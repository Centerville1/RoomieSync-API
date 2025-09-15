import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseMembersService } from './house-members.service';
import { HouseMembership } from '../entities/house-membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HouseMembership]),
  ],
  providers: [HouseMembersService],
  exports: [HouseMembersService],
})
export class CommonModule {}