import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { House } from './house.entity';

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('house_memberships')
@Unique(['userId', 'houseId'])
@Unique(['houseId', 'displayName']) // Display name unique per house
export class HouseMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  displayName: string;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role: MemberRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.houseMemberships)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => House, (house) => house.memberships)
  @JoinColumn()
  house: House;

  @Column()
  houseId: string;
}