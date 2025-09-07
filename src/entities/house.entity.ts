import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Expense } from './expense.entity';
import { Payment } from './payment.entity';
import { Balance } from './balance.entity';
import { Category } from './category.entity';
import { HouseMembership } from './house-membership.entity';

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  inviteCode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: '#10B981' }) // Default emerald color
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => HouseMembership, (membership) => membership.house)
  memberships: HouseMembership[];

  @OneToMany(() => Expense, (expense) => expense.house)
  expenses: Expense[];

  @OneToMany(() => Payment, (payment) => payment.house)
  payments: Payment[];

  @OneToMany(() => Balance, (balance) => balance.house)
  balances: Balance[];

  @OneToMany(() => Category, (category) => category.house)
  categories: Category[];

  // Helper method to get member count
  get memberCount(): number {
    return this.memberships ? this.memberships.length : 0;
  }
}