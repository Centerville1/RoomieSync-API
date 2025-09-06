import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHouseDto {
  @ApiProperty({ 
    example: 'My Shared House', 
    description: 'Name of the house' 
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    example: '123 Main St, City, State', 
    description: 'Physical address of the house' 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ 
    example: 'A cozy 3-bedroom house with shared common areas', 
    description: 'Description of the house' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 'Johnny', 
    description: 'Your display name in this house (unique per house)' 
  })
  @IsString()
  displayName: string;
}