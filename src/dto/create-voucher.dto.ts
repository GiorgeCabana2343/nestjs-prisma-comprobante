import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateVoucherDto {
    
  @IsString() 
  @IsNotEmpty() 
  companyId: string;

  @IsString() 
  @IsNotEmpty() 
  supplierRuc: string;

  @IsString()
  @IsNotEmpty() 
  invoiceNumber: string;

  @IsNumber() 
  amount: number;

  @IsDateString() 
  @IsNotEmpty() 
  issueDate: string;

  @IsString() 
  @IsNotEmpty() 
  documentType: string;
}