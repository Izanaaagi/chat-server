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

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(socket: Socket) {
    await this.chatService.getUserFromSocket(socket);
    this.logger.log('-------------------------------');
    let clientsArray;
    this.server.sockets.in('room:48').clients((error, clients) => {
      clientsArray = clients;
    });
    console.log(clientsArray);
  }

  @SubscribeMessage('sendMessage')
  async listenForMessages(
    @MessageBody() sendMessageDTO: SendMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const message = await this.chatService.sendMessage(sendMessageDTO);
    this.logger.log(
      `${socket.id} send message ${sendMessageDTO.message} to room ${sendMessageDTO.roomId}`,
    );
    this.server.sockets.in('room:48').clients((error, clients) => {
      console.log(clients[0]);
    });
    this.server.sockets
      .to(`room:${sendMessageDTO.roomId}`)
      .emit('receiveMessage', message);
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

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  //
  async handleDisconnect(socket: Socket) {
    const user: User = await this.chatService.getUserFromSocket(socket);
    this.logger.log(`Client disconnected: ${user.name}`);
  }
}
