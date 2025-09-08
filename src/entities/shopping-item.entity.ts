import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShoppingList } from './shopping-list.entity';
import { Category } from './category.entity';
import { User } from './user.entity';

@Entity('shopping_items')
export class ShoppingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 1 })
  quantity: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  purchasedAt: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringInterval: number; // days

  @Column({ nullable: true })
  lastRecurredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ShoppingList, (list) => list.items)
  @JoinColumn()
  shoppingList: ShoppingList;

  @Column()
  shoppingListId: string;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  @JoinColumn()
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn()
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn()
  purchasedBy: User;

  @Column({ nullable: true })
  purchasedById: string;
}