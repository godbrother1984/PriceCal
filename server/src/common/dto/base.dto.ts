// path: server/src/common/dto/base.dto.ts
// version: 1.0 (Initial Base DTO)
// last-modified: 31 สิงหาคม 2568

import { IsOptional, IsString, IsDateString } from 'class-validator';

export abstract class BaseDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsDateString()
  createDate?: string;

  @IsOptional()
  @IsString()
  createUser?: string;

  @IsOptional()
  @IsDateString()
  modifyDate?: string;

  @IsOptional()
  @IsString()
  modifyUser?: string;
}