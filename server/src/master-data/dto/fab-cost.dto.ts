// path: server/src/master-data/dto/fab-cost.dto.ts
// version: 1.0 (Initial DTO Creation)
// last-modified: 31 สิงหาคม 2568

import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFabCostDto {
  @IsString()
  @IsNotEmpty()
  customerGroupId: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  costValue: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class UpdateFabCostDto {
  @IsString()
  @IsNotEmpty()
  customerGroupId: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  costValue: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}