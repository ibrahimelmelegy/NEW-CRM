<script setup lang="ts">
import { computed } from 'vue';
import { FileText, CheckCircle, Clock, Hexagon } from 'lucide-vue-next';

// ─── Types ───────────────────────────────────────────────────────────

interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  cost: number;
  margin: number;
  rate: number;
}

interface ProposalPhase {
  id: number;
  name: string;
  duration: string;
  deliverables: string;
}

interface CustomSection {
  id: string;
  title: string;
  content: string;
}

interface ProposalData {
  id: number;
  refNumber: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  date: string;
  validUntil: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Sent' | 'Rejected' | 'Archived';
  type?: 'FINANCIAL' | 'TECHNICAL' | 'MIXED';
  themeColor: string;
  coverStyle: string;
  font: 'sans' | 'serif' | 'mono';
  logo?: string;
  clientLogo?: string;
  stepOrder: string[];
  stepLabels: {
    branding: string;
    executive: string;
    solution: string;
    financial: string;
    legal: string;
  };
  introduction: string;
  objectives: string;
  scopeOfWork: string;
  methodology: string;
  phases: ProposalPhase[];
  customSections: CustomSection[];
  currency: string;
  items: ProposalItem[];
  taxRate: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  paymentTerms: string;
  termsAndConditions: string;
  version: number;
  lastModified: string;
  approvedBy?: string;
}

// ─── Props ───────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    formData: ProposalData;
    themeColor?: string;
  }>(),
  {
    themeColor: '#7c3aed'
  }
);

// ─── Computed ────────────────────────────────────────────────────────

const color = computed(() => props.formData.themeColor || props.themeColor);

const fontClass = computed(() => {
  if (props.formData.font === 'serif') return 'font-serif';
  if (props.formData.font === 'mono') return 'font-mono';
  return 'font-sans';
});

const typeInfo = computed(() => {
  const t = props.formData.type || 'MIXED';
  if (t === 'FINANCIAL') return { label: 'Financial', fullLabel: 'Financial Proposal', color: 'emerald' };
  if (t === 'TECHNICAL') return { label: 'Technical', fullLabel: 'Technical Proposal', color: 'blue' };
  return { label: 'Mixed', fullLabel: 'Comprehensive Proposal', color: 'violet' };
});

const defaultLabels: Record<string, string> = {
  branding: 'Branding & Details',
  executive: 'Executive Summary',
  solution: 'Solution & Scope',
  financial: 'Investment',
  legal: 'Terms & Legal'
};

const labels = computed(() => ({
  ...defaultLabels,
  ...props.formData.stepLabels
}));

/** Steps that produce content pages (everything except branding) */
const contentSteps = computed(() =>
  (props.formData.stepOrder || ['executive', 'solution', 'financial', 'legal']).filter((id: string) => id !== 'branding')
);

// ─── Financial Calculations ──────────────────────────────────────────

const subtotal = computed(() => props.formData.items?.reduce((sum, item) => sum + item.quantity * item.rate, 0) || 0);

const discountAmount = computed(() =>
  props.formData.discountType === 'percent' ? subtotal.value * ((props.formData.discount || 0) / 100) : props.formData.discount || 0
);

const taxableAmount = computed(() => subtotal.value - discountAmount.value);

const tax = computed(() => taxableAmount.value * ((props.formData.taxRate || 0) / 100));

const total = computed(() => taxableAmount.value + tax.value);

// ─── Helpers ─────────────────────────────────────────────────────────

const refIdShort = computed(() => props.formData.refNumber?.split('-').pop() || '');

const currentDate = computed(() => new Date().toLocaleDateString());

function getTocTitle(id: string): string {
  if (defaultLabels[id]) return defaultLabels[id];
  const custom = props.formData.customSections?.find(s => s.id === id);
  return custom ? custom.title : id;
}

function getCustomSection(id: string): CustomSection | undefined {
  return props.formData.customSections?.find(s => s.id === id);
}

function handleImgError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.style.display = 'none';
}

// ─── Print Styles ────────────────────────────────────────────────────

const printStyles = computed(
  () => `
  @page {
    size: A4;
    margin: 0 !important;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 297mm !important;
      width: 210mm !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      height: 297.1mm !important;
      page-break-after: always !important;
      page-break-inside: avoid !important;
      position: relative !important;
      overflow: hidden !important;
      background-color: white !important;
    }
    .no-print { display: none !important; }
  }
  /* Design enhancements */
  .proposal-header-bg {
    background: linear-gradient(to bottom, #fcfaff 0%, #ffffff 100%);
  }
  .proposal-rich-text { font-size: 11pt; }
  .proposal-rich-text h1 { font-size: 24pt; font-weight: 800; margin-top: 20pt; margin-bottom: 12pt; color: #111827; }
  .proposal-rich-text h2 { font-size: 18pt; font-weight: 700; margin-top: 15pt; margin-bottom: 10pt; color: #1f2937; }
  .proposal-rich-text h3 { font-size: 14pt; font-weight: 600; margin-top: 12pt; margin-bottom: 8pt; color: #374151; }
  .proposal-rich-text p { margin-bottom: 10pt; line-height: 1.6; color: #4b5563; }
  .proposal-rich-text ul { list-style-type: disc; margin-left: 20pt; margin-bottom: 10pt; }
  .proposal-rich-text table { width: 100%; border-collapse: collapse; margin: 15pt 0; }
  .proposal-rich-text th, .proposal-rich-text td { border: 1px solid #e5e7eb; padding: 8pt; }
`
);
</script>

<template lang="pug">
div(
  :class="['bg-transparent w-full flex flex-col gap-8 items-center text-black relative print:block print:gap-0 min-h-screen', fontClass]"
)
  //- ━━━ Print Styles ━━━
  component(:is="'style'" v-html="printStyles")

  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //- COVER PAGE
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  div.page-container.bg-white.shadow-2xl.mx-auto(
    class="print:shadow-none print:m-0"
    style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
  )
    //- Dot pattern background
    .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
      .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")

    //- Cover page content — all 31 styles in CoverPage sub-component
    ProposalsProposalCoverPage(:form-data="formData" :color="color" :type-info="typeInfo")
    //- ── COVER STYLES END ──
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //- PAGE 2 — TABLE OF CONTENTS
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  div.page-container.bg-white.shadow-2xl.mx-auto(
    class="print:shadow-none print:m-0"
    style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
  )
    //- Dot pattern background
    .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
      .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")

    //- Side accent line
    .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")

    //- Header
    .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
      div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
      .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
        .flex.items-center.gap-6
          .h-16.flex.items-center
            img(
              src="/assets/header-logo.png"
              class="h-full w-auto object-contain"
              alt="Logo"
              @error="handleImgError"
            )
          .h-10.bg-gray-100.italic(class="w-px")
        .text-right
          .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
          .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}

    //- Sidebar page number
    .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
      .flex.flex-col.items-center.gap-4
        .bg-gray-100(class="w-px h-12")
        .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") 02
        .bg-gray-100(class="w-px h-12")

    //- Footer
    .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
      .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
      .flex.flex-col(class="gap-0.5")
        span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
        span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
      .font-mono.font-bold(class="text-[10px] text-gray-300")
        | PAGE //&nbsp;
        span.text-gray-900 2

    //- Content area
    .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
      .h-full.w-full.relative
        .flex-1.px-20.pt-8.flex.flex-col.justify-start.h-full
          .mb-12.border-b-2.pb-6(class="border-slate-100")
            span.text-xs.font-bold.tracking-widest.uppercase.mb-2.block(class="text-violet-600") Document Overview
            h1.text-5xl.font-bold(class="text-slate-900") Table of Contents

          .space-y-6
            div(
              v-for="(id, index) in contentSteps"
              :key="id"
              class="group flex items-end"
            )
              .font-bold.text-3xl.mr-8.w-12.font-serif.italic(class="text-slate-200 group-hover:text-violet-600 transition-colors")
                | {{ String(index + 1).padStart(2, '0') }}
              .flex-1.mb-2.border-b.border-dashed.pb-1.flex.justify-between.items-baseline(class="border-slate-200")
                span.text-xl.font-medium.uppercase.tracking-wide(class="text-slate-800") {{ getTocTitle(id) }}
                span.text-lg.font-bold(class="text-slate-400 group-hover:text-violet-600") 0{{ index + 3 }}

  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //- CONTENT SECTION PAGES (page 3+)
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  template(v-for="(id, idx) in contentSteps" :key="id")

    //- ── EXECUTIVE SUMMARY ──
    template(v-if="id === 'executive'")
      div.page-container.bg-white.shadow-2xl.mx-auto(
        class="print:shadow-none print:m-0"
        style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
      )
        //- Dot pattern
        .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
          .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")
        //- Side accent
        .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")
        //- Header
        .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
          div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
          .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
            .flex.items-center.gap-6
              .h-16.flex.items-center
                img(src="/assets/header-logo.png" class="h-full w-auto object-contain" alt="Logo" @error="handleImgError")
              .h-10.bg-gray-100.italic(class="w-px")
            .text-right
              .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
              .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}
        //- Sidebar page number
        .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
          .flex.flex-col.items-center.gap-4
            .bg-gray-100(class="w-px h-12")
            .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") {{ String(idx + 3).padStart(2, '0') }}
            .bg-gray-100(class="w-px h-12")
        //- Footer
        .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
          .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
          .flex.flex-col(class="gap-0.5")
            span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
            span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
          .font-mono.font-bold(class="text-[10px] text-gray-300")
            | PAGE //&nbsp;
            span.text-gray-900 {{ idx + 3 }}
        //- Content
        .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
          .h-full.w-full.relative
            .flex-1
              .mb-10
                h2.text-3xl.font-bold.text-gray-900.mb-8.flex.items-center.gap-3
                  span.text-gray-200.font-mono 0{{ idx + 3 }}
                  | {{ labels.executive }}
                .proposal-rich-text.mb-8(v-html="sanitizeHtml(formData.introduction)")
                div(
                  v-if="formData.objectives"
                  class="bg-gray-50 p-8 rounded-xl border-l-4"
                  :style="{ borderColor: color }"
                )
                  h3.font-bold.text-gray-900.mb-4.flex.items-center.gap-2
                    CheckCircle(:size="18" :style="{ color: color }")
                    | Objectives
                  .proposal-rich-text(v-html="sanitizeHtml(formData.objectives)")

    //- ── SOLUTION & SCOPE ──
    template(v-else-if="id === 'solution'")
      div.page-container.bg-white.shadow-2xl.mx-auto(
        class="print:shadow-none print:m-0"
        style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
      )
        //- Dot pattern
        .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
          .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")
        //- Side accent
        .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")
        //- Header
        .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
          div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
          .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
            .flex.items-center.gap-6
              .h-16.flex.items-center
                img(src="/assets/header-logo.png" class="h-full w-auto object-contain" alt="Logo" @error="handleImgError")
              .h-10.bg-gray-100.italic(class="w-px")
            .text-right
              .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
              .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}
        //- Sidebar page number
        .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
          .flex.flex-col.items-center.gap-4
            .bg-gray-100(class="w-px h-12")
            .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") {{ String(idx + 3).padStart(2, '0') }}
            .bg-gray-100(class="w-px h-12")
        //- Footer
        .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
          .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
          .flex.flex-col(class="gap-0.5")
            span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
            span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
          .font-mono.font-bold(class="text-[10px] text-gray-300")
            | PAGE //&nbsp;
            span.text-gray-900 {{ idx + 3 }}
        //- Content
        .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
          .h-full.w-full.relative
            .flex-1
              .mb-10
                h2.text-3xl.font-bold.text-gray-900.mb-8.flex.items-center.gap-3
                  span.text-gray-200.font-mono 0{{ idx + 3 }}
                  | {{ labels.solution }}

                //- Scope of Work
                div(v-if="formData.scopeOfWork" class="mb-8")
                  h3.text-sm.font-bold.text-gray-400.uppercase.tracking-widest.mb-4 Scope of Work
                  .proposal-rich-text(v-html="sanitizeHtml(formData.scopeOfWork)")

                //- Methodology
                div(v-if="formData.methodology" class="mb-8")
                  h3.text-sm.font-bold.text-gray-400.uppercase.tracking-widest.mb-4 Methodology
                  .proposal-rich-text(v-html="sanitizeHtml(formData.methodology)")

                //- Phases Timeline
                div(v-if="formData.phases && formData.phases.length > 0")
                  h3.text-sm.font-bold.text-gray-400.uppercase.tracking-widest.mb-6 Timeline
                  .space-y-6
                    div(v-for="(phase, phaseIdx) in formData.phases" :key="phaseIdx" class="flex gap-6")
                      .flex.flex-col.items-center
                        .w-3.h-3.rounded-full(:style="{ backgroundColor: color }")
                        .mt-1.bg-gray-100(class="w-px h-full")
                      .pb-6
                        .flex.items-baseline.gap-4.mb-1
                          span.font-bold.text-gray-900 {{ phase.name }}
                          span.text-xs.font-mono.text-gray-500.bg-gray-100.px-2.rounded(class="py-0.5") {{ phase.duration }}
                        p.text-sm.text-gray-500 {{ phase.deliverables }}

    //- ── FINANCIAL / INVESTMENT ──
    template(v-else-if="id === 'financial'")
      div.page-container.bg-white.shadow-2xl.mx-auto(
        class="print:shadow-none print:m-0"
        style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
      )
        //- Dot pattern
        .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
          .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")
        //- Side accent
        .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")
        //- Header
        .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
          div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
          .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
            .flex.items-center.gap-6
              .h-16.flex.items-center
                img(src="/assets/header-logo.png" class="h-full w-auto object-contain" alt="Logo" @error="handleImgError")
              .h-10.bg-gray-100.italic(class="w-px")
            .text-right
              .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
              .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}
        //- Sidebar page number
        .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
          .flex.flex-col.items-center.gap-4
            .bg-gray-100(class="w-px h-12")
            .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") {{ String(idx + 3).padStart(2, '0') }}
            .bg-gray-100(class="w-px h-12")
        //- Footer
        .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
          .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
          .flex.flex-col(class="gap-0.5")
            span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
            span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
          .font-mono.font-bold(class="text-[10px] text-gray-300")
            | PAGE //&nbsp;
            span.text-gray-900 {{ idx + 3 }}
        //- Content
        .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
          .h-full.w-full.relative
            .flex-1
              h2.text-3xl.font-bold.text-gray-900.mb-10.flex.items-center.gap-3
                span.text-gray-200.font-mono 0{{ idx + 3 }}
                | {{ labels.financial }}

              //- Items table
              .mb-12
                table.w-full.text-left
                  thead
                    tr.border-b-2.border-gray-100
                      th.py-3.text-xs.font-bold.text-gray-400.uppercase.tracking-wider Description
                      th.py-3.text-right.text-xs.font-bold.text-gray-400.uppercase.tracking-wider Qty
                      th.py-3.text-right.text-xs.font-bold.text-gray-400.uppercase.tracking-wider Rate
                      th.py-3.text-right.text-xs.font-bold.text-gray-400.uppercase.tracking-wider Total
                  tbody.divide-y.divide-gray-100
                    tr(v-for="(item, itemIdx) in formData.items" :key="itemIdx")
                      td.py-4.pr-4
                        p.font-bold.text-gray-800.text-sm {{ item.description }}
                        p.text-xs.text-gray-400(class="mt-0.5") {{ item.unit }}
                      td.py-4.text-right.text-sm.text-gray-600 {{ item.quantity }}
                      td.py-4.text-right.text-sm.text-gray-600 {{ item.rate.toLocaleString() }}
                      td.py-4.text-right.text-sm.font-bold.text-gray-900 {{ (item.quantity * item.rate).toLocaleString() }}

              //- Summary
              .flex.justify-end
                .w-64.space-y-3.bg-gray-50.p-6.rounded-xl
                  .flex.justify-between.text-sm.text-gray-500
                    span Subtotal
                    span {{ subtotal.toLocaleString() }} {{ formData.currency }}
                  .flex.justify-between.text-sm.text-green-600(v-if="discountAmount > 0")
                    span Discount
                    span - {{ discountAmount.toLocaleString() }}
                  .flex.justify-between.text-sm.text-gray-500.border-b.border-gray-200.pb-3
                    span Tax ({{ formData.taxRate }}%)
                    span {{ tax.toLocaleString() }} {{ formData.currency }}
                  .flex.justify-between.items-baseline.pt-1
                    span.text-sm.font-bold.text-gray-900 Total
                    span.text-xl.font-bold(:style="{ color: color }") {{ total.toLocaleString() }} {{ formData.currency }}

    //- ── TERMS & LEGAL ──
    template(v-else-if="id === 'legal'")
      div.page-container.bg-white.shadow-2xl.mx-auto(
        class="print:shadow-none print:m-0"
        style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
      )
        //- Dot pattern
        .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
          .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")
        //- Side accent
        .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")
        //- Header
        .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
          div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
          .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
            .flex.items-center.gap-6
              .h-16.flex.items-center
                img(src="/assets/header-logo.png" class="h-full w-auto object-contain" alt="Logo" @error="handleImgError")
              .h-10.bg-gray-100.italic(class="w-px")
            .text-right
              .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
              .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}
        //- Sidebar page number
        .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
          .flex.flex-col.items-center.gap-4
            .bg-gray-100(class="w-px h-12")
            .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") {{ String(idx + 3).padStart(2, '0') }}
            .bg-gray-100(class="w-px h-12")
        //- Footer
        .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
          .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
          .flex.flex-col(class="gap-0.5")
            span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
            span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
          .font-mono.font-bold(class="text-[10px] text-gray-300")
            | PAGE //&nbsp;
            span.text-gray-900 {{ idx + 3 }}
        //- Content
        .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
          .h-full.w-full.relative
            .flex-1.flex.flex-col
              h2.text-3xl.font-bold.text-gray-900.mb-10.flex.items-center.gap-3
                span.text-gray-200.font-mono 0{{ idx + 3 }}
                | {{ labels.legal }}
              .grid.grid-cols-1.gap-12.flex-1
                //- Terms & Conditions
                div(v-if="formData.termsAndConditions")
                  h3.font-bold.text-gray-900.mb-4.flex.items-center.gap-2
                    FileText(:size="18" class="text-gray-400")
                    | Terms &amp; Conditions
                  .proposal-rich-text.text-sm.text-gray-600(v-html="sanitizeHtml(formData.termsAndConditions)")
                //- Payment Schedule
                div(v-if="formData.paymentTerms")
                  h3.font-bold.text-gray-900.mb-4.flex.items-center.gap-2
                    Clock(:size="18" class="text-gray-400")
                    | Payment Schedule
                  .proposal-rich-text.text-sm.text-gray-600(v-html="sanitizeHtml(formData.paymentTerms)")

    //- ── CUSTOM SECTIONS ──
    template(v-else)
      template(v-if="getCustomSection(id)")
        div.page-container.bg-white.shadow-2xl.mx-auto(
          class="print:shadow-none print:m-0"
          style="width: 210mm; height: 297mm; position: relative; overflow: hidden; box-sizing: border-box;"
        )
          //- Dot pattern
          .absolute.inset-0.z-0.pointer-events-none(class="opacity-[0.03]")
            .absolute.inset-0(style="background-image: radial-gradient(#000 0.5px, transparent 0.5px); background-size: 20px 20px;")
          //- Side accent
          .absolute.left-0.top-0.bottom-0.w-1.z-10(:style="{ backgroundColor: color, opacity: 0.1 }")
          //- Header
          .absolute.top-0.left-0.right-0.z-50(class="h-[38mm] bg-white/80 backdrop-blur-sm")
            div(class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600")
            .flex.justify-between.items-center.border-b.border-gray-100.px-12(class="h-[34mm]")
              .flex.items-center.gap-6
                .h-16.flex.items-center
                  img(src="/assets/header-logo.png" class="h-full w-auto object-contain" alt="Logo" @error="handleImgError")
                .h-10.bg-gray-100.italic(class="w-px")
              .text-right
                .uppercase.font-black.tracking-widest.mb-1(class="text-[10px] text-gray-300" style="letter-spacing: 0.2em;") PROPOSAL_SPEC
                .font-mono.font-bold(class="text-[11px] text-gray-500") ID: {{ refIdShort }}
          //- Sidebar page number
          .absolute.left-6.z-30.pointer-events-none.select-none(class="top-1/2 -translate-y-1/2")
            .flex.flex-col.items-center.gap-4
              .bg-gray-100(class="w-px h-12")
              .font-black.transform.leading-none(class="text-[40px] text-gray-50/50 -rotate-90") {{ String(idx + 3).padStart(2, '0') }}
              .bg-gray-100(class="w-px h-12")
          //- Footer
          .absolute.bottom-0.left-0.right-0.px-12.pb-6.flex.justify-between.items-end.z-50.bg-white(class="h-[25mm]")
            .absolute.top-0.left-12.right-12.bg-gray-50(class="h-px")
            .flex.flex-col(class="gap-0.5")
              span.font-bold.uppercase(class="text-[9px] text-gray-300" style="letter-spacing: 0.4em;") Confidential Strategic Asset
              span.font-medium.tracking-tight(class="text-[8px] text-gray-400") V.{{ formData.version }}.0 // Generated {{ currentDate }}
            .font-mono.font-bold(class="text-[10px] text-gray-300")
              | PAGE //&nbsp;
              span.text-gray-900 {{ idx + 3 }}
          //- Content
          .absolute.inset-0.z-20(class="pt-[45mm] pb-[35mm] px-[20mm]")
            .h-full.w-full.relative
              .flex-1
                h2.text-3xl.font-bold.text-gray-900.mb-8.flex.items-center.gap-3
                  span.text-gray-200.font-mono 0{{ idx + 3 }}
                  | {{ getCustomSection(id)!.title }}
                .proposal-rich-text(v-html="sanitizeHtml(getCustomSection(id)!.content)")
</template>
