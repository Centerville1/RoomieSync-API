import { IsString, IsOptional, IsHexColor, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ 
    example: 'Groceries', 
    description: 'Category name' 
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    example: 'Food and household essentials', 
    description: 'Category description' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    example: '#10B981', 
    description: 'Hex color code for the category',
    default: '#6B7280'
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ 
    example: 'shopping-cart', 
    description: 'Icon identifier' 
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Display order (lower numbers appear first)',
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}