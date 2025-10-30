// path: server/src/data/scrap-allowance.controller.ts
// version: 1.0 (Initial Creation - Scrap Allowance REST API)
// last-modified: 29 ตุลาคม 2568 00:20

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScrapAllowanceService } from './scrap-allowance.service';

@Controller('api/data/scrap-allowances')
@UseGuards(JwtAuthGuard)
export class ScrapAllowanceController {
  constructor(private readonly scrapAllowanceService: ScrapAllowanceService) {}

  // GET all scrap allowances
  @Get()
  async getAll() {
    const data = await this.scrapAllowanceService.getScrapAllowances();
    return data;
  }

  // GET version history by ID
  @Get('history/:id')
  async getHistory(@Param('id') id: string) {
    return await this.scrapAllowanceService.getScrapAllowanceHistory(id);
  }

  // CREATE new scrap allowance (Draft)
  @Post()
  async create(@Body() dto: any) {
    return await this.scrapAllowanceService.createScrapAllowance(dto);
  }

  // APPROVE scrap allowance (Draft → Active)
  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    return await this.scrapAllowanceService.approveScrapAllowance(id);
  }

  // ROLLBACK scrap allowance (Archived → Active)
  @Put(':id/rollback')
  async rollback(@Param('id') id: string) {
    return await this.scrapAllowanceService.rollbackScrapAllowance(id);
  }

  // UPDATE scrap allowance (Draft only)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return await this.scrapAllowanceService.updateScrapAllowance(id, dto);
  }

  // DELETE scrap allowance (Draft only)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.scrapAllowanceService.deleteScrapAllowance(id);
  }
}
