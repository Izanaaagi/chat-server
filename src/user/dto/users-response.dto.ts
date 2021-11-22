import User from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UsersResponseDto {
  @ApiProperty({ type: [User] })
  users: User[];

  @ApiProperty()
  count: number;
}
