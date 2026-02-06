// backend/src/config/jwt.config.ts
import { Secret, SignOptions } from 'jsonwebtoken';

export const jwtConfig: {
  secret: Secret;
  refreshSecret: Secret;
  expiresIn: SignOptions['expiresIn'];
  refreshExpiresIn: SignOptions['expiresIn'];
} = {
  secret: process.env.JWT_SECRET as Secret,
  refreshSecret: process.env.JWT_REFRESH_SECRET as Secret,
  expiresIn: '7d',
  refreshExpiresIn: '30d',
};
