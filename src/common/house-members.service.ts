import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseMembership } from '../entities/house-membership.entity';

export interface UserWithDisplayName {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  color: string;
  displayName: string;
}

@Injectable()
export class HouseMembersService {
  constructor(
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
  ) {}

  async getHouseMembersMap(houseId: string): Promise<Map<string, UserWithDisplayName>> {
    const houseMembers = await this.houseMembershipsRepository.find({
      where: { houseId, isActive: true },
      relations: ['user'],
      select: {
        userId: true,
        displayName: true,
        user: { id: true, firstName: true, lastName: true, email: true, color: true }
      }
    });

    return new Map(
      houseMembers.map(m => [m.userId, {
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        color: m.user.color,
        displayName: m.displayName
      }])
    );
  }

  /**
   * Enhance a user object with house-specific display name and color
   */
  enhanceUserObject(user: any, membersMap: Map<string, UserWithDisplayName>): UserWithDisplayName | any {
    if (!user || !user.id) return user;

    const enhancedUser = membersMap.get(user.id);
    return enhancedUser || user;
  }

  /**
   * Enhance an array of user objects with house-specific display names and colors
   */
  enhanceUserObjects(users: any[], membersMap: Map<string, UserWithDisplayName>): UserWithDisplayName[] {
    return users
      .map(user => this.enhanceUserObject(user, membersMap))
      .filter(user => user);
  }
}