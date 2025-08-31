// path: server/src/master-data/dto/customer-group.dto.ts
// version: 1.0 (Initial DTO Creation)
// last-modified: 31 สิงหาคม 2568

import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  id: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  description?: string;
}

export class UpdateCustomerGroupDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  description?: string;
}