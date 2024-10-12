import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  resolveExemplo() {
    return 'exemplo usa o service';
  }
}
