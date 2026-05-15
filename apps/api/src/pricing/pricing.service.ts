import 'reflect-metadata';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pricing, PricingType } from './pricing.entity';
import { Promotion, DiscountType } from './promotion.entity';
import { Material } from '../orders/order.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Pricing)
    private pricingRepository: Repository<Pricing>,
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
  ) {}

  async calculatePrice(params: {
    material: Material;
    volume?: number;
    estimatedTime?: number;
    quantity?: number;
    promoCode?: string;
  }): Promise<{
    basePrice: number;
    volumeCost: number;
    timeCost: number;
    materialCost: number;
    subtotal: number;
    discount: number;
    discountAmount: number;
    total: number;
    promotion?: Promotion;
  }> {
    const quantity = params.quantity || 1;
    
    // 1. Calculer le coût matériau
    const materialCost = await this.calculateMaterialCost(params.material);
    
    // 2. Calculer le coût volume
    const volumeCost = params.volume ? await this.calculateVolumeCost(params.volume) : 0;
    
    // 3. Calculer le coût temps
    const timeCost = params.estimatedTime ? await this.calculateTimeCost(params.estimatedTime) : 0;
    
    // 4. Prix de base
    const basePrice = materialCost + volumeCost + timeCost;
    const subtotal = basePrice * quantity;
    
    // 5. Appliquer promotion
    let discount = 0;
    let discountAmount = 0;
    let promotion = null;
    
    if (params.promoCode) {
      promotion = await this.validatePromoCode(params.promoCode, subtotal);
      if (promotion) {
        if (promotion.discountType === DiscountType.PERCENTAGE) {
          discount = promotion.discountValue;
          discountAmount = (subtotal * discount) / 100;
          if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
            discountAmount = promotion.maxDiscount;
          }
        } else {
          discountAmount = promotion.discountValue;
        }
        
        // Incrémenter le compteur d'utilisation
        promotion.usageCount++;
        await this.promotionRepository.save(promotion);
      }
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    
    return {
      basePrice,
      volumeCost,
      timeCost,
      materialCost,
      subtotal,
      discount,
      discountAmount,
      total: Math.round(total * 100) / 100,
      promotion,
    };
  }

  private async calculateMaterialCost(material: Material): Promise<number> {
    const pricing = await this.pricingRepository.findOne({
      where: { type: PricingType.MATERIAL, material: material, isActive: true },
    });
    
    const defaultPrices: Record<Material, number> = {
      [Material.PLA]: 50,
      [Material.PETG]: 70,
      [Material.ABS]: 65,
      [Material.RESIN]: 120,
    };
    
    return pricing?.fixedPrice || defaultPrices[material];
  }

  private async calculateVolumeCost(volume: number): Promise<number> {
    const pricing = await this.pricingRepository.findOne({
      where: { type: PricingType.VOLUME, isActive: true },
    });
    
    if (pricing?.pricePerCm3) {
      return volume * pricing.pricePerCm3;
    }
    
    // Tarification par paliers
    if (volume < 50) return volume * 2;
    if (volume < 100) return volume * 1.8;
    if (volume < 200) return volume * 1.5;
    return volume * 1.2;
  }

  private async calculateTimeCost(hours: number): Promise<number> {
    const pricing = await this.pricingRepository.findOne({
      where: { type: PricingType.TIME, isActive: true },
    });
    
    if (pricing?.pricePerHour) {
      return hours * pricing.pricePerHour;
    }
    
    // Tarification par défaut
    return hours * 10;
  }

  async validatePromoCode(code: string, orderAmount: number): Promise<Promotion | null> {
    const promotion = await this.promotionRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });
    
    if (!promotion) return null;
    
    const now = new Date();
    
    // Vérifier validité
    if (promotion.validFrom && new Date(promotion.validFrom) > now) return null;
    if (promotion.validUntil && new Date(promotion.validUntil) < now) return null;
    if (promotion.usageCount >= promotion.usageLimit) return null;
    if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) return null;
    
    return promotion;
  }

  async createPricing(data: Partial<Pricing>): Promise<Pricing> {
    const pricing = this.pricingRepository.create(data);
    return this.pricingRepository.save(pricing);
  }

  async createPromotion(data: Partial<Promotion>): Promise<Promotion> {
    const promotion = this.promotionRepository.create({
      ...data,
      code: data.code?.toUpperCase(),
    });
    return this.promotionRepository.save(promotion);
  }

  async getAllPricing(): Promise<Pricing[]> {
    return this.pricingRepository.find();
  }

  async getAllPromotions(): Promise<Promotion[]> {
    return this.promotionRepository.find();
  }

  async deletePricing(id: string): Promise<void> {
    await this.pricingRepository.delete(id);
  }

  async deletePromotion(id: string): Promise<void> {
    await this.promotionRepository.delete(id);
  }
}