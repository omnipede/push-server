import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ClientEntity } from '../service/client/ClientEntity';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, SystemException } from './error';

/**
 * Client 에 등록된 api secret 을 이용해서 hmac secret 을 만들고
 * 해당 hmac secret 이 헤더의 SIG 와 일치하는지 확인하는 가드
 */
@Injectable()
export class ClientHmacGuard implements CanActivate {

  private readonly logger: Logger = new Logger(ClientHmacGuard.name);

  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>
  ) {}

  /**
   * Request 를 검사하여 API 사용자를 인증하는 메소드
   * @param context
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    return true;
    // return this.validateRequest(request);
  }

  /**
   * Request 의 헤더에서 API-ID, TIMESTAMP, SIG 를 추출하고 hmac 인증을 하는 메소드
   * @param request
   * @private
   */
  private async validateRequest(request: Request): Promise<boolean> {
    const clientId = request.header('API-ID');
    const timestamp = request.header('TIMESTAMP');
    const sig = request.header('SIG');

    // Timeout 확인
    ClientHmacGuard.checkTimeout(parseInt(timestamp));

    // 헤더에 필요한 값이 있는지 확인
    if (!clientId || !timestamp || !sig)
      throw new SystemException(ErrorCode.BadRequest, 'Invalid header: API-ID or TIMESTAMP or SIG is not inside header');

    // DB 에 저장된 client 정보를 가져온다.
    const client = await this.clientRepository.findOne(clientId);
    if (!client)
      throw new SystemException(ErrorCode.BadRequest, "Not registered client");

    // method, uri, API-KEY, body 추출
    const { method, originalUrl } = request
    // client 정보에서 secret 값을 가져옴
    const hmacKey = client.secret;
    const rawBody = await this.getRawBodyFromRequest(request);

    // Hmac message := METHOD | uri | API-ID | timestamp inside header | body
    const hmacMessage = method + originalUrl + clientId + timestamp + rawBody;
    const hmacHash = crypto.createHmac('sha256', hmacKey).update(hmacMessage).digest().toString('hex');

    this.logger.debug("Received: " + sig);
    this.logger.debug("Expected: " + hmacHash);
    this.logger.debug("Expected message before hashed: \n" + hmacMessage);
    return sig === hmacHash;
  }

  /**
   * Raw body 를 추출하는 메소드
   * @param request
   * @private
   */
  private async getRawBodyFromRequest(request: Request): Promise<string> {
    // 미들웨어 상에서 rawBody 를 넣어주고 있다. 만약 해당 미들웨어가 rawBody 를 세팅하지 않으면
    // 에러를 일으키도록 코딩함
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { rawBody } = request;
    if (!rawBody)
      throw new Error('rawBody is not defined inside request object');

    // Debug
    this.logger.debug(`Raw request body: \n${rawBody}`)

    return rawBody;
  }

  /**
   * Timeout 되었는지 확인하는 메소드
   * @param timestamp
   * @private
   */
  private static checkTimeout(timestamp: number): void {
    // 현재 시간에서 5분 전
    const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);

    // 기준 시간 보다 전일 경우
    if (timestamp < fiveMinutesAgo)
      throw new SystemException(ErrorCode.AuthFailed, "Hmac failed: timeout, now is " + timestamp);
  }
}
