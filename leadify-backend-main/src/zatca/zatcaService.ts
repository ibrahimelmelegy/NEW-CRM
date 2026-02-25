import { createHash } from 'crypto';
import { Op } from 'sequelize';
import ZatcaInvoice, { ZatcaAddress, ZatcaLineItem } from './zatcaModel';
import { clampPagination } from '../utils/pagination';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateZatcaInvoiceData {
  invoiceId: string;
  invoiceType: 'STANDARD' | 'SIMPLIFIED' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
  invoiceNumber: string;
  issueDate: string;
  supplyDate?: string;
  sellerName: string;
  sellerVatNumber: string;
  sellerAddress: ZatcaAddress;
  buyerName: string;
  buyerVatNumber?: string;
  buyerAddress?: ZatcaAddress;
  lineItems: ZatcaLineItem[];
  previousInvoiceHash?: string;
}

export interface ZatcaInvoiceQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

// ---------------------------------------------------------------------------
// TLV Encoding helpers (ZATCA QR Code spec)
// Tag-Length-Value per ZATCA e-invoicing standard
// Tag 1: Seller Name (UTF-8)
// Tag 2: VAT Registration Number (ASCII)
// Tag 3: Invoice Timestamp (ISO 8601)
// Tag 4: Invoice Total (with VAT)
// Tag 5: VAT Total
// ---------------------------------------------------------------------------

/**
 * Encode a single TLV entry.
 * @param tag  Tag number (1-5)
 * @param value String value to encode
 * @returns Buffer containing [tag, length, ...value bytes]
 */
function tlvEncode(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, 'utf-8');
  const length = valueBytes.length;
  return Buffer.concat([Buffer.from([tag]), Buffer.from([length]), valueBytes]);
}

/**
 * Generate a ZATCA-compliant QR code payload in Base64.
 * Encodes TLV fields 1-5 per the ZATCA e-invoicing specification.
 */
function generateQRCode(invoice: ZatcaInvoice): string {
  const timestamp = new Date(invoice.issueDate).toISOString();
  const totalWithVat = Number(invoice.totalAmount).toFixed(2);
  const vatTotal = Number(invoice.totalVat).toFixed(2);

  const tlvData = Buffer.concat([
    tlvEncode(1, invoice.sellerName),
    tlvEncode(2, invoice.sellerVatNumber),
    tlvEncode(3, timestamp),
    tlvEncode(4, totalWithVat),
    tlvEncode(5, vatTotal)
  ]);

  return tlvData.toString('base64');
}

// ---------------------------------------------------------------------------
// UBL 2.1 XML Generation (ZATCA-compliant)
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function formatAddress(address: ZatcaAddress, tagName: string): string {
  return `
      <cac:${tagName}>
        <cac:PostalAddress>
          <cbc:StreetName>${escapeXml(address.street)}</cbc:StreetName>
          <cbc:BuildingNumber>${escapeXml(address.buildingNumber)}</cbc:BuildingNumber>
          <cbc:CityName>${escapeXml(address.city)}</cbc:CityName>
          <cbc:PostalZone>${escapeXml(address.postalCode)}</cbc:PostalZone>
          <cbc:CountrySubentity>${escapeXml(address.district)}</cbc:CountrySubentity>
          <cac:Country>
            <cbc:IdentificationCode>${escapeXml(address.country)}</cbc:IdentificationCode>
          </cac:Country>
        </cac:PostalAddress>
      </cac:${tagName}>`;
}

function generateLineItemXml(item: ZatcaLineItem, index: number): string {
  return `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${item.lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${item.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="SAR">${(item.lineTotal - item.discount).toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="SAR">${item.taxAmount.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID>${escapeXml(item.taxCategory)}</cbc:ID>
            <cbc:Percent>${item.taxRate}</cbc:Percent>
            <cac:TaxScheme>
              <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(item.description)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="SAR">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
        <cac:AllowanceCharge>
          <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
          <cbc:Amount currencyID="SAR">${item.discount.toFixed(2)}</cbc:Amount>
        </cac:AllowanceCharge>
      </cac:Price>
    </cac:InvoiceLine>`;
}

/**
 * Generate UBL 2.1 XML document per ZATCA e-invoicing specification.
 */
function generateInvoiceXML(invoice: ZatcaInvoice): string {
  const invoiceTypeCode =
    invoice.invoiceType === 'STANDARD' || invoice.invoiceType === 'SIMPLIFIED' ? '388' : invoice.invoiceType === 'DEBIT_NOTE' ? '383' : '381'; // CREDIT_NOTE

  // Sub-type: 01 = Standard tax invoice, 02 = Simplified tax invoice
  const invoiceSubType = invoice.invoiceType === 'SIMPLIFIED' ? '0200000' : '0100000';

  const lineItemsXml = (invoice.lineItems || []).map((item, idx) => generateLineItemXml(item, idx)).join('\n');

  const sellerAddr = typeof invoice.sellerAddress === 'string' ? JSON.parse(invoice.sellerAddress) : invoice.sellerAddress;

  const buyerAddr = invoice.buyerAddress
    ? typeof invoice.buyerAddress === 'string'
      ? JSON.parse(invoice.buyerAddress as any)
      : invoice.buyerAddress
    : null;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${invoice.uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>00:00:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceSubType}">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  ${
    invoice.previousInvoiceHash
      ? `<cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoice.previousInvoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>`
      : ''
  }
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoice.qrCode || ''}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(invoice.sellerVatNumber)}</cbc:ID>
      </cac:PartyIdentification>
      ${formatAddress(sellerAddr, 'PostalAddress')}
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoice.sellerVatNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.sellerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${
        invoice.buyerVatNumber
          ? `<cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${escapeXml(invoice.buyerVatNumber)}</cbc:ID>
      </cac:PartyIdentification>`
          : ''
      }
      ${buyerAddr ? formatAddress(buyerAddr, 'PostalAddress') : ''}
      ${
        invoice.buyerVatNumber
          ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoice.buyerVatNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ''
      }
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.buyerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>${
    invoice.supplyDate
      ? `
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${invoice.supplyDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>`
      : ''
  }
  <cac:AllowanceCharge>
    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
    <cbc:Amount currencyID="SAR">${Number(invoice.totalDiscount).toFixed(2)}</cbc:Amount>
    <cac:TaxCategory>
      <cbc:ID>S</cbc:ID>
      <cbc:Percent>15</cbc:Percent>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:TaxCategory>
  </cac:AllowanceCharge>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${Number(invoice.totalVat).toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${Number(invoice.subtotal).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${Number(invoice.totalTaxableAmount).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${Number(invoice.totalAmount).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="SAR">${Number(invoice.totalDiscount).toFixed(2)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="SAR">${Number(invoice.totalAmount).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lineItemsXml}
</Invoice>`;

  return xml;
}

/**
 * Compute SHA-256 hash of XML content (Base64-encoded).
 */
function calculateInvoiceHash(xmlContent: string): string {
  return createHash('sha256').update(xmlContent, 'utf-8').digest('base64');
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateInvoice(data: Partial<CreateZatcaInvoiceData>): ValidationResult {
  const errors: string[] = [];

  if (!data.invoiceNumber) errors.push('Invoice number is required');
  if (!data.invoiceType) errors.push('Invoice type is required');
  if (!data.issueDate) errors.push('Issue date is required');
  if (!data.sellerName) errors.push('Seller name is required');

  // Validate seller VAT number (15 digits starting with 3, ending with 3 per ZATCA)
  if (!data.sellerVatNumber) {
    errors.push('Seller VAT number is required');
  } else if (!/^3\d{13}3$/.test(data.sellerVatNumber)) {
    errors.push('Seller VAT number must be 15 digits, starting and ending with 3');
  }

  if (!data.sellerAddress) {
    errors.push('Seller address is required');
  } else {
    const addr = data.sellerAddress;
    if (!addr.street) errors.push('Seller street is required');
    if (!addr.city) errors.push('Seller city is required');
    if (!addr.district) errors.push('Seller district is required');
    if (!addr.postalCode) errors.push('Seller postal code is required');
    if (!addr.country) errors.push('Seller country is required');
    if (!addr.buildingNumber) errors.push('Seller building number is required');
  }

  if (!data.buyerName) errors.push('Buyer name is required');

  // Standard invoices (B2B) require buyer VAT number
  if (data.invoiceType === 'STANDARD' && !data.buyerVatNumber) {
    errors.push('Buyer VAT number is required for standard (B2B) invoices');
  }

  if (!data.lineItems || data.lineItems.length === 0) {
    errors.push('At least one line item is required');
  } else {
    data.lineItems.forEach((item, idx) => {
      if (!item.description) errors.push(`Line item ${idx + 1}: description is required`);
      if (item.quantity == null || item.quantity <= 0) errors.push(`Line item ${idx + 1}: quantity must be positive`);
      if (item.unitPrice == null || item.unitPrice < 0) errors.push(`Line item ${idx + 1}: unit price must be non-negative`);
      if (item.taxRate == null || item.taxRate < 0) errors.push(`Line item ${idx + 1}: tax rate must be non-negative`);
    });
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ZatcaService {
  /**
   * Calculate totals from line items and build a complete ZATCA e-invoice.
   */
  async createZatcaInvoice(data: CreateZatcaInvoiceData): Promise<ZatcaInvoice> {
    // Validate first
    const validation = validateInvoice(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate totals from line items
    let subtotal = 0;
    let totalDiscount = 0;
    let totalVat = 0;

    const lineItems: ZatcaLineItem[] = data.lineItems.map(item => {
      const lineGross = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const lineNet = lineGross - discount;
      const taxAmount = Math.round(lineNet * (item.taxRate / 100) * 100) / 100;
      const lineTotal = lineGross;

      subtotal += lineGross;
      totalDiscount += discount;
      totalVat += taxAmount;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        taxCategory: item.taxCategory || 'S',
        taxRate: item.taxRate,
        taxAmount,
        lineTotal
      };
    });

    const totalTaxableAmount = subtotal - totalDiscount;
    const totalAmount = totalTaxableAmount + totalVat;

    // Round to 2 decimal places
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    const roundedDiscount = Math.round(totalDiscount * 100) / 100;
    const roundedTaxable = Math.round(totalTaxableAmount * 100) / 100;
    const roundedVat = Math.round(totalVat * 100) / 100;
    const roundedTotal = Math.round(totalAmount * 100) / 100;

    // Create the record first (to get the UUID)
    const invoice = await ZatcaInvoice.create({
      invoiceId: data.invoiceId,
      invoiceType: data.invoiceType,
      invoiceNumber: data.invoiceNumber,
      issueDate: data.issueDate,
      supplyDate: data.supplyDate || null,
      sellerName: data.sellerName,
      sellerVatNumber: data.sellerVatNumber,
      sellerAddress: data.sellerAddress,
      buyerName: data.buyerName,
      buyerVatNumber: data.buyerVatNumber || null,
      buyerAddress: data.buyerAddress || null,
      lineItems,
      subtotal: roundedSubtotal,
      totalDiscount: roundedDiscount,
      totalTaxableAmount: roundedTaxable,
      totalVat: roundedVat,
      totalAmount: roundedTotal,
      previousInvoiceHash: data.previousInvoiceHash || null,
      status: 'DRAFT'
    });

    // Generate QR code (TLV encoded, Base64)
    const qrCode = generateQRCode(invoice);

    // Generate UBL 2.1 XML
    invoice.qrCode = qrCode;
    const xmlContent = generateInvoiceXML(invoice);

    // Calculate invoice hash (SHA-256 of the XML)
    const invoiceHash = calculateInvoiceHash(xmlContent);

    // Update the record with generated fields
    await invoice.update({
      qrCode,
      xmlContent,
      invoiceHash
    });

    return invoice.reload();
  }

  /**
   * Submit invoice to ZATCA API (Phase 2 integration-ready).
   * Currently returns a mock success response; replace with actual API call.
   */
  async submitToZatca(invoiceId: number): Promise<ZatcaInvoice> {
    const invoice = await ZatcaInvoice.findByPk(invoiceId);
    if (!invoice) throw new Error('ZATCA invoice not found');

    if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED') {
      throw new Error(`Cannot submit invoice with status: ${invoice.status}`);
    }

    if (!invoice.xmlContent) {
      throw new Error('Invoice XML has not been generated');
    }

    // Mark as PENDING while submitting
    await invoice.update({ status: 'PENDING', submittedAt: new Date() });

    // --- ZATCA API Integration Point ---
    // In production, this would call the ZATCA Fatoora portal API:
    //   POST https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single
    //   or /invoices/clearance/single for standard invoices
    //
    // Headers:
    //   Authorization: Basic <base64(certificate:secret)>
    //   Content-Type: application/json
    //   Accept-Language: en
    //
    // Body: { invoiceHash, uuid, invoice (Base64 XML) }

    // Mock response for development - simulates ZATCA clearance
    const isSimplified = invoice.invoiceType === 'SIMPLIFIED';
    const mockResponse = {
      reportingStatus: isSimplified ? 'REPORTED' : 'CLEARED',
      clearanceStatus: isSimplified ? null : 'CLEARED',
      validationResults: {
        status: 'PASS',
        infoMessages: [{ type: 'INFO', code: 'XSD_VALID', message: 'Compliant with UBL 2.1 schema' }],
        warningMessages: [],
        errorMessages: []
      },
      clearedInvoice: isSimplified ? null : invoice.xmlContent,
      qrSellertStatus: 'VALID',
      timestamp: new Date().toISOString()
    };

    const newStatus = isSimplified ? 'REPORTED' : 'CLEARED';

    await invoice.update({
      status: newStatus,
      zatcaResponse: mockResponse
    });

    return invoice.reload();
  }

  /**
   * Get a single ZATCA invoice by ID.
   */
  async getZatcaInvoice(id: number): Promise<ZatcaInvoice> {
    const invoice = await ZatcaInvoice.findByPk(id);
    if (!invoice) throw new Error('ZATCA invoice not found');
    return invoice;
  }

  /**
   * List ZATCA invoices with pagination and filtering.
   */
  async getZatcaInvoices(query: ZatcaInvoiceQuery) {
    const { page, limit, offset } = clampPagination(query, 20);
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where[Op.or as any] = [
        { invoiceNumber: { [Op.iLike]: `%${query.search}%` } },
        { buyerName: { [Op.iLike]: `%${query.search}%` } },
        { sellerVatNumber: { [Op.iLike]: `%${query.search}%` } }
      ];
    }

    if (query.fromDate || query.toDate) {
      where.issueDate = {};
      if (query.fromDate) where.issueDate[Op.gte] = query.fromDate;
      if (query.toDate) where.issueDate[Op.lte] = query.toDate;
    }

    const { rows, count } = await ZatcaInvoice.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['xmlContent'] } // Exclude large XML from list
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Validate invoice data without persisting.
   */
  validateInvoiceData(data: Partial<CreateZatcaInvoiceData>): ValidationResult {
    return validateInvoice(data);
  }

  /**
   * Get the QR code for a specific invoice.
   */
  async getQRCode(id: number): Promise<{ qrCode: string; invoiceNumber: string }> {
    const invoice = await ZatcaInvoice.findByPk(id, {
      attributes: ['id', 'qrCode', 'invoiceNumber']
    });
    if (!invoice) throw new Error('ZATCA invoice not found');
    if (!invoice.qrCode) throw new Error('QR code has not been generated for this invoice');
    return { qrCode: invoice.qrCode, invoiceNumber: invoice.invoiceNumber };
  }

  /**
   * Get the XML content for a specific invoice.
   */
  async getXML(id: number): Promise<{ xml: string; invoiceNumber: string }> {
    const invoice = await ZatcaInvoice.findByPk(id, {
      attributes: ['id', 'xmlContent', 'invoiceNumber']
    });
    if (!invoice) throw new Error('ZATCA invoice not found');
    if (!invoice.xmlContent) throw new Error('XML has not been generated for this invoice');
    return { xml: invoice.xmlContent, invoiceNumber: invoice.invoiceNumber };
  }
}

export default new ZatcaService();
