import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '../../entities/house-membership.entity';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the member',
    enum: MemberRole,
    example: MemberRole.ADMIN
  })
  @IsEnum(MemberRole, { message: 'Role must be either admin or member' })
  @IsNotEmpty()
  role: MemberRole;
}