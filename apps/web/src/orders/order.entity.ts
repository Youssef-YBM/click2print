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

  @ManyToOne(() => User, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}