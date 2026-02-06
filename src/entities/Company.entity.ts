// backend/src/entities/Company.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsOptional, IsDate, IsString } from 'class-validator';
import { User } from './User.entity';

// Enums for strict data integrity
export enum CompanyType {
  SDN_BHD = 'SDN_BHD', // Private Limited
  BHD = 'BHD',         // Public Limited
  LLP = 'LLP',         // Limited Liability Partnership
  SOLE_PROP = 'SOLE_PROP', // Sole Proprietorship
  PARTNERSHIP = 'PARTNERSHIP',
  FOREIGN = 'FOREIGN',
}

export enum CompanyStatus {
  INCORPORATING = 'INCORPORATING',
  ACTIVE = 'ACTIVE',
  STRUCK_OFF = 'STRUCK_OFF',
  DORMANT = 'DORMANT',
  LIQUIDATION = 'LIQUIDATION',
  INACTIVE = 'INACTIVE',
}

@Entity('companies')
@Index(['legal_name'])
@Index(['registration_number'], { unique: true })
@Index(['owner_id', 'status'])
@Index(['assigned_secretary_id', 'status'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  legal_name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  @IsOptional()
  registration_number: string; // The SSM ID (e.g., 202401xxxxxx)

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  company_number: string; // Alternative company number

  @Column({
    type: 'enum',
    enum: CompanyType,
    default: CompanyType.SDN_BHD,
  })
  @IsEnum(CompanyType)
  entity_type: CompanyType;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.INCORPORATING,
  })
  @IsEnum(CompanyStatus)
  status: CompanyStatus;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  incorporation_date: Date;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  business_sector: string; // MSIC Code category

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  business_nature: string; // Nature of business

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  authorized_capital: number; // Authorized share capital

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  paid_up_capital: number; // Paid-up capital

  @Column({ type: 'int', nullable: true })
  total_shares: number; // Total number of shares

  @Column({ type: 'varchar', nullable: true })
  par_value: string; // Par value per share

  // Compliance Tracking
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  financial_year_end: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  next_annual_return_due: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  last_annual_return_filed: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  next_agm_date: Date; // Annual General Meeting

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  last_agm_held: Date;

  @Column({ type: 'boolean', default: false })
  is_agm_held: boolean;

  @Column({ type: 'boolean', default: false })
  is_annual_return_filed: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  registered_address: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  business_address: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  phone_number: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  directors: Array<{
    name: string;
    identification_number: string;
    nationality: string;
    address: string;
    appointment_date: Date;
    resignation_date?: Date;
    is_active: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  shareholders: Array<{
    name: string;
    identification_number: string;
    shares_held: number;
    share_percentage: number;
    appointment_date: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  secretaries: Array<{
    name: string;
    registration_number: string;
    appointment_date: Date;
    resignation_date?: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  auditors: Array<{
    firm_name: string;
    registration_number: string;
    appointment_date: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  bank_accounts: Array<{
    bank_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    is_primary: boolean;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Foreign Keys
  @Column({ name: 'owner_id', type: 'uuid' })
  owner_id: string;

  @Column({ name: 'assigned_secretary_id', type: 'uuid', nullable: true })
  assigned_secretary_id?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.owned_companies)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_secretary_id' })
  assigned_secretary: User;

  // You might want to track filings or documents related to this company
  // @OneToMany(() => Document, (doc) => doc.company)
  // documents: Document[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Business logic methods
  getCompanyAge(): number {
    if (!this.incorporation_date) return 0;
    const diffInMs = Date.now() - this.incorporation_date.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffInYears);
  }

  isCompliant(): boolean {
    const now = new Date();
    if (this.next_annual_return_due && this.next_annual_return_due < now) {
      return false;
    }
    if (this.next_agm_date && this.next_agm_date < now) {
      return false;
    }
    return true;
  }

  getNextComplianceDue(): Date | null {
    const dates = [];
    if (this.next_annual_return_due) dates.push(this.next_annual_return_due);
    if (this.next_agm_date) dates.push(this.next_agm_date);
    
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }

  addDirector(director: {
    name: string;
    identification_number: string;
    nationality: string;
    address: string;
    appointment_date: Date;
  }): void {
    if (!this.directors) this.directors = [];
    this.directors.push({
      ...director,
      is_active: true,
    });
  }

  addShareholder(shareholder: {
    name: string;
    identification_number: string;
    shares_held: number;
    share_percentage: number;
  }): void {
    if (!this.shareholders) this.shareholders = [];
    this.shareholders.push({
      ...shareholder,
      appointment_date: new Date(),
    });
  }
}