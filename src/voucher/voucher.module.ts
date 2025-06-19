import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [PrismaModule]
})
export class VoucherModule {}