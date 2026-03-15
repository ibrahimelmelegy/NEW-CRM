<template>
  <div class="relative">
    <!-- Label -->
    <label class="block text-sm font-semibold text-gray-700 mb-2">Link to CRM Entity</label>

    <!-- Selected Value / Trigger -->
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all duration-200',
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-violet-400 cursor-pointer',
        isOpen ? 'border-violet-500 ring-2 ring-violet-100' : 'border-gray-200'
      ]"
      @click="toggleDropdown"
    >
      <div v-if="modelValue" class="flex items-center gap-3">
        <div :class="['p-1.5 rounded-lg', getEntityTypeConfig(modelValue.type)?.color]">
          <component :is="getEntityTypeConfig(modelValue.type)?.icon" :size="16" :class="getEntityTypeConfig(modelValue.type)?.color.split(' ')[0]" />
        </div>
        <div>
          <p class="font-medium text-gray-900">{{ modelValue.name }}</p>
          <p class="text-xs text-gray-500">{{ modelValue.type }}</p>
        </div>
      </div>
      <span v-else class="text-gray-400">Select Opportunity, Deal, or Project...</span>

      <div class="flex items-center gap-2">
        <button v-if="modelValue && !disabled" class="p-1 hover:bg-gray-100 rounded-full transition-colors" @click.stop="handleClear">
          <X :size="16" class="text-gray-400" />
        </button>
        <ChevronDown :size="20" :class="['text-gray-400 transition-transform', { 'rotate-180': isOpen }]" />
      </div>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <!-- Entity Type Tabs -->
      <div class="flex border-b border-gray-100 p-2 gap-1">
        <button
          v-for="et in entityTypes"
          :key="et.type"
          :class="[
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            entityType === et.type ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-50'
          ]"
          @click="entityType = et.type"
        >
          <component :is="et.icon" :size="16" />
          {{ et.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="p-3 border-b border-gray-100">
        <div class="relative">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="`Search ${entityType.toLowerCase()}s...`"
            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            autofocus
          />
        </div>
      </div>

      <!-- Results -->
      <div class="max-h-64 overflow-y-auto">
        <div v-if="isLoadingEntities" class="flex items-center justify-center py-8">
          <Loader2 :size="24" class="animate-spin text-violet-500" />
        </div>

        <template v-else-if="filteredEntities.length > 0">
          <button
            v-for="entity in filteredEntities"
            :key="entity.id"
            class="w-full px-4 py-3 text-left hover:bg-violet-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
            @click="handleSelect(entity)"
          >
            <div :class="['p-2 rounded-lg', getEntityTypeConfig(entityType)?.color]">
              <component :is="getEntityTypeConfig(entityType)?.icon" :size="16" :class="getEntityTypeConfig(entityType)?.color.split(' ')[0]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">
                {{ entity.name || entity.title }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ entity.company || entity.client?.name || entity.description || `ID: ${entity.id}` }}
              </p>
            </div>
            <span v-if="entity.status" class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {{ entity.status }}
            </span>
          </button>
        </template>

        <div v-else class="py-8 text-center text-gray-500">
          <p class="text-sm">No {{ entityType.toLowerCase() }}s found</p>
          <p v-if="searchTerm" class="text-xs mt-1">Try a different search term</p>
        </div>
      </div>
    </div>

    <!-- Backdrop to close dropdown -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, markRaw, type Component } from 'vue';
import { Search, Building2, Briefcase, FolderKanban, ChevronDown, X, Loader2 } from 'lucide-vue-next';
import logger from '~/utils/logger'

// ---- Types ----
type EntityType = 'Opportunity' | 'Deal' | 'Project';

interface SelectedEntity {
  id: string | number;
  type: string;
  name: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
}

interface EntityTypeConfig {
  type: EntityType;
  icon: Component;
  label: string;
  color: string;
}

// ---- Props ----
interface Props {
  modelValue: SelectedEntity | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false
});

// ---- Emits ----
const emit = defineEmits<{
  'update:modelValue': [entity: SelectedEntity | null];
}>();

// ---- State ----
const isOpen = ref(false);
const entityType = ref<EntityType>('Opportunity');
const searchTerm = ref('');

// CRM data
const opportunities = ref<Record<string, unknown>[]>([]);
const deals = ref<Record<string, unknown>[]>([]);
const projects = ref<Record<string, unknown>[]>([]);
const isLoadingOpportunities = ref(false);
const isLoadingDeals = ref(false);
const isLoadingProjects = ref(false);

// ---- Entity type configs ----
const entityTypes: EntityTypeConfig[] = [
  { type: 'Opportunity', icon: markRaw(Building2), label: 'Opportunity', color: 'text-blue-600 bg-blue-50' },
  { type: 'Deal', icon: markRaw(Briefcase), label: 'Deal', color: 'text-green-600 bg-green-50' },
  { type: 'Project', icon: markRaw(FolderKanban), label: 'Project', color: 'text-purple-600 bg-purple-50' }
];

// ---- Computed ----
const currentEntities = computed(() => {
  switch (entityType.value) {
    case 'Opportunity':
      return opportunities.value || [];
    case 'Deal':
      return deals.value || [];
    case 'Project':
      return projects.value || [];
    default:
      return [];
  }
});

const isLoadingEntities = computed(() => {
  switch (entityType.value) {
    case 'Opportunity':
      return isLoadingOpportunities.value;
    case 'Deal':
      return isLoadingDeals.value;
    case 'Project':
      return isLoadingProjects.value;
    default:
      return false;
  }
});

const filteredEntities = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return currentEntities.value.filter(entity => entity.name?.toLowerCase().includes(term) || entity.title?.toLowerCase().includes(term));
});

// ---- Methods ----
const getEntityTypeConfig = (type: string) => {
  return entityTypes.find(e => e.type === type);
};

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const handleSelect = (entity: unknown) => {
  const clientData = entity.client || {};

  emit('update:modelValue', {
    type: entityType.value,
    id: entity.id,
    name: entity.name || entity.title,
    clientName: clientData.name || entity.contactName || '',
    clientCompany: clientData.companyName || clientData.name || entity.companyName || entity.name || entity.title || '',
    clientEmail: clientData.email || entity.email || ''
  });

  isOpen.value = false;
  searchTerm.value = '';
};

const handleClear = () => {
  emit('update:modelValue', null);
};

// ---- Fetch CRM entities ----
const fetchOpportunities = async () => {
  isLoadingOpportunities.value = true;
  try {
    const response = await useApiFetch('opportunity', 'GET');
    if (response.success && response.body) {
      opportunities.value = Array.isArray(response.body) ? response.body : (response.body as unknown).rows || [];
    }
  } catch (error) {
    logger.error('Failed to fetch opportunities:', error);
  } finally {
    isLoadingOpportunities.value = false;
  }
};

const fetchDeals = async () => {
  isLoadingDeals.value = true;
  try {
    const response = await useApiFetch('deal', 'GET');
    if (response.success && response.body) {
      deals.value = Array.isArray(response.body) ? response.body : (response.body as unknown).rows || [];
    }
  } catch (error) {
    logger.error('Failed to fetch deals:', error);
  } finally {
    isLoadingDeals.value = false;
  }
};

const fetchProjects = async () => {
  isLoadingProjects.value = true;
  try {
    const response = await useApiFetch('project', 'GET');
    if (response.success && response.body) {
      projects.value = Array.isArray(response.body) ? response.body : (response.body as unknown).rows || [];
    }
  } catch (error) {
    logger.error('Failed to fetch projects:', error);
  } finally {
    isLoadingProjects.value = false;
  }
};

// Fetch entities when the entity type changes (lazy loading)
watch(
  entityType,
  newType => {
    switch (newType) {
      case 'Opportunity':
        if (opportunities.value.length === 0) fetchOpportunities();
        break;
      case 'Deal':
        if (deals.value.length === 0) fetchDeals();
        break;
      case 'Project':
        if (projects.value.length === 0) fetchProjects();
        break;
    }
  },
  { immediate: false }
);

// Fetch initial entities when dropdown opens
watch(isOpen, opened => {
  if (opened) {
    switch (entityType.value) {
      case 'Opportunity':
        if (opportunities.value.length === 0) fetchOpportunities();
        break;
      case 'Deal':
        if (deals.value.length === 0) fetchDeals();
        break;
      case 'Project':
        if (projects.value.length === 0) fetchProjects();
        break;
    }
  }
});
</script>
