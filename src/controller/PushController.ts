import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import { PushMessageApplication } from '../application/PushMessageApplication';
import { JoiValidationPipe } from '../system/pipe';
import { ErrorCode, SystemException } from '../system/error';
import { PushReqDTO, PushToIdReqDTO } from './push.dto';

@Controller("/api/v1")
export class PushController {

  constructor(private pushMessageApplication: PushMessageApplication) {}

  /**
   * 특정 아이디에게 전송하는 API
   * @param dto 요청 DTO
   * @returns 응답 DTO
   */
  @Post("/push/id")
  // POST controller 의 경우 성공 시 201 을 반환하기 때문에 강제로 200을 반환하도록 하는 어노테이션을 추가함
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(PushToIdReqDTO.schema))
  public async pushToId(@Body() dto: PushToIdReqDTO) {
    // DTO 파싱
    const { client_id, token_id, message } = dto;

    // Send multicast message via FCM
    const result = await this.pushMessageApplication.sendToTokenId(client_id, token_id, message);

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
   * @param dto 요청 DTO
   */
  @Post("/push")
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(PushReqDTO.schema))
  public async push(@Body() dto: PushReqDTO) {
    // DTO 파싱
    const { client_id, message } = dto;
    const result = await this.pushMessageApplication.send(client_id, message);

    // 에러 맵핑
    result.mapErr((e) => {
      if (e == 'not-found-token')
        throw new SystemException(ErrorCode.NotFoundData, 'Token not found');
    });

    // 결과 반환
    return { status: 200 }
  }
}
