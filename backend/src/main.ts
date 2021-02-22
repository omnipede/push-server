import { NestFactory } from '@nestjs/core';
import { Logger, LogLevel, Module } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { GlobalErrorFilter, HttpExceptionFilter, SystemExceptionFilter } from './system/error';
import { DBModule } from './system/db';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './system/config';
import * as helmet from 'helmet';
import { UserAuthModule } from './auth/UserAuthModule';
import { PushApiModule } from './push/PushApiModule';

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
    // Configuration module
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    // Database connection
    DBModule,
    // Authentication module
    UserAuthModule,
    // Push api module
    PushApiModule,
  ],
})
class AppModule {}

// Bootstrap logger
const logger: Logger  = new Logger("Bootstrap");

/**
 * Boot strap server app module
 */
async function bootstrap() {
  // Create server application
  const app = await NestFactory.create(AppModule, {
    bodyParser: false
  });

  // App server filter, pipe 설정
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new SystemExceptionFilter());

  // 보안모듈 적용
  app.use(helmet());

  // CORS 허용
  app.enableCors();

  // 설정 값 받아오기
  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const port: number = configService.get( "server.port", 3000 ); // 포트 설정
  const logLevel: LogLevel[] = configService.get( "logger", [] ); // 로그 레벨 설정

  // 로그 레벨 설정
  app.useLogger(logLevel);

  // 리스닝 시작
  await app.listen(port);
  logger.log(`Server is listening on port ${port}`);
}

/**
 * Request 의 raw body 를 임시로 요청 객체에 저장하는 메소드
 * @param req Http request object
 * @param res Http response object
 * @param buf Body buffer
 */
const rawBodyBuffer = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString();
  }
};

bootstrap();
