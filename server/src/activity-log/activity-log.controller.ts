// path: server/src/activity-log/activity-log.controller.ts
// version: 2.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:40

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';

@Controller('api/activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  async findAllLogs() {
    console.log('[ActivityLogController] GET /api/activity-logs');
    const logs = await this.activityLogService.findAllLogs();
    return {
      success: true,
      message: 'Activity logs retrieved successfully',
      data: logs,
    };
  }

  @Get('request/:requestId')
  async findLogsByRequestId(@Param('requestId') requestId: string) {
    console.log(`[ActivityLogController] GET /api/activity-logs/request/${requestId}`);
    const logs = await this.activityLogService.findLogsByRequestId(requestId);
    return {
      success: true,
      message: `Activity logs for request ${requestId} retrieved successfully`,
      data: logs,
    };
  }
}