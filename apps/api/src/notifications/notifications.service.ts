import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../auth/user.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      user: { id: userId } as User,
      metadata: metadata || {},
    });
    return this.notificationRepository.save(notification);
  }

  async notifyOrderStatusChange(order: Order, oldStatus: string, newStatus: string, changedBy: User) {
    const title = `Commande ${order.id.slice(0,8)} - ${newStatus}`;
    let message = '';
    
    const statusMessages = {
      pending: 'votre commande a été créée et est en attente de validation.',
      review: 'votre commande est en cours de vérification par notre équipe.',
      printing: 'votre commande a commencé à être imprimée !',
      done: 'votre commande est prête à être expédiée.',
      shipped: 'votre commande a été expédiée !',
      cancelled: 'votre commande a été annulée.',
    };
    
    message = statusMessages[newStatus] || `statut changé de ${oldStatus} à ${newStatus}`;
    
    return this.createNotification(
      order.user.id,
      title,
      message,
      NotificationType.ORDER_UPDATED,
      { orderId: order.id, oldStatus, newStatus, changedBy: changedBy.email }
    );
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { user: { id: userId } };
    if (unreadOnly) where.read = false;
    
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user: { id: userId } },
      { read: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, read: false },
      { read: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, read: false },
    });
  }
}