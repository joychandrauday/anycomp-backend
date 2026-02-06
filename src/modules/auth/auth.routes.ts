import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import {
    register,
    login,
    refreshToken,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
} from './auth.controller';
import { authMiddleware, AuthRequest } from './auth.middleware';

const router = Router();

// Validation middleware
const validateRequest = (req: AuthRequest, res: any, next: Function) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    next();
};

// Routes
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('full_name').notEmpty().trim(),
        body('role').optional().isIn(['admin', 'manager', 'specialist', 'viewer']),
        body('department').optional().trim(),
    ],
    validateRequest,
    register
);

router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    validateRequest,
    login
);

router.post('/refresh', refreshToken);

router.post('/logout', authMiddleware, logout);

router.post(
    '/change-password',
    authMiddleware,
    [
        body('current_password').notEmpty(),
        body('new_password').isLength({ min: 8 }),
    ],
    validateRequest,
    changePassword
);

router.post(
    '/forgot-password',
    [body('email').isEmail().normalizeEmail()],
    validateRequest,
    forgotPassword
);

router.post(
    '/reset-password',
    [
        body('token').notEmpty(),
        body('password').isLength({ min: 8 }),
    ],
    validateRequest,
    resetPassword
);

router.get('/me', authMiddleware, getMe);

export { router as authRoutes };
