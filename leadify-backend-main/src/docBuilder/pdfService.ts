import * as fs from 'fs';
import * as path from 'path';
import DocBuilderDocument from './models/docBuilderModel';
import { renderDocumentHtml } from './templateRenderer';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

class PdfService {
  private uploadDir = path.join(process.cwd(), 'public', 'uploads', 'doc-builder');

  /**
   * Generate a PDF for a document.
   * Uses Puppeteer if available, otherwise generates an HTML file that can be printed to PDF.
   */
  public async generatePdf(documentId: string): Promise<string> {
    const document = await DocBuilderDocument.findByPk(documentId);
    if (!document) throw new BaseError(ERRORS.NOT_FOUND);

    let content: any = {};
    try {
      content = document.content ? JSON.parse(document.content) : {};
    } catch {
      content = {};
    }

    const html = renderDocumentHtml(content, document.type);
    const dir = path.join(this.uploadDir, documentId);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      // Try Puppeteer for proper PDF generation
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(dir, `v${document.version}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();

      const pdfUrl = `/assets/doc-builder/${documentId}/v${document.version}.pdf`;
      await document.update({ pdfUrl });

      return pdfUrl;
    } catch {
      // Fallback: save HTML file (can be opened in browser and printed to PDF)
      const htmlPath = path.join(dir, `v${document.version}.html`);
      fs.writeFileSync(htmlPath, html);

      const htmlUrl = `/assets/doc-builder/${documentId}/v${document.version}.html`;
      await document.update({ pdfUrl: htmlUrl });

      return htmlUrl;
    }
  }

  /**
   * Generate PDF from raw HTML content.
   */
  public async generatePdfFromHtml(html: string, filename: string): Promise<string> {
    const dir = path.join(this.uploadDir, 'custom');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(dir, `${filename}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();
      return `/assets/doc-builder/custom/${filename}.pdf`;
    } catch {
      // Fallback: save HTML
      const htmlPath = path.join(dir, `${filename}.html`);
      fs.writeFileSync(htmlPath, html);
      return `/assets/doc-builder/custom/${filename}.html`;
    }
  }
}

export default new PdfService();
