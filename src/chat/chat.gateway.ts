import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import User from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import Message from './entities/message.entity';
import { plainToClass } from 'class-transformer';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    transports: ['websocket', 'polling'],
  },
  allowEIO3: true,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private onlineUsers: User[] = [];

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(socket: Socket) {
    let user: User = await this.chatService.getUserFromSocket(socket);
    (user as any).socketId = socket.id;
    this.logger.log(user.name + ' connected');
    user = plainToClass(User, await this.userService.setOnlineStatus(user));
    this.onlineUsers.push(user);
    this.logger.log('Online users');
    console.log(this.onlineUsers);
    this.server.sockets.emit('updateUsersStatus', user);
  }

  @SubscribeMessage('sendMessage')
  async listenForMessages(
    @MessageBody() sendMessageDTO: SendMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    let message: Message = await this.chatService.sendMessage(
      sendMessageDTO,
      sendMessageDTO.privateFile,
    );
    message = plainToClass(Message, message);
    this.logger.log(
      `${socket.id} send message ${sendMessageDTO.message} to room ${sendMessageDTO.roomId}`,
    );
    this.server.sockets
      .to(`room:${sendMessageDTO.roomId}`)
      .emit('receiveMessage', message);

    const isReceiverOnline = this.onlineUsers.find(
      (user) => user.id === sendMessageDTO.receiverId,
    );
    if (isReceiverOnline) {
      socket.broadcast
        .to((isReceiverOnline as any).socketId)
        .emit('messageNotification', message);
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() roomId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`${socket.id} leave room ${roomId}`);
    socket.leave(`room:${roomId}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() roomId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    const user: User = await this.chatService.getUserFromSocket(socket);
    this.logger.log(`${user.name} join room ${roomId}`);
    socket.join(`room:${roomId}`);
  }

  @SubscribeMessage('typing')
  typing(
    @MessageBody()
    typingStatus: { roomId: number; isTyping: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(typingStatus.isTyping);
    socket.broadcast
      .to(`room:${typingStatus.roomId}`)
      .emit('display', typingStatus.isTyping);
  }

  @SubscribeMessage('markSeenMessages')
  async markSeenMessages(
    @MessageBody()
    messages: Message | Message[],
    @ConnectedSocket() socket: Socket,
  ) {
    const user: User = await this.chatService.getUserFromSocket(socket);
    let seenMessages: Message | Message[];
    let event: string;
    let room: number;
    if (!Array.isArray(messages)) {
      seenMessages = await this.chatService.markSeenMessage(messages);
      room = messages.room.id;
      event = 'messageSeen';
    } else {
      seenMessages = await this.chatService.markSeenMessages(messages, user.id);
      room = messages[0].room.id;
      event = 'messagesSeen';
    }
    socket.broadcast.to(`room:${room}`).emit(event, seenMessages);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  //
  async handleDisconnect(socket: Socket) {
    let user: User = await this.chatService.getUserFromSocket(socket);
    this.logger.log(`Client disconnected: ${user.name}`);
    user = plainToClass(User, await this.userService.setOfflineStatus(user));
    this.onlineUsers = this.onlineUsers.filter(
      (onlineUser) => onlineUser.id !== user.id,
    );
    this.logger.log(this.onlineUsers);
    this.server.sockets.emit('updateUsersStatus', user);
  }
}
