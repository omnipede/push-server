import { Body, Controller, Delete, Post, UsePipes } from '@nestjs/common';
import { PushTokenService } from '../service/token/PushTokenService';
import * as Joi from 'joi';
import { JoiValidationPipe } from '../system/pipe';
import { ClientService } from '../service/client/ClientService';
import { ErrorCode, SystemException } from '../system/error';

// Request DTO
class PushTokenDTO {
  client_id: string;
  id: string;
  token: string;

  static readonly schema = Joi.object({
    client_id: Joi.string().required(),
    id: Joi.string().required(),
    token: Joi.string().required()
  })
}

// Request DTO
class PushTokenIdDTO {
  client_id: string;
  id: string;

  static readonly schema = Joi.object({
    client_id: Joi.string().required(),
    id: Joi.string().required()
  })
}

@Controller("/api/v1")
export class TokenController {

  constructor(
    private pushTokenService: PushTokenService,
    private clientService: ClientService,
  ) {}

  /**
   * 토큰 추가 API
   * @param dto 요청 DTO
   */
  @Post("/token")
  @UsePipes(new JoiValidationPipe(PushTokenDTO.schema))
  public async addPushToken(@Body() dto: PushTokenDTO) {
    const { client_id, id, token } = dto;
    // client 찾기 => 없으면 에러
    const client = (await this.clientService.findById(client_id))
        .orElse(null);
    if (client == null)
      throw new SystemException(ErrorCode.NotFoundData, 'Client not found');

    // 새로운 푸시 토큰 저장
    await this.pushTokenService.save(client_id, id, token);
    return {
      status: 200
    };
  }

  /**
   * 토큰 삭제 API
   * @param dto
   */
  @Delete("/token")
  @UsePipes(new JoiValidationPipe(PushTokenDTO.schema))
  public async deleteOne(@Body() dto: PushTokenDTO) {
    const { client_id, id, token } = dto;

    // Find one token
    const pushToken = (await this.pushTokenService.findOne(client_id, id, token))
      .orElse(null);

    // if not found => error
    if (pushToken == null)
      throw new SystemException(ErrorCode.NotFoundData, 'Token not found');

    // 토큰 삭제
    await this.pushTokenService.delete(client_id, id, token);
    return {
      status: 200,
    }
  }

  /**
   * 토큰 삭제 API. id 로 찾은 모든 토큰을 삭제한다는 점이 위와 다르다.
   * @param dto
   */
  @Delete("/tokens")
  public async deleteAllById(@Body() dto: PushTokenIdDTO) {
    // dto 파싱
    const { client_id, id } = dto;

    // 토큰 검색 => 없으면 에러
    const tokenList = await this.pushTokenService.findAllById(client_id, id);
    if (tokenList.length == 0)
      throw new SystemException(ErrorCode.NotFoundData, "Not found token");

    // 토큰 삭제
    await Promise.all(
      tokenList.map((pushToken) => this.pushTokenService.delete(client_id, id, pushToken.token))
    );

    return {
      status: 200,
    }
  }
}
