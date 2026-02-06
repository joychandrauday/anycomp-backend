// backend/src/modules/secretary/secretary.routes.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../auth/auth.middleware';
import {
    getAllSecretaries,
    getSecretaryById,
    createSecretary,
    updateSecretary,
    deleteSecretary
} from './secretary.controller';
import multer from 'multer';
export const upload = multer(); // Using memoryStorage by default

const router = Router();

const validateRequest = (req: any, res: any, next: Function) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// router.use(authMiddleware); // Protect all secretary routes

router.get('/', getAllSecretaries);
router.get('/:id', getSecretaryById);

router.post(
    '/',
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'banner', maxCount: 1 }
    ]),
    validateRequest,
    createSecretary
);

router.put(
    '/:id',
    [
        body('status').optional().isIn(['active', 'on_leave', 'inactive']),
        body('hourly_rate').optional().isDecimal(),
    ],
    validateRequest,
    updateSecretary
);

router.delete('/:id', deleteSecretary);

export { router as secretaryRoutes };