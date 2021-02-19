import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as Joi from 'joi';

/**
 * 공지사항이 저장된 DB 의 connection 설정
 */
@Injectable()
class DBConfig implements TypeOrmOptionsFactory {
  type: 'mysql' | 'mariadb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  // DB table 을 typeorm entity 와 synchronize 할지 여부
  synchronize: boolean;
  timezone: string;

  // 설정값을 validate 하기 위한 schema
  private readonly schema = Joi.object({
    type: Joi.string().valid('mysql', 'mariadb').required(),
    host: Joi.string().required(),
    port: Joi.number().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    database: Joi.string().required(),
    synchronize: Joi.boolean().required(),
    timezone: Joi.string().required(),
  }).unknown(true);

  constructor(
    private configService: ConfigService
  ) {
    // Config service 에서 설정값을 불러와 멤버 변수에 저장함
    this.type = configService.get('db.type')
    this.host = configService.get('db.host');
    this.port = configService.get('db.port');
    this.username = configService.get('db.username');
    this.password = configService.get('db.password');
    this.database = configService.get('db.database');
    this.synchronize = configService.get('db.synchronize', false);
    this.timezone = configService.get('db.timezone');

    const { error } = this.schema.validate(this);
    if (error)
      throw new Error(JSON.stringify(error.details, null, 4));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createTypeOrmOptions(connectionName?: string): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    return {
      type: this.type,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      synchronize: this.synchronize,
      timezone: this.timezone,
      keepConnectionAlive: true,
      autoLoadEntities: true,
      logging: false,
    };
  }
}

/**
 * 공지사항 DB 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: DBConfig,
    }),
  ],
})
export class DBModule {}
