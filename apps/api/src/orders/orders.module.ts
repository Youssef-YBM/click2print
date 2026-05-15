import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderHistory } from './order-history.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MachinesModule } from '../machines/machines.module';
import { PricingModule } from '../pricing/pricing.module';  

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderHistory]),
    NotificationsModule,
    MachinesModule,
    PricingModule,  
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}