import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SunatService } from '../sunat/sunat.service';
import { Voucher, ReceiptState } from '@prisma/client';
import { CreateVoucherDto } from 'src/dto/create-voucher.dto';
import { UpdateVoucherStatusDto } from 'src/dto/update-voucher-status.dto';
import { FilterVoucherDto } from 'src/dto/filter-voucher.dto';
import OpenAI from 'openai';


@Injectable()
export class VoucherService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private sunatService: SunatService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

  }

  async createVoucher(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const { amount, supplierRuc, companyId, invoiceNumber, issueDate, documentType } = createVoucherDto;

    const parsedIssueDate = new Date(issueDate);
    const sunatApiKey = process.env.SUNAT_API_KEY || '';
    const isRucValid = await this.sunatService.validateRuc(supplierRuc, sunatApiKey);

    let state: ReceiptState = ReceiptState.pending;
    if (!isRucValid) {
      state = ReceiptState.rejected;
    }

    const igv = parseFloat((amount * 0.18).toFixed(2));
    const total = parseFloat((amount * 1.18).toFixed(2));

    return this.prisma.voucher.create({
      data: {
        companyId,
        supplierRuc,
        invoiceNumber,
        amount,
        issueDate: parsedIssueDate,
        documentType,
        igv,
        total,
        state,
      },
    });
  }

  async updateVoucherStatus(id: number, updateVoucherStatusDto: UpdateVoucherStatusDto): Promise<Voucher> {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });

    if (!voucher) {
      throw new BadRequestException(`Voucher con ID ${id} no encontrado.`);
    }

    return this.prisma.voucher.update({
      where: { id },
      data: {
        state: updateVoucherStatusDto.state,
      },
    });
  }

  async findAll(filters: FilterVoucherDto) {
    const page = parseInt(filters.page || '1', 10);
    const limit = parseInt(filters.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.startDate) {
      where.issueDate = { ...where.issueDate, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      const endDateObj = new Date(filters.endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      where.issueDate = { ...where.issueDate, lt: endDateObj };
    }
    if (filters.endDate && !filters.startDate) {
      where.issueDate = { lte: new Date(filters.endDate) };
    }

    if (filters.documentType) {
      where.documentType = { equals: filters.documentType, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = filters.state;
    }

    const [vouchers, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        where,
        skip,
        take: limit
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      data: vouchers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getQuetionsIA(question: string): Promise<string> {

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente experto en análisis de datos de vouchers.
            Tu tarea es identificar la intención de la pregunta del usuario sobre Vouchers y, si es sobre datos numéricos o de conteo, intentar extraer el estado (pending, validated, rejected, observed) y el mes (ej. mayo, junio).
            Si la pregunta es sobre "total de facturas", identifica el documentType como "FACTURA".
            Si no puedes identificar la intención o los parámetros, responde con un formato JSON indicando "unrecognized".
            Si puedes identificarlo, responde en formato JSON con la siguiente estructura:
            { "intent": "get_total_vouchers_by_state_and_month" | "get_count_vouchers_by_state" | "get_total_vouchers_by_type" | "unrecognized" | "general_greeting", "state": "pending" | "validated" | "rejected" | "observed" | null, "month": "enero" | "febrero" | ... | "diciembre" | null, "documentType": "FACTURA" | "BOLETA" | null, "message": "Tu respuesta de saludo si la intención es general_greeting" }
            No incluyas texto adicional fuera del JSON. Si la pregunta es solo un saludo, el intent es "general_greeting".`,
          },
          { role: 'user', content: question },
        ],
        response_format: { type: "json_object" },
      });

      const aiResponseContent = completion.choices[0].message.content;
      let aiIntent: any;

      try {
        aiIntent = JSON.parse(aiResponseContent);
      } catch (e) {
        console.log('Error en la respuesta JSON de OpenAI (posiblemente no JSON válido o problema interno):', e, aiResponseContent);
        const backResponse = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `El usuario preguntó: "${question}". No pudo reponder tu respuesta anterior , solo repsonde a preguntas de voucher` }],
        });
        return backResponse.choices[0].message.content || 'Hubo un problema al entender la respuesta de la IA. Intenta reformular tu pregunta.';
      }

      let responseMessage = 'No pude encontrar datos para esa pregunta o la pregunta no es clara.';

      if (aiIntent.intent === 'get_total_vouchers_by_state_and_month' && aiIntent.state && aiIntent.month) {
        const monthMap: { [key: string]: number } = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
          'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        const monthIndex = monthMap[aiIntent.month.toLowerCase()];

        if (monthIndex === undefined) {
          return `No puedo procesar el mes "${aiIntent.month}".`;
        }

        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, monthIndex, 1);
        const endDate = new Date(currentYear, monthIndex + 1, 0);

        const vouchers = await this.prisma.voucher.findMany({
          where: {
            state: aiIntent.state as ReceiptState,
            issueDate: { gte: startDate, lte: endDate },
          },
        });
        const totalAmount = vouchers.reduce((sum, v) => sum + v.total, 0);
        const count = vouchers.length;
        responseMessage = `El total de vouchers ${aiIntent.state} en ${aiIntent.month} es de ${totalAmount.toFixed(2)} y hay ${count} vouchers.`;

      } else if (aiIntent.intent === 'get_count_vouchers_by_state' && aiIntent.state) {
        const count = await this.prisma.voucher.count({
          where: { state: aiIntent.state as ReceiptState },
        });

        responseMessage = `Actualmente hay ${count} vouchers con estado ${aiIntent.state}.`;

      } else if (aiIntent.intent === 'get_total_vouchers_by_type' && aiIntent.documentType) {
        const vouchers = await this.prisma.voucher.findMany({
          where: {
            documentType: {
              equals: aiIntent.documentType,
              mode: 'insensitive',
            },
          },
        });
        const totalAmount = vouchers.reduce((sum, v) => sum + v.total, 0);
        const count = vouchers.length;
        responseMessage = `El total acumulado de ${aiIntent.documentType} es de ${totalAmount.toFixed(2)} y hay ${count} ${aiIntent.documentType} registrados.`;

      } else if (aiIntent.intent === 'general_greeting' && aiIntent.message) {
        responseMessage = aiIntent.message;
      } else if (aiIntent.intent === 'unrecognized') {
        responseMessage = 'Lo siento, no pude entender la intención de tu pregunta sobre vouchers. Por favor, sé más específico sobre qué datos quieres analizar.';
      } else {
        responseMessage = 'La IA pudo extraer una intención, pero no los parámetros necesarios. Por favor, intenta de nuevo con más detalles.';
      }

      return responseMessage;

    } catch (error) {
      console.error('Error al comunicarse con la API de OpenAI:', error);
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          return 'Error de autenticación con OpenAI. Verifica tu API Key.';
        }
        if (error.status === 429) {
          return 'Demasiadas solicitudes a OpenAI. Por favor, espera y reintenta más tarde.';
        }
        if (error.status === 400 && error.message.includes('json_object')) {
          return 'Error de formato JSON solicitado a OpenAI. Revisa el prompt del sistema o la API Key.';
        }
        return `Error de la API de OpenAI (${error.status || 'desconocido'}): ${error.message}`;
      }
      return 'Hubo un error inesperado al procesar tu solicitud con la IA. Por favor, inténtalo de nuevo más tarde.';
    }
  }
}