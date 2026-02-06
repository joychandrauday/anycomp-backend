
// backend/src/utils/cloudinary.uploader.ts
import cloudinary from '../config/cloudinary.config';

export interface UploadResult {
    url: string;
    public_id: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
}

export class CloudinaryUploader {
    static async uploadFile(
        file: Express.Multer.File,
        folder: string = 'specialists'
    ): Promise<UploadResult> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4'],
                    transformation: [
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    if (result) {
                        resolve({
                            url: result.secure_url,
                            public_id: result.public_id,
                            format: result.format,
                            bytes: result.bytes,
                            width: result.width,
                            height: result.height,
                        });
                    }
                }
            );

            stream.end(file.buffer);
        });
    }

    static async deleteFile(publicId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) reject(error);
                resolve();
            });
        });
    }

    static async uploadMultiple(
        files: Express.Multer.File[],
        folder: string = 'specialists'
    ): Promise<UploadResult[]> {
        const uploadPromises = files.map(file => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }
}