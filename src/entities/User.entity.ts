// backend/src/entities/User.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { IsEmail, IsEnum, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Specialist } from './Specialist.entity';
import { Company } from './Company.entity';
import { Secretary } from './Secretary.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SPECIALIST = 'specialist',
  SECRETARY = 'secretary',
  CLIENT = 'client',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Column()
  @MinLength(8)
  password: string;

  @Column({ nullable: true })
  password_reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires?: Date;

  @Column()
  @IsNotEmpty()
  full_name: string;

  @Column({ nullable: true })
  phone_number?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  profile_image?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at?: Date;

  @Column({ nullable: true })
  email_verification_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires?: Date;

  @Column({ nullable: true })
  registration_number?: string; // For specialists/secretaries with professional licenses

  @Column({ type: 'boolean', default: false })
  is_profile_complete: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  // Relations for Specialist role
  @OneToMany(() => Specialist, (specialist) => specialist.created_by)
  specialists: Specialist[];

  // Relations for Client role
  @OneToMany(() => Company, (company) => company.owner)
  owned_companies: Company[];

  // Relations for Secretary role (if using separate Secretary entity)
  @OneToOne(() => Secretary, (secretary) => secretary.user)
  secretary_profile: Secretary;

  // Self-referencing relation for manager-employee hierarchy
  @ManyToOne(() => User, (user) => user.team_members, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => User, (user) => user.manager)
  team_members: User[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Helper methods for RBAC
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  hasPermission(permission: string): boolean {
    if (this.role === UserRole.SUPER_ADMIN) return true;
    return this.permissions?.includes(permission) || false;
  }

  can(action: string, resource: string): boolean {
    const permission = `${resource}.${action}`;
    return this.hasPermission(permission);
  }

  // Business logic methods
  isSpecialist(): boolean {
    return this.role === UserRole.SPECIALIST;
  }

  isSecretary(): boolean {
    return this.role === UserRole.SECRETARY;
  }

  isClient(): boolean {
    return this.role === UserRole.CLIENT;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  canManageSpecialists(): boolean {
    return this.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  }

  canManageCompanies(): boolean {
    return this.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECRETARY]);
  }
}