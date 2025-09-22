// path: server/src/auth/auth.controller.ts
// version: 2.0 (Database Authentication)
// last-modified: 22 กันยายน 2568 10:40

import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() userData: { username: string; password: string; name: string; role?: string }) {
    const user = await this.authService.createUser(userData);
    return {
      success: true,
      message: 'User created successfully',
      data: {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }
}