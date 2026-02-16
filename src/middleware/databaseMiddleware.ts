import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database.config';

export const databaseMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if database is connected
    if (!AppDataSource.isInitialized) {
      console.log('🔄 Database disconnected, reconnecting...');
      await AppDataSource.initialize();
      console.log('✅ Database reconnected successfully');
    }

    // Optional: Run a simple query to verify connection
    await AppDataSource.query('SELECT 1');

    next();
  } catch (error) {
    console.error('❌ Database connection error:', error);

    // Try to reconnect
    try {
      await AppDataSource.initialize();
      console.log('✅ Database reconnected after error');
      next();
    } catch (reconnectError) {
      console.error('❌ Failed to reconnect to database:', reconnectError);

      // Return error but don't crash the app
      res.status(503).json({
        success: false,
        error: 'Database connection unavailable',
      });
    }
  }
};