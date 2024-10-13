import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class MyExeptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const statusCode = exception.getStatus();
    const exeptionResponse = exception.getResponse();

    const error =
      typeof exeptionResponse === 'string'
        ? {
            message: exeptionResponse,
          }
        : (exeptionResponse as object);

    response
      .status(statusCode)
      .json({ ...error, data: new Date().toISOString(), path: request.url });
  }
}
