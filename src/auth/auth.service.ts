import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, House, HouseMembership, MemberRole, PasswordResetToken } from '../entities';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(House)
    private housesRepository: Repository<House>,
    @InjectRepository(HouseMembership)
    private houseMembershipsRepository: Repository<HouseMembership>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private emailService: EmailService,
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Check rate limiting - max 3 requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokensCount = await this.passwordResetTokenRepository.count({
      where: {
        user: { email },
        createdAt: MoreThan(oneHourAgo)
      },
      relations: ['user']
    });

    if (recentTokensCount >= 3) {
      // Still return success to prevent email enumeration
      return { message: 'If an account with that email exists, we have sent you a password reset link.' };
    }

    // Find user by email
    const user = await this.usersRepository.findOne({
      where: { email, isActive: true }
    });

    if (!user) {
      // Don't reveal whether email exists - return success anyway
      return { message: 'If an account with that email exists, we have sent you a password reset link.' };
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate any existing tokens for this user
    await this.passwordResetTokenRepository.update(
      { userId: user.id, used: false },
      { used: true }
    );

    // Create new reset token
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
      used: false
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // Send email with raw token (not hashed)
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        rawToken
      );
    } catch (error) {
      // Log error but don't reveal it to user
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If an account with that email exists, we have sent you a password reset link.' };
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    // Find all non-used, non-expired tokens
    const resetTokens = await this.passwordResetTokenRepository.find({
      where: {
        used: false,
        expiresAt: MoreThan(new Date())
      }
    });

    // Check if provided token matches any of the hashed tokens
    for (const resetToken of resetTokens) {
      const isTokenValid = await bcrypt.compare(token, resetToken.token);
      if (isTokenValid) {
        return { valid: true, message: 'Token is valid' };
      }
    }

    return { valid: false, message: 'Invalid or expired token' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Find all non-used, non-expired tokens
    const resetTokens = await this.passwordResetTokenRepository.find({
      where: {
        used: false,
        expiresAt: MoreThan(new Date())
      },
      relations: ['user']
    });

    let matchedToken: PasswordResetToken | null = null;

    // Check if provided token matches any of the hashed tokens
    for (const resetToken of resetTokens) {
      const isTokenValid = await bcrypt.compare(token, resetToken.token);
      if (isTokenValid) {
        matchedToken = resetToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Get the user
    const user = matchedToken.user;
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or account is inactive');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.usersRepository.update(user.id, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    // Mark token as used
    await this.passwordResetTokenRepository.update(matchedToken.id, {
      used: true
    });

    // Optionally: Invalidate all other reset tokens for this user
    await this.passwordResetTokenRepository.update(
      { userId: user.id, used: false },
      { used: true }
    );

    return { message: 'Password has been reset successfully' };
  }

  async cleanupExpiredTokens(): Promise<void> {
    // Remove expired tokens (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await this.passwordResetTokenRepository.delete({
      expiresAt: MoreThan(oneDayAgo)
    });
  }
}