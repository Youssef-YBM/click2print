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
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        
        //  Configuration pour la production (Neon.tech)
        if (isProduction) {
          return {
            type: 'postgres',
            url: config.get('DATABASE_URL'),
            entities: [User, Order, Machine, Notification, OrderHistory],
            autoLoadEntities: true,
            synchronize: false, //  Toujours false en production
            ssl: { rejectUnauthorized: false },
            extra: {
              max: 20,
              connectionTimeoutMillis: 5000,
            },
          };
        }
        
        // 📌 Configuration pour le développement (Docker local)
        return {
          type: 'postgres',
          host: config.get('DB_HOST', 'localhost'),
          port: config.get('DB_PORT', 5432),
          username: config.get('DB_USER', 'admin'),
          password: config.get('DB_PASSWORD', 'secret'),
          database: config.get('DB_NAME', 'click2print'),
          entities: [User, Order, Machine, Notification, OrderHistory],
          autoLoadEntities: true,
          synchronize: true, //  En développement seulement
        };
      },
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