import { Body, Controller, HttpCode, Post, UsePipes, UseGuards, Res, Req, Injectable } from '@nestjs/common';
import { AuthApplication } from '../application/AuthApplication';
import * as Joi from 'joi';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JoiValidationPipe } from '../../system/pipe';
import { ErrorCode, SystemException } from '../../system/error';
import { JwtAuthGuard } from '../JwtAuthGuard';

/**
 * Login 요청 DTO
 */
class LoginReqDTO {
  // username
  username: string;
  // password
  password: string;
  // Validation schema
  static readonly schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  });
}

/**
 * Logout 요청 DTO
 */
class LogoutReqDTO {
  username: string;

  static readonly schema = Joi.object({
    username: Joi.string().required(),
  });
}

/**
 * 인증 http API 설정값
 */
@Injectable()
export class AuthHttpConfig {
  secure: boolean;

  private readonly schema = Joi.object({
    secure: Joi.boolean().required(),
  }).unknown(true);

  constructor(
    private configService: ConfigService
  ) {
    this.secure = configService.get<boolean>('server.auth.secure-cookie', false);
    const { error } = this.schema.validate(this);
    if (error)
      throw new Error(JSON.stringify(error.details, null, 4));
  }
}

/**
 * Login, logout 관련 http controller
 */
@Controller("/api/v1/auth")
export class AuthController {
  constructor(
    private authApplication: AuthApplication,
    private authHttpConfig: AuthHttpConfig,
  ) {}

  @Post("/login")
  @HttpCode(200)
  @UsePipes(new JoiValidationPipe(LoginReqDTO.schema))
  public async login(@Body() dto: LoginReqDTO, @Res() response: Response): Promise<void> {
    // DTO parsing
    const { username, password } = dto;

    // Process logic
    const result = await this.authApplication.login(username, password);

    // Checked error 맵핑
    result.mapErr((e) => {
      if (e === 'not-found-user')
        throw new SystemException(ErrorCode.NotFoundData, "User not found");
      if (e === 'wrong-password')
        throw new SystemException(ErrorCode.AuthFailed, "Wrong password");
    });

    // Get generated access token and refresh token
    const { accessToken, refreshToken } = result.unwrapOr(null)

    // Refresh token 은 쿠키에 넣어서 반환
    response.cookie('REFRESH-TOKEN', refreshToken, {
      httpOnly: true,
      secure: this.authHttpConfig.secure,
    });

    // Access token 은 json payload 에 넣어서 반환
    response.send({
      access_token: accessToken,
    });
  }

  @Post("/refresh")
  @HttpCode(200)
  public async extendLogin(@Req() request: Request) {
    // Get refresh token from cookies
    const refreshToken = request.cookies['REFRESH-TOKEN'];

    // Check header
    if (!refreshToken)
      throw new SystemException(ErrorCode.BadRequest, "Invalid cookie, refresh token not found.");

    // Process logic
    const result = await this.authApplication.extendLogin(refreshToken);

    // Checked error 맵핑
    result.mapErr((e) => {
      if (e === 'not-found-refresh-token')
        throw new SystemException(ErrorCode.NotFoundData, "Refresh token not found");
      throw new SystemException(ErrorCode.AuthFailed, e);
    });

    // 새로 발급받은 token 반환
    const accessToken = result.unwrapOr(null);
    return {
      access_token: accessToken
    };
  }

  @Post("/logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new JoiValidationPipe(LogoutReqDTO.schema))
  public async logout(@Body() dto: LogoutReqDTO) {
    // DTO parsing
    const { username } = dto;

    // Do logic
    await this.authApplication.logout(username);

    // Return success if no error occurred
    return {
      success: true
    }
  }
}

