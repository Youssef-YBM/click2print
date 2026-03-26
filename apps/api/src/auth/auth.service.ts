import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (existing) throw new ConflictException('Email déjà utilisé');

        const hashed = await bcrypt.hash(dto.password, 10);
        const user = this.userRepository.create({
            ...dto,
            password: hashed,
        });
        await this.userRepository.save(user);

        const token = this.jwtService.sign({ sub: user.id, role: user.role });
        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (!user) throw new UnauthorizedException('Identifiants invalides');

        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) throw new UnauthorizedException('Identifiants invalides');

        const token = this.jwtService.sign({ sub: user.id, role: user.role });
        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Utilisateur non trouvé');
        const { password, ...result } = user as User & { password: string };
        return result;
    }

    async getAllUsers() {
        const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });
        return users.map(({ password, ...u }) => u);
    }

async updateRole(id: string, role: string, requesterId: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) throw new UnauthorizedException('Utilisateur introuvable');
  
  // Un admin ne peut pas se rétrograder lui-même
  if (id === requesterId && role !== 'admin') {
    throw new ForbiddenException('Vous ne pouvez pas changer votre propre rôle');
  }
  
  user.role = role as any;
  await this.userRepository.save(user);
  const { password, ...result } = user as any;
  return result;
}
}