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
import { Category } from './category.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ nullable: true })
  receiptUrl: string;

  // Array of user IDs this expense was split between (including the payer)
  @Column('uuid', { array: true })
  splitBetween: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  paidBy: User;

  @Column()
  paidById: string;

  @ManyToOne(() => House)
  @JoinColumn()
  house: House;

  @Column()
  houseId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn()
  category: Category;

  @Column()
  categoryId: string;

  // Helper methods
  get amountPerPerson(): number {
    return Number(this.amount) / this.splitBetween.length;
  }

  get splitCount(): number {
    return this.splitBetween.length;
  }
}