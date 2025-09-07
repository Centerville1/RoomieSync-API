import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 125.50,
    description: 'Payment amount (must be positive)',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a valid number with up to 2 decimal places' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount: number;

  @ApiProperty({
    example: 'user-uuid-2',
    description: 'UUID of user receiving the payment',
  })
  @IsNotEmpty()
  @IsUUID(4, { message: 'toUserId must be a valid UUID' })
  toUserId: string;

  @ApiProperty({
    example: 'Groceries repayment',
    description: 'Optional memo for the payment',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    example: '2025-09-06',
    description: 'Date the payment was made (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Payment date must be a valid date string (YYYY-MM-DD)' })
  paymentDate: string;
}