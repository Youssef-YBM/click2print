import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum MachineStatus {
  IDLE        = 'idle',
  PRINTING    = 'printing',
  ERROR       = 'error',
  MAINTENANCE = 'maintenance',
}

export enum MachineType {
  FDM = 'FDM',
  SLA = 'SLA',
  SLS = 'SLS',
}

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: MachineType, default: MachineType.FDM })
  type: MachineType;

  @Column({ type: 'enum', enum: MachineStatus, default: MachineStatus.IDLE })
  status: MachineStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ nullable: true })
  currentJob: string;

  @Column({ type: 'simple-array', default: 'PLA' })
  materials: string[];

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}