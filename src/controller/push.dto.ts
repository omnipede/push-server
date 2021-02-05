import * as Joi from 'joi';

/**
 * 푸시 요청 DTO
 */
export class PushToIdReqDTO {
  token_id: string;
  message: Record<string, unknown>;

  static readonly schema = Joi.object({
    token_id: Joi.string().required(),
    message: Joi.object().required(),
  });
}

export class PushReqDTO {
  message: Record<string, unknown>;

  static readonly schema = Joi.object({
    message: Joi.object({
      topic: Joi.string(),
      token: Joi.string(),
      condition: Joi.string(),
    }).xor('topic', 'token', 'condition').unknown(true).required(),
  });
}
