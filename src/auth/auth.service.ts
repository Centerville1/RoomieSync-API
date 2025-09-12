import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, House, HouseMembership, MemberRole } from '../entities';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(House)
    private housesRepository: Repository<House>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ 
      where: { email },
      relations: ['houseMemberships', 'houseMemberships.house']
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        houseMemberships: user.houseMemberships || [],
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate invite code and display name if provided
    let house = null;
    if (registerDto.inviteCode) {
      if (!registerDto.displayName) {
        throw new BadRequestException('Display name required when using invite code');
      }

      house = await this.housesRepository.findOne({
        where: { inviteCode: registerDto.inviteCode }
      });
      
      if (!house) {
        throw new UnauthorizedException('Invalid invite code');
      }

      // Check if display name is already taken in this house
      const existingMembership = await this.houseMembershipsRepository.findOne({
        where: { 
          houseId: house.id, 
          displayName: registerDto.displayName 
        }
      });

      if (existingMembership) {
        throw new ConflictException('Display name already taken in this house');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
      phoneNumber: registerDto.phoneNumber,
    });

    const savedUser = await this.usersRepository.save(user);

    // Create house membership if invite code was provided
    if (house && registerDto.displayName) {
      const membership = this.houseMembershipsRepository.create({
        userId: savedUser.id,
        houseId: house.id,
        displayName: registerDto.displayName,
        role: MemberRole.MEMBER,
      });
      
      await this.houseMembershipsRepository.save(membership);
      
      // Load the user with memberships for the response
      const userWithMemberships = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['houseMemberships', 'houseMemberships.house']
      });

      return this.login(userWithMemberships);
    }

    // Return login response
    return this.login(savedUser);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user fields if provided
    if (updateProfileDto.firstName) user.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) user.lastName = updateProfileDto.lastName;
    if (updateProfileDto.phoneNumber !== undefined) user.phoneNumber = updateProfileDto.phoneNumber;
    if (updateProfileDto.profileImageUrl !== undefined) user.profileImageUrl = updateProfileDto.profileImageUrl;
    if (updateProfileDto.color) user.color = updateProfileDto.color;

    const updatedUser = await this.usersRepository.save(user);

    // Return user without password
    const { password, ...result } = updatedUser;
    return result;
  }
}