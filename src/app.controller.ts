import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'kek';
  }

  @Get('kek')
  getHelloId(@Body() request: Body): Body {
    return request;
  }
}
