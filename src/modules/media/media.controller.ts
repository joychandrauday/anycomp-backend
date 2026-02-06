import { Response } from 'express';
import { MediaService, CreateMediaDto, UpdateMediaDto } from './media.service';
import { AuthRequest } from '../auth/auth.middleware';

const mediaService = new MediaService();

export class MediaController {
    static async findBySpecialist(req: AuthRequest, res: Response) {
        try {
            const { specialistId } = req.params;
            const media = await mediaService.findBySpecialist(specialistId);
            res.json({ success: true, data: media });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async findOne(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const media = await mediaService.findOne(id);
            res.json({ success: true, data: media });
        } catch (err: any) {
            res.status(404).json({ success: false, error: err.message });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const data: CreateMediaDto = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const media = await mediaService.create(data, req.user!.id, req.user?.role, files);
            res.status(201).json({ success: true, data: media });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const data: UpdateMediaDto = req.body;
            const media = await mediaService.update(id, data, req.user!.id, req.user?.role);
            res.json({ success: true, data: media });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await mediaService.delete(id, req.user!.id, req.user?.role);
            res.json({ success: true, result });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }
}
