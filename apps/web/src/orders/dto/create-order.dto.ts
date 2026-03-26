import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Material } from '../order.entity';

export class CreateOrderDto {
  @IsString()
  fileName: string;

  @IsEnum(Material)
  material: Material;

  @IsString()
  color: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}