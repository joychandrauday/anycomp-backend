import { Response } from 'express';
import {
    ServiceMasterService,
    CreateServiceMasterDto,
    UpdateServiceMasterDto,
} from './service-master.service';
import { AuthRequest } from '../auth/auth.middleware';

const serviceMasterService = new ServiceMasterService();

export class ServiceMasterController {
    static async findAll(req: AuthRequest, res: Response) {
        try {
            const { search } = req.query;
            const services = await serviceMasterService.findAll(search as string);
            res.json({ success: true, data: services });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async findOne(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const service = await serviceMasterService.findOne(id);
            res.json({ success: true, data: service });
        } catch (err: any) {
            res.status(404).json({ success: false, error: err.message });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const data: CreateServiceMasterDto = req.body;
            const service = await serviceMasterService.create(data, req.user?.role);
            res.status(201).json({ success: true, data: service });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const data: UpdateServiceMasterDto = req.body;
            const service = await serviceMasterService.update(id, data, req.user?.role);
            res.json({ success: true, data: service });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await serviceMasterService.delete(id, req.user?.role);
            res.json({ success: true, result });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }
}
