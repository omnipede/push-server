import { Optional } from 'typescript-optional';
import { Injectable } from '@nestjs/common';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Repository, UpdateDateColumn } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * User 가 저장된 db table
 */
@Entity({ name: 't_admin' })
export class UserEntity {

  // PK
  @PrimaryGeneratedColumn()
  seq: number;

  // 사용자 아이디
  @Column({ name: 'username', nullable: false, unique: true })
  username: string;

  // User 의 password 를 해싱해서 저장한 필드
  @Column({ name: 'hashed_password', nullable: false })
  hashedPassword: string;

  // Created at
  @CreateDateColumn({ name: 'created_at'})
  createdAt: Date;

  // Updated at
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 사용자 CRUD service
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Username, password 를 이용해서 user 를 찾는 메소드
   * @param username Username
   * @returns If found, returns username or returns empty
   */
  public async findUser(username: string): Promise<Optional<{ username: string, hashedPassword: string }>> {
    // Find user from DB by username
    const userEntity = await this.userRepository.findOne({
      where: {
        username
      }
    });

    // If entity not found
    if (!userEntity)
      return Optional.empty();

    // Return username and hashed password
    return Optional.of({
      username: userEntity.username,
      hashedPassword: userEntity.hashedPassword
    });
  }
}
