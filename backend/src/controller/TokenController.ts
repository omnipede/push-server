import { Body, Controller, Delete, Headers, Post, UseGuards, UsePipes } from '@nestjs/common';
import { PushTokenService } from '../service/token/PushTokenService';
import * as Joi from 'joi';
import { JoiValidationPipe } from '../system/pipe';
import { ClientService } from '../service/client/ClientService';
import { ErrorCode, SystemException } from '../system/error';
import { ClientHmacGuard } from '../system/guard';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientEntity } from '../service/client/ClientEntity';

// Request DTO
class PushTokenDTO {
  id: string;
  token: string;

  static readonly schema = Joi.object({
    id: Joi.string().required(),
    token: Joi.string().required()
  })
}

// Request DTO
class PushTokenIdDTO {
  id: string;

  static readonly schema = Joi.object({
    id: Joi.string().required()
  })
}

@Controller("/api/v1")
export class TokenController {

  constructor(
    private pushTokenService: PushTokenService,
    private clientService: ClientService,
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>
  ) {}

  /**
   * 토큰 추가 API
   * @param clientId ID or client
   * @param dto 요청 DTO
   */
  @Post("/token")
  @UsePipes(new JoiValidationPipe(PushTokenDTO.schema))
  @UseGuards(ClientHmacGuard)
  public async addPushToken(@Headers("API-ID") clientId: string, @Body() dto: PushTokenDTO) {
    const { id, token } = dto;
    // client 찾기 => 없으면 에러
    const client = (await this.clientService.findById(clientId))
        .orElse(null);
    if (client == null)
      throw new SystemException(ErrorCode.NotFoundData, 'Client not found');

    // 새로운 푸시 토큰 저장
    await this.pushTokenService.save(clientId, id, token);
    return {
      status: 200
    };
  }

  /**
   * 토큰 삭제 API
   * @param clientId
   * @param dto
   */
  @Delete("/token")
  @UsePipes(new JoiValidationPipe(PushTokenDTO.schema))
  @UseGuards(ClientHmacGuard)
  public async deleteOne(@Headers("API-ID") clientId: string, @Body() dto: PushTokenDTO) {
    const { id, token } = dto;

    // Find one token
    const pushToken = (await this.pushTokenService.findOne(clientId, id, token))
      .orElse(null);

    // if not found => error
    if (pushToken == null)
      throw new SystemException(ErrorCode.NotFoundData, 'Token not found');

    // 토큰 삭제
    await this.pushTokenService.delete(clientId, id, token);
    return {
      status: 200,
    }
  }

  /**
   * 토큰 삭제 API. id 로 찾은 모든 토큰을 삭제한다는 점이 위와 다르다.
   * @param clientId
   * @param dto
   */
  @Delete("/tokens")
  @UseGuards(ClientHmacGuard)
  public async deleteAllById(@Headers("API-ID") clientId: string, @Body() dto: PushTokenIdDTO) {
    // dto 파싱
    const { id } = dto;

    // 토큰 검색 => 없으면 에러
    const tokenList = await this.pushTokenService.findAllById(clientId, id);
    if (tokenList.length == 0)
      throw new SystemException(ErrorCode.NotFoundData, "Not found token");

    // 토큰 삭제
    await Promise.all(
      tokenList.map((pushToken) => this.pushTokenService.delete(clientId, id, pushToken.token))
    );

    return {
      status: 200,
    }
  }
}
