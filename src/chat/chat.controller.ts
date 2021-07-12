import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import Participant from './entities/participant.entity';
import Room from './entities/room.entity';
import Message from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './chat.service';
import JwtAuthGuard from '../auth/guards/jwtAuth.guard';
import RequestWithUser from '../auth/requestWithUser.interface';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private readonly chatService: ChatService,
  ) {}

  @Post()
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(sendMessageDto);
  }

  @Get(':receiverId')
  async getMessages(
    @Param('receiverId') receiverId: number,
    @Req() req: RequestWithUser,
  ) {
    const room: Room = await this.chatService.getChatRoom(
      req.user.id,
      receiverId,
    );
    const messages: Message[] = await this.chatService.getMessages(room.id);

    return {
      roomId: room.id,
      messages,
    };
  }

  @Get()
  async getChats(@Req() req: RequestWithUser): Promise<Room[]> {
    const authUser: User = req.user;
    const roomsWithUser: Room[] = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('user.id = :id', { id: authUser.id })
      .select('room.id')
      .getMany();

    const finalArray: Room[] = await this.roomsRepository
      .createQueryBuilder('room')
      .select([
        'room.id',
        'user',
        'participants',
        'messages.id',
        'messages.message',
        'messages.created_at',
        'messages.updated_at',
        'messages.userId',
      ])
      .whereInIds(roomsWithUser)
      .leftJoin('room.participants', 'participants')
      .leftJoin('participants.user', 'user')
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
        'messages',
        'messages.roomId = room.id AND messages.created_at = last_message.effective_date',
      )
      .groupBy('user.id, participants.id, messages.id, room.id')
      .having('COUNT(messages) > 0')
      .getMany();

    finalArray.forEach((room) =>
      room.participants[0].user.id === authUser.id
        ? room.participants.shift()
        : room.participants.pop(),
    );

    return finalArray;
  }
}
