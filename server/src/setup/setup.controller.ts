import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('setup')
export class SetupController {
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  initializeApp(@Body() setupDto: any): { message: string } {
    // ในระบบจริง ข้อมูลนี้จะถูกบันทึกลงฐานข้อมูล
    // แต่ใน Phase 1 เราจะแค่แสดงผลใน Console เพื่อยืนยันว่าได้รับข้อมูล
    console.log('[Setup Wizard] Received initial settings:');
    console.log('Company Name:', setupDto.companyName);
    console.log('Admin User:', setupDto.adminUsername);
    
    // จำลองการบันทึกข้อมูลสำเร็จ
    return { message: 'Installation completed successfully!' };
  }
}