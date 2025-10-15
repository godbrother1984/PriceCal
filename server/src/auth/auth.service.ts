// path: server/src/auth/auth.service.ts
// version: 2.1 (Fix JWT Response Format - access_token)
// last-modified: 14 ตุลาคม 2568 16:50

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

  async login(loginDto: any): Promise<{ access_token: string; user: any }> {
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
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,  // ✅ ส่ง access_token ตาม JWT standard format
      user: {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
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