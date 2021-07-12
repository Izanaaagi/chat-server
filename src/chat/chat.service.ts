import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { parse } from 'cookie';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import Room from './entities/room.entity';
import User from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import Participant from './entities/participant.entity';
import Message from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly authService: AuthService,
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

  async createMessage(message: string, room: Room, user: User) {
    const newMessage = await this.messagesRepository.create({
      message,
      room,
      user,
    });
    await this.messagesRepository.save(newMessage);

    return newMessage;
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

  async sendMessage(sendMessageDto: SendMessageDto): Promise<Message> {
    const authUser: User = await this.usersRepository.findOne(
      sendMessageDto.userId,
    );

    const room: Room = await this.getChatRoom(
      sendMessageDto.userId,
      sendMessageDto.receiverId,
    );
    return this.createMessage(sendMessageDto.message, room, authUser);
  }

  async getMessages(roomId: number): Promise<Message[]> {
    return await this.messagesRepository
      .createQueryBuilder('messages')
      .innerJoin('messages.room', 'room')
      .where('room.id = :roomId', { roomId })
      .leftJoinAndSelect('messages.user', 'user')
      .orderBy('created_at')
      .getMany();
  }
}
