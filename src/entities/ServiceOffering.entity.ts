import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from 'typeorm';
import { Specialist } from './Specialist.entity';
import { ServiceMaster } from './ServiceMaster.entity';

@Entity('service_offerings')
@Unique(['specialist_id', 'service_master_id'])
@Index(['specialist_id'])
@Index(['service_master_id'])
export class ServiceOffering {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Foreign Keys
    @Column({ name: 'specialist_id', type: 'uuid' })
    specialist_id: string;

    @Column({ name: 'service_master_id', type: 'uuid' })
    service_master_id: string;

    // Relations
    @ManyToOne(() => Specialist, (specialist) => specialist.service_offerings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'specialist_id' })
    specialist: Specialist;

    @ManyToOne(() => ServiceMaster, (master) => master.service_offerings)
    @JoinColumn({ name: 'service_master_id' })
    master_service: ServiceMaster;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}