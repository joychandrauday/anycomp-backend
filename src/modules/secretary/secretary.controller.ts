// backend/src/modules/secretary/secretary.controller.ts
import { Request, Response } from 'express';
import { SecretaryService } from './secretary.service';

const secretaryService = new SecretaryService();

export const getAllSecretaries = async (req: Request, res: Response) => {
    try {
        const secretaries = await secretaryService.findAll(req.query);
        res.json({ success: true, data: secretaries });
    } catch (error: any) {
        console.error('Error fetching secretaries:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSecretaryById = async (req: Request, res: Response) => {
    try {
        const secretary = await secretaryService.findById(req.params.id);
        if (!secretary) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: secretary });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createSecretary = async (req: Request, res: Response) => {
    try {
        console.log('creating', req.body);
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const result = await secretaryService.createWithUser(req.body, files);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateSecretary = async (req: Request, res: Response) => {
    try {
        const secretary = await secretaryService.update(req.params.id, req.body);
        res.json({ success: true, data: secretary });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deleteSecretary = async (req: Request, res: Response) => {
    try {
        await secretaryService.delete(req.params.id);
        res.json({ success: true, message: 'Secretary deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};