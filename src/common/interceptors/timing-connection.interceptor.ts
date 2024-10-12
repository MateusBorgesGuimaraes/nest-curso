import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';

@Injectable()
export class TimingConnectionInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const startTime = Date.now();
    console.log('TimingConnectionInterceptor - Executado ANTES...');

    // await new Promise((resolve) => setTimeout(resolve, 3000));
    return next.handle().pipe(
      tap(() => {
        const finalTime = Date.now();
        const elapsedTime = finalTime - startTime;
        console.log(elapsedTime);
        // console.log(
        //   `TimingConnectionInterceptor: levou ${elapsedTime}ms para executar`,
        // );
      }),
    );
  }
}