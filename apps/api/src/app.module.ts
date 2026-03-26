import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { FilesModule } from './files/files.module';
import { PricingModule } from './pricing/pricing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MachinesModule } from './machines/machines.module';
import { User } from './auth/user.entity';
import { Order } from './orders/order.entity';
import { Machine } from './orders/machine.entity';
import { Notification } from './notifications/notification.entity';
import { OrderHistory } from './orders/order-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'secret',
        database: 'click2print',
        entities: [User, Order, Machine, Notification, OrderHistory],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    OrdersModule,
    FilesModule,
    PricingModule,
    NotificationsModule,
    MachinesModule,
  ],
})
export class AppModule {}