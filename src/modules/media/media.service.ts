import { AppDataSource } from '../../config/database.config';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Media, MediaType, MimeType } from '../../entities/Media.entity';
import { UserRole } from '../../entities/User.entity';
import { Specialist } from '../../entities/Specialist.entity';
import { CloudinaryUploader } from '../../utils/cloudinary.utils';
import { upload } from '../secretary/secretary.routes';

export interface CreateMediaDto {
    cloudinary_url: string;
    cloudinary_public_id: string;
    file_name: string;
    file_size: number;
    display_order?: number;
    mime_type: MimeType;
    media_type?: MediaType;
    specialist_id: string;
}

export interface UpdateMediaDto {
    display_order?: number;
    media_type?: MediaType;
}

export class MediaService {
    private repo: Repository<Media>;
    private specialistRepo: Repository<Specialist>;

    constructor() {
        this.repo = AppDataSource.getRepository(Media);
        this.specialistRepo = AppDataSource.getRepository(Specialist);
    }

    /** Get all media for a specialist */
    async findBySpecialist(specialistId: string): Promise<Media[]> {
        return this.repo.find({
            where: { specialist_id: specialistId },
            order: { display_order: 'ASC' },
        });
    }

    /** Get single media */
    async findOne(id: string): Promise<Media> {
        const media = await this.repo.findOne({ where: { id } });
        if (!media) throw new Error('Media not found');
        return media;
    }

    /** Create media */
    async create(data: CreateMediaDto, userId: string, userRole?: UserRole, files?: { [fieldname: string]: Express.Multer.File[] }): Promise<Media> {
        const specialist = await this.specialistRepo.findOne({
            where: { id: data.specialist_id },
        });
        let imageUrl: string | undefined;
        let cloudUploadResult: { url: string; public_id: string } | undefined;
        if (files) {
            const imageKeys = ['image_1', 'image_2', 'image_3'] as const;

            for (const key of imageKeys) {
                if (files[key]?.length) {
                    const upload = await CloudinaryUploader.uploadFile(files[key][0], 'media');
                    imageUrl = upload.url; // Save only the first uploaded URL
                    cloudUploadResult = {
                        url: upload.url,
                        public_id: upload.public_id,
                    };
                    break; // Stop after the first image
                }
            }
        }
        if (!specialist) {
            throw new Error('Specialist not found');
        }

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to add media to this specialist');
        }
        // cloudinary public id from upload
        const media = this.repo.create({
            ...data,
            display_order: data.display_order ?? 0,
            media_type: data.media_type ?? MediaType.GALLERY,
            cloudinary_url: imageUrl,
            cloudinary_public_id: cloudUploadResult?.public_id ?? data.cloudinary_public_id,
        });

        return this.repo.save(media);
    }

    /** Update media */
    async update(
        id: string,
        data: UpdateMediaDto,
        userId: string,
        userRole?: UserRole
    ): Promise<Media> {
        const media = await this.findOne(id);

        const specialist = await this.specialistRepo.findOne({
            where: { id: media.specialist_id },
        });

        if (!specialist) {
            throw new Error('Specialist not found');
        }

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to update this media');
        }

        Object.assign(media, data);
        return this.repo.save(media);
    }

    /** Delete media (soft delete) */
    async delete(id: string, userId: string, userRole?: UserRole): Promise<{ id: string }> {
        const media = await this.findOne(id);

        const specialist = await this.specialistRepo.findOne({
            where: { id: media.specialist_id },
        });

        if (!specialist) {
            throw new Error('Specialist not found');
        }

        if (userRole !== UserRole.ADMIN && specialist.created_by_id !== userId) {
            throw new Error('Not authorized to delete this media');
        }

        await this.repo.softRemove(media);
        return { id };
    }
}