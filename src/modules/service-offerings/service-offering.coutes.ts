import { Router } from 'express';
import { ServiceOfferingController } from './service-offering.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Public
router.get('/specialist/:specialistId', ServiceOfferingController.getBySpecialist);
router.get('/service/:serviceMasterId', ServiceOfferingController.getByService);

// Protected
router.post('/', authMiddleware, ServiceOfferingController.create);
router.delete('/:id', authMiddleware, ServiceOfferingController.delete);

export { router as serviceOfferingRoutes };
