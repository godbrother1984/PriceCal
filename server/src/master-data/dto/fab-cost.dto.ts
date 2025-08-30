// File: /c:/Project/PriceCal/server/src/master-data/dto/fab-cost.dto.ts
// Version: 1.0.0

import { IsString, IsNumber, IsOptional, IsNotEmpty, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFabCostDto {
  @ApiProperty({
    description: 'ID กลุ่มลูกค้า',
    example: 'group-001'
  })
  @IsString()
  @IsNotEmpty()
  customerGroupId: string;

  @ApiProperty({
    description: 'ค่าต้นทุน Fab',
    example: 150.00,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  costValue: number;

  @ApiProperty({
    description: 'สกุลเงิน',
    example: 'THB',
    default: 'THB'
  })
  @IsString()
  @IsOptional()
  currency?: string = 'THB';

  @ApiProperty({
    description: 'หมายเหตุเพิ่มเติม',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFabCostDto {
  @ApiProperty({
    description: 'ID ของ Fab Cost Record',
    example: 'fab-cost-001'
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'ID กลุ่มลูกค้า',
    example: 'group-001',
    required: false
  })
  @IsString()
  @IsOptional()
  customerGroupId?: string;

  @ApiProperty({
    description: 'ค่าต้นทุน Fab',
    example: 160.00,
    minimum: 0,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costValue?: number;

  @ApiProperty({
    description: 'สกุลเงิน',
    example: 'THB',
    required: false
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'หมายเหตุเพิ่มเติม',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class FabCostResponseDto {
  @ApiProperty({
    description: 'ID เฉพาะของ Fab Cost Record',
    example: 'fab-cost-001'
  })
  id: string;

  @ApiProperty({
    description: 'ID กลุ่มลูกค้า',
    example: 'group-001'
  })
  customerGroupId: string;

  @ApiProperty({
    description: 'ชื่อกลุ่มลูกค้า',
    example: 'กลุ่ม VIP'
  })
  customerGroupName: string;

  @ApiProperty({
    description: 'ค่าต้นทุน Fab',
    example: 150.00
  })
  costValue: number;

  @ApiProperty({
    description: 'สกุลเงิน',
    example: 'THB'
  })
  currency: string;

  @ApiProperty({
    description: 'หมายเหตุเพิ่มเติม'
  })
  description?: string;

  @ApiProperty({
    description: 'วันที่สร้าง',
    example: '2025-08-30T10:00:00Z'
  })
  createDate: Date;

  @ApiProperty({
    description: 'ผู้สร้าง',
    example: 'admin@company.com'
  })
  createUser: string;

  @ApiProperty({
    description: 'วันที่แก้ไขล่าสุด',
    example: '2025-08-30T15:30:00Z'
  })
  modifyDate?: Date;

  @ApiProperty({
    description: 'ผู้แก้ไขล่าสุด',
    example: 'costing@company.com'
  })
  modifyUser?: string;

  @ApiProperty({
    description: 'สถานะของรายการ',
    example: 'ACTIVE'
  })
  status: string;

  @ApiProperty({
    description: 'เวอร์ชันของข้อมูล',
    example: 1
  })
  version: number;
}