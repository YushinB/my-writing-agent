import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Production Seed Script
 * This script creates a default admin account for production if it doesn't exist.
 * It's idempotent - can be run multiple times safely without duplicating data.
 */
async function main() {
  console.log('🌱 Starting production database seeding...');

  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@prosepolish.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      console.log('ℹ️  Skipping admin user creation.');
      return;
    }

    // Create Admin User
    console.log(`👤 Creating admin user: ${adminEmail}...`);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedAdminPassword,
        name: adminName,
        role: UserRole.ADMIN,
      },
    });

    console.log(`✅ Admin user created successfully: ${adminUser.email}`);

    // Create default settings for admin
    await prisma.userSettings.create({
      data: {
        userId: adminUser.id,
        llmModel: 'gemini-2.0-flash',
        preferredLanguage: 'en',
        theme: 'dark',
        emailNotifications: true,
      },
    });
    console.log(`✅ Default settings created for admin user`);

    // Summary
    console.log('\n✨ Production database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin user created: ${adminEmail}`);
    console.log(`   - Role: ADMIN`);
    console.log('\n⚠️  IMPORTANT: Change the default admin password immediately after first login!');
    console.log(`   Current password: ${adminPassword.substring(0, 3)}...`);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
