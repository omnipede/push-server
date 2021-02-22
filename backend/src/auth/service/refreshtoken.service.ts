import { Injectable } from '@nestjs/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Repository,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Refresh token entity
 * (username, refresh_token) 쌍을 저장한다.
 */
@Entity({ name: 't_refresh_token' })
// 중복된 (username, refresh_token 쌍이 존재해서는 안된다.
@Unique(["username", "refreshToken"])
export class RefreshTokenEntity {

  // PK
  @PrimaryGeneratedColumn()
  seq: number;

  // 사용자 아이디
  @Column({ name: 'username', nullable: false })
  username: string;

  // Refresh token of user
  @Column( { name: 'refresh_token', nullable: false })
  refreshToken: string;

  // Created at
  @CreateDateColumn({ name: 'created_at'})
  createdAt: Date;

  // Updated at
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Refresh token CRUD service
 */
@Injectable()
export class RefreshTokenService {

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  /**
   * Refresh token 을 저장하는 메소드
   * @param username Username of refresh token owner
   * @param refreshToken 저장할 refresh token
   */
  public async save(username: string, refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.save({
      username, refreshToken
    });
  }

  /**
   * (username, refreshToken) 이 등록되었는지 확인하는 메소드
   * @param username 사용자 username
   * @param refreshToken 로그인 시 발급 받은 refresh token
   */
  public async doesExist(username: string, refreshToken: string): Promise<boolean> {
    // Find refresh token entity
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        username, refreshToken
      }
    });

    // If refresh token entity is null, return false
    if (!refreshTokenEntity)
      return false;
    return true;
  }

  /**
   * Username 으로 삭제할 refresh token
   * @param username 삭제할 refresh token 을 갖고있는 사용자의 username
   */
  public async deleteByUsername(username: string) {
    await this.refreshTokenRepository.delete({
      username
    });
  }
}
