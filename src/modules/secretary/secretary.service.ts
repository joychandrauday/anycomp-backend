// backend/src/modules/secretary/secretary.service.ts
import { AppDataSource } from '../../config/database.config';
import { Secretary, SecretaryStatus } from '../../entities/Secretary.entity';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/User.entity';
import { RolePermissions } from '../../middleware/rbac.middleware';
import { CloudinaryUploader } from '../../utils/cloudinary.utils';

export class SecretaryService {
    private secretaryRepository: Repository<Secretary>;

    constructor() {
        this.secretaryRepository = AppDataSource.getRepository(Secretary);
    }

    async findAll(filters: any = {}): Promise<Secretary[]> {
        return await this.secretaryRepository
            .createQueryBuilder('secretary')
            .leftJoinAndSelect('secretary.user', 'user')
            .leftJoinAndSelect(
                'secretary.managed_specialists',
                'specialist'
            )
            .leftJoinAndSelect(
                'secretary.managed_companies',
                'company'
            )
            .where(filters)
            .getMany();
    }

    async findById(id: string): Promise<Secretary | null> {
        return await this.secretaryRepository.findOne({
            where: { id },
            relations: ['user', 'managed_companies', 'managed_specialists'],
        });
    }

    async createWithUser(data: any, files?: { [fieldname: string]: Express.Multer.File[] }): Promise<Secretary> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        // Track uploads so we can delete them if the DB transaction fails
        const uploadedPublicIds: string[] = [];

        try {
            // 1. Handle File Uploads first
            let avatarUrl = data.avatar; // Fallback to existing if any
            let bannerUrl = data.banner;

            if (files) {
                if (files.avatar?.[0]) {
                    const upload = await CloudinaryUploader.uploadFile(files.avatar[0], 'secretaries/avatars');
                    avatarUrl = upload.url;
                    uploadedPublicIds.push(upload.public_id);
                }
                if (files.banner?.[0]) {
                    const upload = await CloudinaryUploader.uploadFile(files.banner[0], 'secretaries/banners');
                    bannerUrl = upload.url;
                    uploadedPublicIds.push(upload.public_id);
                }
            }
            // 2. Check if user already exists
            const userRepository = queryRunner.manager.getRepository(User);
            const existingUser = await userRepository.findOne({ where: { email: data.email } });
            console.log(avatarUrl, "avatar");
            if (existingUser) throw new Error('User with this email already exists');

            // 3. Create User Record
            const user = userRepository.create({
                email: data.email,
                password: data.password, // Remember to hash this!
                full_name: data.full_name,
                role: data.role || UserRole.VIEWER,
                status: UserStatus.ACTIVE,
                profile_image: avatarUrl,
                permissions: RolePermissions[data.role as keyof typeof RolePermissions] || [],

            });
            const savedUser = await userRepository.save(user);

            // 4. Create Secretary Profile with Image URLs
            const secretaryRepository = queryRunner.manager.getRepository(Secretary);
            const secretary = secretaryRepository.create({
                ...data,
                avatar: avatarUrl,
                banner: bannerUrl,
                user_id: savedUser.id,
            });

            const savedSecretary = await secretaryRepository.save(secretary);

            await queryRunner.commitTransaction();
            return { ...savedSecretary, user: savedUser } as unknown as Secretary;

        } catch (err) {
            await queryRunner.rollbackTransaction();

            // CLEANUP: If DB fails, delete the images we just uploaded to Cloudinary
            for (const publicId of uploadedPublicIds) {
                await CloudinaryUploader.deleteFile(publicId).catch(console.error);
            }

            throw err;
        } finally {
            await queryRunner.release();
        }
    }
    async update(id: string, data: Partial<Secretary>): Promise<Secretary> {
        const secretary = await this.findById(id);
        if (!secretary) throw new Error('Secretary not found');

        Object.assign(secretary, data);
        return await this.secretaryRepository.save(secretary);
    }

    async delete(id: string): Promise<void> {
        await this.secretaryRepository.softDelete(id);
    }

    async getStats(id: string) {
        const secretary = await this.findById(id);
        if (!secretary) throw new Error('Secretary not found');
        return {
            workload: secretary.getWorkloadPercentage(),
            isOverloaded: secretary.isOverloaded(),
            isAvailable: secretary.isAvailable()
        };
    }
}