import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { Category } from '../entities/category.entity';
import { Balance } from '../entities/balance.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Balance)
    private balancesRepository: Repository<Balance>,
  ) {}

  private async verifyHouseMembership(userId: string, houseId: string) {
    const membership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true }
    });

    if (!membership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    return membership;
  }

  async createExpense(createExpenseDto: CreateExpenseDto, userId: string, houseId: string) {
    await this.verifyHouseMembership(userId, houseId);

    // Verify category belongs to this house
    const category = await this.categoriesRepository.findOne({
      where: { id: createExpenseDto.categoryId, houseId }
    });

    if (!category) {
      throw new BadRequestException('Category not found in this house');
    }

    // Verify all users in splitBetween are members of this house
    const membershipPromises = createExpenseDto.splitBetween.map(splitUserId => 
      this.houseMembershipsRepository.findOne({
        where: { userId: splitUserId, houseId, isActive: true }
      })
    );

    const memberships = await Promise.all(membershipPromises);
    if (memberships.some(m => !m)) {
      throw new BadRequestException('One or more users in splitBetween are not members of this house');
    }

    // Create the expense
    const expense = this.expensesRepository.create({
      ...createExpenseDto,
      paidById: userId,
      houseId,
      expenseDate: new Date(createExpenseDto.expenseDate),
    });

    const savedExpense = await this.expensesRepository.save(expense);

    // Update balances
    await this.updateBalancesForExpense(savedExpense);

    return await this.getExpenseDetails(savedExpense.id, userId);
  }

  private async updateBalancesForExpense(expense: Expense) {
    const splitAmount = expense.amount / expense.splitBetween.length;
    
    // Update balance for each person in the split
    for (const splitUserId of expense.splitBetween) {
      if (splitUserId !== expense.paidById) {
        // This person owes the payer
        await this.updateBalance(splitUserId, expense.paidById, expense.houseId, splitAmount);
      }
    }
  }

  private async updateBalance(fromUserId: string, toUserId: string, houseId: string, amount: number) {
    // Ensure consistent ordering: user1 has smaller UUID
    const [user1Id, user2Id] = fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];
    
    let balance = await this.balancesRepository.findOne({
      where: { user1Id, user2Id, houseId }
    });

    if (balance) {
      // Update existing balance
      if (fromUserId === user1Id) {
        // user1 owes user2 more
        balance.amount = Number(balance.amount) + amount;
      } else {
        // user2 owes user1, so subtract from the balance
        balance.amount = Number(balance.amount) - amount;
      }
    } else {
      // Create new balance
      const balanceAmount = fromUserId === user1Id ? amount : -amount;
      balance = this.balancesRepository.create({
        user1Id,
        user2Id,
        houseId,
        amount: balanceAmount
      });
    }

    await this.balancesRepository.save(balance);
  }

  async getHouseExpenses(userId: string, houseId: string) {
    await this.verifyHouseMembership(userId, houseId);

    return await this.expensesRepository.find({
      where: { houseId },
      relations: ['paidBy', 'category'],
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
      select: {
        paidBy: { id: true, firstName: true, lastName: true, email: true }
      }
    });
  }

  async getExpenseDetails(expenseId: string, userId: string) {
    const expense = await this.expensesRepository.findOne({
      where: { id: expenseId },
      relations: ['paidBy', 'category', 'house']
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.verifyHouseMembership(userId, expense.houseId);

    return {
      ...expense,
      paidBy: {
        id: expense.paidBy.id,
        firstName: expense.paidBy.firstName,
        lastName: expense.paidBy.lastName,
        email: expense.paidBy.email
      }
    };
  }

  async getHouseBalances(userId: string, houseId: string) {
    await this.verifyHouseMembership(userId, houseId);

    const balances = await this.balancesRepository.find({
      where: { houseId },
      relations: ['user1', 'user2'],
      select: {
        user1: { id: true, firstName: true, lastName: true, email: true },
        user2: { id: true, firstName: true, lastName: true, email: true }
      }
    });

    // Filter out zero balances and format response
    return balances
      .filter(balance => Math.abs(Number(balance.amount)) > 0.01)
      .map(balance => {
        const debtInfo = balance.getDebtInfo();
        if (!debtInfo) return null;
        
        return {
          id: balance.id,
          amount: debtInfo.amount,
          fromUser: debtInfo.debtor,
          toUser: debtInfo.creditor,
          updatedAt: balance.updatedAt
        };
      })
      .filter(balance => balance !== null);
  }

  async getUserBalances(userId: string, houseId: string) {
    await this.verifyHouseMembership(userId, houseId);

    const balances = await this.balancesRepository.find({
      where: [
        { houseId, user1Id: userId },
        { houseId, user2Id: userId }
      ],
      relations: ['user1', 'user2'],
      select: {
        user1: { id: true, firstName: true, lastName: true, email: true },
        user2: { id: true, firstName: true, lastName: true, email: true }
      }
    });

    return balances
      .filter(balance => Math.abs(Number(balance.amount)) > 0.01)
      .map(balance => {
        const debtInfo = balance.getDebtInfo();
        if (!debtInfo) return null;
        
        const isUserDebtor = debtInfo.debtor.id === userId;
        const otherUser = isUserDebtor ? debtInfo.creditor : debtInfo.debtor;
        
        return {
          id: balance.id,
          amount: debtInfo.amount,
          type: isUserDebtor ? 'owes' : 'owed_by',
          otherUser,
          updatedAt: balance.updatedAt
        };
      })
      .filter(balance => balance !== null);
  }
}