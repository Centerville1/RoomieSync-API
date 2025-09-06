import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousesService } from './houses.service';
import { HousesController } from './houses.controller';
import { House } from '../entities/house.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([House, HouseMembership, User])],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}