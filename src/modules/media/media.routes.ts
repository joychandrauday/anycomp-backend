import { Router } from 'express';
import { MediaController } from './media.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { upload } from '../secretary/secretary.routes';

const router = Router();

// Public
router.get('/specialist/:specialistId', MediaController.findBySpecialist);
router.get('/:id', MediaController.findOne);

// Protected
router.post('/',
    upload.fields([
        { name: 'image_1', maxCount: 1 },
        { name: 'image_2', maxCount: 1 },
        { name: 'image_3', maxCount: 1 },
    ]),
    authMiddleware, MediaController.create);
router.patch('/:id', authMiddleware, MediaController.update);
router.delete('/:id', authMiddleware, MediaController.delete);

export { router as mediaRoutes };
