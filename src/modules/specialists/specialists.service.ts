import { AppDataSource } from "../../config/database.config";
import { Repository, FindOptionsWhere, Like, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Specialist, VerificationStatus } from "../../entities/Specialist.entity";
import { User, UserRole } from "../../entities/User.entity";
import { Media, MediaType, MimeType } from "../../entities/Media.entity";
import { CloudinaryUploader } from "../../utils/cloudinary.utils";

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
    description?: string;
    min_price?: number;
    max_price?: number;
    is_draft?: boolean;
    verification_status?: VerificationStatus;
}


export class SpecialistsService {
    private repo: Repository<Specialist>;
    private specialistRepo = AppDataSource.getRepository(Specialist);
    private mediaRepo = AppDataSource.getRepository(Media);

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
            relations: {
                media: true,
                assigned_secretary: true,

            },
        });

        return { data, total };
    }

    /** Find a single specialist by ID */
    async findOne(slug: string, userId?: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.repo.findOne({
            where: { slug },
            relations: [
                'media',
                'assigned_secretary'
            ]
        });
        if (!specialist) throw new Error("Specialist not found");

        // Only allow draft view for admins or the creator
        if (specialist.is_draft && userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to view this specialist");
        }

        return specialist;
    }
    async findBySecretary(userId?: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.repo.findOne({
            where: {
                assigned_secretary_id: userId
            },
            relations: [
                'media',
                'assigned_secretary'
            ]
        });
        if (!specialist) throw new Error("Specialist not found");

        // Only allow draft view for admins or the creator
        if (specialist.is_draft && userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to view this specialist");
        }

        return specialist;
    }
    async findOneById(id: string, userId?: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.repo.findOne({
            where: { id },
            relations: [
                'media',
                'assigned_secretary'
            ]
        });
        if (!specialist) throw new Error("Specialist not found");

        // Only allow draft view for admins or the creator
        if (specialist.is_draft && userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to view this specialist");
        }

        return specialist;
    }

    async create(
        data: any, // Using 'any' briefly to handle FormData string conversion
        userId: string,
        files?: { [fieldname: string]: Express.Multer.File[] }
    ): Promise<Specialist> {

        // --- 1. PREPARE DATA ---
        // FormData sends numbers/booleans as strings. We might need to parse them.
        // Additionally, 'additional_offerings' comes as a JSON string.

        let parsedOfferings = data.additional_offerings;
        if (typeof data.additional_offerings === 'string') {
            try {
                parsedOfferings = JSON.parse(data.additional_offerings);
            } catch (e) {
                parsedOfferings = [];
            }
        }
        // if not draft rhen make it verified
        const is_verified = data.is_draft === 'true' || data.is_draft === true ? false : true;
        // Create the Specialist Entity
        const newSpecialist = this.specialistRepo.create({
            title: data.title,
            description: data.description,
            base_price: parseFloat(data.base_price), // Ensure number
            platform_fee: parseFloat(data.platform_fee), // Ensure number
            duration_days: parseInt(data.duration_days),
            is_draft: data.is_draft === 'true' || data.is_draft === true,
            is_verified,
            additional_offerings: parsedOfferings,
            assigned_secretary_id: data.assigned_secretary_id || null,
            created_by_id: userId,
        });

        // Save Specialist first to generate the ID
        const savedSpecialist = await this.specialistRepo.save(newSpecialist);

        // --- 2. HANDLE IMAGES ---
        if (files) {
            const imageConfig = [
                { key: 'image_1', type: MediaType.PROFILE, order: 0 },
                { key: 'image_2', type: MediaType.GALLERY, order: 1 },
                { key: 'image_3', type: MediaType.GALLERY, order: 2 }
            ];

            for (const config of imageConfig) {
                const fileArray = files[config.key];
                if (!fileArray || fileArray.length === 0) continue;

                const file = fileArray[0];

                try {
                    const upload = await CloudinaryUploader.uploadFile(file, 'specialists');

                    const media = this.mediaRepo.create({
                        specialist_id: savedSpecialist.id, // assign column, not relation
                        media_type: config.type,           // valid MediaType enum
                        cloudinary_url: upload.url,
                        cloudinary_public_id: upload.public_id,
                        file_name: file.originalname,
                        file_size: file.size,
                        mime_type: file.mimetype as MimeType,
                        display_order: config.order,
                        // remove is_active if not in entity
                    });

                    await this.mediaRepo.save(media);
                } catch (err) {
                    console.error(`Failed to upload ${config.key}:`, err);
                }
            }
        }

        // --- 3. RETURN RESULT ---
        // Fetch the specialist again with the relations (media) to return full object
        return this.specialistRepo.findOne({
            where: { id: savedSpecialist.id },
            relations: ['media', 'created_by']
        }) as Promise<Specialist>;
    }

    /** Update a specialist */
    async update(
        slug: string,
        data: UpdateSpecialistDto,
        userId: string,
        userRole?: UserRole
    ): Promise<Specialist> {
        const specialist = await this.findOne(
            slug
        );
        console.log(slug, specialist);

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

    /** Search specialists with separate filters */
    /** Search specialists by a single keyword across multiple fields */
    async searchSpecialistsByKeyword(
        keyword: string,
        userId?: string,
        userRole?: UserRole
    ): Promise<{ data: Specialist[]; total: number }> {

        if (!keyword) {
            return { data: [], total: 0 };
        }

        const where: FindOptionsWhere<Specialist>[] = [
            { title: Like(`%${keyword}%`) },
            { description: Like(`%${keyword}%`) },
            // You can add more fields here:
            // { slug: Like(`%${keyword}%`) },
        ];

        // For non-super-admins, apply visibility filters to each OR condition
        if (userRole !== UserRole.SUPER_ADMIN) {
            for (let condition of where) {
                condition.is_draft = false;
                condition.verification_status = VerificationStatus.VERIFIED;
            }
        }

        const [data, total] = await this.repo.findAndCount({
            where,
            relations: [
                'media',
                'assigned_secretary',
            ],
            order: {
                created_at: 'DESC',
            },
        });

        return { data, total };
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
        const specialist = await this.findOneById(id, userId, userRole);

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error("Not authorized to publish this specialist");
        }

        specialist.is_draft = false;
        return this.repo.save(specialist);
    }

    /** Unpublish a specialist */
    async unpublish(id: string, userId: string, userRole?: UserRole): Promise<Specialist> {
        const specialist = await this.findOneById(id, userId, userRole);

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

        const specialist = await this.findOneById(id, userId, userRole);
        specialist.verification_status = status;
        specialist.is_verified = status === VerificationStatus.VERIFIED;
        return this.repo.save(specialist);
    }

    /** Update rating */
    async updateRating(id: string, rating: number): Promise<Specialist> {
        const specialist = await this.findOneById(id);

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
