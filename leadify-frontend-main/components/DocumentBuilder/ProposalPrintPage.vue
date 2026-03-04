<template>
  <div
    :class="`page-container proposal-print-page force-light-mode bg-white shadow-2xl mx-auto print:shadow-none print:m-0 ${$attrs.class || ''}`"
    :style="{
      width: '210mm',
      height: '297mm',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }"
  >
    <!-- Technical Background Elements -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
      <div class="absolute inset-0" :style="{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }"></div>
    </div>

    <!-- Side Accent Line -->
    <div
      v-if="!isCover"
      class="absolute left-0 top-0 bottom-0 w-1 z-10"
      :style="{ backgroundColor: data?.themeColor || '#7c3aed', opacity: 0.1 }"
    ></div>

    <template v-if="!isCover">
      <!-- Header Section -->
      <div class="absolute top-0 left-0 right-0 h-[38mm] z-50 bg-white/80 backdrop-blur-sm">
        <div class="h-1.5 w-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-600"></div>
        <div class="flex justify-between items-center h-[34mm] border-b border-gray-100 px-12">
          <div class="flex items-center gap-6">
            <div class="h-16 flex items-center">
              <img src="/images/Logo.png" class="h-full w-auto object-contain" alt="Logo" />
            </div>
            <div class="h-10 w-px bg-gray-100 italic"></div>
          </div>
          <div class="text-right">
            <div class="text-[10px] uppercase font-black text-gray-300 tracking-[0.2em] mb-1">PROPOSAL_SPEC</div>
            <div class="text-[11px] font-mono font-bold text-gray-500">ID: {{ data?.refNumber?.split('-').pop() }}</div>
          </div>
        </div>
      </div>

      <!-- Vertical Sidebar Numbering -->
      <div class="absolute left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-none select-none">
        <div class="flex flex-col items-center gap-4">
          <div class="w-px h-12 bg-gray-100"></div>
          <div class="text-[40px] font-black text-gray-50/50 transform -rotate-90 leading-none">{{ pageNum?.toString().padStart(2, '0') }}</div>
          <div class="w-px h-12 bg-gray-100"></div>
        </div>
      </div>

      <!-- Footer Section -->
      <div class="absolute bottom-0 left-0 right-0 h-[25mm] px-12 pb-6 flex justify-between items-end z-50 bg-white">
        <div class="absolute top-0 left-12 right-12 h-px bg-gray-50"></div>
        <div class="flex flex-col gap-0.5">
          <span class="text-[9px] font-bold text-gray-300 uppercase tracking-[0.4em]">Confidential Strategic Asset</span>
          <span class="text-[8px] text-gray-400 font-medium tracking-tight">
            V.{{ data?.version }}.0 // Generated {{ new Date().toLocaleDateString() }}
          </span>
        </div>
        <div class="text-[10px] font-mono font-bold text-gray-300">
          PAGE //
          <span class="text-gray-900">{{ pageNum }}</span>
        </div>
      </div>
    </template>

    <!-- Content Area -->
    <div :class="`absolute inset-0 z-20 ${!isCover ? 'pt-[45mm] pb-[35mm] px-[20mm]' : ''}`">
      <div v-if="!isCover" class="h-full w-full relative">
        <slot />
      </div>
      <slot v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProposalData } from './types';

defineProps<{
  pageNum?: number;
  data?: ProposalData;
  isCover?: boolean;
}>();
</script>

<style>
/* Using global print styles from React */
@page {
  size: A4;
  margin: 0 !important;
}
@media print {
  html,
  body {
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
  .no-print {
    display: none !important;
  }
}
/* Force light mode for print/preview components */
.force-light-mode {
  color-scheme: light;
  background: white;
  color: #111827;
  --text-primary: #111827;
  --text-secondary: #374151;
  --text-muted: #6b7280;
}
/* html2pdf.js page break support */
.proposal-print-page + .proposal-print-page {
  page-break-before: always;
}
.proposal-header-bg {
  background: linear-gradient(to bottom, #fcfaff 0%, #ffffff 100%);
}
.proposal-rich-text {
  font-size: 11pt;
}
.proposal-rich-text h1 {
  font-size: 24pt;
  font-weight: 800;
  margin-top: 20pt;
  margin-bottom: 12pt;
  color: #111827;
}
.proposal-rich-text h2 {
  font-size: 18pt;
  font-weight: 700;
  margin-top: 15pt;
  margin-bottom: 10pt;
  color: #1f2937;
}
.proposal-rich-text h3 {
  font-size: 14pt;
  font-weight: 600;
  margin-top: 12pt;
  margin-bottom: 8pt;
  color: #374151;
}
.proposal-rich-text p {
  margin-bottom: 10pt;
  line-height: 1.6;
  color: #4b5563;
}
.proposal-rich-text ul {
  list-style-type: disc;
  margin-left: 20pt;
  margin-bottom: 10pt;
}
.proposal-rich-text table {
  width: 100%;
  border-collapse: collapse;
  margin: 15pt 0;
}
.proposal-rich-text th,
.proposal-rich-text td {
  border: 1px solid #e5e7eb;
  padding: 8pt;
}
</style>
