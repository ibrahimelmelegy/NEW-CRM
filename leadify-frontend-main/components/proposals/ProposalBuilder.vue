<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Palette,
  User,
  Layers,
  DollarSign,
  CheckSquare,
  Maximize2,
  ZoomOut,
  ZoomIn,
  Eye,
  EyeOff,
  Printer,
  ImageIcon,
  Calculator,
  Plus,
  X,
  Cpu,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-vue-next';

// ── Types ──────────────────────────────────────────────────────────
export interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  cost: number;
  margin: number;
  rate: number;
}

export interface ProposalPhase {
  id: number;
  name: string;
  duration: string;
  deliverables: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface ProposalData {
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

interface SelectedEntity {
  clientCompany?: string;
  clientName?: string;
  clientEmail?: string;
  [key: string]: unknown;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  [key: string]: unknown;
}

// ── Props & Emits ──────────────────────────────────────────────────
const props = defineProps<{
  initialData?: ProposalData;
}>();

const emit = defineEmits<{
  save: [data: ProposalData];
  cancel: [];
}>();

// ── Constants ──────────────────────────────────────────────────────
const defaultStepOrder = ['branding', 'executive', 'solution', 'financial', 'legal'];

const colors = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0f172a', '#db2777', '#0891b2'];

const coverStyles = [
  'corporate',
  'business',
  'creative',
  'enterprise',
  'minimal',
  'tech',
  'modern-art',
  'geometric',
  'bold-typography',
  'gradient-splash',
  'swiss',
  'dark-mode',
  'architectural',
  'abstract',
  'neon-night',
  'brutalist',
  'nature',
  'japanese-minimal',
  'retro-pop',
  'futuristic-grid',
  'ethereal',
  'aurora',
  'midnight-gradient',
  'art-deco',
  'newspaper',
  'terminal',
  'brush-stroke',
  'mondrian',
  'blueprint-dark',
  'warm-boho',
  'glassmorphism',
  'magazine-editorial'
];

const proposalTypes = [
  { id: 'FINANCIAL', label: 'Financial', icon: DollarSign, desc: 'Budget & Costing focus' },
  { id: 'TECHNICAL', label: 'Technical', icon: Cpu, desc: 'Specs & Scope focus' },
  { id: 'MIXED', label: 'Mixed', icon: Layers, desc: 'Complete proposal' }
];

// ── State ──────────────────────────────────────────────────────────
const activeStep = ref('branding');
const showPreview = ref(true);
const zoom = ref(0.6);
const isGeneratingPdf = ref(false);
const errors = ref<Record<string, string>>({});

const isAddingSection = ref(false);
const newSectionTitle = ref('');

const globalMargin = ref<number>(0);

const selectedEntity = ref<SelectedEntity | null>(null);
const attachments = ref<UploadedFile[]>([]);

const showErrorToast = ref(false);
const errorToastMessage = ref('');

function createDefaultFormData(): ProposalData {
  return {
    id: Date.now(),
    refNumber: `PROP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    title: 'New Project Proposal',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0] ?? '',
    validUntil: '',
    status: 'Draft',
    themeColor: '#7c3aed',
    coverStyle: 'corporate',
    font: 'sans',
    introduction: '',
    objectives: '',
    scopeOfWork: '',
    methodology: '',
    phases: [],
    customSections: [],
    stepOrder: [...defaultStepOrder],
    currency: 'SAR',
    items: [{ id: 1, description: 'Service 1', quantity: 1, unit: 'Lumpsum', cost: 0, margin: 0, rate: 0 }],
    taxRate: 15,
    discount: 0,
    discountType: 'percent',
    paymentTerms: '50% Upfront, 50% Upon Completion.',
    termsAndConditions: '1. Valid for 30 days.\n2. Prices exclusive of VAT.',
    version: 1,
    lastModified: new Date().toISOString(),
    stepLabels: {
      branding: 'Branding & Details',
      executive: 'Executive Summary',
      solution: 'Solution & Scope',
      financial: 'Investment',
      legal: 'Terms & Legal'
    }
  };
}

const formData = reactive<ProposalData>(props.initialData ? JSON.parse(JSON.stringify(props.initialData)) : createDefaultFormData());

// ── Ensure stepOrder for legacy data ───────────────────────────────
onMounted(() => {
  if (!formData.stepOrder || formData.stepOrder.length === 0) {
    formData.stepOrder =
      formData.customSections && formData.customSections.length > 0
        ? ['branding', 'executive', 'solution', ...formData.customSections.map(s => s.id), 'financial', 'legal']
        : [...defaultStepOrder];
  }
});

// ── Auto-fill client data when CRM entity selected ────────────────
watch(selectedEntity, entity => {
  if (entity) {
    formData.clientCompany = entity.clientCompany || formData.clientCompany || '';
    formData.clientName = entity.clientName || formData.clientName || '';
    formData.clientEmail = entity.clientEmail || formData.clientEmail || '';
    errors.value = { ...errors.value, clientCompany: '' };
  }
});

// ── Handlers ───────────────────────────────────────────────────────
function handleChange(field: keyof ProposalData, value: unknown) {
  (formData as unknown)[field] = value;
  if (errors.value[field as string]) {
    errors.value = { ...errors.value, [field as string]: '' };
  }
}

function handleStepLabelChange(key: string, value: string) {
  formData.stepLabels = {
    ...(formData.stepLabels || {}),
    [key]: value
  } as ProposalData['stepLabels'];
}

// ── Dynamic Steps ──────────────────────────────────────────────────
interface StepDetail {
  id: string;
  label: string;
  iconComponent: unknown;
  isCustom: boolean;
}

function getStepDetails(id: string): StepDetail {
  if (id === 'branding') return { id, label: formData.stepLabels?.branding || 'Branding & Details', iconComponent: Palette, isCustom: false };
  if (id === 'executive') return { id, label: formData.stepLabels?.executive || 'Executive Summary', iconComponent: User, isCustom: false };
  if (id === 'solution') return { id, label: formData.stepLabels?.solution || 'Solution & Scope', iconComponent: Layers, isCustom: false };
  if (id === 'financial') return { id, label: formData.stepLabels?.financial || 'Investment', iconComponent: DollarSign, isCustom: false };
  if (id === 'legal') return { id, label: formData.stepLabels?.legal || 'Terms & Legal', iconComponent: CheckSquare, isCustom: false };

  const custom = formData.customSections?.find(s => s.id === id);
  if (custom) return { id, label: custom.title, iconComponent: FileText, isCustom: true };

  return { id, label: 'Unknown Step', iconComponent: FileText, isCustom: false };
}

const orderedSteps = computed(() => {
  return (formData.stepOrder || defaultStepOrder).map(id => getStepDetails(id));
});

// ── Custom Section Handlers ────────────────────────────────────────
function handleAddSection() {
  if (!newSectionTitle.value.trim()) return;
  const newId = `custom-${Date.now()}`;
  const newSection: CustomSection = {
    id: newId,
    title: newSectionTitle.value,
    content: ''
  };

  const newOrder = [...(formData.stepOrder || defaultStepOrder)];
  newOrder.splice(3, 0, newId);

  formData.customSections = [...(formData.customSections || []), newSection];
  formData.stepOrder = newOrder;
  newSectionTitle.value = '';
  isAddingSection.value = false;
  activeStep.value = newId;
}

function handleUpdateCustomSection(id: string, content: string) {
  formData.customSections = formData.customSections.map(s => (s.id === id ? { ...s, content } : s));
}

function handleUpdateCustomSectionTitle(id: string, title: string) {
  formData.customSections = formData.customSections.map(s => (s.id === id ? { ...s, title } : s));
}

// ── Step Move / Delete ─────────────────────────────────────────────
function handleMoveStep(index: number, direction: 'up' | 'down') {
  const newOrder = [...formData.stepOrder];
  if (direction === 'up') {
    if (index === 0) return;
    [newOrder[index - 1], newOrder[index]] = [newOrder[index] ?? '', newOrder[index - 1] ?? ''];
  } else {
    if (index === newOrder.length - 1) return;
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1] ?? '', newOrder[index] ?? ''];
  }
  handleChange('stepOrder', newOrder);
}

function handleDeleteStep(id: string) {
  if (id === 'branding') {
    alert('The Branding & Details section is mandatory and cannot be deleted.');
    return;
  }

  if (window.confirm('Are you sure you want to remove this section from the proposal?')) {
    formData.customSections = id.startsWith('custom-') ? (formData.customSections || []).filter(s => s.id !== id) : formData.customSections;
    formData.stepOrder = (formData.stepOrder || ['branding', 'executive', 'solution', 'financial', 'legal']).filter(sId => sId !== id);

    if (activeStep.value === id) {
      activeStep.value = 'branding';
    }
  }
}

// ── Item Handlers with Margin Logic ────────────────────────────────
function handleItemChange(id: number, field: keyof ProposalItem, value: unknown) {
  formData.items = formData.items.map(item => {
    if (item.id === id) {
      const updates: unknown = { [field]: value };

      if (field === 'cost') {
        const cost = Number(value) || 0;
        const margin = item.margin || 0;
        updates.rate = cost * (1 + margin / 100);
      } else if (field === 'margin') {
        const margin = Number(value) || 0;
        const cost = item.cost || 0;
        updates.rate = cost * (1 + margin / 100);
      } else if (field === 'rate') {
        const rate = Number(value) || 0;
        const cost = item.cost || 0;
        if (cost > 0) {
          updates.margin = ((rate - cost) / cost) * 100;
        }
      }
      return { ...item, ...updates };
    }
    return item;
  });
}

function applyGlobalMargin() {
  formData.items = formData.items.map(item => ({
    ...item,
    margin: globalMargin.value,
    rate: (item.cost || 0) * (1 + globalMargin.value / 100)
  }));
}

function addItem() {
  formData.items = [...formData.items, { id: Date.now(), description: '', quantity: 1, unit: 'Unit', cost: 0, margin: globalMargin.value, rate: 0 }];
}

function removeItem(id: number) {
  formData.items = formData.items.filter(i => i.id !== id);
}

// ── Phase Handlers ─────────────────────────────────────────────────
function addPhase() {
  formData.phases = [...formData.phases, { id: Date.now(), name: '', duration: '', deliverables: '' }];
}

function removePhase(id: number) {
  formData.phases = formData.phases.filter(p => p.id !== id);
}

function handlePhaseChange(id: number, field: keyof ProposalPhase, value: unknown) {
  formData.phases = formData.phases.map(p => (p.id === id ? { ...p, [field]: value } : p));
}

// ── Print / PDF ────────────────────────────────────────────────────
function handlePrint() {
  window.print();
}

async function handleDownloadPDF() {
  if (typeof (window as unknown).html2pdf === 'undefined') {
    // Dynamically import html2pdf.js
    try {
      const html2pdfModule = await import('html2pdf.js');
      (window as unknown).html2pdf = html2pdfModule.default || html2pdfModule;
    } catch {
      alert('PDF generation library not loaded. Please try printing to PDF instead.');
      return;
    }
  }

  isGeneratingPdf.value = true;
  const element = document.getElementById('proposal-print-container');

  if (element) {
    const originalStyle = element.style.display;
    element.style.display = 'block';

    const opt = {
      margin: 0,
      filename: `${formData.title.replace(/\s+/g, '_')}_Proposal.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', avoid: '.print\\:break-after-page' }
    };

    try {
      await (window as unknown).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please use the Print option.');
    } finally {
      element.style.display = originalStyle;
      isGeneratingPdf.value = false;
    }
  } else {
    isGeneratingPdf.value = false;
  }
}

// ── Zoom / Fullscreen ──────────────────────────────────────────────
function handleZoomIn() {
  zoom.value = Math.min(2.0, zoom.value + 0.1);
}

function handleZoomOut() {
  zoom.value = Math.max(0.3, zoom.value - 0.1);
}

function handleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(e => console.error('Error entering fullscreen:', e));
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(e => console.error('Error exiting fullscreen:', e));
  }
}

// ── Logo Upload ────────────────────────────────────────────────────
function handleLogoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      handleChange('logo', result);
    };
    reader.readAsDataURL(file);
  }
}

function handleClientLogoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      handleChange('clientLogo', result);
    };
    reader.readAsDataURL(file);
  }
}

// ── Validation ─────────────────────────────────────────────────────
function validate(): boolean {
  const newErrors: Record<string, string> = {};
  if (!formData.title.trim()) newErrors.title = 'Title is required';
  if (!formData.clientCompany.trim()) {
    newErrors.clientCompany = 'Client Company is required. Please enter manually or select from CRM Entity.';
    if (activeStep.value !== 'branding') activeStep.value = 'branding';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

function handleSave() {
  if (validate()) {
    showErrorToast.value = false;

    const updatedData: ProposalData = {
      ...JSON.parse(JSON.stringify(formData)),
      version: props.initialData ? Number(formData.version) + 0.1 : 1,
      lastModified: new Date().toISOString()
    };

    emit('save', updatedData);
  } else {
    errorToastMessage.value = 'Please fill in the required fields before saving.';
    showErrorToast.value = true;
    setTimeout(() => {
      showErrorToast.value = false;
    }, 5000);
  }
}

// ── Status Color Map ───────────────────────────────────────────────
function getStatusColor(status: string): string {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'In Review':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Sent':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
}

// ── Active Custom Section ──────────────────────────────────────────
const activeCustomSection = computed(() => {
  return formData.customSections?.find(s => s.id === activeStep.value) || null;
});

// ── Active Step Index (for past/active styling) ────────────────────
const activeIndex = computed(() => {
  return orderedSteps.value.findIndex(s => s.id === activeStep.value);
});

// ── New Section Enter Key ──────────────────────────────────────────
function onNewSectionKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleAddSection();
}
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-50 font-sans text-gray-800">
    <!-- Global Print Styles -->
    <component :is="'style'">
      @media print { @page { margin: 0; size: auto; } nav, aside, header, .print\:hidden, .no-print { display: none !important; } html, body, #root,
      #__nuxt { height: auto !important; min-height: auto !important; overflow: visible !important; position: static !important; width: 100%
      !important; margin: 0 !important; padding: 0 !important; display: block !important; } .flex, .h-screen, .min-h-screen, .overflow-hidden,
      .overflow-y-auto, .fixed { display: block !important; height: auto !important; overflow: visible !important; position: static !important; }
      #proposal-print-container { display: block !important; visibility: visible !important; position: absolute; left: 0; top: 0; width: 100%;
      background: white; z-index: 9999; } body > *:not(#__nuxt) { display: none !important; } }
    </component>

    <!-- Error Toast Notification -->
    <div v-if="showErrorToast" class="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div class="bg-red-50 border border-red-200 rounded-2xl shadow-xl shadow-red-100/50 p-4 max-w-md flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertCircle :size="20" class="text-red-600" />
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-red-800 text-sm">Validation Error</h4>
          <p class="text-red-600 text-xs mt-1">{{ errorToastMessage }}</p>
          <p v-if="errors.clientCompany" class="text-red-500 text-xs mt-2 flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
            Client Company is required
          </p>
          <p v-if="errors.title" class="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
            Proposal Title is required
          </p>
        </div>
        <button class="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-lg transition-colors" @click="showErrorToast = false">
          <X :size="16" />
        </button>
      </div>
    </div>

    <!-- EDITOR UI -->
    <div class="flex flex-col h-full print:hidden">
      <!-- TOP BAR -->
      <div
        class="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-4 flex justify-between items-center z-20 shadow-sm h-18 flex-shrink-0"
      >
        <div class="flex items-center gap-4">
          <button class="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" @click="emit('cancel')">
            <ChevronLeft :size="20" />
          </button>
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-extrabold text-gray-900 leading-none tracking-tight">{{ formData.title || 'Untitled Proposal' }}</h2>
              <span :class="['text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border', getStatusColor(formData.status)]">
                {{ formData.status }}
              </span>
            </div>
            <p class="text-xs text-gray-400 font-medium mt-1 flex items-center gap-2">
              <span>Ref: {{ formData.refNumber }}</span>
              <span class="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>v{{ formData.version }}.0</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden lg:flex items-center gap-2 bg-gray-100/50 rounded-lg p-1">
            <button
              class="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900"
              title="Full Screen"
              @click="handleFullScreen"
            >
              <Maximize2 :size="16" />
            </button>
            <button
              class="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900"
              title="Zoom Out"
              @click="handleZoomOut"
            >
              <ZoomOut :size="16" />
            </button>
            <span class="text-xs font-bold text-gray-400 w-8 text-center">{{ Math.round(zoom * 100) }}%</span>
            <button
              class="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-900"
              title="Zoom In"
              @click="handleZoomIn"
            >
              <ZoomIn :size="16" />
            </button>
          </div>

          <div class="h-8 w-px bg-gray-200 mx-1"></div>

          <!-- Preview Toggle -->
          <button
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm',
              showPreview
                ? 'bg-violet-50 text-violet-700 border border-violet-100 shadow-violet-100'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            ]"
            @click="showPreview = !showPreview"
          >
            <Eye v-if="showPreview" :size="16" />
            <EyeOff v-else :size="16" />
            {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
          </button>

          <button
            class="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            title="Print/PDF"
            @click="handlePrint"
          >
            <Printer :size="20" />
          </button>

          <button
            :disabled="isGeneratingPdf"
            class="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            title="Download PDF"
            @click="handleDownloadPDF"
          >
            <Loader2 v-if="isGeneratingPdf" :size="20" class="animate-spin" />
            <Download v-else :size="20" />
          </button>

          <button
            class="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black flex items-center gap-2 shadow-lg shadow-gray-200/50 transition-all active:scale-95 hover:-translate-y-0.5"
            @click="handleSave"
          >
            <Save :size="18" />
            Save
          </button>
        </div>
      </div>

      <!-- MAIN BUILDER AREA -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- 1. LEFT SIDEBAR -->
        <div
          :class="[
            'w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative z-10 transition-all duration-300',
            !showPreview ? 'w-80' : ''
          ]"
        >
          <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 px-2">Proposal Steps</h3>
            <div class="space-y-2 relative mb-6">
              <div class="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>
              <div
                v-for="(step, idx) in orderedSteps"
                :key="step.id"
                class="relative z-10 flex items-center gap-2 w-full group cursor-pointer"
                @click="activeStep = step.id"
              >
                <div
                  :class="[
                    'flex-1 flex items-center gap-4 px-3 py-3 text-sm font-medium rounded-2xl transition-all',
                    activeStep === step.id
                      ? 'bg-violet-50/80 text-violet-700 shadow-sm ring-1 ring-violet-100'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  ]"
                >
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 flex-shrink-0',
                      activeStep === step.id
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                        : activeIndex > idx
                          ? 'bg-violet-100 text-violet-600 border-violet-100'
                          : 'bg-white text-gray-400 border-gray-200 group-hover:border-gray-300'
                    ]"
                  >
                    <CheckCircle v-if="activeIndex > idx" :size="14" />
                    <template v-else>{{ idx + 1 }}</template>
                  </div>
                  <div class="text-left w-full truncate">
                    <span class="block leading-none mb-0.5 truncate">{{ step.label }}</span>
                    <span v-if="activeStep === step.id" class="text-[10px] text-violet-400 font-normal animate-pulse">Editing now...</span>
                  </div>
                </div>
                <div class="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                  <button
                    :disabled="idx === 0"
                    class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    @click="handleMoveStep(idx, 'up')"
                  >
                    <ArrowUp :size="12" />
                  </button>
                  <button
                    :disabled="idx === orderedSteps.length - 1"
                    class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    @click="handleMoveStep(idx, 'down')"
                  >
                    <ArrowDown :size="12" />
                  </button>
                  <button
                    v-if="step.id !== 'branding'"
                    class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    @click.stop="handleDeleteStep(step.id)"
                  >
                    <Trash2 :size="12" />
                  </button>
                </div>
                <ChevronRight
                  v-if="step.id !== activeStep"
                  :size="16"
                  class="ml-auto text-violet-400 flex-shrink-0 opacity-0 group-hover:opacity-100"
                />
              </div>
            </div>

            <!-- Add Custom Section -->
            <button
              v-if="!isAddingSection"
              class="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-xs hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
              @click="isAddingSection = true"
            >
              <Plus :size="14" />
              Add Custom Section
            </button>
            <div v-else class="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in fade-in zoom-in-95">
              <label class="block text-xs font-bold text-gray-500 mb-2">New Section Name</label>
              <input
                v-model="newSectionTitle"
                autofocus
                placeholder="e.g. Portfolio"
                class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-violet-500 outline-none"
                @keydown="onNewSectionKeyDown"
              />
              <div class="flex gap-2">
                <button class="flex-1 bg-violet-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700" @click="handleAddSection">
                  Add
                </button>
                <button
                  class="flex-1 bg-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300"
                  @click="isAddingSection = false"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. MIDDLE (Editor Form) -->
        <div
          :class="[
            'flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar transition-all duration-300',
            showPreview ? 'max-w-[45%]' : 'max-w-full mx-auto'
          ]"
        >
          <div class="max-w-3xl mx-auto space-y-8 pb-20">
            <!-- Dynamic Custom Section Editor -->
            <div v-if="activeCustomSection" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex-1 mr-4">
                    <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input
                      :value="activeCustomSection.title"
                      class="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 w-full bg-transparent outline-none placeholder-gray-300"
                      :placeholder="$t('proposals.sectionName')"
                      @input="handleUpdateCustomSectionTitle(activeCustomSection!.id, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <button
                    type="button"
                    class="text-red-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                    @click="handleDeleteStep(activeCustomSection!.id)"
                  >
                    <Trash2 :size="16" />
                    Delete
                  </button>
                </div>
                <p class="text-sm text-gray-500 mb-6">Add your custom content for this section.</p>
                <ProposalsProposalRichTextEditor
                  :model-value="activeCustomSection.content"
                  :placeholder="`Enter details for ${activeCustomSection.title}...`"
                  class="bg-gray-50"
                  min-height="400px"
                  @update:model-value="handleUpdateCustomSection(activeCustomSection!.id, $event)"
                />
              </div>
            </div>

            <!-- BRANDING STEP -->
            <div v-if="activeStep === 'branding'" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600"><Palette :size="20" /></div>
                  <input
                    :value="formData.stepLabels?.branding || 'Branding & Details'"
                    class="text-xl font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none flex-1"
                    @input="handleStepLabelChange('branding', ($event.target as HTMLInputElement).value)"
                  />
                </h3>

                <div class="space-y-8">
                  <!-- Logo Upload -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">Company Logo</label>
                    <div class="flex items-center gap-5">
                      <div
                        class="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50/50 overflow-hidden group hover:border-violet-400 transition-colors relative"
                      >
                        <img v-if="formData.logo" :src="formData.logo" alt="Logo" class="w-full h-full object-contain p-2" />
                        <ImageIcon v-else :size="24" class="text-gray-300 group-hover:text-violet-400 transition-colors" />
                        <input type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" @change="handleLogoUpload" />
                      </div>
                      <div class="space-y-2">
                        <button
                          class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm relative overflow-hidden"
                        >
                          <input type="file" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" @change="handleLogoUpload" />
                          Upload New Logo
                        </button>
                        <p class="text-xs text-gray-400">Recommended size: 200x200px (PNG)</p>
                      </div>
                    </div>
                  </div>

                  <!-- Proposal Type Selection -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">Proposal Type</label>
                    <div class="grid grid-cols-3 gap-4">
                      <button
                        v-for="pType in proposalTypes"
                        :key="pType.id"
                        :class="[
                          'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                          (formData.type || 'MIXED') === pType.id
                            ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-md ring-1 ring-violet-200'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        ]"
                        @click="handleChange('type', pType.id)"
                      >
                        <div
                          :class="[
                            'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                            (formData.type || 'MIXED') === pType.id ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-400'
                          ]"
                        >
                          <component :is="pType.icon" :size="18" />
                        </div>
                        <span class="text-sm font-bold">{{ pType.label }}</span>
                        <span class="text-[10px] opacity-70 mt-1">{{ pType.desc }}</span>
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-8">
                    <!-- Colors -->
                    <div>
                      <label class="block text-sm font-bold text-gray-700 mb-4">Theme Color</label>
                      <div class="flex gap-3 flex-wrap">
                        <button
                          v-for="c in colors"
                          :key="c"
                          :class="[
                            'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                            formData.themeColor === c ? 'ring-2 ring-offset-2 ring-gray-300 scale-110 shadow-md' : 'hover:scale-105'
                          ]"
                          :style="{ backgroundColor: c }"
                          @click="handleChange('themeColor', c)"
                        >
                          <CheckCircle v-if="formData.themeColor === c" :size="16" class="text-white/80" />
                        </button>
                      </div>
                    </div>
                    <!-- Fonts -->
                    <div>
                      <label class="block text-sm font-bold text-gray-700 mb-4">Typography</label>
                      <div class="flex bg-gray-100 p-1.5 rounded-xl">
                        <button
                          v-for="f in ['sans', 'serif', 'mono']"
                          :key="f"
                          :class="[
                            'flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all',
                            formData.font === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                          ]"
                          @click="handleChange('font', f)"
                        >
                          {{ f }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Cover Style -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-4">Cover Page Style</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        v-for="style in coverStyles"
                        :key="style"
                        :class="[
                          'border-2 rounded-2xl p-3 text-left transition-all group',
                          formData.coverStyle === style
                            ? 'border-violet-500 bg-violet-50/50 ring-0 shadow-lg shadow-violet-100'
                            : 'border-transparent bg-gray-100 hover:bg-gray-100 hover:border-gray-200'
                        ]"
                        @click="handleChange('coverStyle', style)"
                      >
                        <div
                          :class="[
                            'aspect-[3/4] mb-3 rounded-xl overflow-hidden relative shadow-inner',
                            formData.coverStyle === style ? 'bg-white' : 'bg-gray-200'
                          ]"
                        >
                          <!-- Mini-Preview Content -->
                          <div v-if="style === 'business'" class="absolute inset-0 bg-white flex flex-col">
                            <div class="h-2/3 bg-white"></div>
                            <div class="h-1/3 bg-slate-800"></div>
                          </div>
                          <div v-if="style === 'corporate'" class="absolute inset-0 bg-white flex">
                            <div class="w-1/3 h-full bg-slate-800"></div>
                            <div class="w-2/3 h-full bg-white"></div>
                          </div>
                          <div v-if="style === 'creative'" class="absolute inset-0 bg-white">
                            <div
                              class="absolute top-0 right-0 w-full h-full bg-slate-800"
                              style="clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%)"
                            ></div>
                            <div class="absolute bottom-10 left-4 w-12 h-1 bg-violet-500"></div>
                          </div>
                          <div v-if="style === 'enterprise'" class="absolute inset-0 bg-white flex flex-col">
                            <div class="h-12 bg-slate-900"></div>
                            <div class="flex-1 border-4 border-slate-900 m-4"></div>
                          </div>
                          <div v-if="style === 'minimal'" class="absolute inset-0 bg-white items-center justify-center flex">
                            <div class="w-12 h-1 bg-slate-900"></div>
                          </div>
                          <div v-if="style === 'tech'" class="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <div class="w-full h-px bg-green-500"></div>
                          </div>
                          <div v-if="style === 'modern-art'" class="absolute inset-0 bg-white overflow-hidden">
                            <div class="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-violet-200 opacity-50"></div>
                            <div class="absolute top-10 left-[-10px] w-12 h-12 rounded-full bg-violet-600"></div>
                          </div>
                          <div v-if="style === 'geometric'" class="absolute inset-0 bg-white flex">
                            <div class="w-1/3 h-full bg-slate-900 flex flex-col justify-end p-1">
                              <div class="w-full h-1 bg-violet-500 mb-1"></div>
                            </div>
                            <div class="flex-1 p-2"><div class="w-8 h-8 border-2 border-violet-500"></div></div>
                          </div>
                          <div v-if="style === 'bold-typography'" class="absolute inset-0 bg-white flex flex-col justify-center px-2">
                            <div class="w-2 h-full absolute left-0 top-0 bg-slate-900"></div>
                            <div class="h-2 w-12 bg-violet-500 mb-2"></div>
                            <div class="h-4 w-full bg-slate-800 mb-1"></div>
                            <div class="h-4 w-2/3 bg-slate-800"></div>
                          </div>
                          <div v-if="style === 'gradient-splash'" class="absolute inset-0 bg-white">
                            <div class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-b-3xl"></div>
                          </div>
                          <div v-if="style === 'swiss'" class="absolute inset-0 bg-white p-2 flex flex-col justify-between">
                            <div class="w-full h-px bg-black"></div>
                            <div class="flex-1 mt-2">
                              <div class="h-4 w-16 bg-black mb-1"></div>
                              <div class="h-4 w-10 bg-red-600"></div>
                            </div>
                            <div class="w-full h-px bg-black"></div>
                          </div>
                          <div v-if="style === 'dark-mode'" class="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                            <div class="w-10 h-10 rounded-full border border-violet-500 mb-2 shadow-[0_0_10px_rgba(124,58,237,0.5)]"></div>
                            <div class="h-1 w-12 bg-violet-500"></div>
                          </div>
                          <div
                            v-if="style === 'architectural'"
                            class="absolute inset-0 bg-white p-2"
                            :style="{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '10px 10px' }"
                          >
                            <div class="border border-blue-900 h-full w-full flex flex-col justify-end p-2">
                              <div class="w-full h-8 border-t border-blue-900"></div>
                            </div>
                          </div>
                          <div v-if="style === 'abstract'" class="absolute inset-0 bg-white overflow-hidden">
                            <div class="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] rounded-full bg-violet-100"></div>
                            <div class="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-violet-50"></div>
                            <div class="absolute top-[40%] left-[20%] w-8 h-8 rounded-full bg-violet-400 blur-sm"></div>
                          </div>
                          <div v-if="style === 'neon-night'" class="absolute inset-0 bg-black flex flex-col justify-center items-center">
                            <div class="w-16 h-1 bg-cyan-400 shadow-[0_0_8px_cyan]"></div>
                            <div class="mt-2 w-10 h-1 bg-pink-500 shadow-[0_0_8px_magenta]"></div>
                          </div>
                          <div v-if="style === 'brutalist'" class="absolute inset-0 bg-stone-200 p-2">
                            <div class="border-4 border-black h-full w-full flex items-center justify-center">
                              <div class="bg-black text-white px-2 py-1 text-[8px] font-bold uppercase">Proposal</div>
                            </div>
                          </div>
                          <div v-if="style === 'nature'" class="absolute inset-0 bg-[#fdfcf0] flex flex-col justify-end">
                            <div class="h-16 w-full bg-[#e8eed9] rounded-t-full"></div>
                          </div>
                          <div v-if="style === 'japanese-minimal'" class="absolute inset-0 bg-white flex items-center justify-center">
                            <div class="w-8 h-8 rounded-full bg-red-600"></div>
                            <div class="absolute right-2 top-2 w-1 h-12 bg-black"></div>
                          </div>
                          <div v-if="style === 'retro-pop'" class="absolute inset-0 bg-yellow-300 p-2 overflow-hidden">
                            <div class="absolute -right-4 -top-4 w-12 h-12 bg-blue-500 rounded-full border-2 border-black"></div>
                            <div class="absolute bottom-2 left-2 w-full h-4 bg-pink-500 border-2 border-black transform -rotate-3"></div>
                          </div>
                          <div
                            v-if="style === 'futuristic-grid'"
                            class="absolute inset-0 bg-slate-900 p-1"
                            :style="{
                              backgroundImage:
                                'linear-gradient(rgba(0,255,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.2) 1px, transparent 1px)',
                              backgroundSize: '10px 10px'
                            }"
                          >
                            <div class="border border-green-500/50 h-full w-full relative">
                              <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500"></div>
                              <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500"></div>
                            </div>
                          </div>
                          <div v-if="style === 'ethereal'" class="absolute inset-0 bg-white flex flex-col justify-end">
                            <div class="h-12 w-full bg-violet-100 rounded-tr-[50px] opacity-70"></div>
                            <div class="h-8 w-2/3 bg-violet-200 rounded-tr-[50px]"></div>
                          </div>
                          <div v-if="style === 'aurora'" class="absolute inset-0 bg-slate-900 overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900"></div>
                            <div class="absolute bottom-[-10px] w-full h-10 bg-gradient-to-t from-violet-500/30 to-transparent blur-md"></div>
                          </div>
                          <div
                            v-if="style === 'midnight-gradient'"
                            class="absolute inset-0 bg-gradient-to-b from-blue-900 to-purple-900 flex flex-col items-center justify-center"
                          >
                            <div class="w-12 h-12 rounded-full border border-white/20"></div>
                          </div>
                          <div
                            v-if="style === 'art-deco'"
                            class="absolute inset-0 bg-black border-4 border-[#D4AF37] flex items-center justify-center"
                          >
                            <div class="w-16 h-16 border border-[#D4AF37] transform rotate-45"></div>
                          </div>
                          <div v-if="style === 'newspaper'" class="absolute inset-0 bg-[#f0f0f0] p-2 flex flex-col">
                            <div class="w-full h-2 bg-black mb-1"></div>
                            <div class="flex gap-1 flex-1">
                              <div class="w-1/3 bg-gray-300"></div>
                              <div class="w-2/3 bg-gray-200"></div>
                            </div>
                          </div>
                          <div v-if="style === 'terminal'" class="absolute inset-0 bg-black p-2 font-mono text-[8px] text-green-500">
                            &gt; INIT...
                            <br />
                            &gt; LOAD
                          </div>
                          <div v-if="style === 'brush-stroke'" class="absolute inset-0 bg-white flex items-center justify-center">
                            <div class="w-20 h-8 bg-red-200 -skew-x-12 rounded-sm"></div>
                          </div>
                          <div v-if="style === 'mondrian'" class="absolute inset-0 bg-white border-2 border-black grid grid-cols-2 grid-rows-2">
                            <div class="bg-red-600 border-r-2 border-b-2 border-black"></div>
                            <div class="bg-white border-b-2 border-black"></div>
                            <div class="bg-yellow-400 border-r-2 border-black"></div>
                            <div class="bg-blue-600"></div>
                          </div>
                          <div
                            v-if="style === 'blueprint-dark'"
                            class="absolute inset-0 bg-[#00509d] p-1"
                            :style="{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '10px 10px' }"
                          >
                            <div class="border border-white w-full h-full"></div>
                          </div>
                          <div v-if="style === 'warm-boho'" class="absolute inset-0 bg-[#e3d5ca] flex items-center justify-center">
                            <div class="w-16 h-16 rounded-full bg-[#d5bdaf]"></div>
                          </div>
                          <div
                            v-if="style === 'glassmorphism'"
                            class="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-300 flex items-center justify-center"
                          >
                            <div class="w-20 h-12 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg"></div>
                          </div>
                          <div v-if="style === 'magazine-editorial'" class="absolute inset-0 bg-white">
                            <div class="h-1/2 bg-gray-200"></div>
                            <div class="p-2">
                              <div class="h-4 w-4 bg-black text-white text-[8px] flex items-center justify-center font-bold">M</div>
                            </div>
                          </div>
                        </div>
                        <span
                          :class="[
                            'text-xs font-bold capitalize block text-center',
                            formData.coverStyle === style ? 'text-violet-700' : 'text-gray-500'
                          ]"
                        >
                          {{ style.replace(/-/g, ' ') }}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Document & Client Details -->
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Document &amp; Client Details</h3>
                <div class="grid grid-cols-12 gap-6">
                  <div class="col-span-12">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Proposal Title
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      :value="formData.title"
                      :class="[
                        'w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none font-bold text-lg transition-all',
                        errors.title ? 'border-red-500' : 'border-transparent'
                      ]"
                      placeholder="e.g. Digital Transformation Roadmap"
                      @input="handleChange('title', ($event.target as HTMLInputElement).value)"
                    />
                    <p v-if="errors.title" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle :size="10" />
                      {{ errors.title }}
                    </p>
                  </div>
                  <div class="col-span-6 md:col-span-4">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Reference ID</label>
                    <input
                      :value="formData.refNumber"
                      class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 outline-none font-mono text-sm transition-all"
                      @input="handleChange('refNumber', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div class="col-span-6 md:col-span-4">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Version</label>
                    <div class="flex items-center">
                      <span class="bg-gray-100 border border-r-0 border-transparent px-4 py-3 rounded-l-xl text-gray-500 text-sm font-bold">v</span>
                      <input
                        type="number"
                        :value="formData.version"
                        class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-r-xl focus:bg-white focus:border-violet-500 outline-none font-bold transition-all"
                        @input="handleChange('version', parseFloat(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                  </div>
                  <div class="col-span-6 md:col-span-4">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                    <input
                      type="date"
                      :value="formData.date"
                      class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-violet-500 outline-none text-sm font-medium transition-all"
                      @input="handleChange('date', ($event.target as HTMLInputElement).value)"
                    />
                  </div>

                  <!-- CRM Entity Selector -->
                  <div class="col-span-12">
                    <ProposalsProposalCRMEntitySelector v-model="selectedEntity as unknown" />
                  </div>

                  <div class="col-span-12 pt-6 mt-4 border-t border-gray-100 bg-violet-50/50 p-6 rounded-2xl border border-violet-100">
                    <h4 class="text-sm font-bold text-violet-800 mb-4 flex items-center gap-2">
                      <User :size="16" />
                      Client Information (Prepared For)
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Client Company
                          <span class="text-red-500">*</span>
                        </label>
                        <input
                          :value="formData.clientCompany"
                          :placeholder="$t('proposals.companyName')"
                          :class="[
                            'w-full px-4 py-3 bg-white border-2 rounded-xl focus:border-violet-500 outline-none text-sm font-bold text-gray-800 transition-all shadow-sm',
                            errors.clientCompany ? 'border-red-500' : 'border-transparent'
                          ]"
                          @input="handleChange('clientCompany', ($event.target as HTMLInputElement).value)"
                        />
                        <p v-if="errors.clientCompany" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle :size="10" />
                          {{ errors.clientCompany }}
                        </p>
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Contact Name</label>
                        <input
                          :value="formData.clientName"
                          :placeholder="$t('proposals.contactPerson')"
                          class="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-violet-500 outline-none text-sm font-bold text-gray-800 transition-all shadow-sm"
                          @input="handleChange('clientName', ($event.target as HTMLInputElement).value)"
                        />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Contact Email</label>
                        <input
                          :value="formData.clientEmail"
                          placeholder="email@company.com"
                          class="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-violet-500 outline-none text-sm font-medium transition-all shadow-sm"
                          @input="handleChange('clientEmail', ($event.target as HTMLInputElement).value)"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="col-span-12 border-t border-gray-100 pt-6 mt-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-4">Client Branding (Optional)</label>
                    <div
                      class="flex items-center gap-5 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-white hover:border-violet-300 transition-all group"
                    >
                      <div class="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        <img v-if="formData.clientLogo" :src="formData.clientLogo" alt="Client Logo" class="w-full h-full object-contain p-2" />
                        <ImageIcon v-else :size="20" class="text-gray-300" />
                      </div>
                      <div>
                        <label class="cursor-pointer text-sm font-bold text-gray-700 hover:text-violet-600 transition-colors inline-block">
                          Upload Client Logo
                          <input type="file" class="hidden" accept="image/*" @change="handleClientLogoUpload" />
                        </label>
                        <p class="text-[10px] text-gray-400 mt-1">Logo will appear on the cover page for personalization.</p>
                      </div>
                    </div>
                  </div>

                  <!-- File Attachments -->
                  <div class="col-span-12 border-t border-gray-100 pt-6 mt-2">
                    <ProposalsProposalFileUploader v-model="attachments as unknown" />
                  </div>
                </div>
              </div>
            </div>

            <!-- EXECUTIVE STEP -->
            <div v-if="activeStep === 'executive'" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-xl font-bold text-gray-900 flex-1">
                    <input
                      :value="formData.stepLabels?.executive || 'Executive Summary'"
                      class="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full"
                      @input="handleStepLabelChange('executive', ($event.target as HTMLInputElement).value)"
                    />
                  </h3>
                  <button
                    type="button"
                    class="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"
                    title="Delete Section"
                    @click="handleDeleteStep('executive')"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
                <p class="text-sm text-gray-500 mb-6">A high-level overview of the proposal.</p>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.introduction"
                  :placeholder="$t('proposals.introPlaceholder')"
                  class="bg-gray-50"
                  min-height="250px"
                  @update:model-value="handleChange('introduction', $event)"
                />
              </div>
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <h3 class="text-xl font-bold text-gray-900 mb-2">Key Objectives</h3>
                <p class="text-sm text-gray-500 mb-6">What will this project achieve?</p>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.objectives"
                  placeholder="1. Increase operational efficiency..."
                  class="bg-gray-50"
                  min-height="200px"
                  @update:model-value="handleChange('objectives', $event)"
                />
              </div>
            </div>

            <!-- SOLUTION STEP -->
            <div v-if="activeStep === 'solution'" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xl font-bold text-gray-900 flex-1">
                    <input
                      :value="formData.stepLabels?.solution || 'Solution & Scope'"
                      class="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full"
                      @input="handleStepLabelChange('solution', ($event.target as HTMLInputElement).value)"
                    />
                  </h3>
                  <button
                    type="button"
                    class="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"
                    title="Delete Section"
                    @click="handleDeleteStep('solution')"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.scopeOfWork"
                  class="bg-gray-50"
                  min-height="400px"
                  @update:model-value="handleChange('scopeOfWork', $event)"
                />
              </div>
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Methodology</h3>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.methodology"
                  class="bg-gray-50"
                  min-height="250px"
                  @update:model-value="handleChange('methodology', $event)"
                />
              </div>
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xl font-bold text-gray-900">Project Phases</h3>
                  <button
                    class="text-violet-600 hover:bg-violet-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    @click="addPhase"
                  >
                    <Plus :size="16" />
                    Add Phase
                  </button>
                </div>
                <div class="space-y-4">
                  <div
                    v-for="phase in formData.phases"
                    :key="phase.id"
                    class="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 relative group hover:border-violet-200 transition-all"
                  >
                    <button
                      class="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-white rounded-lg shadow-sm"
                      @click="removePhase(phase.id)"
                    >
                      <X :size="16" />
                    </button>
                    <div class="grid grid-cols-2 gap-4">
                      <input
                        :value="phase.name"
                        :placeholder="$t('proposals.phaseName')"
                        class="bg-white border-2 border-transparent p-3 rounded-xl text-sm font-bold focus:border-violet-500 outline-none transition-all"
                        @input="handlePhaseChange(phase.id, 'name', ($event.target as HTMLInputElement).value)"
                      />
                      <input
                        :value="phase.duration"
                        :placeholder="$t('proposals.duration')"
                        class="bg-white border-2 border-transparent p-3 rounded-xl text-sm font-medium focus:border-violet-500 outline-none transition-all"
                        @input="handlePhaseChange(phase.id, 'duration', ($event.target as HTMLInputElement).value)"
                      />
                      <input
                        :value="phase.deliverables"
                        :placeholder="$t('proposals.deliverables')"
                        class="col-span-2 bg-white border-2 border-transparent p-3 rounded-xl text-sm text-gray-600 focus:border-violet-500 outline-none transition-all"
                        @input="handlePhaseChange(phase.id, 'deliverables', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FINANCIAL STEP -->
            <div v-if="activeStep === 'financial'" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xl font-bold text-gray-900 flex-1">
                    <input
                      :value="formData.stepLabels?.financial || 'Investment'"
                      class="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full"
                      @input="handleStepLabelChange('financial', ($event.target as HTMLInputElement).value)"
                    />
                  </h3>
                  <button
                    type="button"
                    class="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"
                    title="Delete Section"
                    @click="handleDeleteStep('financial')"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>

                <!-- Profitability Tuner -->
                <div
                  class="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 mb-8 shadow-lg shadow-violet-200 text-white flex items-center justify-between"
                >
                  <div class="flex items-center gap-4">
                    <div class="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><Calculator :size="24" class="text-white" /></div>
                    <div>
                      <h4 class="text-base font-bold text-white">Profitability Tuner</h4>
                      <p class="text-xs text-violet-100 opacity-80">Adjust margin for all items instantly.</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm">
                      <input
                        type="number"
                        :value="globalMargin"
                        class="w-20 p-3 text-lg font-bold text-center outline-none bg-transparent text-white placeholder-white/50"
                        placeholder="0"
                        @input="globalMargin = parseFloat(($event.target as HTMLInputElement).value)"
                      />
                      <span class="pr-4 text-sm font-bold text-white/70">%</span>
                    </div>
                    <button
                      class="bg-white text-violet-700 px-5 py-3 rounded-xl text-xs font-bold hover:bg-violet-50 transition-colors shadow-sm"
                      @click="applyGlobalMargin"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <!-- Pricing Table -->
                <div class="flex justify-between items-center mb-6 px-2">
                  <h3 class="text-xl font-bold text-gray-900">Pricing Table</h3>
                  <button
                    class="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2"
                    @click="addItem"
                  >
                    <Plus :size="16" />
                    Add Item
                  </button>
                </div>
                <div class="overflow-hidden rounded-xl border border-gray-100">
                  <table class="w-full text-left">
                    <thead class="bg-gray-50/80">
                      <tr class="text-xs text-gray-500 uppercase tracking-wider">
                        <th class="py-4 pl-6 font-bold">Description</th>
                        <th class="py-4 w-20 text-center font-bold">Unit</th>
                        <th class="py-4 w-20 text-center font-bold">Qty</th>
                        <th class="py-4 w-28 text-right font-bold text-gray-400">Cost</th>
                        <th class="py-4 w-24 text-right font-bold text-blue-600">Margin</th>
                        <th class="py-4 w-28 text-right font-bold">Price</th>
                        <th class="py-4 w-28 text-right font-bold">Total</th>
                        <th class="py-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="item in formData.items" :key="item.id" class="group hover:bg-gray-50/50 transition-colors">
                        <td class="py-3 pl-4">
                          <input
                            :value="item.description"
                            class="w-full bg-transparent outline-none text-sm p-2 rounded-lg focus:bg-white focus:ring-2 focus:ring-violet-100 font-medium"
                            :placeholder="$t('proposals.itemName')"
                            @input="handleItemChange(item.id, 'description', ($event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-3">
                          <input
                            :value="item.unit"
                            class="w-full bg-transparent outline-none text-sm p-2 text-center text-gray-500"
                            @input="handleItemChange(item.id, 'unit', ($event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-3">
                          <input
                            type="number"
                            :value="item.quantity"
                            class="w-full bg-transparent outline-none text-sm p-2 text-center font-bold"
                            @input="handleItemChange(item.id, 'quantity', parseFloat(($event.target as HTMLInputElement).value))"
                          />
                        </td>
                        <td class="py-3">
                          <div class="relative mx-2">
                            <input
                              type="number"
                              :value="item.cost || 0"
                              class="w-full bg-gray-100/50 rounded-lg border-none outline-none text-xs p-2 text-right text-gray-500 font-mono focus:ring-2 focus:ring-gray-200 transition-all"
                              @input="handleItemChange(item.id, 'cost', parseFloat(($event.target as HTMLInputElement).value))"
                            />
                          </div>
                        </td>
                        <td class="py-3">
                          <div class="relative mx-2">
                            <input
                              type="number"
                              :value="item.margin !== undefined ? Number(item.margin).toFixed(1) : 0"
                              class="w-full bg-blue-50/50 rounded-lg border-none outline-none text-xs p-2 text-right text-blue-600 font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                              @input="handleItemChange(item.id, 'margin', parseFloat(($event.target as HTMLInputElement).value))"
                            />
                          </div>
                        </td>
                        <td class="py-3">
                          <input
                            type="number"
                            :value="item.rate !== undefined ? Number(item.rate).toFixed(2) : 0"
                            class="w-full bg-transparent outline-none text-sm p-2 text-right font-bold text-gray-900"
                            @input="handleItemChange(item.id, 'rate', parseFloat(($event.target as HTMLInputElement).value))"
                          />
                        </td>
                        <td class="py-3 text-right text-sm font-extrabold text-gray-800 pr-4">
                          {{ (item.quantity * item.rate).toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
                        </td>
                        <td class="py-3 text-center">
                          <button
                            class="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-all"
                            @click="removeItem(item.id)"
                          >
                            <X :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Tax & Discount -->
                <div class="mt-8 pt-8 border-t border-gray-100 flex justify-end">
                  <div class="w-72 space-y-4 bg-gray-50/50 p-6 rounded-2xl">
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-500 font-medium">Tax Rate (%)</span>
                      <input
                        type="number"
                        :value="formData.taxRate"
                        class="w-20 text-right bg-white border border-gray-200 rounded-lg p-1.5 text-sm font-bold focus:border-violet-500 outline-none"
                        @input="handleChange('taxRate', parseFloat(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-500 font-medium">Discount</span>
                      <div class="flex gap-2">
                        <select
                          :value="formData.discountType"
                          class="text-xs border border-gray-200 rounded-lg bg-white px-1 outline-none"
                          @change="handleChange('discountType', ($event.target as HTMLSelectElement).value)"
                        >
                          <option value="percent">%</option>
                          <option value="fixed">$</option>
                        </select>
                        <input
                          type="number"
                          :value="formData.discount"
                          class="w-20 text-right bg-white border border-gray-200 rounded-lg p-1.5 text-sm font-bold focus:border-violet-500 outline-none"
                          @input="handleChange('discount', parseFloat(($event.target as HTMLInputElement).value))"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- LEGAL STEP -->
            <div v-if="activeStep === 'legal'" class="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xl font-bold text-gray-900 flex-1">
                    <input
                      :value="formData.stepLabels?.legal || 'Terms & Legal'"
                      class="font-bold text-gray-900 border-none focus:ring-0 bg-transparent outline-none w-full"
                      @input="handleStepLabelChange('legal', ($event.target as HTMLInputElement).value)"
                    />
                  </h3>
                  <button
                    type="button"
                    class="text-red-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"
                    title="Delete Section"
                    @click="handleDeleteStep('legal')"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
                <h3 class="text-lg font-bold text-gray-700 mb-4">Payment Terms</h3>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.paymentTerms"
                  min-height="150px"
                  @update:model-value="handleChange('paymentTerms', $event)"
                />
              </div>
              <div class="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white">
                <h3 class="text-lg font-bold text-gray-700 mb-4">Terms &amp; Conditions</h3>
                <ProposalsProposalRichTextEditor
                  :model-value="formData.termsAndConditions"
                  min-height="250px"
                  @update:model-value="handleChange('termsAndConditions', $event)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 3. RIGHT (Live Preview) -->
        <div
          v-if="showPreview"
          class="flex-1 bg-slate-100 overflow-y-auto flex flex-col items-center p-12 relative print:hidden border-l border-gray-200/50 shadow-inner"
          :style="{
            backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }"
        >
          <div
            :style="{ transform: `scale(${zoom})`, transformOrigin: 'top center', paddingBottom: '100px' }"
            class="transition-transform duration-200"
          >
            <ProposalsProposalPrintTemplate :form-data="formData as unknown" />
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Print Area -->
    <div id="proposal-print-container" class="hidden print:block">
      <ProposalsProposalPrintTemplate :form-data="formData as unknown" />
    </div>
  </div>
</template>
