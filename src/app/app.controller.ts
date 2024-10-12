import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('home')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get('hello')
  getHello(): string {
    return 'Hello World!';
  }

  // @Get('exemplo')
  exemplo() {
    return this.appService.resolveExemplo();
  }
}
