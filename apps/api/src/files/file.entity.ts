import 'reflect-metadata';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  orderId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ nullable: true })
  minioUrl: string;

  @ManyToOne(() => User, { eager: true, nullable: false })  
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;
}