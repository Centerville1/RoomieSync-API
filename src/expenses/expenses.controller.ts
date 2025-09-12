import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Expenses')
@Controller('houses/:houseId/expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an expense in house',
    description: 'Create a new expense and automatically update balances between house members'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiResponse({
    status: 201,
    description: 'Expense created successfully',
    schema: {
      example: {
        id: 'uuid',
        description: 'Weekly grocery shopping',
        amount: 125.50,
        expenseDate: '2025-09-06',
        receiptUrl: 'https://example.com/receipt.jpg',
        splitBetween: ['user-uuid-1', 'user-uuid-2'],
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        paidBy: {
          id: 'user-uuid-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        category: {
          id: 'category-uuid',
          name: 'Groceries',
          color: '#10B981'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, category not found, or users not members of house'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async createExpense(
    @Param('houseId') houseId: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req
  ) {
    return this.expensesService.createExpense(createExpenseDto, req.user.id, houseId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get house expenses',
    description: 'Get all expenses for the house, ordered by date (most recent first)'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of house expenses',
    schema: {
      example: [{
        id: 'uuid',
        description: 'Weekly grocery shopping',
        amount: 125.50,
        expenseDate: '2025-09-06',
        receiptUrl: 'https://example.com/receipt.jpg',
        splitBetween: ['user-uuid-1', 'user-uuid-2'],
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        paidBy: {
          id: 'user-uuid-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        category: {
          id: 'category-uuid',
          name: 'Groceries',
          color: '#10B981'
        }
      }]
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getHouseExpenses(@Param('houseId') houseId: string, @Request() req) {
    return this.expensesService.getHouseExpenses(req.user.id, houseId);
  }

  @Get(':expenseId')
  @ApiOperation({
    summary: 'Get expense details',
    description: 'Get detailed information about a specific expense'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiParam({ name: 'expenseId', description: 'Expense UUID' })
  async getExpenseDetails(@Param('expenseId') expenseId: string, @Request() req) {
    return this.expensesService.getExpenseDetails(expenseId, req.user.id);
  }
}

@ApiTags('Balances')
@Controller('houses/:houseId/balances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BalancesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get house balances',
    description: 'Get current IOU balances between house members'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of current balances between all house members',
    schema: {
      example: [{
        id: 'balance-uuid',
        amount: 62.75,
        updatedAt: '2025-09-06T12:00:00Z',
        fromUser: {
          id: 'user-uuid-1',
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com'
        },
        toUser: {
          id: 'user-uuid-2',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      }]
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getHouseBalances(@Param('houseId') houseId: string, @Request() req) {
    return this.expensesService.getHouseBalances(req.user.id, houseId);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get user balances in house',
    description: 'Get IOU balances for the requesting user in a specific house'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of current balances involving the requesting user',
    schema: {
      example: [{
        id: 'balance-uuid',
        amount: 62.75,
        type: 'owes',
        updatedAt: '2025-09-06T12:00:00Z',
        otherUser: {
          id: 'user-uuid-2',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      }, {
        id: 'balance-uuid-2',
        amount: 25.30,
        type: 'owed_by',
        updatedAt: '2025-09-06T12:00:00Z',
        otherUser: {
          id: 'user-uuid-3',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah@example.com'
        }
      }]
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getUserBalances(@Param('houseId') houseId: string, @Request() req) {
    return this.expensesService.getUserBalances(req.user.id, houseId);
  }
}