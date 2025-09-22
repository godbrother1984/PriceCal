// path: server/src/auth/jwt.strategy.ts
// version: 1.0 (JWT Strategy)
// last-modified: 22 กันยายน 2568 10:40

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'pricecal-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true }
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}