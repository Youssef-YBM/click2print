import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';
import { Machine } from './machine.entity';
import { OrderHistory } from './order-history.entity';

export enum OrderStatus {
  PENDING   = 'pending',
  REVIEW    = 'review',
  PRINTING  = 'printing',
  DONE      = 'done',
  SHIPPED   = 'shipped',
  CANCELLED = 'cancelled',
}

export enum Material {
  PLA   = 'PLA',
  PETG  = 'PETG',
  ABS   = 'ABS',
  RESIN = 'Résine',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'enum', enum: Material, default: Material.PLA })
  material: Material;

  @Column({ default: 'Blanc' })
  color: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Machine, { eager: true, nullable: true })
  machine: Machine;

@OneToMany(() => OrderHistory, history => history.id)
history: OrderHistory[];

  @CreateDateColumn()
  createdAt: Date;
}