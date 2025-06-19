import { Module } from '@nestjs/common';
import { SunatModule } from './sunat/sunat.module';
import { PrismaModule } from './prisma/prisma.module';
import { VoucherModule } from './voucher/voucher.module';
import { VoucherController } from './voucher/voucher.controller';
import { VoucherService } from './voucher/voucher.service';


@Module({
  imports: [
    PrismaModule, 
    SunatModule,
    VoucherModule
   ],
  controllers: [VoucherController],
  providers: [VoucherService],
})
export class AppModule {}
