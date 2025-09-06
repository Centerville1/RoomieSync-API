import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { House } from './house.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  memo: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  fromUser: User;

  @Column()
  fromUserId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  toUser: User;

  @Column()
  toUserId: string;

  @ManyToOne(() => House)
  @JoinColumn()
  house: House;

  @Column()
  houseId: string;
}