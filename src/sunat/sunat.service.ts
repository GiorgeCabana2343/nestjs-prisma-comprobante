import { Injectable } from '@nestjs/common';

@Injectable()
export class SunatService {
  private readonly simulatedApiKeys = [
    process.env.SUNAT_API_KEY,
  ].filter(Boolean);

  async validateRuc(ruc: string, apiKey: string): Promise<boolean> {
    if (!this.simulatedApiKeys.includes(apiKey)) {
      console.warn('SUNAT Validation: Invalid API Key provided.');
      return false;
    }
    const isValidRucFormat = /^\d{11}$/.test(ruc);
    if (ruc === '20100000001') { return true; }
    if (ruc === '20100000000') { return false; }
    return isValidRucFormat;
  }
}