import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { House } from './house.entity';
import { ShoppingItem } from './shopping-item.entity';

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Shopping List' })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => House, (house) => house.primaryShoppingList, { nullable: true })
  primaryForHouse: House;

  @ManyToOne(() => House, (house) => house.secondaryShoppingLists, { nullable: true })
  @JoinColumn()
  house: House;

  @Column({ nullable: true })
  houseId: string;

  @OneToMany(() => ShoppingItem, (item) => item.shoppingList, { cascade: true })
  items: ShoppingItem[];
}