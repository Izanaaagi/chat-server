import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import Room from './entities/room.entity';
import User from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository, SelectQueryBuilder } from 'typeorm';
import Participant from './entities/participant.entity';
import Message from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { plainToClass } from 'class-transformer';
import { PrivateFilesService } from '../privateFiles/privateFiles.service';
import PrivateFile from '../privateFiles/privateFile.entity';
import { MessagesResponseDto } from './dto/messages-response.dto';
import { ChatsResponseDto } from './dto/chats-response.dto';

@Injectable()
export class ChatService {
  private logger: Logger = new Logger('ChatService');

  constructor(
    private readonly authService: AuthService,
    private readonly privateFilesService: PrivateFilesService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async getUserFromSocket(socket: Socket) {
    const cookie = socket.handshake.headers.cookie;
    const { Authentication: authenticationToken } = parse(cookie);
    const user = await this.authService.getUserFromAuthenticationToken(
      authenticationToken,
    );
    if (!user) {
      throw new WsException('Invalid credentials');
    }
    return user;
  }

  async createMessage(
    message: string,
    room: Room,
    user: User,
    file: Partial<Express.Multer.File>,
  ): Promise<Message> {
    let uploadFile: PrivateFile;
    let newMessage: Message = await this.messagesRepository.create({
      message,
      room,
      user,
    });

    newMessage = await this.messagesRepository.save(newMessage);

    if (file) {
      uploadFile = await this.privateFilesService.uploadPrivateFile(
        file.buffer,
        newMessage.id,
        file.originalname,
      );
      newMessage.message = 'File';
    }

    return await this.messagesRepository.save({
      ...newMessage,
      privateFile: uploadFile,
    });
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    file?: Partial<Express.Multer.File>,
  ): Promise<Message> {
    const authUser: User = await this.usersRepository.findOne(
      sendMessageDto.userId,
    );
    const room: Room = await this.getChatRoom(
      sendMessageDto.userId,
      sendMessageDto.receiverId,
    );

    if (file || sendMessageDto.message) {
      const message: any = await this.createMessage(
        sendMessageDto.message,
        room,
        authUser,
        file,
      );
      if (file) {
        const url = await this.privateFilesService.generatePresignedUrl(
          message.privateFile.key,
        );
        return { ...message, privateFile: { ...message.privateFile, url } };
      }
      return message;
    } else {
      throw new HttpException(
        'Message or file must exist',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createRoomWithParticipants(
    userId: number,
    receiverId: number,
  ): Promise<Room> {
    if (userId == receiverId) {
      throw new HttpException(
        'You cant send message to yourself',
        HttpStatus.BAD_REQUEST,
      );
    }
    const newRoom = await this.roomsRepository.save({
      name: `room`,
      type: false,
    });

    const roomParticipants = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', {
        ids: [userId, receiverId],
      })
      .getMany();

    roomParticipants.forEach((user) => {
      this.participantsRepository
        .createQueryBuilder('participant')
        .insert()
        .values({
          room: newRoom,
          user: user,
        })
        .execute();
    });
    return newRoom;
  }

  async getChatRoom(userId: number, receiverId: number): Promise<Room> {
    let rooms: Room[] = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('user.id IN (:...id)', {
        id: [userId, receiverId],
      })
      .getMany();

    rooms = rooms.filter((room) => room.participants.length == 2);

    if (rooms.length === 0) {
      return await this.createRoomWithParticipants(userId, receiverId);
    }

    return rooms[0];
  }

  async markSeenMessages(
    messages: Message[],
    authUserId: number,
  ): Promise<Message[]> {
    messages = messages
      .filter((message) => message.user.id !== authUserId)
      .map((message) => {
        return {
          ...message,
          is_read: true,
        };
      });
    return await this.messagesRepository.save(messages);
  }

  async markSeenMessage(message: Message): Promise<Message> {
    return await this.messagesRepository.save({ ...message, is_read: true });
  }

  async getMessages(
    query,
    roomId: number,
    authUser: User,
  ): Promise<Partial<MessagesResponseDto>> {
    const qb: SelectQueryBuilder<Message> = await this.messagesRepository
      .createQueryBuilder('messages')
      .innerJoinAndSelect('messages.room', 'room')
      .where('room.id = :roomId', { roomId })
      .leftJoinAndSelect('messages.user', 'user')
      .leftJoinAndSelect('messages.privateFile', 'file')
      .orderBy('messages.created_at', 'DESC');

    const take: number = query.take || 50;
    const page: number = query.page || 1;
    const skip: number = (page - 1) * take;
    const count: number = await qb.getCount();
    const numPages: number = Math.ceil(count / take);
    let messages: Message[];

    if (numPages >= page) {
      messages = await qb.offset(skip).limit(take).getMany();
      messages = await this.getAllPrivateFiles(messages);
    } else if (count !== 0) {
      throw new HttpException(
        { status: HttpStatus.NO_CONTENT, error: 'Page not fount' },
        HttpStatus.NO_CONTENT,
      );
    }

    return {
      messages,
      count,
    };
  }

  async getAllPrivateFiles(messages: Message[]): Promise<Message[]> {
    return Promise.all(
      messages.map(async (message) => {
        if (message.privateFile) {
          const url = await this.privateFilesService.generatePresignedUrl(
            message.privateFile.key,
          );
          return {
            ...message,
            privateFile: { ...message.privateFile, url },
          };
        }
        return message;
      }),
    );
  }

  async getChats(user, query) {
    const authUser: User = user;
    const take: number = query.take || 8;
    const page: number = query.page || 1;
    const keyWord: string = query.keyWord?.toLowerCase() || '';
    const skip: number = (page - 1) * take;
    const manager = getManager();

    const roomsWithUser: Room[] = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('user.id = :id', { id: authUser.id })
      .select('room.id')
      .getMany();

    const chatRooms: SelectQueryBuilder<Room> = await this.roomsRepository
      .createQueryBuilder('room')
      .select([
        'room.id',
        'user',
        'participants',
        'message.id',
        'message.message',
        'message.created_at',
        'message.updated_at',
        'message.userId',
      ])
      .whereInIds(roomsWithUser)
      .leftJoin('room.participants', 'participants')
      .leftJoin('participants.user', 'user')
      .andWhere('LOWER(user.name) like :name', {
        name: `%${keyWord}%`,
      })
      .andWhere('user.id != :id', { id: authUser.id })
      .leftJoinAndSelect('user.avatar', 'avatar')
      .leftJoin(
        (qb) =>
          qb
            .from(Message, 'message')
            .select('MAX(created_at)', 'effective_date')
            .addSelect('message.roomId', 'room_id')
            .groupBy('room_id'),
        'last_message',
        'last_message.room_id = room.id',
      )
      .leftJoin(
        'room.messages',
        'message',
        'message.roomId = room.id AND message.created_at = last_message.effective_date',
      )
      .leftJoinAndSelect('message.privateFile', 'file')
      .groupBy(
        'user.id, participants.id, message.id, room.id, avatar.id, file.id',
      )
      .orderBy('message.created_at', 'DESC')
      .having('COUNT(message) > 0');

    const count: number = await chatRooms.getCount();
    const numPages: number = Math.ceil(count / take);
    let finalArray: Room[];
    if (numPages >= page) {
      finalArray = await chatRooms.skip(skip).take(take).getMany();
      const unreadMessagesCount = await manager.query(
        `SELECT COUNT(*), "roomId"
         FROM "message"
         WHERE "roomId" = ANY($1)
           AND "is_read" = false
           AND "userId" != $2
         GROUP BY "roomId"`,
        [roomsWithUser.map((room) => room.id), authUser.id],
      );

      const response: ChatsResponseDto[] = finalArray.map((room) => {
        return {
          id: room.id,
          user: room.participants.find(
            (participant) => participant.user.id != authUser.id,
          ).user,
          lastMessage: plainToClass(
            Message,
            room.messages[0].privateFile
              ? { ...room.messages[0], message: 'File' }
              : room.messages[0],
          ),
          unreadMessagesCount: unreadMessagesCount.find(
            (room2) => room.id === room2.roomId,
          )?.count,
        };
      });
      return response;
    } else {
      throw new HttpException(
        { status: HttpStatus.NO_CONTENT, error: 'Page not found' },
        HttpStatus.NO_CONTENT,
      );
    }
  }
}
