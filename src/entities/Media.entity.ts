// backend/src/entities/Media.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsNumber, IsUrl, Min } from 'class-validator';
import { Specialist } from './Specialist.entity';

export enum MimeType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  PDF = 'application/pdf',
  MP4 = 'video/mp4',
}

export enum MediaType {
  PROFILE = 'profile',
  GALLERY = 'gallery',
  DOCUMENT = 'document',
  VIDEO = 'video',
}

@Entity('media')
@Index(['specialist_id', 'display_order'])
@Index(['specialist_id', 'media_type'])
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUrl()
  @IsNotEmpty()
  cloudinary_url: string;

  @Column()
  @IsNotEmpty()
  cloudinary_public_id: string;

  @Column()
  @IsNotEmpty()
  file_name: string;

  @Column()
  @IsNumber()
  @Min(0)
  file_size: number; // in bytes

  @Column({ default: 0 })
  @IsNumber()
  display_order: number;

  @Column({
    type: 'enum',
    enum: MimeType,
  })
  @IsEnum(MimeType)
  mime_type: MimeType;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.GALLERY,
  })
  @IsEnum(MediaType)
  media_type: MediaType;

  // Foreign Keys
  @Column({ name: 'specialist_id', type: 'uuid' })
  specialist_id: string;

  // Relations
  @ManyToOne(() => Specialist, (specialist) => specialist.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'specialist_id' })
  specialist: Specialist;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}