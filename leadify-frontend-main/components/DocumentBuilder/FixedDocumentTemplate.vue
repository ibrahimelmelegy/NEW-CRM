<template>
  <div class="fixed-doc-template print:block">
    <!-- Single A4 Page -->
    <div class="page-container bg-white mx-auto print:shadow-none print:m-0"
         :style="{ width: '210mm', minHeight: '297mm', position: 'relative', boxSizing: 'border-box' }">

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TOP COLOR BAR -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="h-2 w-full" :style="{ background: `linear-gradient(90deg, ${color}, ${colorLight})` }"></div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- WATERMARK OVERLAY -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-if="watermarkText" class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
        <span 
          class="text-[120px] font-black uppercase tracking-[0.3em] select-none"
          :style="{ 
            color: watermarkColor,
            opacity: 0.06,
            transform: 'rotate(-35deg)',
            whiteSpace: 'nowrap'
          }"
        >{{ watermarkText }}</span>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- HEADER: Company Info + Document Badge -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="px-12 pt-8 pb-6">
        <div class="flex justify-between items-start">
          <!-- Company Block -->
          <div class="flex items-start gap-5">
            <img src="/images/Logo.png" class="h-14 w-auto object-contain" alt="Company Logo" />
            <div>
              <h2 class="text-lg font-bold text-gray-900 tracking-tight">{{ data.companyName || 'Your Company' }}</h2>
              <p class="text-xs text-gray-500 mt-0.5" v-if="data.companyAddress">{{ data.companyAddress }}</p>
              <p class="text-xs text-gray-500" v-if="data.companyPhone">{{ data.companyPhone }}</p>
              <p class="text-xs text-gray-500" v-if="data.companyTaxId">Tax ID: {{ data.companyTaxId }}</p>
            </div>
          </div>

          <!-- Document Type Badge -->
          <div class="text-right">
            <div class="inline-block px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest text-white mb-2" :style="{ backgroundColor: color }">
              {{ docLabel }}
            </div>
            <div class="space-y-1 mt-2">
              <p class="text-xs text-gray-500 font-mono">REF: <span class="font-bold text-gray-900">{{ data.refNumber }}</span></p>
              <p class="text-xs text-gray-500 font-mono">DATE: <span class="font-bold text-gray-900">{{ data.date }}</span></p>
              <p class="text-xs text-gray-500 font-mono" v-if="data.dueDate">DUE: <span class="font-bold text-red-600">{{ data.dueDate }}</span></p>
              <p class="text-xs text-gray-500 font-mono" v-else-if="data.validUntil">VALID: <span class="font-bold text-gray-900">{{ data.validUntil }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- CLIENT INFO BAR -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="mx-12 mb-6 bg-gray-50 rounded-xl border border-gray-100 p-5">
        <div class="grid grid-cols-2 gap-8">
          <!-- Bill To -->
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{{ billToLabel }}</p>
            <p class="text-base font-bold text-gray-900">{{ data.clientCompany || data.clientName }}</p>
            <p class="text-sm text-gray-600" v-if="data.clientCompany && data.clientName">{{ data.clientName }}</p>
            <p class="text-xs text-gray-500 mt-1" v-if="data.clientAddress">{{ data.clientAddress }}</p>
            <p class="text-xs text-gray-500" v-if="data.clientEmail">{{ data.clientEmail }}</p>
            <p class="text-xs text-gray-500" v-if="data.clientPhone">{{ data.clientPhone }}</p>
            <p class="text-xs text-gray-500" v-if="data.clientTaxId">Tax ID: {{ data.clientTaxId }}</p>
          </div>
          <!-- Document Title -->
          <div class="text-right flex flex-col justify-center">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subject</p>
            <p class="text-lg font-bold text-gray-900">{{ data.title }}</p>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ITEMS TABLE -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="mx-12 mb-6">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr :style="{ backgroundColor: color + '12' }">
              <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-wider rounded-tl-lg" :style="{ color }">
                #
              </th>
              <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" :style="{ color }">
                Description
              </th>
              <th class="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider" :style="{ color }">
                Qty
              </th>
              <th class="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider" :style="{ color }">
                Unit Price
              </th>
              <th class="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider rounded-tr-lg" :style="{ color }">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in data.items" :key="idx" 
                :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'"
                class="border-b border-gray-100">
              <td class="py-3 px-4 text-xs text-gray-400 font-mono">{{ String(idx + 1).padStart(2, '0') }}</td>
              <td class="py-3 px-4">
                <p class="text-sm font-semibold text-gray-800">{{ item.description }}</p>
                <p class="text-[10px] text-gray-400 mt-0.5" v-if="item.unit">{{ item.unit }}</p>
              </td>
              <td class="py-3 px-4 text-right text-sm text-gray-700">{{ item.quantity }}</td>
              <td class="py-3 px-4 text-right text-sm text-gray-700">{{ formatNumber(item.rate) }}</td>
              <td class="py-3 px-4 text-right text-sm font-bold text-gray-900">{{ formatNumber(item.quantity * item.rate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- TOTALS BLOCK -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="mx-12 mb-6 flex justify-end">
        <div class="w-72 border border-gray-200 rounded-xl overflow-hidden">
          <div class="flex justify-between px-5 py-2.5 border-b border-gray-100">
            <span class="text-xs text-gray-500">Subtotal</span>
            <span class="text-sm font-semibold text-gray-800">{{ formatNumber(subtotal) }} {{ data.currency }}</span>
          </div>
          <div v-if="discountAmount > 0" class="flex justify-between px-5 py-2.5 border-b border-gray-100">
            <span class="text-xs text-green-600">Discount</span>
            <span class="text-sm font-semibold text-green-600">- {{ formatNumber(discountAmount) }} {{ data.currency }}</span>
          </div>
          <div class="flex justify-between px-5 py-2.5 border-b border-gray-100">
            <span class="text-xs text-gray-500">VAT ({{ data.taxRate || 0 }}%)</span>
            <span class="text-sm font-semibold text-gray-800">{{ formatNumber(taxAmount) }} {{ data.currency }}</span>
          </div>
          <div class="flex justify-between px-5 py-3.5" :style="{ backgroundColor: color + '08' }">
            <span class="text-sm font-bold text-gray-900">Total Due</span>
            <span class="text-lg font-black" :style="{ color }">{{ formatNumber(finalTotal) }} {{ data.currency }}</span>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- AMOUNT IN WORDS -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="mx-12 mb-6">
        <div class="bg-gray-50 rounded-lg px-5 py-3 border border-gray-100">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount in Words</p>
          <p class="text-xs font-semibold text-gray-700 italic">{{ amountInWords }}</p>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- BANK DETAILS (Invoices Only) -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-if="isInvoiceType && hasBankDetails" class="mx-12 mb-6">
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <p class="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">Payment Details</p>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div v-if="data.bankName"><span class="text-blue-500">Bank:</span> <span class="font-bold text-gray-800">{{ data.bankName }}</span></div>
            <div v-if="data.bankAccountName"><span class="text-blue-500">Account:</span> <span class="font-bold text-gray-800">{{ data.bankAccountName }}</span></div>
            <div v-if="data.bankIban"><span class="text-blue-500">IBAN:</span> <span class="font-bold text-gray-800 font-mono">{{ data.bankIban }}</span></div>
            <div v-if="data.bankSwift"><span class="text-blue-500">SWIFT:</span> <span class="font-bold text-gray-800 font-mono">{{ data.bankSwift }}</span></div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- NOTES -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div v-if="data.notes || data.termsAndConditions || data.paymentTerms" class="mx-12 mb-6">
        <div class="border-t border-gray-100 pt-4 space-y-3">
          <div v-if="data.notes">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
            <p class="text-xs text-gray-600 leading-relaxed">{{ data.notes }}</p>
          </div>
          <div v-if="data.termsAndConditions">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
            <div class="text-xs text-gray-600 leading-relaxed" v-html="data.termsAndConditions"></div>
          </div>
          <div v-if="data.paymentTerms">
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Terms</p>
            <div class="text-xs text-gray-600 leading-relaxed" v-html="data.paymentTerms"></div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- SIGNATURE BLOCK -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="mx-12 mb-8 mt-auto">
        <div class="grid grid-cols-2 gap-12 border-t-2 border-gray-200 pt-6">
          <!-- Authorized Signatory -->
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Authorized Signature</p>
            <div class="border-b-2 border-gray-300 mb-2 h-12"></div>
            <div class="flex justify-between text-[10px] text-gray-400">
              <span>Name: _______________</span>
              <span>Date: _______________</span>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <div class="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <span class="text-[8px] text-gray-300 uppercase tracking-wider">Stamp</span>
              </div>
            </div>
          </div>
          <!-- Client Acceptance -->
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">{{ clientSignatureLabel }}</p>
            <div class="border-b-2 border-gray-300 mb-2 h-12"></div>
            <div class="flex justify-between text-[10px] text-gray-400">
              <span>Name: _______________</span>
              <span>Date: _______________</span>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <div class="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                <span class="text-[8px] text-gray-300 uppercase tracking-wider">Stamp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- FOOTER -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="absolute bottom-0 left-0 right-0 px-12 pb-4">
        <div class="border-t border-gray-100 pt-3 flex justify-between items-end">
          <div>
            <p class="text-[8px] text-gray-300 font-bold uppercase tracking-widest">{{ footerText }}</p>
            <p class="text-[7px] text-gray-300 mt-0.5">Generated {{ currentDate }}</p>
          </div>
          <div class="text-[9px] font-mono text-gray-300">
            {{ data.refNumber }}
          </div>
        </div>
        <div class="h-1.5 w-full mt-2 rounded-full" :style="{ background: `linear-gradient(90deg, ${color}, ${colorLight})` }"></div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProposalData } from './types';
import { numberToWords } from './numberToWords';

const props = defineProps<{
  data: ProposalData;
}>();

const color = computed(() => props.data?.themeColor || '#7c3aed');
const colorLight = computed(() => {
  // Lighten the color for gradient
  const hex = color.value.replace('#', '');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 60);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 60);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 60);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
});

const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Document type labels ──────────────────────────────
const docTypeConfig: Record<string, { label: string; footer: string; billTo: string; clientSig: string }> = {
  invoice:       { label: 'INVOICE',                 footer: 'Invoice · Payment Due Within Terms',          billTo: 'Bill To',     clientSig: 'Client Acknowledgement'  },
  proforma_invoice: { label: 'PROFORMA INVOICE',     footer: 'Proforma Invoice · Not a Tax Invoice',        billTo: 'Bill To',     clientSig: 'Client Acknowledgement'  },
  purchase_order:{ label: 'PURCHASE ORDER',          footer: 'Purchase Order · Subject to Terms',           billTo: 'Vendor',      clientSig: 'Vendor Acceptance'        },
  credit_note:   { label: 'CREDIT NOTE',             footer: 'Credit Note · Applied to Account',            billTo: 'Issued To',   clientSig: 'Client Acknowledgement'  },
  quote:         { label: 'QUOTATION',               footer: 'Quotation · Valid Until Expiry Date',         billTo: 'Quoted To',   clientSig: 'Client Acceptance'       },
  rfq:           { label: 'REQUEST FOR QUOTATION',   footer: 'RFQ · Awaiting Vendor Response',              billTo: 'Requested From', clientSig: 'Vendor Response'      },
  sales_order:   { label: 'SALES ORDER',             footer: 'Sales Order · Confirmed',                     billTo: 'Ship To',     clientSig: 'Client Confirmation'     },
  delivery_note: { label: 'DELIVERY NOTE',           footer: 'Delivery Note · Goods Dispatched',            billTo: 'Deliver To',  clientSig: 'Received By'             },
  contract:      { label: 'CONTRACT',                footer: 'Contract · Legally Binding Agreement',        billTo: 'Party B',     clientSig: 'Party B Signature'       },
  sla:           { label: 'SLA',                     footer: 'Service Level Agreement · Binding Terms',     billTo: 'Service Recipient', clientSig: 'Recipient Signature' },
  proposal:      { label: 'PROPOSAL',                footer: 'Proposal · Confidential',                     billTo: 'Prepared For', clientSig: 'Client Signature'       }
};

const defaultConfig = { label: 'DOCUMENT', footer: 'Document', billTo: 'To', clientSig: 'Client Signature' };
const config = computed(() => docTypeConfig[props.data?.documentType] ?? defaultConfig);
const docLabel = computed(() => config.value.label);
const footerText = computed(() => config.value.footer);
const billToLabel = computed(() => config.value.billTo);
const clientSignatureLabel = computed(() => config.value.clientSig);

const isInvoiceType = computed(() => ['invoice', 'proforma_invoice', 'credit_note'].includes(props.data?.documentType));
const hasBankDetails = computed(() => props.data?.bankName || props.data?.bankIban);

// ── Watermark ─────────────────────────────────────────
const watermarkText = computed(() => {
  const status = props.data?.status;
  if (status === 'Draft') return 'DRAFT';
  if (status === 'Approved') return 'PAID';
  if (status === 'Rejected') return 'CANCELLED';
  return '';
});
const watermarkColor = computed(() => {
  const status = props.data?.status;
  if (status === 'Approved') return '#22c55e';
  if (status === 'Rejected') return '#ef4444';
  return '#6b7280';
});

// ── Financial calculations ────────────────────────────
const subtotal = computed(() => {
  return props.data?.items?.reduce((sum, item) => sum + (item.quantity * item.rate), 0) || 0;
});

const discountAmount = computed(() => {
  if (props.data?.discountType === 'percent') {
    return subtotal.value * ((props.data?.discount || 0) / 100);
  }
  return props.data?.discount || 0;
});

const taxableAmount = computed(() => subtotal.value - discountAmount.value);
const taxAmount = computed(() => taxableAmount.value * ((props.data?.taxRate || 0) / 100));
const finalTotal = computed(() => taxableAmount.value + taxAmount.value);
const amountInWords = computed(() => numberToWords(finalTotal.value, props.data?.currency || 'SAR'));

function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style>
@page {
  size: A4;
  margin: 0 !important;
}

@media print {
  .fixed-doc-template .page-container {
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    position: relative !important;
    overflow: hidden !important;
    background-color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
