import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../auth/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get(getRepositoryToken(User));

  const existing = await userRepo.findOne({ where: { email: 'admin@click2print.ma' } });
  
  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10);
    const admin = userRepo.create({
      name: 'Super Admin',
      email: 'admin@click2print.ma',
      password: hashed,
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('✅ Admin créé : admin@click2print.ma / admin123');
  } else {
    // Force le rôle admin si déjà existant
    existing.role = UserRole.ADMIN;
    await userRepo.save(existing);
    console.log('✅ Admin mis à jour');
  }

  await app.close();
}

seed().catch(console.error);