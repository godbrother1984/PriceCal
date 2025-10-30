// path: server/src/dashboard/dashboard.controller.ts
// version: 1.1 (Add Task Detail Endpoint)
// last-modified: 29 ตุลาคม 2568 00:35

import { Controller, Get, Query, Request, UseGuards, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Request() req) {
    const { userId, username, role } = req.user;
    console.log(`[DashboardController] Get stats for user: ${username} (${role})`);
    return this.dashboardService.getDashboardStats(userId, role);
  }

  @Get('my-tasks')
  async getMyTasks(@Request() req, @Query('limit') limit?: string) {
    const { userId, username, role } = req.user;
    const taskLimit = limit ? parseInt(limit) : 5;
    console.log(`[DashboardController] Get tasks for user: ${username} (${role}), limit: ${taskLimit}`);
    return this.dashboardService.getMyTasks(userId, role, taskLimit);
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    const activityLimit = limit ? parseInt(limit) : 10;
    console.log(`[DashboardController] Get recent activity, limit: ${activityLimit}`);
    return this.dashboardService.getRecentActivity(activityLimit);
  }

  @Get('task-detail/:taskId')
  async getTaskDetail(
    @Param('taskId') taskId: string,
    @Query('type') type: string,
    @Query('entityType') entityType?: string
  ) {
    console.log(`[DashboardController] Get task detail: ${taskId}, type: ${type}, entityType: ${entityType}`);
    return this.dashboardService.getTaskDetail(taskId, type, entityType);
  }
}
