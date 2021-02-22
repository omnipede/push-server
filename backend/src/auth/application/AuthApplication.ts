import { Injectable } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { err, ok, Result } from 'neverthrow';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { RefreshTokenService } from '../service/refreshtoken.service';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * 사용자 인증시 사용하는 외부 설정값
 */
@Injectable()
export class AuthConfig {
  // JWT 생성시 사용하는 secret
  jwtSecret: string;
  // Access token 만료기간
  accessTokenExp: string;
  // Refresh token 만료기간
  refreshTokenExp: string;

  private readonly schema = Joi.object({
    jwtSecret: Joi.string().required(),
    accessTokenExp: Joi.string().required(),
    refreshTokenExp: Joi.string().required(),
  }).unknown(true);

  constructor(
    private configService: ConfigService
  ) {
    this.jwtSecret = configService.get('jwt.secret');
    this.accessTokenExp = configService.get('jwt.access.expire');
    this.refreshTokenExp = configService.get('jwt.refresh.expire');

    const { error } = this.schema.validate(this);
    if (error)
      throw new Error(JSON.stringify(error.details, null, 4));
  }
}

/**
 * 사용자 인증처리 기능 어플리케이션
 */
@Injectable()
export class AuthApplication {

  private readonly JWT_SECRET: string;
  private readonly ACCESS_TOKEN_EXP: string;
  private readonly REFRESH_TOKEN_EXP: string;

  constructor(
    // 사용자 정보 CRUD service
    private userService: UserService,
    // Refresh token CRUD service
    private refreshTokenService: RefreshTokenService,
    // 인증 관련 설정 정보
    private authConfig: AuthConfig,
  ){
    this.JWT_SECRET = authConfig.jwtSecret;
    this.ACCESS_TOKEN_EXP = authConfig.accessTokenExp;
    this.REFRESH_TOKEN_EXP = authConfig.refreshTokenExp;
  }

  /**
   * Login method.
   * 성공시 access token, refresh token 반환
   * @param username User name
   * @param password Password of user
   * @returns Access token and refresh token if success
   */
  public async login(username: string, password: string)
    : Promise<Result<{ accessToken: string, refreshToken: string }, 'not-found-user' | 'wrong-password'>> {
    // Get id, pw from user service
    const userInsideDB = (await this.userService.findUser(username))
      .orElse(null);

    // If user not found
    if (userInsideDB == null)
      return err('not-found-user');

    // Check password
    // Sha256 으로 password 를 해싱하고, 그 결과가 DB 에 저장된 hashed password 와 일치하는지 확인한다
    if (userInsideDB.hashedPassword !== crypto.createHash('sha256').update(password).digest('hex'))
      return err('wrong-password');

    // Create access token and refresh token
    const accessToken = await this.createJwt(username, this.ACCESS_TOKEN_EXP);
    const refreshToken = await this.createJwt(username, this.REFRESH_TOKEN_EXP);

    // Save refresh token
    await this.refreshTokenService.save(username, refreshToken)

    // Return generated tokens
    return ok({
      accessToken, refreshToken
    });
  }

  /**
   * Access token 을 검증하는 메소드
   * @param accessToken 검증할 access token
   */
  public async verifyAccessToken(accessToken: string): Promise<Result<boolean, string | 'invalid-payload' |'not-found-user'>> {
    // JWT 검증
    const jwtVerfResult = await this.verifyJwt(accessToken);

    // Checked 에러 맵핑
    if (jwtVerfResult.isErr())
      return err(jwtVerfResult.error);

    // 'username' 필드를 jwt payload 에서 읽음
    const { username } = jwtVerfResult.value;
    if (!username)
      return err('invalid-payload');

    // Check whether username exist in DB
    const user = (await this.userService.findUser(username))
      .orElse(null);

    if (!user)
      return err('not-found-user');

    return ok(true);
  }

  /**
   * Logout method.
   * 단, 이 메소드를 사용하기 전에 사용자 본인이 요청한 것인지 확인해야 한다.
   * @param username 로그아웃 할 사용자의 username
   */
  public async logout(username: string): Promise<void> {
    await this.refreshTokenService.deleteByUsername(username);
  }

  /**
   * Refresh token 을 이용하여 로그인을 연장하는 메소드
   *
   * 1) Refresh token 검증
   * 2) 검증된 refresh token 에서 username 필드 추출
   * 3) DB 검색하여 refresh token 이 저장되었는지 확인
   * 4) 위 모든 과정을 통과하면 새로운 access token 을 발급한다.
   *
   * @param refreshToken 로그인 시 사용자에게 발급한 jwt format refresh token
   * @returns
   */
  public async extendLogin(refreshToken: string): Promise<Result<string, string | 'not-found-refresh-token'>> {
    // JWT 검증
    const jwtVerfResult = await this.verifyJwt(refreshToken);

    // Checked 에러 맵핑
    if (jwtVerfResult.isErr())
      return err(jwtVerfResult.error);

    // 검증된 jwt 에서 username 필드 추출
    const { username } = jwtVerfResult.value;

    // Refresh token 이 등록되었는지 확인
    const result: boolean = await this.refreshTokenService.doesExist(username, refreshToken);

    // 등록 안되어있으면 에러
    if (!result)
      return err('not-found-refresh-token');

    // 새로운 access token 발급
    const accessToken = await this.createJwt(username, this.ACCESS_TOKEN_EXP);
    return ok(accessToken);
  }

  /**
   * JWT token 생성 메소드
   * @param username Payload 에 포함될 username
   * @param expiresIn 토큰 만료 기간
   * @returns Access token and refresh token
   * @private
   */
  private async createJwt(username: string, expiresIn: string): Promise<string> {
    // Wrap jwt.sign method with promise.
    return new Promise((resolve) => {
      // jwt.sign method requires (payload, secret, options, callback)
      jwt.sign({
        username,
      }, this.JWT_SECRET, {
        expiresIn,
        issuer: 'Push server',
        subject: 'Login token'
      }, (err, res) => {
        if (err)
          throw err;
        resolve(res);
      });
    });
  }

  /**
   * JWT token 을 검증하는 메소드
   * @param token json web token
   * @returns decoded jwt
   * @private
   */
  private async verifyJwt(token: string): Promise<Result<Record<string, any>, string>> {
    return new Promise((resolve) => {
      jwt.verify(token, this.JWT_SECRET, (error, decoded) => {
        if (!error)
          resolve(ok(decoded));
        resolve(err(error.message));
      });
    });
  }
}
