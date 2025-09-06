import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';
import { HouseMembership } from '../entities/house-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, HouseMembership])],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}