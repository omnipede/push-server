import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

export class ErrorCode {
  static readonly BadRequest = new ErrorCode(400, 40000, 'Bad request');
  static readonly InvalidBody = new ErrorCode(400, 40001, 'Invalid request body');
  static readonly AuthFailed = new ErrorCode(401, 40100, 'Authentication failed');
  static readonly NotFoundUri = new ErrorCode(404, 40400, 'Not found uri or maybe wrong http method');
  static readonly NotFoundData = new ErrorCode(404, 40401, 'Not found data');
  static readonly InternalServerError = new ErrorCode(500, 50000, 'Internal server error');
  private constructor(public readonly status: number, public readonly code: number, public readonly message: string) {}
}

export class SystemException extends Error {

  // Exception handler 에게 전달하는 에러 코드
  public readonly errorCode: ErrorCode;
  // 추가적인 에러 정보 (optional)
  public aux: any;

  /**
   * 비지지스 로직 상에서 발생하는 에러를 추상화한 객체
   * @param errorCode Exception handler 에게 전달하는 에러 코드
   * @param aux 추가적인 에러 정보
   */
  constructor(errorCode: ErrorCode, aux?: any) {
    super()
    this.errorCode = errorCode;
    this.aux = aux;
  }
}

/**
 * Business exception 을 처리하는 filter
 */
@Catch(SystemException)
export class SystemExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(SystemExceptionFilter.name);

  // Exception handling method
  catch(exception: SystemException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Exception 내부의 에러 코드를 추출
    const errorCode = exception.errorCode;
    const aux = exception.aux;

    const { status, code, message } = errorCode;

    // 에러 코드에 따라 http 응답 반환
    response.status(status).json({
      status, code, message, aux
    });
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const message = exception.message;

    response.status(status).json({
      status,
      code: status * 100,
      message,
    });
  }
}

/**
 * 그 외 서버 에러를 잡는 필터
 */
@Catch(Error)
export class GlobalErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(exception.message, exception.stack);

    const { status, code, message } = ErrorCode.InternalServerError;

    response.status(500).json({
      status, code, message,
      developer_message: exception.message,
    });
  }
}
