import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove chaves que nao existem no DTO
      forbidNonWhitelisted: true, // retorna erro se tiver chaves que não existem no DTO
      transform: false, // tenta converter o valor da chave para o tipo definido
    }),
    new ParseIntIdPipe(),
  );

  await app.listen(3000);
}

bootstrap();
