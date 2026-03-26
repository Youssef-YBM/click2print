import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';

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

  @Column({ type: 'enum', enum: OrderStatus })
  fromStatus: OrderStatus;

  @Column({ type: 'enum', enum: OrderStatus })
  toStatus: OrderStatus;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => User, { eager: true })
  changedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}