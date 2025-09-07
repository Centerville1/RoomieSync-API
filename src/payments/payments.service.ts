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

  async getHousePayments(userId: string, houseId: string) {
    // Verify user is a member of the house
    const membership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    return this.paymentsRepository.find({
      where: { houseId },
      relations: ['fromUser', 'toUser'],
      order: { paymentDate: 'DESC' },
    });
  }

  async getUserPayments(userId: string, houseId: string) {
    // Verify user is a member of the house
    const membership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    return this.paymentsRepository.find({
      where: [
        { fromUserId: userId, houseId },
        { toUserId: userId, houseId },
      ],
      relations: ['fromUser', 'toUser'],
      order: { paymentDate: 'DESC' },
    });
  }

  private async updateBalancesAfterPayment(
    fromUserId: string,
    toUserId: string,
    houseId: string,
    amount: number,
  ) {
    // Find existing balance between these users in this house
    let balance = await this.balancesRepository.findOne({
      where: [
        { fromUserId, toUserId, houseId },
        { fromUserId: toUserId, toUserId: fromUserId, houseId },
      ],
    });

    if (!balance) {
      // Create new balance if none exists
      balance = this.balancesRepository.create({
        fromUserId: toUserId, // Payment reduces what fromUser owes to toUser
        toUserId: fromUserId,
        houseId,
        amount: -amount, // Negative amount means toUser now owes fromUser
      });
    } else {
      // Update existing balance
      if (balance.fromUserId === fromUserId && balance.toUserId === toUserId) {
        // fromUser owes toUser, payment reduces this debt
        balance.amount -= amount;
      } else {
        // toUser owes fromUser, payment increases this debt
        balance.amount += amount;
      }

      // If balance becomes negative, flip the relationship
      if (balance.amount < 0) {
        const tempUserId = balance.fromUserId;
        balance.fromUserId = balance.toUserId;
        balance.toUserId = tempUserId;
        balance.amount = Math.abs(balance.amount);
      }

      // If balance is zero, delete it
      if (balance.amount === 0) {
        await this.balancesRepository.remove(balance);
        return;
      }
    }

    await this.balancesRepository.save(balance);
  }
}