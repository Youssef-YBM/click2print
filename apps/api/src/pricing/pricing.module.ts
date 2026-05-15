import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { Pricing } from './pricing.entity';
import { Promotion } from './promotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pricing, Promotion])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}