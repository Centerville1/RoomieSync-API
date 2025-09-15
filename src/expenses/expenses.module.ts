import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController, BalancesController, TransactionsController } from './expenses.controller';
import { Expense } from '../entities/expense.entity';
import { Payment } from '../entities/payment.entity';
import { Balance } from '../entities/balance.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { Category } from '../entities/category.entity';
import { CategoriesModule } from '../categories/categories.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Payment, Balance, HouseMembership, Category]),
    CategoriesModule,
    CommonModule,
  ],
  controllers: [ExpensesController, BalancesController, TransactionsController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}