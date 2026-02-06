import { AppDataSource } from '../../config/database.config';
import { Repository } from 'typeorm';
import { ServiceOffering } from '../../entities/ServiceOffering.entity';
import { Specialist } from '../../entities/Specialist.entity';
import { ServiceMaster } from '../../entities/ServiceMaster.entity';
import { UserRole } from '../../entities/User.entity';

export interface CreateServiceOfferingDto {
    specialist_id: string;
    service_master_id: string;
}

export class ServiceOfferingService {
    private repo: Repository<ServiceOffering>;
    private specialistRepo: Repository<Specialist>;
    private masterRepo: Repository<ServiceMaster>;

    constructor() {
        this.repo = AppDataSource.getRepository(ServiceOffering);
        this.specialistRepo = AppDataSource.getRepository(Specialist);
        this.masterRepo = AppDataSource.getRepository(ServiceMaster);
    }

    /** Get all services for a specialist */
    async findBySpecialist(specialistId: string): Promise<ServiceOffering[]> {
        return this.repo.find({
            where: { specialist_id: specialistId },
            relations: ['master_service'],
            order: { created_at: 'DESC' },
        });
    }

    /** Get all specialists offering a service */
    async findByService(serviceMasterId: string): Promise<ServiceOffering[]> {
        return this.repo.find({
            where: { service_master_id: serviceMasterId },
            relations: ['specialist'],
            order: { created_at: 'DESC' },
        });
    }

    /** Add service to specialist */
    async create(
        data: CreateServiceOfferingDto,
        userId: string,
        userRole?: UserRole
    ): Promise<ServiceOffering> {
        const specialist = await this.specialistRepo.findOne({
            where: { id: data.specialist_id },
        });
        if (!specialist) throw new Error('Specialist not found');

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to add services to this specialist');
        }

        const master = await this.masterRepo.findOne({
            where: { id: data.service_master_id },
        });
        if (!master) throw new Error('Master service not found');

        const offering = this.repo.create(data);
        return this.repo.save(offering);
    }

    /** Remove service from specialist (soft delete) */
    async delete(
        id: string,
        userId: string,
        userRole?: UserRole
    ): Promise<{ id: string }> {
        const offering = await this.repo.findOne({ where: { id } });
        if (!offering) throw new Error('Service offering not found');

        const specialist = await this.specialistRepo.findOne({
            where: { id: offering.specialist_id },
        });
        if (!specialist) throw new Error('Specialist not found');

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to remove this service');
        }

        await this.repo.softRemove(offering);
        return { id };
    }
}
