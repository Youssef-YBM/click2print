import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(dto: CreateOrderDto, userId: string): Promise<Order> {
    const price = this.calculatePrice(dto.material, dto.quantity);
    const order = this.orderRepository.create({
      ...dto,
      price,
      user: { id: userId },
      status: OrderStatus.PENDING,
    });
    return this.orderRepository.save(order);
  }

  async findAll(userId: string, role: string): Promise<Order[]> {
    if (role === 'admin' || role === 'operator') {
      return this.orderRepository.find({ order: { createdAt: 'DESC' } });
    }
    return this.orderRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, role: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role === 'client' && order.user.id !== userId) {
      throw new ForbiddenException('Accès refusé');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, userId: string, role: string): Promise<Order> {
    const order = await this.findOne(id, userId, role);
    Object.assign(order, dto);
    return this.orderRepository.save(order);
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const order = await this.findOne(id, userId, role);
    await this.orderRepository.remove(order);
  }

  private calculatePrice(material: string, quantity: number): number {
    const basePrices: Record<string, number> = {
      'PLA': 50, 'PETG': 70, 'ABS': 65, 'Résine': 120,
    };
    return (basePrices[material] || 50) * quantity;
  }
}