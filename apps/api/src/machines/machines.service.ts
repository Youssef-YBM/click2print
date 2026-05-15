import 'reflect-metadata';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine, MachineStatus, MachineType } from '../orders/machine.entity';
import { Order, OrderStatus } from '../orders/order.entity';  // Ajouter OrderStatus

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) { }

  async findAll(): Promise<Machine[]> {
    return this.machineRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.machineRepository.findOne({ where: { id } });
    if (!machine) throw new NotFoundException('Machine introuvable');
    return machine;
  }

  async create(dto: any): Promise<Machine> {
    const savedMachine = await this.machineRepository.save({
      name: dto.name,
      type: dto.type,
      materials: dto.materials,
      status: MachineStatus.IDLE,
      progress: 0,
      currentJob: null,
      notes: dto.notes || null,
    });
    return savedMachine as Machine;
  }

  async update(id: string, dto: any): Promise<Machine> {
    const machine = await this.findOne(id);
    Object.assign(machine, dto);
    return await this.machineRepository.save(machine);
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
    return await this.machineRepository.save(machine);
  }

  async findAvailableMachines(material?: string): Promise<Machine[]> {
    const query = this.machineRepository.createQueryBuilder('machine')
      .where('machine.status = :status', { status: MachineStatus.IDLE });

    if (material) {
      query.andWhere(':material = ANY(machine.materials)', { material });
    }

    return query.getMany();
  }

  async assignMachineToOrder(machineId: string, orderId: string): Promise<Machine> {
    const machine = await this.findOne(machineId);

    if (machine.status !== MachineStatus.IDLE) {
      throw new BadRequestException(`Machine ${machine.name} est actuellement ${machine.status}`);
    }

    machine.status = MachineStatus.PRINTING;
    machine.currentJob = orderId;
    machine.progress = 0;

    return await this.machineRepository.save(machine);
  }

  async releaseMachine(machineId: string): Promise<Machine> {
    const machine = await this.findOne(machineId);
    machine.status = MachineStatus.IDLE;
    machine.currentJob = null;
    machine.progress = 0;
    return await this.machineRepository.save(machine);
  }

  async updateProgress(machineId: string, progress: number): Promise<Machine> {
    const machine = await this.findOne(machineId);

    if (machine.status !== MachineStatus.PRINTING) {
      throw new BadRequestException('Machine not printing');
    }

    machine.progress = Math.min(100, Math.max(0, progress));

    if (machine.progress >= 100) {
      machine.status = MachineStatus.IDLE;
      machine.currentJob = null;
      machine.progress = 0;
    }

    return await this.machineRepository.save(machine);
  }

  async findBestMachineForOrder(material: string): Promise<Machine | null> {
    const machines = await this.findAvailableMachines(material);

    if (machines.length === 0) return null;

    const machineType = material === 'RESIN' ? MachineType.SLA : MachineType.FDM;
    const preferredMachine = machines.find(m => m.type === machineType);

    return preferredMachine || machines[0];
  }

  async synchronizeMachineStatus(): Promise<void> {
    const machines = await this.machineRepository.find();
    // CORRECTION ICI : Utiliser OrderStatus.PRINTING au lieu de 'printing'
    const orders = await this.orderRepository.find({
      where: { status: OrderStatus.PRINTING },
      relations: ['machine'],
    });

    for (const machine of machines) {
      const activeOrder = orders.find(o => o.machine?.id === machine.id);

      if (activeOrder) {
        if (machine.status !== MachineStatus.PRINTING) {
          machine.status = MachineStatus.PRINTING;
          machine.currentJob = activeOrder.fileName;
          await this.machineRepository.save(machine);
        }
      } else {
        if (machine.status === MachineStatus.PRINTING) {
          machine.status = MachineStatus.IDLE;
          machine.currentJob = null;
          machine.progress = 0;
          await this.machineRepository.save(machine);
        }
      }
    }
  }
}