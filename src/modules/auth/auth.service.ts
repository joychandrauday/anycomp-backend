// backend/src/modules/auth/auth.service.ts
import { AppDataSource } from '../../config/database.config';
import { User, UserRole, UserStatus } from '../../entities/User.entity';
import { Repository, MoreThan } from 'typeorm';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';
import { RolePermissions } from '../../middleware/rbac.middleware';
import { CloudinaryUploader } from '../../utils/cloudinary.utils';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    permissions: string[];
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  department?: string;
}

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /** Register a new user */
  async register(data: RegisterDto, files: { [fieldname: string]: Express.Multer.File[] }): Promise<User> {

    let profileImageUrl: string | undefined;

    if (files?.profile_image?.length) {
      const upload = await CloudinaryUploader.uploadFile(
        files.profile_image[0],
        'users'
      );

      profileImageUrl = upload.url;
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const role = data.role || UserRole.VIEWER;

    const user = this.userRepository.create({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role,
      status: UserStatus.ACTIVE,
      department: data.department,
      permissions: RolePermissions[role as keyof typeof RolePermissions] || [],
      profile_image: profileImageUrl
    });

    await this.userRepository.save(user);
    delete (user as any).password;

    return user;
  }

  /** Login user and return tokens */
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email, status: UserStatus.ACTIVE },
    });

    if (!user || !(await user.validatePassword(password))) {
      throw new Error('Invalid credentials');
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);

    const permissions = RolePermissions[user.role as keyof typeof RolePermissions] || [];

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        permissions,
      },
      access_token: this.generateAccessToken(user),
      refresh_token: this.generateRefreshToken(user),
      expires_in: 7 * 24 * 60 * 60,
    };
  }

  /** Refresh access token */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as JwtPayload;

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub as string, status: UserStatus.ACTIVE },
      });

      if (!user) throw new Error();

      const permissions = RolePermissions[user.role as keyof typeof RolePermissions] || [];

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          permissions,
        },
        access_token: this.generateAccessToken(user),
        refresh_token: this.generateRefreshToken(user),
        expires_in: 7 * 24 * 60 * 60,
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  /** Change password */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !(await user.validatePassword(currentPassword))) {
      throw new Error('Invalid credentials');
    }

    user.password = newPassword;
    await this.userRepository.save(user);
  }

  /** Request password reset */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email, status: UserStatus.ACTIVE },
    });

    if (!user) throw new Error('User not found');

    const resetToken = jwt.sign({ sub: user.id }, jwtConfig.secret, { expiresIn: '1h' });

    user.password_reset_token = resetToken;
    user.password_reset_expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.save(user);
    return resetToken;
  }

  /** Reset password using token */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: MoreThan(new Date()),
      },
    });

    if (!user) throw new Error('Invalid or expired reset token');

    jwt.verify(token, jwtConfig.secret);

    user.password = newPassword;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;

    await this.userRepository.save(user);
  }

  /** Generate JWT access token */
  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || RolePermissions[user.role as keyof typeof RolePermissions] || [],
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
  }

  /** Generate JWT refresh token */
  private generateRefreshToken(user: User): string {
    return jwt.sign({ sub: user.id }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });
  }
}
