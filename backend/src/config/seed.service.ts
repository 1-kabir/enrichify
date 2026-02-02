import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { AuthUtils } from '../utils/auth.utils';

/**
 * Service to seed initial data (admin user) on app startup
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.createAdminUser();
  }

  private async createAdminUser() {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Skip if no admin credentials provided
    if (!adminUsername || !adminEmail || !adminPassword) {
      return;
    }

    try {
      // Check if admin already exists
      const existingAdmin = await this.userRepository.findOne({
        where: [{ username: adminUsername }, { email: adminEmail }],
      });

      if (existingAdmin) {
        this.logger.log(
          `Admin user "${adminUsername}" already exists. Skipping creation.`,
        );
        return;
      }

      // Create admin user
      const hashedPassword = await AuthUtils.hashPassword(adminPassword);
      const admin = this.userRepository.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });

      await this.userRepository.save(admin);
      this.logger.log(
        `✓ Created admin user: "${adminUsername}" (${adminEmail})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create admin user: ${error.message}`,
      );
    }
  }
}
