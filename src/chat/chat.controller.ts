import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { PaginationDto } from './dto/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { multerOptions } from './multerOptions';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MessagesResponseDto } from './dto/messages-response.dto';
import { ChatsResponseDto } from './dto/chats-response.dto';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('chat')
@ApiCookieAuth()
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
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiOkResponse({ type: Message, description: 'Send message' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Message> {
    return await this.chatService.sendMessage(sendMessageDto, file);
  }

  @Get(':receiverId')
  @ApiOkResponse({
    type: MessagesResponseDto,
    description: 'Get paginated messages',
  })
  async getMessages(
    @Query() query: PaginationDto,
    @Param('receiverId') receiverId: number,
    @Req() req: RequestWithUser,
  ): Promise<MessagesResponseDto> {
    const room: Room = await this.chatService.getChatRoom(
      req.user.id,
      receiverId,
    );
    const messages = await this.chatService.getMessages(
      query,
      room.id,
      req.user,
    );

    return {
      roomId: room.id,
      messages: messages.messages,
      count: messages.count,
    };
  }

  @Get()
  @ApiOkResponse({
    type: [ChatsResponseDto],
    description: 'Get paginated chats',
  })
  async getChats(
    @Req() req: RequestWithUser,
    @Query() query: PaginationDto,
  ): Promise<ChatsResponseDto[]> {
    return this.chatService.getChats(req.user, query);
  }
}
