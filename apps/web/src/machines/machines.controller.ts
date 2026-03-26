import 'reflect-metadata';
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll() {
    return this.machinesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.machinesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.machinesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.machinesService.remove(id);
  }
}