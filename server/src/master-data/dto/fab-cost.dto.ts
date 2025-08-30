import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn } from 'class-validator';
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