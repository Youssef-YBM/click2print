import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ApplyPromoDto {
  @IsString()
  promoCode: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;
}