import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PricingType {
  MATERIAL = 'material',
  VOLUME = 'volume',
  TIME = 'time',
  PROMO = 'promo',
}

@Entity('pricing')
export class Pricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PricingType })
  type: PricingType;

  @Column()
  name: string;

  @Column({ nullable: true })
  material: string;

  @Column({ type: 'float', nullable: true })
  minVolume: number;

  @Column({ type: 'float', nullable: true })
  maxVolume: number;

  @Column({ type: 'float', nullable: true })
  pricePerGram: number;

  @Column({ type: 'float', nullable: true })
  pricePerCm3: number;

  @Column({ type: 'float', nullable: true })
  pricePerHour: number;

  @Column({ type: 'float', default: 0 })
  fixedPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}