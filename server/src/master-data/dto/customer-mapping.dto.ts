import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCustomerMappingDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  customerGroupId: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerGroupName?: string;
}

export class UpdateCustomerMappingDto extends CreateCustomerMappingDto {
  @IsOptional()
  @IsString()
  id?: string;
}