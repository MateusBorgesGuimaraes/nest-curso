import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class OutroMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Outro middleware: Olá, mundo!');
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
  }
}
