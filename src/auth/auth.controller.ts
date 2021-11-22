import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LocalAuthGuard } from './guards/localAuth.guard';
import RequestWithUser from './requestWithUser.interface';
import { Response } from 'express';
import JwtAuthGuard from './guards/jwtAuth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiImplicitBody } from '@nestjs/swagger/dist/decorators/api-implicit-body.decorator';
import { LoginDto } from './dto/login.dto';
import User from '../user/entities/user.entity';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({ description: 'Register new user', type: User })
  async register(@Body() registrationData: CreateUserDto): Promise<User> {
    return this.authService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @ApiImplicitBody({ content: undefined, name: '', type: LoginDto })
  @ApiOkResponse({
    type: User,
    description: 'Login, set authorization cookie and return authorized user',
  })
  @Post('login')
  async login(@Req() request: RequestWithUser, @Res() response: Response) {
    const { user } = request;
    const cookie = this.authService.getCookieWithJwtToken(user.id);
    response.setHeader('Set-Cookie', cookie);
    user.password = undefined;
    return response.send(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Logout, delete authorization cookie' })
  @Post('logout')
  async logOut(@Req() request: RequestWithUser, @Res() response: Response) {
    response.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    response.status(200);
    return response.send('Logout successfully');
  }
}
