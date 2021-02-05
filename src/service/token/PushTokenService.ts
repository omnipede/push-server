import {
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PushTokenEntity } from './PushTokenEntity';
import { ClientEntity } from '../client/ClientEntity';
import { Optional } from 'typescript-optional';

export type PushToken = {
  id: string;
  token: string;
}

export class PushTokenService {

  constructor(
    @InjectRepository(PushTokenEntity)
    private pushTokenRepository: Repository<PushTokenEntity>,

    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>
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
   * 토큰 하나를 찾아 반환하는 메소드
   * @param clientId
   * @param tokenId
   * @param token
   */
  public async findOne(clientId: string, tokenId: string, token: string): Promise<Optional<PushToken>> {
    // Find one token which is not deleted
    const tokenEntity = (await this.pushTokenRepository.find( { where: { client_id: clientId, id: tokenId, token, deleted: false }}))[0];
    if (!tokenEntity)
      return Optional.empty();

    return Optional.of({
      id: tokenEntity.id,
      token: tokenEntity.token,
    });
  }

  /**
   * 푸시 토큰 추가
   * @param clientId 클리이언트 아이디
   * @param tokenId 추가할 토큰 아이디
   * @param token 추가할 토큰
   */
  public async save(clientId: string, tokenId: string, token: string): Promise<PushToken> {
    // Client 찾기
    const clientEntity = this.clientRepository.findOne({ id: clientId });
    if (clientEntity == null)
      throw new Error('Client entity not found')

    // Entity 찾기
    const tokenEntity = (await this.pushTokenRepository.find({ where: { client_id: clientId, id: tokenId, token }}))[0]

    // 없으면 새로 만들기
    if (tokenEntity == null) {
      const newTokenEntity = new PushTokenEntity(clientId, tokenId, token);
      const savedTokenEntity = await this.pushTokenRepository.save(newTokenEntity);
      return {
        id: savedTokenEntity.id,
        token: savedTokenEntity.token
      }
    }

    // 있으면 deleted = false 로 만들고 업데이트하기
    if (tokenEntity.deleted === true) {
      // 토큰 업데이트하기
      tokenEntity.deleted = false;
      await this.pushTokenRepository.save(tokenEntity);
    }

    return {
      id: tokenEntity.id,
      token: tokenEntity.token,
    }
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
