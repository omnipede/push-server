import { Body, Controller, Headers, HttpCode, Post, UseGuards, UsePipes } from '@nestjs/common';
import { PushMessageApplication } from '../application/PushMessageApplication';
import { JoiValidationPipe } from '../system/pipe';
import { ErrorCode, SystemException } from '../system/error';
import { PushReqDTO, PushToIdReqDTO } from './push.dto';
import { ClientHmacGuard } from '../system/guard';

@Controller("/api/v1")
@UseGuards(ClientHmacGuard)
export class PushController {

  constructor(private pushMessageApplication: PushMessageApplication) {}

  /**
   * 특정 아이디에게 전송하는 API
   * @param clientId
   * @param dto 요청 DTO
   * @returns 응답 DTO
   */
  @Post("/push/id")
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(PushToIdReqDTO.schema))
  @UseGuards(ClientHmacGuard)
  public async pushToId(@Headers("API-ID") clientId: string, @Body() dto: PushToIdReqDTO) {
    // DTO 파싱
    const { token_id, message } = dto;

    // Send multicast message via FCM
    const result = await this.pushMessageApplication.sendToTokenId(clientId, token_id, message);

    // 에러 맵핑
    result.mapErr((e) => {
      if (e == 'not-found-token')
        throw new SystemException(ErrorCode.NotFoundData, 'Token not found');
      if (e == 'not-found-client')
        throw new SystemException(ErrorCode.NotFoundData, 'Client is not registered');
    });

    // 에러가 없으면 삭제된 토큰 반환
    const deletedTokens = result.unwrapOr([]);
    return {
      status: 200,
      deleted: deletedTokens,
    };
  }

  /**
   * 일반적인 푸시
   * @param clientId
   * @param dto 요청 DTO
   */
  @Post("/push")
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(PushReqDTO.schema))
  @UseGuards(ClientHmacGuard)
  public async push(@Headers("API-ID") clientId: string, @Body() dto: PushReqDTO) {
    // DTO 파싱
    const { message } = dto;
    const result = await this.pushMessageApplication.send(clientId, message);

    // 에러 맵핑
    result.mapErr((e) => {
      if (e == 'not-found-token')
        throw new SystemException(ErrorCode.NotFoundData, 'Token not found');
    });

    // 결과 반환
    return { status: 200 }
  }
}
