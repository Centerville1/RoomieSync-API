import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiParam
} from '@nestjs/swagger';
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { JoinHouseDto } from './dto/join-house.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Houses')
@Controller('houses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new house',
    description: 'Create a new house and become its admin. Generates a unique invite code.'
  })
  @ApiBody({ type: CreateHouseDto })
  @ApiResponse({
    status: 201,
    description: 'House successfully created',
    schema: {
      example: {
        id: 'uuid',
        name: 'My Shared House',
        address: '123 Main St',
        description: 'A cozy house',
        inviteCode: 'HOUSE123',
        isActive: true,
        createdAt: '2025-09-06T12:00:00Z',
        updatedAt: '2025-09-06T12:00:00Z',
        memberships: [{
          id: 'uuid',
          displayName: 'Johnny',
          role: 'admin',
          joinedAt: '2025-09-06T12:00:00Z',
          user: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }]
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['name should not be empty'],
        error: 'Bad Request'
      }
    }
  })
  @ApiConflictResponse({
    description: 'Display name already taken',
    schema: {
      example: {
        statusCode: 409,
        message: 'Display name "Johnny" is already taken in this house',
        error: 'Conflict'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async createHouse(@Body() createHouseDto: CreateHouseDto, @Request() req) {
    return this.housesService.createHouse(createHouseDto, req.user.id);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Join a house',
    description: 'Join an existing house using its invite code'
  })
  @ApiBody({ type: JoinHouseDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully joined house',
    schema: {
      example: {
        id: 'uuid',
        name: 'My Shared House',
        address: '123 Main St',
        description: 'A cozy house',
        inviteCode: 'HOUSE123',
        createdAt: '2025-09-06T12:00:00Z',
        userMembership: {
          id: 'uuid',
          displayName: 'Johnny',
          role: 'member',
          joinedAt: '2025-09-06T12:00:00Z'
        },
        members: [{
          id: 'uuid',
          displayName: 'Admin User',
          role: 'admin',
          joinedAt: '2025-09-05T10:00:00Z',
          user: {
            id: 'uuid',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com'
          }
        }]
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or inactive',
    schema: {
      example: {
        statusCode: 404,
        message: 'House not found or inactive',
        error: 'Not Found'
      }
    }
  })
  @ApiConflictResponse({
    description: 'Already a member or display name taken',
    schema: {
      example: {
        statusCode: 409,
        message: 'Display name "Johnny" is already taken in this house',
        error: 'Conflict'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async joinHouse(@Body() joinHouseDto: JoinHouseDto, @Request() req) {
    return this.housesService.joinHouse(joinHouseDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user houses',
    description: 'Get all houses the authenticated user belongs to'
  })
  @ApiResponse({
    status: 200,
    description: 'List of houses user belongs to',
    schema: {
      example: [{
        id: 'uuid',
        name: 'My Shared House',
        address: '123 Main St',
        description: 'A cozy house',
        inviteCode: 'HOUSE123',
        createdAt: '2025-09-06T12:00:00Z',
        membership: {
          id: 'uuid',
          displayName: 'Johnny',
          role: 'admin',
          joinedAt: '2025-09-06T12:00:00Z'
        }
      }]
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getUserHouses(@Request() req) {
    return this.housesService.getUserHouses(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get house details',
    description: 'Get detailed information about a specific house including all members'
  })
  @ApiParam({
    name: 'id',
    description: 'House UUID',
    example: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'House details with members',
    schema: {
      example: {
        id: 'uuid',
        name: 'My Shared House',
        address: '123 Main St',
        description: 'A cozy house',
        inviteCode: 'HOUSE123',
        createdAt: '2025-09-06T12:00:00Z',
        userMembership: {
          id: 'uuid',
          displayName: 'Johnny',
          role: 'admin',
          joinedAt: '2025-09-06T12:00:00Z'
        },
        members: [{
          id: 'uuid',
          displayName: 'Johnny',
          role: 'admin',
          joinedAt: '2025-09-06T12:00:00Z',
          user: {
            id: 'uuid',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }]
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'House not found or user is not a member',
    schema: {
      example: {
        statusCode: 404,
        message: 'House not found or you are not a member',
        error: 'Not Found'
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token'
  })
  async getHouseDetails(@Param('id') id: string, @Request() req) {
    return this.housesService.getHouseDetails(id, req.user.id);
  }
}