// backend/src/modules/specialists/specialists.controller.ts
import { Request, Response } from 'express';
import { SpecialistsService, CreateSpecialistDto, UpdateSpecialistDto, SpecialistFilter } from './specialists.service';
import { AuthRequest } from '../auth/auth.middleware';

const specialistsService = new SpecialistsService();

export class SpecialistsController {
    static async findAll(req: AuthRequest, res: Response) {
        try {
            const filters: SpecialistFilter = req.query as any;
            const result = await specialistsService.findAll(filters, req.user?.id, req.user?.role);
            console.log(result);
            res.json({ success: true, ...result });
        } catch (err: any) {
            console.log(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
    static async findAllAdmin(req: AuthRequest, res: Response) {
        try {
            console.log(req.user);
            const filters: SpecialistFilter = req.query as any;
            const result = await specialistsService.findAll(filters, req.user?.id, req.user?.role);
            res.json({ success: true, ...result });
        } catch (err: any) {
            console.log(err)
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async findOne(req: AuthRequest, res: Response) {
        try {
            const { slug } = req.params;
            const specialist = await specialistsService.findOne(slug, req.user?.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(404).json({ success: false, error: err.message });
        }
    }
    static async findBySecretary(req: AuthRequest, res: Response) {
        try {
            const specialist = await specialistsService.findBySecretary(req.user?.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(404).json({ success: false, error: err.message });
        }
    }
    static async search(req: AuthRequest, res: Response) {
        try {
            const specialist = await specialistsService.searchSpecialistsByKeyword(req.query.q as string, req.user?.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(404).json({ success: false, error: err.message });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const data: CreateSpecialistDto = req.body;
            console.log(data, 'Create Specialist');
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
            const specialist = await specialistsService.create(data, req.user!.id, files);
            res.status(201).json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const { slug } = req.params;
            const data: UpdateSpecialistDto = req.body;
            // console.log(data, 'Update Specialist');
            const specialist = await specialistsService.update(slug, data, req.user!.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            console.log(err);
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await specialistsService.delete(id, req.user!.id, req.user?.role);
            res.json({ success: true, result });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async publish(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const specialist = await specialistsService.publish(id, req.user!.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async unpublish(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const specialist = await specialistsService.unpublish(id, req.user!.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async updateVerificationStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const specialist = await specialistsService.updateVerificationStatus(id, status, req.user!.id, req.user?.role);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async updateRating(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { rating } = req.body;
            const specialist = await specialistsService.updateRating(id, rating);
            res.json({ success: true, data: specialist });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getStats(req: AuthRequest, res: Response) {
        try {
            const stats = await specialistsService.getStats(req.user?.id, req.user?.role);
            res.json({ success: true, data: stats });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
