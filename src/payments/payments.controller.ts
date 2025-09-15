import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('houses/:houseId/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a payment',
    description: 'Record a payment between house members and update balances'
  })
  @ApiParam({ name: 'houseId', description: 'House UUID' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    schema: {
      example: {
        id: 'payment-uuid',
        amount: 125.50,
        memo: 'Groceries repayment',
        paymentDate: '2025-09-06',
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        fromUser: {
          id: 'user-uuid-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        toUser: {
          id: 'user-uuid-2',
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, users not members of house, or attempting to pay yourself'
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async createPayment(
    @Param('houseId') houseId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req
  ) {
    return this.paymentsService.createPayment(createPaymentDto, req.user.id, houseId);
  }

}