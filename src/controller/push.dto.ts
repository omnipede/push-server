import * as Joi from 'joi';

/**
 * 푸시 요청 DTO
 */
export class PushToIdReqDTO {
  client_id: string;
  token_id: string;
  message: Record<string, unknown>;

  static readonly schema = Joi.object({
    client_id: Joi.string().required(),
    token_id: Joi.string().required(),

    // todo custom validation
    message: Joi.object().required(),
  });
}

export class PushReqDTO {
  client_id: string;
  message: Record<string, unknown>;

  // xor('topic', 'token', 'condition')
  static readonly schema = Joi.object({
    client_id: Joi.string().required(),
    message: Joi.object({
      topic: Joi.string(),
      token: Joi.string(),
      condition: Joi.string(),
    }).unknown(true).required(),
  });
}
