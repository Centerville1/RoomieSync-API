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
import { HouseMembership } from './house-membership.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ default: '#6366F1' }) // Default indigo color
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => HouseMembership, (membership) => membership.user)
  houseMemberships: HouseMembership[];

  @OneToMany(() => Expense, (expense) => expense.paidBy)
  expensesPaid: Expense[];

  @OneToMany(() => Payment, (payment) => payment.fromUser)
  paymentsMade: Payment[];

  @OneToMany(() => Payment, (payment) => payment.toUser)
  paymentsReceived: Payment[];

  @OneToMany(() => Balance, (balance) => balance.user1)
  balancesAsUser1: Balance[];

  @OneToMany(() => Balance, (balance) => balance.user2)
  balancesAsUser2: Balance[];

  // Helper method to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}