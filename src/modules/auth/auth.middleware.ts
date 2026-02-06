// backend/src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { AppDataSource } from '../../config/database.config';
import { User, UserRole } from '../../entities/User.entity';
import { RolePermissions } from '../../middleware/rbac.middleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verify(token, jwtConfig.secret) as any;

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.sub },
      select: ['id', 'email', 'role', 'permissions'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      // Use the RolePermissions with proper type checking
      permissions: user.permissions || RolePermissions[user.role] || [],
    };

    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
    }

    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// Optional: Refresh token middleware
export const refreshTokenMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return next();
  }

  try {
    const decoded = verify(refreshToken, jwtConfig.refreshSecret) as any;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.sub },
      select: ['id', 'email', 'role', 'permissions'],
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || RolePermissions[user.role] || [],
      };
    }
  } catch (error) {
    // Ignore refresh token errors
  }

  next();
};