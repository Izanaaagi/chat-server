import User from '../../user/entities/user.entity';
import Message from '../entities/message.entity';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class ChatsResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({ type: OmitType(Message, ['user', 'room', 'is_read']) })
  lastMessage: Omit<Message, 'user' | 'room' | 'is_read'>;

  @ApiProperty({ required: false })
  unreadMessagesCount: number;
}
