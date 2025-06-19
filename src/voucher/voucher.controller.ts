import { Controller, Post, Body, HttpStatus, Get, Param, Put, Query, Res, ParseIntPipe } from '@nestjs/common'; // Sin Patch, Param, etc. por ahora
import { CreateVoucherDto } from 'src/dto/create-voucher.dto';
import { VoucherService } from './voucher.service';
import { UpdateVoucherStatusDto } from 'src/dto/update-voucher-status.dto';
import { FilterVoucherDto } from 'src/dto/filter-voucher.dto';
import { Response } from 'express';
import { stringify } from 'csv-stringify';
import { AiQueryDto } from '@app/dto/openia-quentions.dto';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly vouchersService: VoucherService) { }


  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.vouchersService.createVoucher(createVoucherDto);
  }

  @Put(':id/estado')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() updateVoucherStatusDto: UpdateVoucherStatusDto) {
    return this.vouchersService.updateVoucherStatus(id, updateVoucherStatusDto);
  }

  @Get()
  findAll(@Query() filters: FilterVoucherDto) {
    return this.vouchersService.findAll(filters);
  }

  @Get('export-csv')
async exportCsv(@Query() filters: FilterVoucherDto, @Res() res: Response) {
  const { data: vouchers } = await this.vouchersService.findAll(filters);

  const formattedVouchers = vouchers.map(voucher => ({
    ...voucher,
    issueDate: voucher.issueDate ? voucher.issueDate.toISOString().split('T')[0] : '',
    createdAt: voucher.createdAt ? voucher.createdAt.toISOString().split('T')[0] : '',
    updatedAt: voucher.updatedAt ? voucher.updatedAt.toISOString().split('T')[0] : '',
  }));

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'companyId', header: 'ID Empresa' },
    { key: 'supplierRuc', header: 'RUC Proveedor' },
    { key: 'invoiceNumber', header: 'Número Factura' },
    { key: 'amount', header: 'Monto (Sin IGV)' },
    { key: 'igv', header: 'IGV Calculado' },
    { key: 'total', header: 'Total Calculado' },
    { key: 'issueDate', header: 'Fecha Emisión' }, 
    { key: 'documentType', header: 'Tipo Documento' },
    { key: 'state', header: 'Estado Actual' },
    { key: 'createdAt', header: 'Fecha Creación' },
    { key: 'updatedAt', header: 'Última Actualización' },
  ];

  stringify(formattedVouchers, { header: true, columns: columns }, (err, output) => { 
    res.header('Content-Type', 'text/csv');
    res.attachment('vouchers.csv');
    res.send(output);
  });
}

  @Post('OPEN-IA') 
  async getAiResponse(@Body() aiQueryDto: AiQueryDto) {
    const response = await this.vouchersService.getQuetionsIA(aiQueryDto.question);
    return { response };
  }
}