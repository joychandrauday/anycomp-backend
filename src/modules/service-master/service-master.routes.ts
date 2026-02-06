import { Router } from 'express';
import { ServiceMasterController } from './service-master.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Public
router.get('/', ServiceMasterController.findAll);
router.get('/:id', ServiceMasterController.findOne);

// Admin only
router.post('/', authMiddleware, ServiceMasterController.create);
router.patch('/:id', authMiddleware, ServiceMasterController.update);
router.delete('/:id', authMiddleware, ServiceMasterController.delete);

export { router as serviceMasterRoutes };
