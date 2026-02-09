// backend/src/modules/specialists/specialists.routes.ts
import { Router } from 'express';
import { SpecialistsController } from './specialists.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { upload } from '../secretary/secretary.routes';

const router = Router();

// All routes require authentication
// router.use(authMiddleware);

// CRUD
router.get('/', SpecialistsController.findAll);
router.get('/admin', authMiddleware, SpecialistsController.findAllAdmin);
router.get('/service/search', authMiddleware, SpecialistsController.search);
router.get('/:slug', SpecialistsController.findOne);
router.get('/secretary/my', SpecialistsController.findBySecretary);
router.post('/',
    upload.fields([
        { name: 'image_1', maxCount: 1 },
        { name: 'image_2', maxCount: 1 },
        { name: 'image_3', maxCount: 1 },
    ]),
    authMiddleware, SpecialistsController.create);
router.put('/:slug', authMiddleware, SpecialistsController.update);
router.delete('/:id', authMiddleware, SpecialistsController.delete);

// Publish / Unpublish
router.patch('/:id/publish', authMiddleware, SpecialistsController.publish);
router.patch('/:id/unpublish', authMiddleware, SpecialistsController.unpublish);

// Verification
router.patch('/:id/verify', authMiddleware, SpecialistsController.updateVerificationStatus);

// Ratings
router.patch('/:id/rating', authMiddleware, SpecialistsController.updateRating);

// Stats
router.get('/stats', authMiddleware, SpecialistsController.getStats);

export { router as specialistsRoutes };
