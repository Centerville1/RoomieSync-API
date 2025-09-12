import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HousesService } from "./houses.service";
import { HousesController } from "./houses.controller";
import { House } from "../entities/house.entity";
import { HouseMembership } from "../entities/house-membership.entity";
import { User } from "../entities/user.entity";
import { ShoppingList } from "../entities/shopping-list.entity";
import { Expense } from "../entities/expense.entity";
import { Payment } from "../entities/payment.entity";
import { Balance } from "../entities/balance.entity";
import { Category } from "../entities/category.entity";
import { UploadModule } from "../upload/upload.module";
import { CategoriesModule } from "../categories/categories.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      House, 
      HouseMembership, 
      User, 
      ShoppingList, 
      Expense, 
      Payment, 
      Balance, 
      Category
    ]),
    UploadModule,
    CategoriesModule,
  ],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
