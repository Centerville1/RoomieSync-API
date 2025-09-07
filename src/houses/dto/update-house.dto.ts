import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateHouseDto {
  @ApiProperty({
    example: 'My Updated House Name',
    description: 'House name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '456 New Address St, City, State',
    description: 'House address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'An updated description of our house',
    description: 'House description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/house.jpg',
    description: 'URL to house image',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'House image must be a valid URL' })
  imageUrl?: string;

  @ApiProperty({
    example: '#10B981',
    description: 'House color as hex code (e.g., #10B981)',
    required: false,
  })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color code (e.g., #10B981)' })
  color?: string;
}