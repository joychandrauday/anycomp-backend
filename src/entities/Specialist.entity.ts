// backend/src/entities/Specialist.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  OneToOne,
  BeforeUpdate,
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsBoolean, IsEnum, Min, Max, IsOptional } from 'class-validator';
import { User } from './User.entity';
import { Media } from './Media.entity';
import { ServiceOffering } from './ServiceOffering.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum SpecialistStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive',
}

@Entity('specialists')
@Index(['slug'], { unique: true })
@Index(['is_draft', 'verification_status'])
@Index(['created_by_id', 'is_draft'])
@Index(['specialist_status', 'is_draft'])
export class Specialist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  short_bio?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  base_price: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  platform_fee: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  final_price: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ default: 0 })
  total_number_of_ratings: number;

  @Column({ default: true })
  @IsBoolean()
  is_draft: boolean;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @IsEnum(VerificationStatus)
  verification_status: VerificationStatus;

  @Column({ default: false })
  is_verified: boolean;

  @Column({
    type: 'enum',
    enum: SpecialistStatus,
    default: SpecialistStatus.AVAILABLE,
  })
  specialist_status: SpecialistStatus;


  @Column({ default: 0 })
  total_projects_completed: number;

  @Column()
  @IsNumber()
  @Min(1)
  @Max(365)
  duration_days: number;

  @Column({ type: 'jsonb', nullable: true })
  additional_offerings: string[];

  @Column({ type: 'jsonb', nullable: true })
  expertise_areas: string[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: Array<{
    name: string;
    issuing_organization: string;
    issue_date: Date;
    expiry_date?: Date;
    credential_id?: string;
  }>;


  // Foreign Keys
  @Column({ name: 'created_by_id', type: 'uuid' })
  created_by_id: string;

  @Column({ name: 'assigned_secretary_id', type: 'uuid', nullable: true })
  assigned_secretary_id?: string;

  // Relations - UPDATED TO MATCH YOUR EXISTING ENTITIES
  @ManyToOne(() => User, (user) => user.specialists)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_secretary_id' })
  assigned_secretary: User;

  @OneToMany(() => Media, (media) => media.specialist)
  media: Media[];

  @OneToMany(() => ServiceOffering, (serviceOffering) => serviceOffering.specialist)
  service_offerings: ServiceOffering[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Hooks
  @BeforeInsert()
  generateSlug() {
    if (!this.slug) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  calculateFinalPrice() {
    if (this.base_price && this.platform_fee) {
      const feeAmount = (this.base_price * this.platform_fee) / 100;
      this.final_price = this.base_price + feeAmount;
    }
  }

  // Business logic methods
  isAvailable(): boolean {
    return this.specialist_status === SpecialistStatus.AVAILABLE && !this.is_draft;
  }

  canBeBooked(): boolean {
    return this.isAvailable() && this.is_verified;
  }

  getYearsOfExperience(): number {
    if (!this.created_at) return 0;
    const diffInMs = Date.now() - this.created_at.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffInYears);
  }

  updateRating(newRating: number): void {
    const totalScore = this.average_rating * this.total_number_of_ratings + newRating;
    this.total_number_of_ratings += 1;
    this.average_rating = totalScore / this.total_number_of_ratings;
  }
}