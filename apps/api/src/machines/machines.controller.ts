import 'reflect-metadata';
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) { }

  @Get()
  findAll() {
    return this.machinesService.findAll();
  }

  @Get('available')
  async getAvailableMachines(@Query('material') material?: string) {
    return this.machinesService.findAvailableMachines(material);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.machinesService.create(dto);
  }

  @Post(':id/assign')
  async assignMachine(@Param('id') id: string, @Body('orderId') orderId: string) {
    return this.machinesService.assignMachineToOrder(id, orderId);
  }

  @Post(':id/release')
  async releaseMachine(@Param('id') id: string) {
    return this.machinesService.releaseMachine(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.machinesService.update(id, dto);
  }

  @Patch(':id/progress')
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.machinesService.updateProgress(id, progress);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machinesService.remove(id);
  }

  @Get('status/summary')
  async getStatusSummary() {
    const machines = await this.machinesService.findAll();
    const summary = {
      total: machines.length,
      idle: machines.filter(m => m.status === 'idle').length,
      printing: machines.filter(m => m.status === 'printing').length,
      error: machines.filter(m => m.status === 'error').length,
      maintenance: machines.filter(m => m.status === 'maintenance').length,
      machines: machines.map(m => ({
        id: m.id,
        name: m.name,
        status: m.status,
        progress: m.progress,
        currentJob: m.currentJob,
      })),
    };
    return summary;
  }

  @Post(':id/start-print')
  async startPrint(@Param('id') id: string, @Body('orderId') orderId: string) {
    const machine = await this.machinesService.findOne(id);

    if (machine.status !== 'idle') {
      throw new BadRequestException('Machine déjà occupée');
    }

    return this.machinesService.assignMachineToOrder(id, orderId);
  }

  @Post(':id/complete-print')
  async completePrint(@Param('id') id: string) {
    const machine = await this.machinesService.findOne(id);

    if (machine.status !== 'printing') {
      throw new BadRequestException('La machine n\'est pas en train d\'imprimer');
    }

    return this.machinesService.releaseMachine(id);
  }
  @Post('sync')
  async syncMachines() {
    await this.machinesService.synchronizeMachineStatus();
    return this.machinesService.findAll();
  }
}