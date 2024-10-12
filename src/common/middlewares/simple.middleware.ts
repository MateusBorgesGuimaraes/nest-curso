import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class SimpleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Simple middleware: Olá, mundo!');
    const authorization = req.headers?.authorization;

    if (authorization) {
      req['user'] = {
        nome: 'Joaquim',
        sobrenome: 'Silva',
      };
    }
    // terminando a cadeia de chamadas
    // return res.status(404).send({ message: 'Não encontrado!' });
    next();

    res.on('finish', () => {
      console.log('Simple middleware: Tchau, mundo!');
    });
  }
}
