import { IsIn, IsNotEmpty } from 'class-validator';
import { ReceiptState } from '@prisma/client'; 

export class UpdateVoucherStatusDto {
    
  @IsNotEmpty()
  @IsIn(Object.values(ReceiptState))
  state: ReceiptState;
}