import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  @IsUUID()
  machineId?: string;  // Ajouter cette ligne
}