import { AppDataSource } from "../../config/database.config";
import { Repository, FindOptionsWhere, Like } from "typeorm";
import { Specialist, VerificationStatus } from "../../entities/Specialist.entity";
import { User, UserRole } from "../../entities/User.entity";

export interface CreateSpecialistDto {
    title: string;
    description: string;
    base_price: number;
    platform_fee?: number;
    duration_days: number;
}

export interface UpdateSpecialistDto {
    title?: string;
    description?: string;
    base_price?: number;
    platform_fee?: number;
    duration_days?: number;
    is_draft?: boolean;
}

export interface SpecialistFilter {
    title?: string;
    min_price?: number;
    max_price?: number;
    is_draft?: boolean;
    verification_status?: VerificationStatus;
}

export class SpecialistsService {
    private repo: Repository<Specialist>;

    constructor() {
        this.repo = AppDataSource.getRepository(Specialist);
    }

    /** Find all specialists with optional filters */
    async findAll(
        filters: SpecialistFilter,
        userId?: string,
        userRole?: UserRole
    ): Promise<{ data: Specialist[]; total: number }> {
        const where: FindOptionsWhere<Specialist> = {};
        if (filters.title) {
            where.title = Like(`%${filters.title}%`);
        }

        if (filters.is_draft !== undefined) {
            where.is_draft = filters.is_draft;
        }

        if (filters.verification_status) {
            where.verification_status = filters.verification_status;
        }

        // For regular users, only return published specialists
        if (userRole !== UserRole.SUPER_ADMIN) {
            where.is_draft = false;
            where.verification_status = VerificationStatus.VERIFIED;
        }
        console.log(where, userRole);
        const [data, total] = await this.repo.findAndCount({
            where,
            relations: [
                'media',
                'assigned_secretary',
            ],
        });

        return { data, total };
    }

    /** Find a single specialist by ID */
    async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.repo.findOne({ where: { id } });
        if (!specialist) throw new Error("Specialist not found");

        // Only allow draft view for admins or the creator
        if (specialist.is_draft && userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to view this specialist");
        }

        return specialist;
    }

    /** Create a new specialist */
    async create(data: CreateSpecialistDto, userId: string): Promise<Specialist> {
        const specialist = this.repo.create({
            ...data,
            created_by_id: userId,
            platform_fee: data.platform_fee ?? 0,
            is_draft: true,
            verification_status: VerificationStatus.PENDING,
        });

        return this.repo.save(specialist);
    }

    /** Update a specialist */
    async update(
        id: string,
        data: UpdateSpecialistDto,
        userId: string,
        userRole?: UserRole
    ): Promise<Specialist> {
        const specialist = await this.findOne(id, userId, userRole);

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to update this specialist');
        }

        // 🔒 Normalize numeric fields
        if (data.base_price !== undefined) {
            specialist.base_price = Number(data.base_price);
        }

        if (data.platform_fee !== undefined) {
            specialist.platform_fee = Number(data.platform_fee);
        }

        // Recalculate final price safely
        if (
            data.base_price !== undefined ||
            data.platform_fee !== undefined
        ) {
            specialist.final_price =
                Number(specialist.base_price) +
                Number(specialist.platform_fee || 0);
        }

        // Assign the rest (non-numeric fields)
        const { base_price, platform_fee, ...rest } = data;
        Object.assign(specialist, rest);

        return this.repo.save(specialist);
    }


    /** Delete a specialist */
    async delete(id: string, userId: string, userRole?: UserRole): Promise<{ id: string }> {
        const specialist = await this.findOne(id, userId, userRole);

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to delete this specialist");
        }

        await this.repo.remove(specialist);
        return { id };
    }

    /** Publish a specialist */
    async publish(id: string, userId: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.findOne(id, userId, userRole);

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to publish this specialist");
        }

        specialist.is_draft = false;
        return this.repo.save(specialist);
    }

    /** Unpublish a specialist */
    async unpublish(id: string, userId: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.findOne(id, userId, userRole);

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to unpublish this specialist");
        }

        specialist.is_draft = true;
        return this.repo.save(specialist);
    }

    /** Update verification status */
    async updateVerificationStatus(
        id: string,
        status: VerificationStatus,
        userId: string,
        userRole?: UserRole
    ): Promise<Specialist> {
        console.log(userRole, UserRole.ADMIN);
        if (userRole !== UserRole.SUPER_ADMIN) {
            throw new Error("Only admins can update verification status");
        }

        const specialist = await this.findOne(id);
        specialist.verification_status = status;
        specialist.is_verified = status === VerificationStatus.VERIFIED;
        return this.repo.save(specialist);
    }

    /** Update rating */
    async updateRating(id: string, rating: number): Promise<Specialist> {
        const specialist = await this.findOne(id);

        // Calculate new average rating
        const totalRating = specialist.average_rating * specialist.total_number_of_ratings;
        specialist.total_number_of_ratings += 1;
        specialist.average_rating = (totalRating + rating) / specialist.total_number_of_ratings;

        return this.repo.save(specialist);
    }

    /** Get some statistics */
    async getStats(userId?: string, userRole?: UserRole): Promise<any> {
        const where: any = {};
        if (userRole !== UserRole.ADMIN) {
            where.created_by_id = userId;
        }

        const total = await this.repo.count({ where });
        const published = await this.repo.count({ where: { ...where, is_draft: false } });
        const draft = total - published;

        return { total, published, draft };
    }
}
