import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { House } from './house.entity';

@Entity('balances')
@Unique(['houseId', 'fromUserId', 'toUserId'])
export class Balance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Positive amount means fromUser owes toUser money
  // Negative amount means toUser owes fromUser money
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amount: number;

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

  // Helper methods
  get isOwed(): boolean {
    return Number(this.amount) > 0;
  }

  get isOwing(): boolean {
    return Number(this.amount) < 0;
  }

  get absoluteAmount(): number {
    return Math.abs(Number(this.amount));
  }
}