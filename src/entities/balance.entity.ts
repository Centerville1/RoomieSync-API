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
@Unique(['houseId', 'user1Id', 'user2Id'])
export class Balance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Joint balance between two users - positive means user1 owes user2
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Store users as user1 and user2 (user1 has lower UUID for consistency)
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user1: User;

  @Column()
  user1Id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user2: User;

  @Column()
  user2Id: string;

  @ManyToOne(() => House)
  @JoinColumn()
  house: House;

  @Column()
  houseId: string;

  // Helper method to get who owes whom
  getDebtInfo(): { debtor: User; creditor: User; amount: number } | null {
    const absoluteAmount = Math.abs(Number(this.amount));
    if (absoluteAmount < 0.01) return null;

    const amount = Number(this.amount);
    return {
      debtor: amount > 0 ? this.user1 : this.user2,
      creditor: amount > 0 ? this.user2 : this.user1,
      amount: absoluteAmount
    };
  }

  get absoluteAmount(): number {
    return Math.abs(Number(this.amount));
  }
}