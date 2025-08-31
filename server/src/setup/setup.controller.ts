// path: server/src/setup/setup.controller.ts
// version: 2.0 (Status Endpoint Addition)
// last-modified: 31 สิงหาคม 2568

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('setup')
export class SetupController {
  private isSetupComplete = false; // In-memory storage for now
  private setupData: any = null;

  @Get('status')
  getSetupStatus(): { isSetupComplete: boolean; setupData?: any } {
    return {
      isSetupComplete: this.isSetupComplete,
      setupData: this.isSetupComplete ? this.setupData : undefined
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

      // Store setup data (in real system, this goes to database)
      this.setupData = {
        companyName: setupDto.companyName.trim(),
        adminUsername: setupDto.adminUsername.trim(),
        setupDate: new Date().toISOString(),
      };

      // Mark setup as complete
      this.isSetupComplete = true;

      console.log('[Setup Controller] System initialized successfully:');
      console.log('Company Name:', this.setupData.companyName);
      console.log('Admin User:', this.setupData.adminUsername);
      console.log('Setup Date:', this.setupData.setupDate);
      
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
    this.isSetupComplete = false;
    this.setupData = null;
    console.log('[Setup Controller] System reset to initial state');
    
    return { 
      message: 'Setup has been reset successfully',
      success: true
    };
  }
}