// path: server/src/setup/setup.controller.ts
// version: 2.1 (Persistent State Management)
// last-modified: 31 สิงหาคม 2568

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller('setup')
export class SetupController {
  private setupFilePath = path.join(process.cwd(), 'setup.json');

  // ตรวจสอบและโหลดสถานะ setup จากไฟล์
  private loadSetupStatus(): { isSetupComplete: boolean; setupData?: any } {
    try {
      if (fs.existsSync(this.setupFilePath)) {
        const data = fs.readFileSync(this.setupFilePath, 'utf8');
        const setupInfo = JSON.parse(data);
        
        console.log('[Setup Controller] Setup status loaded from file:', setupInfo.isSetupComplete);
        return setupInfo;
      }
    } catch (error) {
      console.error('[Setup Controller] Error loading setup file:', error);
    }
    
    console.log('[Setup Controller] No setup file found, system not initialized');
    return { isSetupComplete: false };
  }

  // บันทึกสถานะ setup ลงไฟล์
  private saveSetupStatus(setupData: any): void {
    try {
      const setupInfo = {
        isSetupComplete: true,
        setupData,
        lastModified: new Date().toISOString()
      };
      
      fs.writeFileSync(this.setupFilePath, JSON.stringify(setupInfo, null, 2), 'utf8');
      console.log('[Setup Controller] Setup status saved to file');
    } catch (error) {
      console.error('[Setup Controller] Error saving setup file:', error);
      throw new Error('Failed to save setup configuration');
    }
  }

  @Get('status')
  getSetupStatus(): { isSetupComplete: boolean; setupData?: any } {
    const setupStatus = this.loadSetupStatus();
    
    return {
      isSetupComplete: setupStatus.isSetupComplete,
      setupData: setupStatus.isSetupComplete ? setupStatus.setupData : undefined
    };
  }

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  initializeApp(@Body() setupDto: any): { message: string; success: boolean } {
    try {
      // Validate required fields
      if (!setupDto.companyName?.trim() || !setupDto.adminUsername?.trim()) {
        throw new Error('Company name and admin username are required');
      }

      // Check if already setup
      const currentStatus = this.loadSetupStatus();
      if (currentStatus.isSetupComplete) {
        console.log('[Setup Controller] System already initialized, skipping...');
        return { 
          message: 'System is already initialized',
          success: true
        };
      }

      // Prepare setup data
      const setupData = {
        companyName: setupDto.companyName.trim(),
        adminUsername: setupDto.adminUsername.trim(),
        setupDate: new Date().toISOString(),
      };

      // Save setup status to file
      this.saveSetupStatus(setupData);

      console.log('[Setup Controller] System initialized successfully:');
      console.log('Company Name:', setupData.companyName);
      console.log('Admin User:', setupData.adminUsername);
      console.log('Setup Date:', setupData.setupDate);
      
      return { 
        message: 'Installation completed successfully!',
        success: true
      };
    } catch (error: any) {
      console.error('[Setup Controller] Installation failed:', error.message);
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  resetSetup(): { message: string; success: boolean } {
    try {
      // Delete setup file
      if (fs.existsSync(this.setupFilePath)) {
        fs.unlinkSync(this.setupFilePath);
        console.log('[Setup Controller] Setup file deleted');
      }
      
      console.log('[Setup Controller] System reset to initial state');
      
      return { 
        message: 'Setup has been reset successfully. Please refresh your browser.',
        success: true
      };
    } catch (error: any) {
      console.error('[Setup Controller] Reset failed:', error.message);
      throw new Error(`Reset failed: ${error.message}`);
    }
  }

  // เพิ่มฟังก์ชันสำหรับตรวจสอบว่าระบบพร้อมใช้งานหรือไม่
  @Get('health')
  getHealthStatus(): { status: string; setupComplete: boolean; timestamp: string } {
    const setupStatus = this.loadSetupStatus();
    
    return {
      status: setupStatus.isSetupComplete ? 'ready' : 'setup_required',
      setupComplete: setupStatus.isSetupComplete,
      timestamp: new Date().toISOString()
    };
  }
}