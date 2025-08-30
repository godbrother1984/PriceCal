// path: server/src/common/dto/base.dto.ts
// version: 1.0
// last-modified: 29 สิงหาคม 2568 16:30

import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class BaseDto {
  @IsOptional()
  @IsUUID()
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