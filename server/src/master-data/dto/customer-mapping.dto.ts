// path: server/src/master-data/dto/customer-mapping.dto.ts
// version: 1.0 (Initial DTO Creation)
// last-modified: 31 สิงหาคม 2568

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCustomerMappingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerGroupId: string;
}

export class UpdateCustomerMappingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  customerGroupId: string;
}