import {
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PushTokenEntity } from './PushTokenEntity';

export type PushToken = {
  id: string;
  token: string;
}

export class PushTokenService {

  constructor(
    @InjectRepository(PushTokenEntity)
    private pushTokenRepository: Repository<PushTokenEntity>
  ) {}

  /**
   * clientId 와 tokenId 로 모든 푸시 토큰을 찾아 반환하는 메소드
   * @param clientId
   * @param tokenId
   * @returns 푸시 토큰 리스트
   */
  public async findAllById(clientId: string, tokenId: string): Promise<PushToken[]> {
    // Find token by client id and token id which is not deleted
    const tokenEntities: PushTokenEntity[] = await this.pushTokenRepository.find( { where: {
        id: tokenId,
        client_id: clientId,
        deleted: false,
    }});

    // Map table entity to dto
    return tokenEntities.map(pushTokenEntity => {
      return {
        id: pushTokenEntity.id,
        token: pushTokenEntity.token,
      }
    });
  }

  /**
   * 토큰을 삭제하는 메소드
   * @param clientId 토큰이 등록된 클라이언트의 아이디
   * @param tokenId 토큰 아이디
   * @param token 삭제할 토큰
   */
  public async delete(clientId: string, tokenId: string, token: string): Promise<void> {
    // Update entity to deleted = true WHERE tokenId, clientId
    await this.pushTokenRepository.update({
      // WHERE
      id: tokenId,
      client_id: clientId,
      token,
    }, {
      // UPDATE
      deleted: true
    });
  }
}
