import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Balance } from '../entities/balance.entity';
import { HouseMembership } from '../entities/house-membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Balance, HouseMembership]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}