// path: server/src/activity-log/activity-log.controller.ts
// version: 1.0 (Activity Log Controller)
// last-modified: 29 กันยายน 2568 16:55

import { Controller, Get, Param } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';

@Controller('api/activity-logs')
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