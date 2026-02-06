// backend/src/seeders/platform-fees.seeder.ts
import { AppDataSource } from '../config/database.config';
import { PlatformFee, TierName } from '../entities/PlatformFee.entity';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const platformFeesData = [
  { tier_name: TierName.BASIC, min_value: 0, max_value: 1000, platform_fee_percentage: 10.0 },
  { tier_name: TierName.STANDARD, min_value: 1000.01, max_value: 5000, platform_fee_percentage: 8.5 },
  { tier_name: TierName.PREMIUM, min_value: 5000.01, max_value: 20000, platform_fee_percentage: 6.0 },
  { tier_name: TierName.ENTERPRISE, min_value: 20000.01, max_value: 100000, platform_fee_percentage: 4.0 },
];

export async function seedPlatformFees(): Promise<void> {
  console.log('🌱 Seeding platform fees...');

  const repo = AppDataSource.getRepository(PlatformFee);

  const count = await repo.count();
  if (count > 0) {
    console.log('✅ Platform fees already seeded');
    return;
  }

  await repo.save(platformFeesData);
  console.log('✅ Platform fees seeded successfully');
}

// ✅ CORRECT TypeORM query
export async function calculatePlatformFee(price: number): Promise<number> {
  const repo = AppDataSource.getRepository(PlatformFee);

  const feeTier = await repo.findOne({
    where: {
      min_value: LessThanOrEqual(price),
      max_value: MoreThanOrEqual(price),
    },
  });

  if (!feeTier) {
    console.warn(`⚠️ No platform fee tier found for ${price}, using default 10%`);
    return 10;
  }

  return Number(feeTier.platform_fee_percentage);
}
