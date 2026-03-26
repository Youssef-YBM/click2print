import 'reflect-metadata';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine, MachineStatus } from '../orders/machine.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
  ) {}

  async findAll(): Promise<Machine[]> {
    return this.machineRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.machineRepository.findOne({ where: { id } });
    if (!machine) throw new NotFoundException('Machine introuvable');
    return machine;
  }

  async create(dto: any): Promise<Machine> {
  const machine = this.machineRepository.create(dto);
  return this.machineRepository.save(machine) as unknown as Machine;
}

  async update(id: string, dto: any): Promise<Machine> {
    const machine = await this.findOne(id);
    Object.assign(machine, dto);
    return this.machineRepository.save(machine);
  }

  async remove(id: string): Promise<void> {
    const machine = await this.findOne(id);
    await this.machineRepository.remove(machine);
  }

  async updateStatus(id: string, status: MachineStatus, progress?: number, job?: string): Promise<Machine> {
    const machine = await this.findOne(id);
    machine.status = status;
    if (progress !== undefined) machine.progress = progress;
    if (job !== undefined) machine.currentJob = job;
    return this.machineRepository.save(machine);
  }
}