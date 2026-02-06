// backend/src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User.entity';

export interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

export class RBACMiddleware {
  // Require specific role
  static requireRole(...roles: UserRole[]) {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          requiredRoles: roles,
          currentRole: req.user.role,
        });
      }

      next();
    };
  }

  // Require specific permission
  static requirePermission(permission: string) {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Super admin has all permissions
      if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
      }

      if (!req.user.permissions?.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${permission}`,
        });
      }

      next();
    };
  }

  // Check ownership for specialists
  static async checkOwnership(
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) {
    const specialistId = req.params.id || req.params.uuid;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!specialistId || !userId) {
      return next();
    }

    try {
      // Import inside function to avoid circular dependency
      const { AppDataSource } = await import('../config/database.config');
      const specialistRepository = AppDataSource.getRepository('Specialist');

      const specialist = await specialistRepository.findOne({
        where: { id: specialistId },
        relations: ['created_by'],
      });

      if (!specialist) {
        return next();
      }

      // Admin and managers can access all
      if (
        userRole === UserRole.SUPER_ADMIN ||
        userRole === UserRole.ADMIN ||
        userRole === UserRole.MANAGER
      ) {
        return next();
      }

      // Specialist can only access their own
      if (userRole === UserRole.SPECIALIST) {
        if (specialist.created_by_id === userId) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'You do not own this resource',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Resource-based access control
  static can(action: string, resource: string) {
    return this.requirePermission(`${resource}.${action}`);
  }
}

// Permission constants
export const Permissions = {
  // Specialist permissions
  SPECIALIST: {
    CREATE: 'specialist.create',
    READ_ANY: 'specialist.read.any',
    READ_OWN: 'specialist.read.own',
    UPDATE_ANY: 'specialist.update.any',
    UPDATE_OWN: 'specialist.update.own',
    DELETE_ANY: 'specialist.delete.any',
    DELETE_OWN: 'specialist.delete.own',
    PUBLISH: 'specialist.publish',
  },
  // Company permissions
  COMPANY: {
    CREATE: 'company.create',
    READ_ANY: 'company.read.any',
    READ_OWN: 'company.read.own',
    UPDATE_ANY: 'company.update.any',
    UPDATE_OWN: 'company.update.own',
    DELETE_ANY: 'company.delete.any',
    DELETE_OWN: 'company.delete.own',
    MANAGE_COMPLIANCE: 'company.manage.compliance',
  },
  // Secretary permissions
  SECRETARY: {
    CREATE: 'secretary.create',
    READ: 'secretary.read',
    UPDATE: 'secretary.update',
    DELETE: 'secretary.delete',
    MANAGE_CLIENTS: 'secretary.manage.clients',
    MANAGE_SPECIALISTS: 'secretary.manage.specialists',
  },
  // Media permissions
  MEDIA: {
    UPLOAD: 'media.upload',
    DELETE: 'media.delete',
    READ: 'media.read',
  },
  // User permissions
  USER: {
    MANAGE: 'user.manage',
    READ: 'user.read',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
  },
  // Platform fee permissions
  PLATFORM_FEE: {
    MANAGE: 'platform_fee.manage',
    READ: 'platform_fee.read',
  },
  // Service permissions
  SERVICE: {
    MANAGE: 'service.manage',
    READ: 'service.read',
  },
};

// Default permissions per role (COMPLETE - includes all UserRole enum values)
export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Specialist permissions
    Permissions.SPECIALIST.CREATE,
    Permissions.SPECIALIST.READ_ANY,
    Permissions.SPECIALIST.UPDATE_ANY,
    Permissions.SPECIALIST.DELETE_ANY,
    Permissions.SPECIALIST.PUBLISH,
    // Company permissions
    Permissions.COMPANY.CREATE,
    Permissions.COMPANY.READ_ANY,
    Permissions.COMPANY.UPDATE_ANY,
    Permissions.COMPANY.DELETE_ANY,
    Permissions.COMPANY.MANAGE_COMPLIANCE,
    // Secretary permissions
    Permissions.SECRETARY.CREATE,
    Permissions.SECRETARY.READ,
    Permissions.SECRETARY.UPDATE,
    Permissions.SECRETARY.DELETE,
    Permissions.SECRETARY.MANAGE_CLIENTS,
    Permissions.SECRETARY.MANAGE_SPECIALISTS,
    // Media permissions
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.DELETE,
    Permissions.MEDIA.READ,
    // User permissions
    Permissions.USER.MANAGE,
    Permissions.USER.READ,
    Permissions.USER.UPDATE,
    Permissions.USER.DELETE,
    // Platform fee permissions
    Permissions.PLATFORM_FEE.MANAGE,
    Permissions.PLATFORM_FEE.READ,
    // Service permissions
    Permissions.SERVICE.MANAGE,
    Permissions.SERVICE.READ,
  ],
  [UserRole.ADMIN]: [
    Permissions.SPECIALIST.CREATE,
    Permissions.SPECIALIST.READ_ANY,
    Permissions.SPECIALIST.UPDATE_ANY,
    Permissions.SPECIALIST.DELETE_ANY,
    Permissions.SPECIALIST.PUBLISH,
    Permissions.COMPANY.CREATE,
    Permissions.COMPANY.READ_ANY,
    Permissions.COMPANY.UPDATE_ANY,
    Permissions.COMPANY.DELETE_ANY,
    Permissions.COMPANY.MANAGE_COMPLIANCE,
    Permissions.SECRETARY.READ,
    Permissions.SECRETARY.UPDATE,
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.DELETE,
    Permissions.MEDIA.READ,
    Permissions.USER.READ,
    Permissions.PLATFORM_FEE.READ,
    Permissions.SERVICE.READ,
  ],
  [UserRole.MANAGER]: [
    Permissions.SPECIALIST.CREATE,
    Permissions.SPECIALIST.READ_ANY,
    Permissions.SPECIALIST.UPDATE_OWN,
    Permissions.SPECIALIST.PUBLISH,
    Permissions.COMPANY.READ_ANY,
    Permissions.SECRETARY.READ,
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.READ,
  ],
  [UserRole.SPECIALIST]: [
    Permissions.SPECIALIST.READ_OWN,
    Permissions.SPECIALIST.UPDATE_OWN,
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.READ,
  ],
  [UserRole.SECRETARY]: [
    Permissions.COMPANY.CREATE,
    Permissions.COMPANY.READ_OWN,
    Permissions.COMPANY.UPDATE_OWN,
    Permissions.COMPANY.MANAGE_COMPLIANCE,
    Permissions.SPECIALIST.READ_ANY,
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.READ,
  ],
  [UserRole.CLIENT]: [
    Permissions.COMPANY.READ_OWN,
    Permissions.COMPANY.UPDATE_OWN,
    Permissions.SPECIALIST.READ_ANY,
    Permissions.MEDIA.UPLOAD,
    Permissions.MEDIA.READ,
  ],
  [UserRole.VIEWER]: [
    Permissions.SPECIALIST.READ_ANY, // Only published
    Permissions.MEDIA.READ,
  ],
};