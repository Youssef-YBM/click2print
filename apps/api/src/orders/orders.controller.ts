import 'reflect-metadata';
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Req() req: Request & { user: any }) {
    return this.ordersService.findAll(req.user.sub, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: Request & { user: any }) {
    return this.ordersService.create(dto, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.ordersService.findOne(id, req.user.sub, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Req() req: Request & { user: any }) {
    return this.ordersService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.ordersService.remove(id, req.user.sub, req.user.role);
  }

  @Patch(':id/progress')
async updateProgress(@Param('id') id: string, @Body('progress') progress: number, @Req() req: any) {
  // Seuls les opérateurs et admins peuvent mettre à jour le progrès
  if (req.user.role === 'client') {
    throw new ForbiddenException('Accès non autorisé');
  }
  return this.ordersService.updatePrintProgress(id, progress);
}
}