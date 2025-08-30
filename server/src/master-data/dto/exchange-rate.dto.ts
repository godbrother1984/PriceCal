import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExchangeRateDto {
  @IsNotEmpty()
  @IsString()
  customerGroupId: string;

  @IsNotEmpty()
  @IsIn(['THB', 'USD', 'EUR'])
  sourceCurrency: 'THB' | 'USD' | 'EUR';

  @IsNotEmpty()
  @IsIn(['THB', 'USD', 'EUR'])
  destinationCurrency: 'THB' | 'USD' | 'EUR';

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  @Type(() => Number)
  rate: number;
}

export class UpdateExchangeRateDto extends CreateExchangeRateDto {
  @IsOptional()
  @IsString()
  id?: string;
}