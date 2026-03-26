import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { Machine } from '../orders/machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Machine])],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}