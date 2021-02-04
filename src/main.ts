import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PushController } from './controller/PushController';
import { PushMessageApplication } from './application/PushMessageApplication';
import { PushTokenService } from './service/token/PushTokenService';
import { PushService } from './service/push/PushService';
import { GlobalErrorFilter, HttpExceptionFilter, SystemExceptionFilter } from './system/error';
import { ClientService } from './service/client/ClientService';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushTokenEntity } from './service/token/PushTokenEntity';
import { ClientEntity } from './service/client/ClientEntity';

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
      logging: true,
    }),
    // Table entity 등록
    TypeOrmModule.forFeature([
      ClientEntity, PushTokenEntity
    ])
  ],
  controllers: [PushController],
  providers: [
    PushMessageApplication,
    PushTokenService, PushService, ClientService
  ]
})
class AppModule {}

/**
 * Boot strap server app module
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalErrorFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new SystemExceptionFilter());
  await app.listen(3000);
}

bootstrap();
