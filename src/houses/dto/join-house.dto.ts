import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinHouseDto {
  @ApiProperty({ 
    example: 'HOUSE123', 
    description: 'Invite code of the house to join' 
  })
  @IsString()
  inviteCode: string;

  @ApiProperty({ 
    example: 'Johnny', 
    description: 'Your display name in this house (unique per house)' 
  })
  @IsString()
  displayName: string;
}