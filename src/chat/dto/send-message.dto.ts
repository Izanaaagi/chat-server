import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @IsInt()
  @Type(() => Number)
  @ApiProperty()
  receiverId: number;

  @IsInt()
  @Type(() => Number)
  @ApiProperty()
  userId: number;

  @IsInt()
  @Type(() => Number)
  @ApiProperty()
  roomId: number;

  @IsString()
  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  privateFile?: {
    buffer: Buffer;
    type: string;
    name: string;
  };
}
