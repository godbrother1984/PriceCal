// path: server/src/app.service.ts
// version: 1.0 (Initial App Service)
// last-modified: 31 สิงหาคม 2568

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FG Pricing System API is running successfully!';
  }

  getHealthCheck(): { status: string; timestamp: string; version: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}