import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchPurchaseDto {
  @ApiProperty({
    description: 'Array of shopping item IDs to mark as purchased',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];
}