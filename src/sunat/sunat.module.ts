import { Module, Global } from '@nestjs/common';
import { SunatService } from './sunat.service';

@Global()
@Module({
  providers: [SunatService],
  exports: [SunatService],
})
export class SunatModule {}