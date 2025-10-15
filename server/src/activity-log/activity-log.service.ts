// path: server/src/activity-log/activity-log.service.ts
// version: 1.2 (Add Price Calculation Logging)
// last-modified: 7 ตุลาคม 2568 17:15

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';

export interface CreateActivityLogDto {
  requestId: string;
  userId?: string;
  userName: string;
  activityType: ActivityType;
  description: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async createLog(logData: CreateActivityLogDto): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      requestId: logData.requestId,
      userId: logData.userId,
      userName: logData.userName,
      activityType: logData.activityType,
      description: logData.description,
      oldValue: logData.oldValue ? JSON.stringify(logData.oldValue) : null,
      newValue: logData.newValue ? JSON.stringify(logData.newValue) : null,
      notes: logData.notes,
    });

    const savedLog = await this.activityLogRepository.save(log);
    console.log(`[ActivityLogService] Created log:`, {
      id: savedLog.id,
      requestId: savedLog.requestId,
      activityType: savedLog.activityType,
      description: savedLog.description,
    });

    return savedLog;
  }

  async findLogsByRequestId(requestId: string): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      where: { requestId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async findAllLogs(): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user', 'priceRequest'],
    });
  }

  // Helper methods สำหรับสร้าง log แต่ละประเภท
  async logRequestCreated(requestId: string, userId: string, userName: string, requestData: any) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'REQUEST_CREATED',
      description: `สร้างคำขอราคาใหม่สำหรับลูกค้า ${requestData.customerName} สินค้า ${requestData.productName}`,
      newValue: requestData,
    });
  }

  async logStatusChanged(requestId: string, userId: string, userName: string, oldStatus: string, newStatus: string, reason?: string) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'STATUS_CHANGED',
      description: `เปลี่ยนสถานะจาก "${oldStatus}" เป็น "${newStatus}"`,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      notes: reason,
    });
  }

  async logCalculationCompleted(requestId: string, userId: string, userName: string, calculationResult: any) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'CALCULATION_COMPLETED',
      description: `คำนวณราคาเสร็จสิ้น ราคารวม: ${calculationResult.totalPrice || 'N/A'} บาท`,
      newValue: calculationResult,
    });
  }

  async logRevisionRequested(requestId: string, userId: string, userName: string, reason: string) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'REVISION_REQUESTED',
      description: `ขอให้แก้ไขคำขอราคา`,
      notes: reason,
    });
  }

  async logApprovalRequested(requestId: string, userId: string, userName: string) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'APPROVAL_REQUESTED',
      description: `ส่งคำขอราคาเพื่อขออนุมัติ`,
    });
  }

  async logApproved(requestId: string, userId: string, userName: string) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'APPROVED',
      description: `อนุมัติคำขอราคาแล้ว`,
    });
  }

  async logRejected(requestId: string, userId: string, userName: string, reason?: string) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'REJECTED',
      description: `ปฏิเสธคำขอราคา`,
      notes: reason,
    });
  }

  async logBoqUpdated(requestId: string, userId: string, userName: string, oldBoq: any[], newBoq: any[]) {
    return this.createLog({
      requestId,
      userId,
      userName,
      activityType: 'BOQ_UPDATED',
      description: `อัปเดต BOQ (รายการวัสดุ)`,
      oldValue: oldBoq,
      newValue: newBoq,
    });
  }

  async logPriceCalculation(
    requestId: string,
    userId: string,
    userName: string,
    productId: string,
    productName: string,
    quantity: number,
    calculationResult: any,
  ) {
    return this.createLog({
      requestId: requestId || productId, // ถ้าไม่มี requestId ใช้ productId
      userId,
      userName,
      activityType: 'PRICE_CALCULATED',
      description: `คำนวณราคาสินค้า ${productName} (${productId}) จำนวน ${quantity} หน่วย - ราคาขาย: ${calculationResult.sellingPriceThb?.toFixed(2) || 'N/A'} THB`,
      newValue: calculationResult,
      notes: `Total Cost: ${calculationResult.totalCost?.toFixed(2)} USD, Margin: ${calculationResult.marginPercentage?.toFixed(2)}%`,
    });
  }

  // Log การเปลี่ยนแปลง Master Data
  async logMasterDataChanged(
    tableName: string,
    recordId: string,
    userId: string,
    userName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue: any,
    newValue: any,
    reason?: string
  ) {
    // ใช้ recordId เป็น requestId เพื่อให้สามารถ query ได้
    const activityType = action === 'CREATE' ? 'REQUEST_CREATED' :
                        action === 'UPDATE' ? 'STATUS_CHANGED' :
                        'REJECTED';

    const actionText = action === 'CREATE' ? 'สร้าง' :
                      action === 'UPDATE' ? 'แก้ไข' :
                      'ลบ';

    return this.createLog({
      requestId: recordId, // ใช้ recordId เป็น identifier
      userId,
      userName,
      activityType,
      description: `${actionText} ${tableName} ID: ${recordId}`,
      oldValue,
      newValue,
      notes: reason,
    });
  }
}