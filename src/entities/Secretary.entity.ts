// backend/src/entities/Secretary.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { User } from './User.entity';
import { Company } from './Company.entity';
import { Specialist } from './Specialist.entity';

export enum SecretaryStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

export enum SecretaryType {
  CORPORATE = 'corporate',
  INDIVIDUAL = 'individual',
}

@Entity('secretaries')
@Index(['registration_number'], { unique: true })
@Index(['user_id'], { unique: true })
@Index(['status'])
export class Secretary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsNotEmpty()
  registration_number: string; // SSM Secretary Registration Number

  @Column({
    type: 'enum',
    enum: SecretaryType,
    default: SecretaryType.INDIVIDUAL,
  })
  @IsEnum(SecretaryType)
  secretary_type: SecretaryType;

  @Column({
    type: 'enum',
    enum: SecretaryStatus,
    default: SecretaryStatus.ACTIVE,
  })
  @IsEnum(SecretaryStatus)
  status: SecretaryStatus;

  @Column({ type: 'date', nullable: true })
  registration_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'text', nullable: true })
  qualification: string;
  @Column({ type: 'text', nullable: true, default: 'ST Comp Holdings' })
  companyName: string;

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column({ type: 'jsonb', nullable: true })
  areas_of_expertise: string[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: Array<{
    name: string;
    issuing_organization: string;
    issue_date: Date;
    expiry_date?: Date;
  }>;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  total_companies_managed: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  total_specialists_managed: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  satisfaction_rate: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  years_of_experience: number;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ name: 'verified_by_id', type: 'uuid', nullable: true })
  verified_by_id?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  avatar: string; // Cloudinary URL for profile picture

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  banner: string; // Cloudinary URL for profile banner

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthly_rate: number;

  @Column({ type: 'text', nullable: true })
  availability_schedule: string;

  @Column({ type: 'boolean', default: true })
  is_accepting_new_companies: boolean;

  @Column({ type: 'boolean', default: true })
  is_accepting_new_specialists: boolean;

  @Column({ type: 'jsonb', nullable: true })
  contact_information: {
    office_phone?: string;
    mobile_phone?: string;
    office_address?: string;
    emergency_contact?: string;
  };

  // Foreign Keys
  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  manager_id?: string;

  // Relations
  @OneToOne(() => User, (user) => user.secretary_profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Company, (company) => company.assigned_secretary)
  managed_companies: Company[];

  @OneToMany(() => Specialist, (specialist) => specialist.assigned_secretary)
  managed_specialists: Specialist[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by_id' })
  verified_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Business logic methods
  isAvailable(): boolean {
    return this.status === SecretaryStatus.ACTIVE && this.is_verified;
  }

  canTakeMoreCompanies(): boolean {
    return this.is_accepting_new_companies && this.isAvailable();
  }

  canTakeMoreSpecialists(): boolean {
    return this.is_accepting_new_specialists && this.isAvailable();
  }

  getWorkloadPercentage(): number {
    const maxCompanies = 50; // Maximum recommended companies per secretary
    const maxSpecialists = 30; // Maximum recommended specialists per secretary

    const companyPercentage = (this.total_companies_managed / maxCompanies) * 100;
    const specialistPercentage = (this.total_specialists_managed / maxSpecialists) * 100;

    return Math.max(companyPercentage, specialistPercentage);
  }

  isOverloaded(): boolean {
    return this.getWorkloadPercentage() >= 80;
  }

  addCompany(): void {
    this.total_companies_managed += 1;
    this.updateAvailability();
  }

  removeCompany(): void {
    this.total_companies_managed = Math.max(0, this.total_companies_managed - 1);
    this.updateAvailability();
  }

  addSpecialist(): void {
    this.total_specialists_managed += 1;
    this.updateAvailability();
  }

  removeSpecialist(): void {
    this.total_specialists_managed = Math.max(0, this.total_specialists_managed - 1);
    this.updateAvailability();
  }

  private updateAvailability(): void {
    const workload = this.getWorkloadPercentage();
    this.is_accepting_new_companies = workload < 80;
    this.is_accepting_new_specialists = workload < 80;
  }
}