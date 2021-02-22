import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AuthApplication } from './application/AuthApplication';

/**
 * Jwt 를 사용하여 사용자 인증을 처리하는 guard
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {

  private readonly logger: Logger = new Logger(JwtAuthGuard.name);

  constructor(
    private authApplication: AuthApplication
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    return this.validateRequest(request);
  }

  /**
   * Request 객체를 파싱하여 validate 하는 메소드
   * @param request Express request object
   * @private
   */
  private async validateRequest(request: Request): Promise<boolean> {
    const accessToken = request.header('ACCESS-TOKEN');
    if (!accessToken)
      return false;

    const result = await this.authApplication.verifyAccessToken(accessToken);

    if (result.isErr()) {
      this.logger.error(result.error);
      return false;
    }

    return result.value;
  }
}
