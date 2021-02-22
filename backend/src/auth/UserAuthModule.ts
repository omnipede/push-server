import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './JwtAuthGuard';
import { UserEntity, UserService } from './service/user.service';
import { RefreshTokenEntity, RefreshTokenService } from './service/refreshtoken.service';
import { AuthApplication, AuthConfig } from './application/AuthApplication';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * 사용자 인증 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, RefreshTokenEntity,
    ]),
  ],
  providers: [
    AuthApplication, AuthConfig,
    UserService, RefreshTokenService,
    JwtAuthGuard,
  ],
  exports: [
    JwtAuthGuard,
  ]
})
export class UserAuthModule {}
