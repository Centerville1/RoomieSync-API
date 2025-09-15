import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Balance } from '../entities/balance.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Balance)
    private balancesRepository: Repository<Balance>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
  ) {}


  async createPayment(
    createPaymentDto: CreatePaymentDto,
    fromUserId: string,
    houseId: string,
  ) {
    // Verify both users are members of the house
    const [fromMembership, toMembership] = await Promise.all([
      this.houseMembershipsRepository.findOne({
        where: { userId: fromUserId, houseId, isActive: true },
      }),
      this.houseMembershipsRepository.findOne({
        where: { userId: createPaymentDto.toUserId, houseId, isActive: true },
      }),
    ]);

    if (!fromMembership) {
      throw new NotFoundException('You are not a member of this house');
    }

    if (!toMembership) {
      throw new BadRequestException('Payment recipient is not a member of this house');
    }

    if (fromUserId === createPaymentDto.toUserId) {
      throw new BadRequestException('Cannot make payment to yourself');
    }

    // Create the payment
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      fromUserId,
      houseId,
      paymentDate: new Date(createPaymentDto.paymentDate),
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update balances
    await this.updateBalancesAfterPayment(
      fromUserId,
      createPaymentDto.toUserId,
      houseId,
      createPaymentDto.amount,
    );

    // Return payment with user details
    return this.paymentsRepository.findOne({
      where: { id: savedPayment.id },
      relations: ['fromUser', 'toUser'],
    });
  }



  private async updateBalancesAfterPayment(
    fromUserId: string,
    toUserId: string,
    houseId: string,
    amount: number,
  ) {
    // Ensure consistent ordering: user1 has smaller UUID
    const [user1Id, user2Id] = fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];
    
    let balance = await this.balancesRepository.findOne({
      where: { user1Id, user2Id, houseId }
    });

    if (balance) {
      // Update existing joint balance
      if (fromUserId === user1Id) {
        // user1 is paying user2, so user1 owes less (subtract from balance)
        balance.amount = Number(balance.amount) - amount;
      } else {
        // user2 is paying user1, so user1 is owed less (add to balance)
        balance.amount = Number(balance.amount) + amount;
      }

      // If balance is effectively zero, delete it
      if (Math.abs(balance.amount) < 0.01) {
        await this.balancesRepository.remove(balance);
        return;
      }
    } else {
      // Create new balance - payment creates a debt in the opposite direction
      const balanceAmount = fromUserId === user1Id ? -amount : amount;
      balance = this.balancesRepository.create({
        user1Id,
        user2Id,
        houseId,
        amount: balanceAmount
      });
    }

    await this.balancesRepository.save(balance);
  }
}