// path: server/src/master-data/dto/exchange-rate.dto.ts
// version: 1.0 (Initial DTO Creation)
// last-modified: 31 สิงหาคม 2568

import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExchangeRateDto {
  @IsString()
  @IsNotEmpty()
  customerGroupId: string;

  @IsString()
  @IsNotEmpty()
  sourceCurrency: string;

  @IsString()
  @IsNotEmpty()
  destinationCurrency: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  rate: number;
}

export class UpdateExchangeRateDto {
  @IsString()
  @IsNotEmpty()
  customerGroupId: string;

  @IsString()
  @IsNotEmpty()
  sourceCurrency: string;

  @IsString()
  @IsNotEmpty()
  destinationCurrency: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  rate: number;
}