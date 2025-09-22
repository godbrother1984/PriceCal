// path: server/src/auth/auth.service.ts
// version: 2.0 (Database Authentication with JWT)
// last-modified: 22 กันยายน 2568 10:40

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: any): Promise<{ user: any; token: string }> {
    const { username, password } = loginDto;

    // ค้นหา user จากฐานข้อมูล
    const user = await this.userRepository.findOne({
      where: { username, isActive: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ตรวจสอบ password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('[Auth Service] Login successful for user:', user.username);

    // สร้าง JWT token
    const payload = { username: user.username, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async createUser(userData: { username: string; password: string; name: string; role?: string }): Promise<User> {
    const { username, password, name, role = 'User' } = userData;

    // เช็คว่า username ซ้ำหรือไม่
    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง user ใหม่
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      name,
      role,
    });

    return this.userRepository.save(user);
  }
}