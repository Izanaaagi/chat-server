import Message from '../entities/message.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MessagesResponseDto {
  @ApiProperty()
  roomId: number;

  @Type(() => Message)
  @ApiProperty({ type: [Message] })
  messages: Message[];

  @ApiProperty()
  count: number;
}
