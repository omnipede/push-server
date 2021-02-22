import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './JwtAuthGuard';
import { UserEntity, UserService } from './service/user.service';
import { RefreshTokenEntity, RefreshTokenService } from './service/refreshtoken.service';
import { AuthApplication, AuthConfig } from './application/AuthApplication';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController, AuthHttpConfig } from './controller/auth.controller';

/**
 * 사용자 인증 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, RefreshTokenEntity,
    ]),
  ],
  // Controller layer
  controllers: [
    AuthController,
  ],
  // Service layer
  providers: [
    AuthApplication, AuthConfig,
    UserService, RefreshTokenService,
    JwtAuthGuard, AuthHttpConfig,
  ],
  exports: [
    JwtAuthGuard,
  ]
})
export class UserAuthModule {}
