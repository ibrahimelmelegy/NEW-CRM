import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

export interface OCRExtractedData {
  vendorName: string;
  totalAmount: number;
  items: Array<{ description: string; quantity: number; unitPrice: number; tax: number }>;
}

class OCRService {
  /**
   * Processes an image or PDF and extracts vendor name, items, and total amount.
   * For now, this is a placeholder structure that can be integrated with
   * Google Vision API or AWS Textract.
   */
  async extractPOData(_file: unknown): Promise<OCRExtractedData> {
    try {
      // Placeholder: Logic to send file to OCR provider would go here
      // For demonstration, we'll return a mock structure.

      return {
        vendorName: 'Mock Vendor',
        totalAmount: 1000.0,
        items: [
          { description: 'Item 1', quantity: 10, unitPrice: 50.0, tax: 15 },
          { description: 'Item 2', quantity: 5, unitPrice: 100.0, tax: 15 }
        ]
      };
    } catch (error) {
      throw new BaseError(ERRORS.FILE_ERROR);
    }
  }
}

export default new OCRService();
