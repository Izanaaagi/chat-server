import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import JwtAuthGuard from '../auth/guards/jwtAuth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import RequestWithUser from '../auth/requestWithUser.interface';
import { Express } from 'express';
import User from './entities/user.entity';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  PartialType,
} from '@nestjs/swagger';
import { PaginationDto } from '../chat/dto/pagination.dto';
import { UsersResponseDto } from './dto/users-response.dto';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('users')
@ApiCookieAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload avatar',
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @Req() request: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.addAvatar(
      request.user.id,
      file.buffer,
      file.originalname,
    );
  }

  @Post()
  @ApiCreatedResponse({
    description: 'The user has been successfully created',
    type: User,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({
    type: UsersResponseDto,
    description: 'Paginated list of users',
  })
  findAll(
    @Query() query: PaginationDto,
    @Req() req: RequestWithUser,
  ): Promise<UsersResponseDto> {
    return this.userService.findAll(query, req.user);
  }

  @Get('getMe')
  @ApiOkResponse({ type: User, description: 'Return authorized user' })
  getMe(@Req() req): User {
    return req.user;
  }

  @Get(':id')
  @ApiOkResponse({ type: User, description: 'Return user by id' })
  findOne(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: User, description: 'Update user information' })
  @ApiBody({ type: PartialType(CreateUserDto) })
  update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Delete user' })
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
