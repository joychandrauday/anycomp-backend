// backend/src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './config/database.config';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { specialistsRoutes } from './modules/specialists/specialists.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { serviceMasterRoutes } from './modules/service-master/service-master.routes';
import { serviceOfferingRoutes } from './modules/service-offerings/service-offering.coutes';
import { secretaryRoutes } from './modules/secretary/secretary.routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');

      // Run seeders in development
      if (process.env.NODE_ENV === 'development') {
        await this.runSeeders();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  private async runSeeders(): Promise<void> {
    const { seedPlatformFees } = await import('./seeders/platform-fees.seeder');
    const { seedServiceMaster } = await import('./seeders/service-master.seeder');
    const { seedAdminUser } = await import('./seeders/admin-user.seeder');

    await seedPlatformFees();
    await seedServiceMaster();
    await seedAdminUser();
    console.log('✅ Database seeders completed');
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    });

    this.app.use('/api/', limiter);

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    // this.app.use(compression());

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
      });
    });

    // API Routes
    this.app.use('/auth', authRoutes);
    this.app.use('/api/v1/user', userRoutes);
    this.app.use('/api/v1/specialists', specialistsRoutes);
    this.app.use('/api/v1/media', mediaRoutes);
    this.app.use('/api/v1/service-offerings', serviceOfferingRoutes);
    this.app.use('/api/v1/service-offerings-master', serviceMasterRoutes);
    this.app.use('/api/v1/secretaries', secretaryRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public getInstance(): Application {
    return this.app;
  }
}

export default App;