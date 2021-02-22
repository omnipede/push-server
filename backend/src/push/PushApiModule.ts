import { Module } from '@nestjs/common';
import { PushController } from './controller/PushController';
import { TokenController } from './controller/TokenController';
import { PushMessageApplication } from './application/PushMessageApplication';
import { PushTokenService } from './service/token/PushTokenService';
import { PushService } from './service/push/PushService';
import { ClientService } from './service/client/ClientService';
import { ClientHmacGuard } from '../system/guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './service/client/ClientEntity';
import { PushTokenEntity } from './service/token/PushTokenEntity';

@Module({
  imports: [
    // Table entity 등록
    TypeOrmModule.forFeature([
      ClientEntity, PushTokenEntity
    ]),
  ],
  // Controller layer
  controllers: [
    PushController, TokenController
  ],
  // Service layer
  providers: [
    PushMessageApplication,
    PushTokenService, PushService, ClientService,
    ClientHmacGuard,
  ],
})
export class PushApiModule {}
