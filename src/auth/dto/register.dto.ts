import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'john@example.com', 
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'User password (minimum 8 characters)',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    example: 'John', 
    description: 'User first name' 
  })
  @IsString()
  firstName: string;

  @ApiProperty({ 
    example: 'Doe', 
    description: 'User last name' 
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ 
    example: '+1234567890', 
    description: 'User phone number' 
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ 
    example: 'HOUSE123', 
    description: 'House invite code to join during registration' 
  })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiPropertyOptional({ 
    example: 'Johnny', 
    description: 'Display name for the house (required if using invite code)' 
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}