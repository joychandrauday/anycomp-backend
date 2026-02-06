import { Response } from 'express';
import {
    ServiceOfferingService,
    CreateServiceOfferingDto,
} from './service-offering.service';
import { AuthRequest } from '../auth/auth.middleware';

const serviceOfferingService = new ServiceOfferingService();

export class ServiceOfferingController {
    static async getBySpecialist(req: AuthRequest, res: Response) {
        try {
            const { specialistId } = req.params;
            const services = await serviceOfferingService.findBySpecialist(specialistId);
            res.json({ success: true, data: services });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getByService(req: AuthRequest, res: Response) {
        try {
            const { serviceMasterId } = req.params;
            const specialists = await serviceOfferingService.findByService(serviceMasterId);
            res.json({ success: true, data: specialists });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const data: CreateServiceOfferingDto = req.body;
            const offering = await serviceOfferingService.create(
                data,
                req.user!.id,
                req.user?.role
            );
            res.status(201).json({ success: true, data: offering });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await serviceOfferingService.delete(
                id,
                req.user!.id,
                req.user?.role
            );
            res.json({ success: true, result });
        } catch (err: any) {
            res.status(403).json({ success: false, error: err.message });
        }
    }
}
