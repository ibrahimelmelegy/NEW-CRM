import DocBuilderDocument from './models/docBuilderModel';
import { renderWithTemplate } from './templateRenderer';
import DocumentTemplate from '../documentTemplate/documentTemplateModel';
import Setting from '../setting/settingModel';
import storageService from '../storage/storageService';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import type { BrandSettings } from './templateEngine';

class PdfService {
  /**
   * Generate a PDF buffer from raw HTML string.
   * Uses Puppeteer for rendering. Returns the raw Buffer (useful for streaming
   * directly as an HTTP response without storing to disk/cloud).
   * Falls back to returning the HTML as a Buffer if Puppeteer is unavailable.
   */
  public async generatePdfBuffer(html: string): Promise<{ buffer: Buffer; isPdf: boolean }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();
      return { buffer: Buffer.from(pdfBuffer), isPdf: true };
    } catch {
      // Fallback: return HTML buffer so caller can still send a file
      return { buffer: Buffer.from(html), isPdf: false };
    }
  }

  /**
   * Generate a PDF for a document.
   * Uses Puppeteer if available, otherwise generates an HTML file that can be printed to PDF.
   * Files are stored via storageService (local or DO Spaces).
   */
  public async generatePdf(documentId: string): Promise<string> {
    const document = await DocBuilderDocument.findByPk(documentId);
    if (!document) throw new BaseError(ERRORS.NOT_FOUND);

    let content: Record<string, unknown> = {};
    try {
      content = document.content ? JSON.parse(document.content) : {};
    } catch {
      content = {};
    }

    // Load template and brand settings
    let templateHtml: string | undefined;
    if (document.templateId) {
      const template = await DocumentTemplate.findByPk(document.templateId);
      if (template?.layout) {
        templateHtml = (template.layout as any).templateHtml;
      }
    }

    const settings = await Setting.findOne();
    const brand: BrandSettings = settings
      ? {
          companyName: settings.name || undefined,
          logo: settings.logo || undefined,
          primaryColor: settings.primaryColor || undefined,
          accentColor: settings.accentColor || undefined,
          fontFamily: settings.fontFamily || undefined,
          companyAddress: settings.companyAddress || undefined,
          companyPhone: settings.companyPhone || undefined,
          companyEmail: settings.email || undefined,
          companyTaxId: settings.companyTaxId || undefined,
          brandFooterText: settings.brandFooterText || undefined
        }
      : {};

    const html = renderWithTemplate(content, document.type, templateHtml, brand);

    try {
      // Try Puppeteer for proper PDF generation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();

      const key = `doc-builder/${documentId}/v${document.version}.pdf`;
      await storageService.upload(Buffer.from(pdfBuffer), key, 'application/pdf');

      const pdfUrl = storageService.getUrl(key);
      await document.update({ pdfUrl });

      return pdfUrl;
    } catch {
      // Fallback: save HTML file (can be opened in browser and printed to PDF)
      const key = `doc-builder/${documentId}/v${document.version}.html`;
      await storageService.upload(Buffer.from(html), key, 'text/html');

      const htmlUrl = storageService.getUrl(key);
      await document.update({ pdfUrl: htmlUrl });

      return htmlUrl;
    }
  }

  /**
   * Generate PDF from raw HTML content.
   */
  public async generatePdfFromHtml(html: string, filename: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();

      const key = `doc-builder/custom/${filename}.pdf`;
      await storageService.upload(Buffer.from(pdfBuffer), key, 'application/pdf');
      return storageService.getUrl(key);
    } catch {
      // Fallback: save HTML
      const key = `doc-builder/custom/${filename}.html`;
      await storageService.upload(Buffer.from(html), key, 'text/html');
      return storageService.getUrl(key);
    }
  }
}

export default new PdfService();
