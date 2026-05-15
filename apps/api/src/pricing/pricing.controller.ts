import 'reflect-metadata';
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplyPromoDto } from './dto/apply-promo.dto';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  async calculatePrice(@Body() params: any) {
    return this.pricingService.calculatePrice(params);
  }

  @Post('validate-promo')
  async validatePromo(@Body() dto: ApplyPromoDto) {
    const promotion = await this.pricingService.validatePromoCode(dto.promoCode, dto.orderAmount);
    if (!promotion) {
      return { valid: false, message: 'Code promo invalide ou expiré' };
    }
    return { valid: true, promotion };
  }

  @Get('config')
  async getPricing() {
    return this.pricingService.getAllPricing();
  }

  @Get('promotions')
  async getPromotions() {
    return this.pricingService.getAllPromotions();
  }

  @Post('config')
  async addPricing(@Body() data: any) {
    return this.pricingService.createPricing(data);
  }

  @Post('promotions')
  async addPromotion(@Body() data: any) {
    return this.pricingService.createPromotion(data);
  }

  @Delete('config/:id')
  async deletePricing(@Param('id') id: string) {
    return this.pricingService.deletePricing(id);
  }

  @Delete('promotions/:id')
  async deletePromotion(@Param('id') id: string) {
    return this.pricingService.deletePromotion(id);
  }
}