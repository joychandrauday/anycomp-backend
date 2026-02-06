import { AppDataSource } from '../../config/database.config';
import { Repository, Like } from 'typeorm';
import { ServiceMaster } from '../../entities/ServiceMaster.entity';
import { UserRole } from '../../entities/User.entity';

export interface CreateServiceMasterDto {
    title: string;
    description: string;
    s3_key?: string;
    bucket_name?: string;
}

export interface UpdateServiceMasterDto {
    title?: string;
    description?: string;
    s3_key?: string;
    bucket_name?: string;
}

export class ServiceMasterService {
    private repo: Repository<ServiceMaster>;

    constructor() {
        this.repo = AppDataSource.getRepository(ServiceMaster);
    }

    /** Get all master services */
    async findAll(search?: string): Promise<ServiceMaster[]> {
        if (search) {
            return this.repo.find({
                where: { title: Like(`%${search}%`) },
                order: { created_at: 'DESC' },
            });
        }
        return this.repo.find({ order: { created_at: 'DESC' } });
    }

    /** Get one master service */
    async findOne(id: string): Promise<ServiceMaster> {
        const service = await this.repo.findOne({ where: { id } });
        if (!service) throw new Error('Service not found');
        return service;
    }

    /** Create master service (ADMIN only) */
    async create(data: CreateServiceMasterDto, userRole?: UserRole): Promise<ServiceMaster> {
        if (userRole !== UserRole.ADMIN) {
            throw new Error('Only admins can create master services');
        }

        const service = this.repo.create(data);
        return this.repo.save(service);
    }

    /** Update master service (ADMIN only) */
    async update(
        id: string,
        data: UpdateServiceMasterDto,
        userRole?: UserRole
    ): Promise<ServiceMaster> {
        if (userRole !== UserRole.ADMIN) {
            throw new Error('Only admins can update master services');
        }

        const service = await this.findOne(id);
        Object.assign(service, data);
        return this.repo.save(service);
    }

    /** Soft delete master service (ADMIN only) */
    async delete(id: string, userRole?: UserRole): Promise<{ id: string }> {
        if (userRole !== UserRole.ADMIN) {
            throw new Error('Only admins can delete master services');
        }

        const service = await this.findOne(id);
        await this.repo.softRemove(service);
        return { id };
    }
}
