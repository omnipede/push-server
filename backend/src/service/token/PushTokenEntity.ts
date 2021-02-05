import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn, Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClientEntity } from '../client/ClientEntity';

@Entity({ name: 't_push_token' })
@Unique(["client_id", "id", "token"])
export class PushTokenEntity {
  // PK
  @PrimaryGeneratedColumn()
  seq: number;

  // Token id
  @Column({ name: 'id', nullable: false })
  id: string;

  // Token value
  @Column({ name: 'token', nullable: false })
  token: string;

  @Column({ name: 'deleted', nullable: false })
  deleted: boolean = false;

  @CreateDateColumn({ name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // FK
  @Column({ name: 'client_id' })
  client_id: string;

  // 토큰이 등록된 클라이언트
  @ManyToOne(() => ClientEntity, client => client.tokenList, { onDelete: 'CASCADE', nullable: false, eager: true })
  @JoinColumn({ name: 'client_id' })
  client: ClientEntity;

  constructor(clientId: string, tokenId: string, token: string) {
    this.client_id = clientId;
    this.id = tokenId;
    this.token = token;
  }
}
