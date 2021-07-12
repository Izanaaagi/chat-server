import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ChatController } from './chat.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from '../user/entities/user.entity';
import Room from './entities/room.entity';
import Participant from './entities/participant.entity';
import Message from './entities/message.entity';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forFeature([User, Room, Participant, Message]),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
