import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { PushController } from './controller/PushController';
import { PushMessageApplication } from './application/PushMessageApplication';
import { PushTokenService } from './service/token/PushTokenService';
import { PushService } from './service/push/PushService';
import { GlobalErrorFilter, HttpExceptionFilter, SystemExceptionFilter } from './system/error';
import { ClientService } from './service/client/ClientService';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushTokenEntity } from './service/token/PushTokenEntity';
import { ClientEntity } from './service/client/ClientEntity';
import { TokenController } from './controller/TokenController';
import { ClientHmacGuard } from './system/guard';

/**
 * 서버 시작 스크립트.
 * DB 연결 설정, 미들웨어 설정, 필터 설정, 서버 어플리케이션 초기화 등의 작업을 진행하고
 * 최종적으로 서버를 실행한다.
 */

/**
 * IoC container
 */
@Module({
  imports: [
    // Database connection
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'database_development',
      synchronize: true,
      dropSchema: false,
      timezone: 'Z',
      autoLoadEntities: true,
      keepConnectionAlive: true,
      logging: false,
    }),
    // Table entity 등록
    TypeOrmModule.forFeature([
      ClientEntity, PushTokenEntity
    ])
  ],
  // Controller layer
  controllers: [PushController, TokenController],
  // Service layer
  providers: [
    PushMessageApplication,
    PushTokenService, PushService, ClientService,
    ClientHmacGuard,
  ]
})
class AppModule {}

/**
 * Boot strap server app module
 */
async function bootstrap() {
  // Create server application
  const app = await NestFactory.create(AppModule, {
    bodyParser: false
  });
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new SystemExceptionFilter());
  await app.listen(3000);
}

/**
 * Request 의 raw body 를 임시로 요청 객체에 저장하는 메소드
 * @param req
 * @param res
 * @param buf
 */
const rawBodyBuffer = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString();
  }
};

bootstrap();
