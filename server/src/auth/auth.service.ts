import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  // ระบบ Login ชั่วคราวสำหรับ Phase 1
  async temporaryLogin(loginDto: any): Promise<{ user: any; token: string }> {
    const { username, password } = loginDto;

    // ตรวจสอบ Username & Password แบบ Hardcode
    if (username === 'admin' && password === 'admin') {
      const user = {
        userId: 'temp-admin-01',
        username: 'admin',
        name: 'Temporary Admin',
        role: 'Administrator',
      };

      console.log('[Auth Service] Temporary login successful for user:', user.username);

      // สร้าง Token จำลอง
      const token = 'fake-jwt-token-for-phase-1';

      return { user, token };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}