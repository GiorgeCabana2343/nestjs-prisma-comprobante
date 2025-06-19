import { IsOptional, IsString, IsDateString, IsIn, IsNumberString } from 'class-validator';
import { ReceiptState } from '@prisma/client'; 
export class FilterVoucherDto {
  @IsOptional() 
  @IsDateString() 
  startDate?: string; 

  @IsOptional()
  @IsDateString()
  endDate?: string; 

  @IsOptional()
  @IsString() 
  documentType?: string; 

  @IsOptional()
  @IsIn(Object.values(ReceiptState)) 
  state?: ReceiptState; 

  @IsOptional()
  @IsNumberString() 
  page?: string; 

  @IsOptional()
  @IsNumberString()
  limit?: string; 
}