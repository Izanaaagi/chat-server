import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../auth/match.decorator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(12)
  name: string;

  @IsString()
  @MinLength(6)
  @MaxLength(16)
  password: string;

  @IsString()
  @Match('password')
  password_confirmation: string;
}
