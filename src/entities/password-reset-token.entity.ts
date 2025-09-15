import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('password_reset_tokens')
@Index(['token']) // Index for fast token lookups
@Index(['userId', 'used']) // Index for user token queries
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  token: string; // This will store the hashed token

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Helper method to check if token is expired
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper method to check if token is valid (not used and not expired)
  get isValid(): boolean {
    return !this.used && !this.isExpired;
  }
}