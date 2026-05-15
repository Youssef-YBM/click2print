import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';
import { Order } from './order.entity';  // AJOUTER CET IMPORT

export enum OrderStatus {
  PENDING   = 'pending',
  REVIEW    = 'review',
  PRINTING  = 'printing',
  DONE      = 'done',
  SHIPPED   = 'shipped',
  CANCELLED = 'cancelled',
}

@Entity('order_history')
export class OrderHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum', 
    enum: OrderStatus,
    default: OrderStatus.PENDING 
  })
  fromStatus: OrderStatus;

  @Column({ 
    type: 'enum', 
    enum: OrderStatus,
    default: OrderStatus.PENDING  
  })
  toStatus: OrderStatus;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => User, { eager: true })
  changedBy: User;

  // AJOUTER CETTE RELATION INVERSE
  @ManyToOne(() => Order, order => order.history, { nullable: true })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;
}