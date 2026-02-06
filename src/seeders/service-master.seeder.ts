// backend/src/seeders/service-master.seeder.ts
import { AppDataSource } from '../config/database.config';
import { ServiceMaster } from '../entities/ServiceMaster.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const servicesData = [
  {
    title: 'Consultation',
    description: 'One-on-one professional consultation session to discuss your needs and provide expert advice.',
  },
  {
    title: 'Workshop',
    description: 'Interactive group training sessions designed to teach specific skills or knowledge areas.',
  },
  {
    title: 'Coaching',
    description: 'Personalized coaching sessions focused on individual development and performance improvement.',
  },
  {
    title: 'Audit',
    description: 'Comprehensive assessment and evaluation of current systems, processes, or performance.',
  },
  {
    title: 'Implementation',
    description: 'Full-service implementation of solutions, including planning, execution, and integration.',
  },
  {
    title: 'Support',
    description: 'Ongoing technical support and maintenance services to ensure continuous operation.',
  },
  {
    title: 'Training',
    description: 'Structured training programs for teams or individuals to develop specific competencies.',
  },
  {
    title: 'Strategy Development',
    description: 'Development of strategic plans and roadmaps to achieve business objectives.',
  },
  {
    title: 'Digital Transformation',
    description: 'Guidance and implementation of digital transformation initiatives.',
  },
  {
    title: 'Market Research',
    description: 'Comprehensive market analysis and research to inform business decisions.',
  },
  {
    title: 'Brand Development',
    description: 'Building and strengthening brand identity, positioning, and messaging.',
  },
  {
    title: 'Financial Planning',
    description: 'Expert financial advice and planning for businesses and individuals.',
  },
  {
    title: 'Legal Consultation',
    description: 'Professional legal advice and consultation services.',
  },
  {
    title: 'Healthcare Services',
    description: 'Specialized healthcare consultation and treatment services.',
  },
  {
    title: 'Technology Consulting',
    description: 'Expert advice on technology selection, implementation, and optimization.',
  },
  {
    title: 'Project Management',
    description: 'End-to-end project management services from initiation to completion.',
  },
  {
    title: 'Quality Assurance',
    description: 'Testing and quality assurance services to ensure product excellence.',
  },
  {
    title: 'Content Creation',
    description: 'Professional content development including writing, design, and multimedia.',
  },
  {
    title: 'Marketing Strategy',
    description: 'Development and implementation of comprehensive marketing strategies.',
  },
  {
    title: 'HR Consulting',
    description: 'Human resources consultation including recruitment, policies, and compliance.',
  },
];

export async function seedServiceMaster(): Promise<void> {
  try {
    console.log('🌱 Seeding service master list...');

    const serviceMasterRepository = AppDataSource.getRepository(ServiceMaster);

    // Check if services already exist
    const existingServices = await serviceMasterRepository.find();
    if (existingServices.length > 0) {
      console.log(`✅ Service master list already seeded (${existingServices.length} services)`);
      return;
    }

    // Create services
    for (const serviceData of servicesData) {
      const service = serviceMasterRepository.create(serviceData);
      await serviceMasterRepository.save(service);
      console.log(`   ✓ Created service: ${serviceData.title}`);
    }

    console.log(`✅ ${servicesData.length} services seeded successfully`);
  } catch (error) {
    console.error('❌ Error seeding service master list:', error);
    throw error;
  }
}

// Function to get all services
export async function getAllServices(): Promise<ServiceMaster[]> {
  const serviceMasterRepository = AppDataSource.getRepository(ServiceMaster);
  return await serviceMasterRepository.find({
    order: { title: 'ASC' },
  });
}

// Function to get service by ID
export async function getServiceById(id: string): Promise<ServiceMaster | null> {
  const serviceMasterRepository = AppDataSource.getRepository(ServiceMaster);
  return await serviceMasterRepository.findOne({
    where: { id },
  });
}

// Function to create a new service
export async function createService(
  title: string,
  description: string,
  s3Key?: string,
  bucketName?: string
): Promise<ServiceMaster> {
  const serviceMasterRepository = AppDataSource.getRepository(ServiceMaster);
  
  const service = serviceMasterRepository.create({
    title,
    description,
    s3_key: s3Key,
    bucket_name: bucketName,
  });

  return await serviceMasterRepository.save(service);
}

// Function to update a service
export async function updateService(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    s3_key: string;
    bucket_name: string;
  }>
): Promise<ServiceMaster> {
  const serviceMasterRepository = AppDataSource.getRepository(ServiceMaster);
  
  const service = await serviceMasterRepository.findOne({
    where: { id },
  });

  if (!service) {
    throw new Error(`Service with ID ${id} not found`);
  }

  Object.assign(service, data);
  service.updated_at = new Date();

  return await serviceMasterRepository.save(service);
}

// Standalone execution
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedServiceMaster();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });
}