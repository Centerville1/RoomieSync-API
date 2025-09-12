import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { House } from '../entities/house.entity';
import { HouseMembership } from '../entities/house-membership.entity';
import { User } from '../entities/user.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { CreateHouseDto } from './dto/create-house.dto';
import { JoinHouseDto } from './dto/join-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { MemberRole } from '../entities/house-membership.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House)
    private housesRepository: Repository<House>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    private categoriesService: CategoriesService,
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

        // Create primary shopping list for the house
        const primaryShoppingList = this.shoppingListRepository.create({
          name: 'Shopping List',
          houseId: savedHouse.id
        });
        const savedShoppingList = await this.shoppingListRepository.save(primaryShoppingList);

        // Link the primary shopping list to the house
        savedHouse.primaryShoppingListId = savedShoppingList.id;
        await this.housesRepository.save(savedHouse);

        // Create default categories for the house
        await this.categoriesService.createDefaultCategories(savedHouse.id);

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
      relations: ['house', 'house.memberships', 'house.memberships.user'],
      order: { joinedAt: 'DESC' }
    });

    return memberships.map(membership => ({
      id: membership.house.id,
      name: membership.house.name,
      address: membership.house.address,
      description: membership.house.description,
      inviteCode: membership.house.inviteCode,
      imageUrl: membership.house.imageUrl,
      color: membership.house.color,
      createdAt: membership.house.createdAt,
      membership: {
        id: membership.id,
        displayName: membership.displayName,
        role: membership.role,
        joinedAt: membership.joinedAt
      },
      members: membership.house.memberships
        .filter(m => m.isActive)
        .map(m => ({
          id: m.id,
          displayName: m.displayName,
          role: m.role,
          joinedAt: m.joinedAt,
          user: {
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            email: m.user.email
          }
        }))
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
      imageUrl: house.imageUrl,
      color: house.color,
      createdAt: house.createdAt,
      membership: {
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

  async updateHouse(houseId: string, userId: string, updateHouseDto: UpdateHouseDto) {
    // Verify user is an admin of the house
    const userMembership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true }
    });

    if (!userMembership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    if (userMembership.role !== MemberRole.ADMIN) {
      throw new ConflictException('Only admins can update house details');
    }

    const house = await this.housesRepository.findOne({
      where: { id: houseId }
    });

    if (!house) {
      throw new NotFoundException('House not found');
    }

    // Update house fields if provided
    if (updateHouseDto.name) house.name = updateHouseDto.name;
    if (updateHouseDto.address !== undefined) house.address = updateHouseDto.address;
    if (updateHouseDto.description !== undefined) house.description = updateHouseDto.description;
    if (updateHouseDto.imageUrl !== undefined) house.imageUrl = updateHouseDto.imageUrl;
    if (updateHouseDto.color) house.color = updateHouseDto.color;

    const updatedHouse = await this.housesRepository.save(house);

    return {
      id: updatedHouse.id,
      name: updatedHouse.name,
      address: updatedHouse.address,
      description: updatedHouse.description,
      inviteCode: updatedHouse.inviteCode,
      imageUrl: updatedHouse.imageUrl,
      color: updatedHouse.color,
      createdAt: updatedHouse.createdAt,
      updatedAt: updatedHouse.updatedAt
    };
  }

  async leaveHouse(houseId: string, userId: string) {
    // Verify user is a member
    const userMembership = await this.houseMembershipsRepository.findOne({
      where: { userId, houseId, isActive: true }
    });

    if (!userMembership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    // Get all active memberships for this house
    const allMemberships = await this.houseMembershipsRepository.find({
      where: { houseId, isActive: true }
    });

    // Check if user is an admin
    const isUserAdmin = userMembership.role === MemberRole.ADMIN;
    
    // Count how many admins are in the house
    const adminCount = allMemberships.filter(m => m.role === MemberRole.ADMIN).length;

    // If this is the only admin and there are other members, prevent leaving
    if (isUserAdmin && adminCount === 1 && allMemberships.length > 1) {
      throw new ConflictException('Cannot leave house as the only admin. Promote another member to admin first or delete the house.');
    }

    // If this is the last member in the house, delete the house
    if (allMemberships.length === 1) {
      await this.housesRepository.update(houseId, { isActive: false });
      await this.houseMembershipsRepository.update(userMembership.id, { isActive: false });
      
      return { 
        message: 'House deleted successfully as you were the last member',
        houseDeleted: true 
      };
    }

    // Otherwise, just remove the user's membership
    await this.houseMembershipsRepository.update(userMembership.id, { isActive: false });
    
    return { 
      message: 'Successfully left the house',
      houseDeleted: false 
    };
  }

  async updateMemberRole(houseId: string, adminUserId: string, membershipId: string, newRole: MemberRole) {
    // Verify admin user is an admin of the house
    const adminMembership = await this.houseMembershipsRepository.findOne({
      where: { userId: adminUserId, houseId, isActive: true }
    });

    if (!adminMembership) {
      throw new NotFoundException('House not found or you are not a member');
    }

    if (adminMembership.role !== MemberRole.ADMIN) {
      throw new ConflictException('Only admins can change member roles');
    }

    // Find the target membership
    const targetMembership = await this.houseMembershipsRepository.findOne({
      where: { id: membershipId, houseId, isActive: true },
      relations: ['user']
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this house');
    }

    // Prevent admin from demoting themselves if they're the only admin
    if (targetMembership.userId === adminUserId && newRole === MemberRole.MEMBER) {
      const adminCount = await this.houseMembershipsRepository.count({
        where: { houseId, role: MemberRole.ADMIN, isActive: true }
      });

      if (adminCount === 1) {
        throw new ConflictException('Cannot demote yourself as the only admin');
      }
    }

    // Update the role
    targetMembership.role = newRole;
    await this.houseMembershipsRepository.save(targetMembership);

    return {
      id: targetMembership.id,
      displayName: targetMembership.displayName,
      role: targetMembership.role,
      joinedAt: targetMembership.joinedAt,
      user: {
        id: targetMembership.user.id,
        firstName: targetMembership.user.firstName,
        lastName: targetMembership.user.lastName,
        email: targetMembership.user.email
      }
    };
  }
}