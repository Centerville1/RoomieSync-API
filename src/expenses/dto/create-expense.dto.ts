import { IsString, IsNumber, IsArray, IsOptional, IsDateString, IsUUID, Min, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ 
    example: 'Weekly grocery shopping', 
    description: 'Description of the expense' 
  })
  @IsString()
  description: string;

  @ApiProperty({ 
    example: 125.50, 
    description: 'Total amount of the expense' 
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ 
    example: '2025-09-06', 
    description: 'Date when expense occurred (YYYY-MM-DD)' 
  })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com/receipt.jpg', 
    description: 'URL to receipt image' 
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({ 
    example: ['user-uuid-1', 'user-uuid-2'], 
    description: 'Array of user IDs to split the expense between' 
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  splitBetween: string[];

  @ApiProperty({ 
    example: 'category-uuid', 
    description: 'Category ID for this expense' 
  })
  @IsUUID(4)
  categoryId: string;
}