import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { PushTokenEntity } from '../token/PushTokenEntity';

@Entity({ name: 't_client' })
export class ClientEntity {
  @PrimaryColumn()
  id: string;

  @Column('text', { name: 'account', nullable: false })
  account: string;

  @Column({ name: 'secret', nullable: false })
  secret: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PushTokenEntity, pushTokenEntity => pushTokenEntity.client)
  tokenList: PushTokenEntity[];
}
