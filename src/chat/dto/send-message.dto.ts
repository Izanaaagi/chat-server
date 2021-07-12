import { IsInt, IsString } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  receiverId: number;

  @IsInt()
  userId: number;

  @IsInt()
  roomId: number;

  @IsString()
  message: string;
}
