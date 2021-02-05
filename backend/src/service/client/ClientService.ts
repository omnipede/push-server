import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientEntity } from './ClientEntity';
import { Optional } from 'typescript-optional';

export interface Client {
  id: string;
  account: string;
}

@Injectable()
export class ClientService {

  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>
  ) {}

  /**
   * 등록된 클라이언트를 아이디로 검색하는 메소드
   * @param id 클라이언트 아이디
   */
  public async findById(id: string): Promise<Optional<Client>> {
    // Find client
    const clientEntity: ClientEntity = await this.clientRepository.findOne({ where: { id }});
    // If client not found => return empty
    if (clientEntity == null)
      return Optional.empty();
    // Return optional
    return Optional.of({
      id: clientEntity.id,
      account: clientEntity.account
    });
  }
}

