import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShoppingItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Milk'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Quantity needed',
    example: 2,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the item',
    example: '2% milk, organic preferred'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Category ID for organization',
    example: 'uuid-category-id'
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'User ID to assign this item to (optional)',
    example: 'uuid-user-id'
  })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Whether this item should recur automatically',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Days between recurring additions (required if isRecurring is true)',
    example: 7
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  recurringInterval?: number;
}