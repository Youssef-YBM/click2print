import 'reflect-metadata';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, Material } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { MachinesService } from '../machines/machines.service';
import { OrderHistory } from './order-history.entity';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderHistory)
    private historyRepository: Repository<OrderHistory>,
    private notificationsService: NotificationsService,
    private machinesService: MachinesService,
    private pricingService: PricingService,
  ) {}

  async create(dto: CreateOrderDto, userId: string, promoCode?: string): Promise<Order> {
    // Calculer le prix avec pricing dynamique
    const pricing = await this.pricingService.calculatePrice({
      material: dto.material,
      volume: (dto as any).volume || 0,
      estimatedTime: (dto as any).estimatedTime || 1,
      quantity: dto.quantity,
      promoCode: promoCode,
    });
    
    const order = this.orderRepository.create({
      ...dto,
      price: pricing.total,
      user: { id: userId } as any,
      status: OrderStatus.PENDING,
    });
    
    const savedOrder = await this.orderRepository.save(order);

    await this.notificationsService.createNotification(
      userId,
      `Commande créée #${savedOrder.id.slice(0, 8)}`,
      `Votre commande de ${dto.quantity}x ${dto.material} a été créée avec succès. Prix: ${pricing.total} MAD`,
      NotificationType.ORDER_CREATED,
      { orderId: savedOrder.id, priceDetails: pricing }
    );

    return savedOrder;
  }

  async findAll(userId: string, role: string): Promise<any[]> {
    let orders;
    if (role === 'admin' || role === 'operator') {
      orders = await this.orderRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['user', 'machine'],
      });
    } else {
      orders = await this.orderRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        relations: ['user', 'machine'],
      });
    }
    return orders.map(o => ({
      ...o,
      user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email, role: o.user.role } : null,
    }));
  }

  async findOne(id: string, userId: string, role: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'machine', 'history'],
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role === 'client' && order.user.id !== userId) {
      throw new ForbiddenException('Accès refusé');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto, userId: string, role: string): Promise<Order> {
    const order = await this.findOne(id, userId, role);
    const oldStatus = order.status;
    const newStatus = dto.status;

    if (newStatus && newStatus !== oldStatus) {
      // Si on passe à "printing"
      if (newStatus === OrderStatus.PRINTING) {
        // Vérifier si une machine est assignée
        if (!order.machine && (dto as any).machineId) {
          const machine = await this.machinesService.findOne((dto as any).machineId);
          if (machine.status !== 'idle') {
            throw new BadRequestException('Machine non disponible');
          }
          order.machine = machine;
        }

        if (!order.machine) {
          throw new BadRequestException('Aucune machine assignée');
        }

        // Mettre à jour le statut de la machine
        await this.machinesService.assignMachineToOrder(order.machine.id, order.id);
      }

      // Si la commande n'est plus en impression, libérer la machine
      if (oldStatus === OrderStatus.PRINTING && newStatus !== OrderStatus.PRINTING) {
        if (order.machine) {
          await this.machinesService.releaseMachine(order.machine.id);
          order.machine = null;
        }
      }

      // Sauvegarder l'historique
      const history = this.historyRepository.create({
        fromStatus: oldStatus,
        toStatus: newStatus,
        note: dto.notes || `Changement par ${role}`,
        changedBy: { id: userId } as any,
        order: order,
      });
      await this.historyRepository.save(history);

      // Notification de changement de statut
      await this.notificationsService.createNotification(
        order.user.id,
        `Commande #${order.id.slice(0, 8)} - ${newStatus}`,
        `Votre commande est passée du statut "${oldStatus}" à "${newStatus}"`,
        NotificationType.ORDER_UPDATED,
        { orderId: order.id, oldStatus, newStatus }
      );
    }

    Object.assign(order, dto);
    const savedOrder = await this.orderRepository.save(order);

    // Synchroniser les machines
    await this.machinesService.synchronizeMachineStatus();

    return savedOrder;
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const order = await this.findOne(id, userId, role);
    if (order.status === OrderStatus.PRINTING) {
      throw new BadRequestException('Impossible de supprimer une commande en cours d\'impression');
    }
    if (order.machine) {
      await this.machinesService.releaseMachine(order.machine.id);
    }
    await this.orderRepository.remove(order);
  }

  // Mettre à jour le progrès d'impression
  async updatePrintProgress(orderId: string, progress: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['machine'],
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.status !== OrderStatus.PRINTING) {
      throw new BadRequestException('La commande n\'est pas en cours d\'impression');
    }

    if (order.machine) {
      await this.machinesService.updateProgress(order.machine.id, progress);
    }

    // Si l'impression est terminée, passer automatiquement à DONE
    if (progress >= 100) {
      order.status = OrderStatus.DONE;
      if (order.machine) {
        await this.machinesService.releaseMachine(order.machine.id);
        order.machine = null;
      }
      await this.orderRepository.save(order);
    }

    return order;
  }
}