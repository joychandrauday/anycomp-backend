// backend/src/entities/ServiceMaster.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { ServiceOffering } from './ServiceOffering.entity';

@Entity('service_offerings_master_list')
export class ServiceMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  s3_key?: string;

  @Column({ nullable: true })
  bucket_name?: string;

  // Relations
  @OneToMany(() => ServiceOffering, (serviceOffering) => serviceOffering.master_service)
  service_offerings: ServiceOffering[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
