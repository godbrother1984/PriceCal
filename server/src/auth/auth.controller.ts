import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  temporaryLogin(@Body() loginDto: any) {
    return this.authService.temporaryLogin(loginDto);
  }
}