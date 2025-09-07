import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousesService } from './houses.service';
import { HousesController } from './houses.controller';
import { House } from '../entities/house.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { User } from '../entities/user.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([House, HouseMembership, User]),
    UploadModule
  ],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}