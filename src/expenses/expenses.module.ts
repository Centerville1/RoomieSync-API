import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController, BalancesController } from './expenses.controller';
import { Expense } from '../entities/expense.entity';
import { Balance } from '../entities/balance.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { Category } from '../entities/category.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Balance, HouseMembership, Category]),
    CategoriesModule,
  ],
  controllers: [ExpensesController, BalancesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}