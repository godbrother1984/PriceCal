// path: server/src/master-data/dto/fab-cost.dto.ts
// version: 1.1 (Fixed Import)
// last-modified: 30 สิงหาคม 2568 11:05

import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFabCostDto {
  @IsNotEmpty()
  @IsString()
  customerGroupId: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  costValue: number;

  @IsNotEmpty()
  @IsIn(['THB', 'USD', 'EUR'])
  currency: 'THB' | 'USD' | 'EUR';
}

export class UpdateFabCostDto extends CreateFabCostDto {
  @IsOptional()
  @IsString()
  id?: string;
}