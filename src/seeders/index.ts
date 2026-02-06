// backend/src/seeders/index.ts
import { AppDataSource } from '../config/database.config';
import { seedPlatformFees } from './platform-fees.seeder';
import { seedServiceMaster } from './service-master.seeder';
import { seedAdminUser } from './admin-user.seeder';
import * as dotenv from 'dotenv';

dotenv.config();

export async function runAllSeeders(): Promise<void> {
  try {
    console.log('🚀 Starting database seeding...\n');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully\n');

    // Run seeders in sequence
    await seedPlatformFees();
    console.log('');
    
    await seedServiceMaster();
    console.log('');
    
    await seedAdminUser();
    console.log('');

    console.log('🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }
}

// Function to reset and reseed database
export async function resetAndSeed(): Promise<void> {
  try {
    console.log('🔄 Resetting and reseeding database...\n');

    // Initialize database connection
    await AppDataSource.initialize();

    // Get repositories
    const entities = AppDataSource.entityMetadatas;
    
    // Create query runner
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Start transaction
    await queryRunner.startTransaction();

    try {
      // Disable foreign key checks (PostgreSQL style)
      await queryRunner.query('SET session_replication_role = replica;');

      // Truncate all tables in reverse order (due to foreign key constraints)
      for (const entity of entities.reverse()) {
        const tableName = entity.tableName;
        console.log(`   Truncating table: ${tableName}`);
        await queryRunner.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      }

      // Re-enable foreign key checks
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      // Commit transaction
      await queryRunner.commitTransaction();
      console.log('✅ Database reset completed\n');

      // Run seeders
      await seedPlatformFees();
      console.log('');
      
      await seedServiceMaster();
      console.log('');
      
      await seedAdminUser();

      console.log('\n✅ Database reset and reseeded successfully!');
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'all':
      await runAllSeeders();
      break;
    case 'reset':
      await resetAndSeed();
      break;
    case 'platform-fees':
      await AppDataSource.initialize();
      await seedPlatformFees();
      break;
    case 'services':
      await AppDataSource.initialize();
      await seedServiceMaster();
      break;
    case 'admin':
      await AppDataSource.initialize();
      await seedAdminUser();
      break;
    case 'help':
    default:
      console.log(`
Database Seeder CLI

Usage: ts-node src/seeders/index.ts <command>

Commands:
  all           Run all seeders (default)
  reset         Reset database and run all seeders
  platform-fees Seed only platform fees
  services      Seed only service master list
  admin         Seed only admin user
  help          Show this help message

Examples:
  ts-node src/seeders/index.ts all
  ts-node src/seeders/index.ts reset
  ts-node src/seeders/index.ts platform-fees
      `);
      break;
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}