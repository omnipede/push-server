import { Injectable, Logger } from '@nestjs/common';
import { PushTokenService } from '../service/token/PushTokenService';
import { err, ok, Result } from 'neverthrow';
import { PushService } from '../service/push/PushService';
import { ClientService } from '../service/client/ClientService';

/**
 * 메시지 푸시 application code
 */
@Injectable()
export class PushMessageApplication {

  private readonly logger: Logger = new Logger(PushMessageApplication.name);

  constructor(
    private tokenService: PushTokenService,
    private pushService: PushService,
    private clientService: ClientService
  ) {}

  /**
   * Token id 와 맵핑되는 토큰을 찾아서 해당 토큰에게 푸시를 날리는 기능
   * @param clientId 서비스 아이디
   * @param tokenId 토큰 아이디
   * @param message 푸시할 메시지
   * @returns invalid tokens
   */
  public async sendToTokenId(clientId: string, tokenId: string, message: Record<string, unknown>): Promise<Result<string[], 'not-found-token' | 'not-found-client'>> {
    // Find fcm account => 없으면 에러
    const client = (await this.clientService.findById(clientId))
      .orElse(null);

    if (client == null)
      return err('not-found-client');

    // Find push tokens via client's id and tokenId => 없으면 에러
    const tokenList: string[] = (await this.tokenService.findAllById(clientId, tokenId))
        .map(p => p.token);

    if (tokenList.length == 0)
      return err('not-found-token');

    // Send multi message
    const invalidTokens = await this.pushService.sendMulti(client, {
      tokens: tokenList,
      ...message,
    });

    // Delete invalid tokens and then return
    if (invalidTokens.length > 0) {
      this.logger.debug(`Invalid tokens: ${invalidTokens}`);
      await Promise.all(
        invalidTokens.map((invalidToken) => this.tokenService.delete(clientId, tokenId, invalidToken))
      )
    }

    return ok(invalidTokens);
  }

  /**
   * 일반적인 메시지를 전송하는 메소드
   * @param clientId
   * @param message
   */
  public async send(clientId: string, message: Record<string, unknown>): Promise<Result<void, 'not-found-token'>> {
    // Find client
    const client = (await this.clientService.findById(clientId))
      .orElse(null);

    if (client == null)
      return err('not-found-token')

    // Send message via FCM
    await this.pushService.send(client, {
      token: message['token'] as string,
      topic: message['topic'] as string,
      condition: message['condition'] as string,
      ...message
    });

    return ok(null);
  }
}
