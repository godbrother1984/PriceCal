import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCustomerGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsIn(['Domestic', 'Export'])
  type: 'Domestic' | 'Export';
}

export class UpdateCustomerGroupDto extends CreateCustomerGroupDto {
  @IsOptional()
  @IsString()
  id?: string;
}