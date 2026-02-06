// backend/src/seeders/admin-user.seeder.ts
import { AppDataSource } from '../config/database.config';
import { User, UserRole, UserStatus } from '../entities/User.entity';
import * as dotenv from 'dotenv';
import { RolePermissions } from '../middleware/rbac.middleware';

dotenv.config();

// Default admin user configuration
const DEFAULT_ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@specialists.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  full_name: 'System Administrator',
  role: UserRole.SUPER_ADMIN,
  department: 'Administration',
};

// Additional default users for testing - UPDATED WITH ALL ROLES
const DEFAULT_USERS = [
  {
    email: 'manager@specialists.com',
    password: 'Manager@123456',
    full_name: 'Department Manager',
    role: UserRole.MANAGER,
    department: 'Management',
  },
  {
    email: 'specialist@specialists.com',
    password: 'Specialist@123456',
    full_name: 'Professional Specialist',
    role: UserRole.SPECIALIST,
    department: 'Services',
  },
  {
    email: 'secretary@specialists.com',
    password: 'Secretary@123456',
    full_name: 'Company Secretary',
    role: UserRole.SECRETARY,
    department: 'Compliance',
  },
  {
    email: 'client@specialists.com',
    password: 'Client@123456',
    full_name: 'Business Client',
    role: UserRole.CLIENT,
    department: 'Client Services',
  },
  {
    email: 'viewer@specialists.com',
    password: 'Viewer@123456',
    full_name: 'General Viewer',
    role: UserRole.VIEWER,
    department: 'Viewing',
  },
];

export async function seedAdminUser(): Promise<void> {
  try {
    console.log('🌱 Seeding admin user and default users...');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: DEFAULT_ADMIN.email },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
    } else {
      // Create admin user
      const adminUser = userRepository.create({
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password, // Will be hashed by entity hook
        full_name: DEFAULT_ADMIN.full_name,
        role: DEFAULT_ADMIN.role,
        department: DEFAULT_ADMIN.department,
        status: UserStatus.ACTIVE,
        permissions: RolePermissions[DEFAULT_ADMIN.role],
        email_verified_at: new Date(),
        is_email_verified: true,
        is_profile_complete: true,
      });

      await userRepository.save(adminUser);
      console.log(`   ✓ Created super admin: ${DEFAULT_ADMIN.email}`);
      console.log(`     Password: ${DEFAULT_ADMIN.password}`);
    }

    // Seed other default users
    for (const userData of DEFAULT_USERS) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = userRepository.create({
          email: userData.email,
          password: userData.password, // Will be hashed by entity hook
          full_name: userData.full_name,
          role: userData.role,
          department: userData.department,
          status: UserStatus.ACTIVE,
          permissions: RolePermissions[userData.role] || [],
          email_verified_at: new Date(),
          is_email_verified: true,
          is_profile_complete: true,
        });

        await userRepository.save(user);
        console.log(`   ✓ Created ${userData.role}: ${userData.email}`);
        console.log(`     Password: ${userData.password}`);
      } else {
        console.log(`   ⚠️  ${userData.role} user already exists: ${userData.email}`);
      }
    }

    console.log('✅ Admin and default users seeded successfully');
    console.log('\n📋 Default Login Credentials:');
    console.log('==============================');
    DEFAULT_USERS.forEach(user => {
      console.log(`   ${user.role.padEnd(12)}: ${user.email} / ${user.password}`);
    });
    console.log(`   ${DEFAULT_ADMIN.role.padEnd(12)}: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    console.log('==============================');
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

// Function to create a new user with specific role
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = UserRole.VIEWER,
  department?: string
): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);

  // Check if user already exists
  const existingUser = await userRepository.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error(`User with email ${email} already exists`);
  }

  const user = userRepository.create({
    email,
    password,
    full_name: fullName,
    role,
    department,
    status: UserStatus.ACTIVE,
    permissions: RolePermissions[role] || [],
    email_verified_at: new Date(),
    is_email_verified: true,
  });

  return await userRepository.save(user);
}

// Function to promote user to admin
export async function promoteToAdmin(userId: string): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  user.role = UserRole.ADMIN;
  user.permissions = RolePermissions[UserRole.ADMIN];
  user.updated_at = new Date();

  return await userRepository.save(user);
}

// Function to reset user password
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  user.password = newPassword; // Will be hashed by entity hook
  user.updated_at = new Date();

  await userRepository.save(user);
}

// Function to get all users with their roles
export async function getAllUsers(): Promise<User[]> {
  const userRepository = AppDataSource.getRepository(User);
  return await userRepository.find({
    select: ['id', 'email', 'full_name', 'role', 'status', 'created_at'],
    order: { created_at: 'DESC' },
  });
}

// Standalone execution
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedAdminUser();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });
}