<template>
  <div class="proposal-print-template print:block force-light-mode">
    <!-- Cover Page (Proposals Only) -->
    <ProposalPrintCover v-if="data.coverStyle && isFullDoc" :data="data" :color="color" :type-info="typeInfo" />

    <!-- Iterate over stepOrder to render sections in the correct order -->
    <template v-for="(sectionId, index) in data.stepOrder" :key="sectionId">
      <!-- Executive Summary -->
      <ProposalPrintPage v-if="sectionId === 'executive'" :page-num="index + 1" :data="data">
        <div class="flex-1">
          <div class="mb-10">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span class="text-gray-200 font-mono">0{{ index + 1 }}</span>
              {{ labels.executive || 'Executive Summary' }}
            </h2>
            <div class="proposal-rich-text mb-8" v-html="data.introduction"></div>

            <div v-if="data.objectives" class="bg-gray-50 p-8 rounded-xl border-l-4" :style="{ borderColor: color }">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size="18" :style="{ color: color }" class="mr-2" />
                Objectives
              </h3>
              <div class="proposal-rich-text" v-html="data.objectives"></div>
            </div>
          </div>
        </div>
      </ProposalPrintPage>

      <!-- Solution & Scope -->
      <ProposalPrintPage v-else-if="sectionId === 'solution'" :page-num="index + 1" :data="data">
        <div class="flex-1">
          <div class="mb-10">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span class="text-gray-200 font-mono">0{{ index + 1 }}</span>
              {{ labels.solution || 'Solution & Scope' }}
            </h2>

            <div v-if="data.scopeOfWork" class="mb-8">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Scope of Work</h3>
              <div class="proposal-rich-text" v-html="data.scopeOfWork"></div>
            </div>

            <div v-if="data.methodology" class="mb-8">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Methodology</h3>
              <div class="proposal-rich-text" v-html="data.methodology"></div>
            </div>

            <div v-if="data.phases && data.phases.length > 0">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Timeline</h3>
              <div class="space-y-6">
                <div v-for="(phase, idx) in data.phases" :key="idx" class="flex gap-6">
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color }"></div>
                    <div class="w-px h-full bg-gray-100 mt-1"></div>
                  </div>
                  <div class="pb-6">
                    <div class="flex items-baseline gap-4 mb-1">
                      <span class="font-bold text-gray-900">{{ phase.name }}</span>
                      <span class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{{ phase.duration }}</span>
                    </div>
                    <p class="text-sm text-gray-500">{{ phase.deliverables }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProposalPrintPage>

      <!-- Financial / Pricing / Invoice -->
      <ProposalPrintPage v-else-if="sectionId === 'financial'" :page-num="index + 1" :data="data">
        <div class="flex-1">
          <!-- Standard Proposal Header -->
          <h2 v-if="isFullDoc" class="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-3">
            <span class="text-gray-200 font-mono">0{{ index + 1 }}</span>
            {{ labels.financial || 'Investment' }}
          </h2>

          <!-- Business Header for Invoices / POs -->
          <div v-else class="mb-12 border-b border-gray-100 pb-10">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-4xl font-bold text-gray-900 uppercase tracking-widest mb-2" :style="{ color }">
                  {{ data.documentType.replace('_', ' ') }}
                </h1>
                <p class="text-sm font-mono text-gray-500 mb-1">
                  REF:
                  <span class="font-bold text-gray-900">{{ data.refNumber }}</span>
                </p>
                <p class="text-sm font-mono text-gray-500">
                  DATE:
                  <span class="font-bold text-gray-900">{{ data.date }}</span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                <p class="text-lg font-bold text-gray-900">{{ data.clientCompany || data.clientName }}</p>
                <p v-if="data.clientCompany" class="text-sm text-gray-500">{{ data.clientName }}</p>
                <p class="text-sm text-gray-500">{{ data.clientEmail }}</p>
              </div>
            </div>
          </div>

          <div class="mb-12">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b-2 border-gray-100">
                  <th class="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                  <th class="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                  <th class="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                  <th class="py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(item, idx) in data.items" :key="idx">
                  <td class="py-4 pr-4">
                    <p class="font-bold text-gray-800 text-sm">{{ item.description }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ item.unit }}</p>
                  </td>
                  <td class="py-4 text-right text-sm text-gray-600">{{ item.quantity }}</td>
                  <td class="py-4 text-right text-sm text-gray-600">{{ Number(item.rate).toLocaleString() }}</td>
                  <td class="py-4 text-right text-sm font-bold text-gray-900">{{ (item.quantity * item.rate).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end">
            <div class="w-64 space-y-3 bg-gray-50 p-6 rounded-xl">
              <div class="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{{ subtotal.toLocaleString() }} {{ data.currency }}</span>
              </div>

              <div v-if="discountAmount > 0" class="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>- {{ discountAmount.toLocaleString() }} {{ data.currency }}</span>
              </div>

              <div class="flex justify-between text-sm text-gray-500 border-b border-gray-200 pb-3">
                <span>VAT ({{ data.taxRate }}%)</span>
                <span>{{ taxAmount.toLocaleString() }} {{ data.currency }}</span>
              </div>

              <div class="flex justify-between items-baseline pt-1">
                <span class="text-sm font-bold text-gray-900">Total Due</span>
                <span class="text-xl font-bold" :style="{ color: color }">{{ finalTotal.toLocaleString() }} {{ data.currency }}</span>
              </div>
            </div>
          </div>
        </div>
      </ProposalPrintPage>

      <!-- Legal / Terms -->
      <ProposalPrintPage v-else-if="sectionId === 'legal'" :page-num="index + 1" :data="data">
        <div class="flex-1 flex flex-col">
          <h2 class="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-3">
            <span class="text-gray-200 font-mono">0{{ index + 1 }}</span>
            {{ labels.legal || 'Terms & Legal' }}
          </h2>
          <div class="grid grid-cols-1 gap-12 flex-1">
            <div v-if="data.termsAndConditions">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size="18" class="text-gray-400 mr-2" />
                Terms & Conditions
              </h3>
              <div class="proposal-rich-text text-sm text-gray-600" v-html="data.termsAndConditions"></div>
            </div>

            <div v-if="data.paymentTerms">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size="18" class="text-gray-400 mr-2" />
                Payment Schedule
              </h3>
              <div class="proposal-rich-text text-sm text-gray-600" v-html="data.paymentTerms"></div>
            </div>
          </div>
        </div>
      </ProposalPrintPage>

      <!-- Custom Sections -->
      <ProposalPrintPage v-else :page-num="index + 1" :data="data">
        <div class="flex-1">
          <h2 class="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <span class="text-gray-200 font-mono">0{{ index + 1 }}</span>
            {{ getCustomSectionTitle(sectionId) }}
          </h2>
          <div class="proposal-rich-text" v-html="getCustomSectionContent(sectionId)"></div>
        </div>
      </ProposalPrintPage>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, resolveComponent, type FunctionalComponent } from 'vue';
import type { ProposalData } from './types';
import ProposalPrintPage from './ProposalPrintPage.vue';
import ProposalPrintCover from './ProposalPrintCover.vue';

// Lightweight icon shims using Nuxt Icon (replaces lucide-vue-next)
const iconShim =
  (name: string): FunctionalComponent<{ size?: number | string; class?: string }> =>
  (props, { attrs }) =>
    h(resolveComponent('Icon'), { name, size: props.size || 20, class: props.class, ...attrs });

const CheckCircle = iconShim('ph:check-circle');
const FileText = iconShim('ph:file-text');
const Clock = iconShim('ph:clock');

const props = defineProps<{
  data: ProposalData;
}>();

const isFullDoc = computed(() => {
  return ['proposal', 'contract'].includes(props.data?.documentType || 'proposal');
});

// Computed Styling
const color = computed(() => props.data?.themeColor || '#7c3aed');
const typeInfo = computed(() => {
  const t = props.data?.type || 'MIXED';
  if (t === 'FINANCIAL') return { label: 'Financial', fullLabel: 'Financial Proposal', color: 'emerald' };
  if (t === 'TECHNICAL') return { label: 'Technical', fullLabel: 'Technical Proposal', color: 'blue' };
  return { label: 'Mixed', fullLabel: 'Comprehensive Proposal', color: 'violet' };
});

const defaultLabels = {
  branding: 'Branding & Details',
  executive: 'Executive Summary',
  solution: 'Solution & Scope',
  financial: 'Investment',
  legal: 'Terms & Legal'
};
const labels = computed(() => ({
  ...defaultLabels,
  ...(props.data?.stepLabels || {})
}));

// Computed Financials
const subtotal = computed(() => {
  return props.data?.items?.reduce((sum, item) => sum + item.quantity * item.rate, 0) || 0;
});
const discountAmount = computed(() => {
  if (props.data?.discountType === 'percent') {
    return subtotal.value * (props.data?.discount / 100);
  }
  return props.data?.discount || 0;
});
const taxableAmount = computed(() => subtotal.value - discountAmount.value);
const taxAmount = computed(() => taxableAmount.value * ((props.data?.taxRate || 0) / 100));
const finalTotal = computed(() => taxableAmount.value + taxAmount.value);

// Helper for Custom Sections
const getCustomSectionTitle = (id: string) => {
  const sec = props.data?.customSections?.find(s => s.id === id);
  return sec ? sec.title : 'Custom Section';
};
const getCustomSectionContent = (id: string) => {
  const sec = props.data?.customSections?.find(s => s.id === id);
  return sec ? sec.content : '';
};
</script>

<style scoped>
.force-light-mode {
  color-scheme: light;
  background: white;
  color: #111827;
  --text-primary: #111827;
  --text-secondary: #374151;
  --text-muted: #6b7280;
}
</style>
