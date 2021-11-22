import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../auth/match.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minimum: 3, maximum: 12 })
  @MinLength(3)
  @MaxLength(12)
  name: string;

  @ApiProperty({ minimum: 6, maximum: 16 })
  @MinLength(6)
  @MaxLength(16)
  password: string;

  @ApiProperty()
  @IsString()
  @Match('password')
  password_confirmation: string;
}
