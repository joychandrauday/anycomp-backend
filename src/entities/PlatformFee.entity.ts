// backend/src/entities/PlatformFee.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TierName {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('platform_fee') // 👈 MUST match the query
export class PlatformFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TierName,
    unique: true,
  })
  tier_name: TierName;

  @Column('decimal', { precision: 10, scale: 2 })
  min_value: number;

  @Column('decimal', { precision: 10, scale: 2 })
  max_value: number;

  @Column('decimal', { precision: 5, scale: 2 })
  platform_fee_percentage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
