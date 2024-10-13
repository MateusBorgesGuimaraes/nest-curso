import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(Error)
export class ErrorExeptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const statusCode = exception.getStatus ? exception.getStatus : 400;
    const exeptionResponse = exception.getResponse
      ? exception.getResponse
      : { message: 'Error', statusCode };

    response.status(statusCode).json({
      ...exeptionResponse,
      data: new Date().toISOString(),
      path: request.url,
    });
  }
}
