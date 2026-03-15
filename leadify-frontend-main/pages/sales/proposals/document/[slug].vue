<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen bg-slate-50 flex items-center justify-center">
      <div class="text-center">
        <el-icon class="is-loading mb-4" :size="40" color="#7c3aed"><Loading /></el-icon>
        <p class="text-gray-500">Loading proposal document...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="!formattedData" class="min-h-screen bg-slate-50 flex items-center justify-center">
      <div class="text-center">
        <Icon name="ph:warning-circle" size="48" class="text-red-500 mx-auto mb-4" />
        <p class="text-gray-700 font-medium mb-2">Proposal not found or access denied</p>
        <button class="text-violet-600 hover:text-violet-700 font-medium mt-2" @click="navigateTo('/sales/proposals')">Back to Proposals</button>
      </div>
    </div>

    <!-- Document View -->
    <div v-else class="bg-gray-100 min-h-screen py-8 print:p-0 print:bg-white relative">
      <!-- Back Button (print hidden) -->
      <div class="max-w-[210mm] mx-auto mb-4 flex items-center gap-3 print:hidden">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          @click="navigateTo(`/sales/proposals/${proposalId}`)"
        >
          <ArrowLeft :size="16" />
          Back to Proposal
        </button>
      </div>

      <!-- Print Template -->
      <div ref="printContainer">
        <ProposalsProposalPrintTemplate :form-data="formattedData as unknown" />
      </div>

      <!-- Floating Export Button -->
      <button
        class="fixed bottom-8 right-8 z-50 bg-violet-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-violet-700 transition-all flex items-center gap-3 print:hidden hover:scale-105 active:scale-95 font-medium"
        @click="handleExport"
      >
        <Download :size="20" />
        Export PDF / Print
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { ArrowLeft, Download } from 'lucide-vue-next';
import { getProposal } from '~/composables/useProposals';
import logger from '~/utils/logger'
// ProposalPrintTemplate is auto-imported by Nuxt from components/proposals/

definePageMeta({
  layout: 'full-width',
  middleware: 'permissions'
});

const route = useRoute();
const proposalId = computed(() => route.params.slug as string);

const loading = ref(true);
const proposal = ref<Record<string, unknown> | null>(null);
const printContainer = ref<HTMLElement | null>(null);

const formattedData = computed(() => {
  if (!proposal.value) return null;
  return transformApiToFormData(proposal.value);
});

function transformApiToFormData(apiData: unknown) {
  const content = apiData.content ? (typeof apiData.content === 'string' ? JSON.parse(apiData.content) : apiData.content) : {};

  return {
    id: apiData.id,
    title: apiData.title || 'New Project Proposal',
    refNumber: apiData.reference || '',
    date: apiData.proposalDate || apiData.date || new Date().toISOString().split('T')[0],
    clientName: apiData.proposalFor || '',
    clientCompany: content.client?.company || apiData.proposalFor || '',
    clientEmail: content.client?.email || '',
    clientPhone: content.client?.phone || '',
    logo: content.branding?.logo || apiData.companyLogo || '',
    clientLogo: content.branding?.clientLogo || '',
    themeColor: content.branding?.themeColor || '#7c3aed',
    font: content.branding?.font || 'sans',
    typography: content.branding?.typography || 'Sans',
    coverStyle: content.branding?.coverStyle || 'corporate',
    introduction: content.sections?.introduction || apiData.notes || '',
    objectives: content.sections?.objectives || '',
    scopeOfWork: content.sections?.scopeOfWork || '',
    methodology: content.sections?.methodology || '',
    executiveSummary: content.sections?.executiveSummary || content.sections?.introduction || apiData.notes || '',
    solutionScope: content.sections?.solutionScope || content.sections?.scopeOfWork || '',
    customSections: content.sections?.customSections || [],
    stepLabels: content.sections?.stepLabels || {},
    stepOrder: content.sections?.stepOrder || ['branding', 'executive', 'solution', 'financial', 'legal'],
    items: content.finance?.items || [],
    discount: content.finance?.discount || 0,
    discountType: content.finance?.discountType || 'percent',
    taxRate: content.finance?.taxRate || 15,
    currency: content.finance?.currency || 'SAR',
    paymentTerms: content.finance?.paymentTerms || '',
    phases: content.timeline || [],
    termsAndConditions: content.terms || '',
    termsConditions: content.terms || '',
    status: apiData.status || 'DRAFT',
    type: apiData.type || 'MIXED',
    version: parseInt(apiData.version) || 1,
    documentType: 'proposal'
  };
}

async function fetchProposal() {
  loading.value = true;
  try {
    const data = await getProposal(proposalId.value);
    proposal.value = data && Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    logger.error('Failed to load proposal:', error);
    proposal.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  // Try html2pdf if available, otherwise fall back to window.print()
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    if (html2pdf && printContainer.value) {
      const element = printContainer.value;
      const title = proposal.value?.title || 'Proposal';
      const reference = proposal.value?.reference || '';
      const filename = `${title}${reference ? ` - ${reference}` : ''}.pdf`;

      html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        } as unknown)
        .from(element)
        .save();
      return;
    }
  } catch {
    // html2pdf not available, fall back to print
  }

  window.print();
}

onMounted(() => {
  fetchProposal();
});
</script>
