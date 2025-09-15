import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingItem } from '../entities/shopping-item.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { Category } from '../entities/category.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingItem, HouseMembership, Category]),
    CommonModule
  ],
  controllers: [ShoppingListsController],
  providers: [ShoppingListsService],
  exports: [ShoppingListsService],
})
export class ShoppingListsModule {}