import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { House } from '../entities/house.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { User } from '../entities/user.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import { JoinHouseDto } from './dto/join-house.dto';
import { MemberRole } from '../entities/house-membership.entity';

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House)
    private housesRepository: Repository<House>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createHouse(createHouseDto: CreateHouseDto, userId: string) {
    const maxRetries = 5;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      const inviteCode = this.generateInviteCode();
      
      try {
        // Create the house
        const house = this.housesRepository.create({
          name: createHouseDto.name,
          address: createHouseDto.address,
          description: createHouseDto.description,
          inviteCode,
        });

        const savedHouse = await this.housesRepository.save(house);

        // Add creator as admin
        const membership = this.houseMembershipsRepository.create({
          userId,
          houseId: savedHouse.id,
          displayName: createHouseDto.displayName,
          role: MemberRole.ADMIN,
        });

        const savedMembership = await this.houseMembershipsRepository.save(membership);

        return {
          ...savedHouse,
          memberships: [
            {
              ...savedMembership,
              user: await this.usersRepository.findOne({ where: { id: userId } })
            }
          ]
        };
        
      } catch (error) {
        // Check if it's a unique constraint violation on inviteCode
        if (error instanceof QueryFailedError && 
            error.message.includes('duplicate key value violates unique constraint') &&
            error.message.includes('inviteCode')) {
          attempt++;
          continue; // Retry with new code
        }
        
        // Check if display name is already taken in this house (shouldn't happen for new house)
        if (error instanceof QueryFailedError && 
            error.message.includes('UQ_f1855356b48e07245d9b1e471d7')) {
          throw new ConflictException(`Display name "${createHouseDto.displayName}" is already taken in this house`);
        }
        
        throw error; // Re-throw other errors
      }
    }
    
    throw new Error('Failed to generate unique invite code after multiple attempts');
  }

  async joinHouse(joinHouseDto: JoinHouseDto, userId: string) {
    // Find house by invite code
    const house = await this.housesRepository.findOne({
      where: { inviteCode: joinHouseDto.inviteCode, isActive: true }
    });

    if (!house) {
      throw new NotFoundException('House not found or inactive');
    }

    // Check if user is already a member
    const existingMembership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId: house.id }
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this house');
    }

    try {
      // Create membership - let database handle unique constraint for display name
      const membership = this.houseMembershipsRepository.create({
        userId,
        houseId: house.id,
        displayName: joinHouseDto.displayName,
        role: MemberRole.MEMBER,
      });

      await this.houseMembershipsRepository.save(membership);

      return await this.getHouseDetails(house.id, userId);
      
    } catch (error) {
      // Check if display name is already taken in this house
      if (error instanceof QueryFailedError && 
          error.message.includes('UQ_f1855356b48e07245d9b1e471d7')) {
        throw new ConflictException(`Display name "${joinHouseDto.displayName}" is already taken in this house`);
      }
      throw error;
    }
  }

  async getUserHouses(userId: string) {
    const memberships = await this.houseMembershipsRepository.find({
      where: { userId, isActive: true },
      relations: ['house'],
      order: { joinedAt: 'DESC' }
    });

    return memberships.map(membership => ({
      id: membership.house.id,
      name: membership.house.name,
      address: membership.house.address,
      description: membership.house.description,
      inviteCode: membership.house.inviteCode,
      createdAt: membership.house.createdAt,
      membership: {
        id: membership.id,
        displayName: membership.displayName,
        role: membership.role,
        joinedAt: membership.joinedAt
      }
    }));
  }

  async getHouseDetails(houseId: string, userId: string) {
    // Verify user is a member
    const userMembership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true }
    });

    if (!userMembership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    const house = await this.housesRepository.findOne({
      where: { id: houseId },
      relations: ['memberships', 'memberships.user']
    });

    return {
      id: house.id,
      name: house.name,
      address: house.address,
      description: house.description,
      inviteCode: house.inviteCode,
      createdAt: house.createdAt,
      userMembership: {
        id: userMembership.id,
        displayName: userMembership.displayName,
        role: userMembership.role,
        joinedAt: userMembership.joinedAt
      },
      members: house.memberships
        .filter(m => m.isActive)
        .map(membership => ({
          id: membership.id,
          displayName: membership.displayName,
          role: membership.role,
          joinedAt: membership.joinedAt,
          user: {
            id: membership.user.id,
            firstName: membership.user.firstName,
            lastName: membership.user.lastName,
            email: membership.user.email
          }
        }))
    };
  }
}