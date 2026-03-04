<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">{{ $t("dataImport.title") }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t("dataImport.subtitle") }}</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ totalImports }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("dataImport.totalImports") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ recordsImported.toLocaleString() }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("dataImport.recordsImported") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ failedRecords }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("dataImport.failedRecords") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ lastImportDate }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("dataImport.lastImport") }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- New Import -->
      <el-tab-pane :label="$t('dataImport.newImport')" name="new">
        <div class="glass-panel p-6 rounded-xl mb-6">
          <h3 class="text-sm font-medium text-slate-200 mb-4">{{ $t("dataImport.selectEntityType") }}</h3>
          <div class="flex gap-3 mb-6">
            <div
              v-for="entity in entityTypes"
              :key="entity.value"
              class="glass-panel p-4 rounded-xl cursor-pointer flex-1 text-center transition-all"
              :class="selectedEntity === entity.value ? 'border-2 !border-indigo-500/60' : 'hover:border-primary-500/30'"
              @click="selectedEntity = entity.value"
            >
              <Icon
                :name="entity.icon"
                class="w-8 h-8 mx-auto mb-2"
                :class="selectedEntity === entity.value ? 'text-indigo-400' : 'text-slate-500'"
              />
              <div class="text-xs font-medium" :class="selectedEntity === entity.value ? 'text-indigo-400' : 'text-slate-400'">
                {{ entity.label }}
              </div>
            </div>
          </div>

          <h3 class="text-sm font-medium text-slate-200 mb-4">{{ $t("dataImport.uploadFile") }}</h3>
          <div
            class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
            :class="isDragging ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-600'"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <Icon name="ph:cloud-arrow-up-bold" class="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p class="text-sm text-slate-400 mb-1">{{ $t("dataImport.dragAndDrop") }}</p>
            <p class="text-xs text-slate-600">{{ $t("dataImport.supportedFormats") }}</p>
            <div v-if="uploadedFile" class="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400">
              <Icon name="ph:file-text-bold" class="w-4 h-4" />
              {{ uploadedFile.name }} ({{ formatFileSize(uploadedFile.size) }})
              <el-button text type="danger" size="small" @click.stop="uploadedFile = null">
                <Icon name="ph:x-bold" class="w-3 h-3" />
              </el-button>
            </div>
          </div>
          <input ref="fileInputRef" type="file" accept=".csv,.xlsx,.xls" class="hidden" @change="handleFileSelect" />

          <!-- Import Settings -->
          <div v-if="uploadedFile" class="mt-6">
            <h3 class="text-sm font-medium text-slate-200 mb-4">{{ $t("dataImport.importSettings") }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-500 mb-2">{{ $t("dataImport.duplicateHandling") }}</label>
                <el-select v-model="importSettings.duplicateHandling" class="w-full">
                  <el-option label="Skip duplicates" value="skip" />
                  <el-option label="Update existing records" value="update" />
                  <el-option label="Create new records" value="create" />
                </el-select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-2">{{ $t("dataImport.requiredFieldValidation") }}</label>
                <el-select v-model="importSettings.validation" class="w-full">
                  <el-option label="Strict - Skip invalid rows" value="strict" />
                  <el-option label="Lenient - Import all rows" value="lenient" />
                </el-select>
              </div>
            </div>
          </div>

          <!-- Preview Table -->
          <div v-if="previewData.length" class="mt-6">
            <h3 class="text-sm font-medium text-slate-200 mb-4">{{ $t("dataImport.preview") }}</h3>
            <el-table :data="previewData" class="glass-table" stripe max-height="300">
              <el-table-column v-for="col in previewColumns" :key="col" :prop="col" :label="col" min-width="150">
                <template #default="{ row }">
                  <span class="text-xs text-slate-300">{{ row[col] }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="flex justify-end mt-4">
              <el-button type="primary" class="!rounded-xl" :loading="importing" @click="startImport">
                <Icon name="ph:upload-bold" class="w-4 h-4 mr-2" />
                {{ $t("dataImport.startImport") }} ({{ previewData.length }}+)
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Import History -->
      <el-tab-pane :label="$t('dataImport.importHistory')" name="history">
        <div class="glass-panel p-1 rounded-xl">
          <el-table :data="importHistory" stripe>
            <el-table-column :label="$t('dataImport.date')" width="160">
              <template #default="{ row }">
                <span class="text-sm text-slate-300">{{ row.date }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.entity')" width="120">
              <template #default="{ row }">
                <el-tag effect="plain" size="small" round>{{ row.entity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.file')" min-width="180">
              <template #default="{ row }">
                <div class="flex items-center gap-2">
                  <Icon name="ph:file-csv-bold" class="w-4 h-4 text-slate-500" />
                  <span class="text-sm text-slate-300 truncate">{{ row.fileName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.total')" width="90" align="center">
              <template #default="{ row }">
                <span class="text-sm font-medium text-slate-200">{{ row.totalRecords }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.success')" width="90" align="center">
              <template #default="{ row }">
                <span class="text-sm font-medium text-emerald-400">{{ row.successCount }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.failed')" width="90" align="center">
              <template #default="{ row }">
                <span class="text-sm font-medium" :class="row.failedCount > 0 ? 'text-red-400' : 'text-slate-500'">{{ row.failedCount }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.statusLabel')" width="120">
              <template #default="{ row }">
                <el-tag :type="getImportStatusType(row.status)" effect="dark" size="small" round>{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('dataImport.user')" width="140">
              <template #default="{ row }">
                <span class="text-sm text-slate-400">{{ row.user }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Field Mapping -->
      <el-tab-pane :label="$t('dataImport.fieldMapping')" name="mapping">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-medium text-slate-200">{{ $t("dataImport.mapColumns") }}</h3>
              <p class="text-xs text-slate-500 mt-1">{{ $t("dataImport.mapColumnsDesc") }}</p>
            </div>
            <el-select v-model="mappingEntity" :placeholder="$t('dataImport.selectEntity')" class="w-44">
              <el-option v-for="entity in entityTypes" :key="entity.value" :label="entity.label" :value="entity.value" />
            </el-select>
          </div>

          <div class="space-y-3">
            <div
              v-for="mapping in fieldMappings"
              :key="mapping.source"
              class="flex items-center gap-4 p-3 rounded-lg"
              style="background: rgba(255, 255, 255, 0.02)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <Icon name="ph:file-text-bold" class="w-4 h-4 text-slate-500" />
                  <span class="text-sm text-slate-300">{{ mapping.source }}</span>
                </div>
              </div>
              <Icon name="ph:arrow-right-bold" class="w-4 h-4 text-slate-600" />
              <div class="flex-1">
                <el-select v-model="mapping.target" :placeholder="$t('dataImport.selectCrmField')" class="w-full" clearable>
                  <el-option v-for="field in getCrmFields(mappingEntity)" :key="field.value" :label="field.label" :value="field.value" />
                </el-select>
              </div>
              <el-tag v-if="mapping.required" type="danger" effect="plain" size="small">{{ $t("dataImport.required") }}</el-tag>
            </div>
          </div>

          <div class="flex justify-end mt-4 gap-2">
            <el-button @click="resetMapping">{{ $t("common.reset") }}</el-button>
            <el-button type="primary" class="!rounded-xl" @click="saveMapping">
              <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
              {{ $t("dataImport.saveMapping") }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({ layout: 'default', middleware: 'permissions' });

const activeTab = ref('new');
const selectedEntity = ref('leads');
const isDragging = ref(false);
const uploadedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const importing = ref(false);
const mappingEntity = ref('leads');

const totalImports = ref(34);
const recordsImported = ref(12480);
const failedRecords = ref(47);
const lastImportDate = ref('Feb 18');

const importSettings = ref({
  duplicateHandling: 'skip',
  validation: 'strict'
});

const entityTypes = [
  { label: 'Leads', value: 'leads', icon: 'ph:user-focus-bold' },
  { label: 'Contacts', value: 'contacts', icon: 'ph:address-book-bold' },
  { label: 'Deals', value: 'deals', icon: 'ph:handshake-bold' },
  { label: 'Products', value: 'products', icon: 'ph:package-bold' }
];

const previewColumns = ref(['Name', 'Email', 'Phone', 'Company', 'Source']);

const previewData = ref<Record<string, string>[]>([
  { Name: 'Ahmed Al-Rashid', Email: 'ahmed@example.com', Phone: '+966 50 123 4567', Company: 'TechCorp SA', Source: 'Website' },
  { Name: 'Sara Mansour', Email: 'sara@example.com', Phone: '+966 55 987 6543', Company: 'Digital Solutions', Source: 'Referral' },
  { Name: 'Tariq Nasser', Email: 'tariq@example.com', Phone: '+966 54 456 7890', Company: 'Gulf Trading', Source: 'LinkedIn' },
  { Name: 'Lina Khalid', Email: 'lina@example.com', Phone: '+966 56 321 0987', Company: 'Smart Services', Source: 'Event' },
  { Name: 'Youssef Ali', Email: 'youssef@example.com', Phone: '+966 50 654 3210', Company: 'Vision Group', Source: 'Website' }
]);

const importHistory = ref([
  {
    id: 1,
    date: 'Feb 18, 2026 14:23',
    entity: 'Leads',
    fileName: 'leads_q1_2026.csv',
    totalRecords: 350,
    successCount: 342,
    failedCount: 8,
    status: 'Completed',
    user: 'Ahmed F.'
  },
  {
    id: 2,
    date: 'Feb 15, 2026 09:10',
    entity: 'Contacts',
    fileName: 'contacts_export.xlsx',
    totalRecords: 1200,
    successCount: 1185,
    failedCount: 15,
    status: 'Completed',
    user: 'Sara M.'
  },
  {
    id: 3,
    date: 'Feb 12, 2026 16:45',
    entity: 'Products',
    fileName: 'products_catalog.csv',
    totalRecords: 89,
    successCount: 89,
    failedCount: 0,
    status: 'Completed',
    user: 'Ahmed F.'
  },
  {
    id: 4,
    date: 'Feb 10, 2026 11:30',
    entity: 'Deals',
    fileName: 'deals_migration.xlsx',
    totalRecords: 200,
    successCount: 178,
    failedCount: 22,
    status: 'Completed',
    user: 'Omar H.'
  },
  {
    id: 5,
    date: 'Feb 08, 2026 08:00',
    entity: 'Leads',
    fileName: 'tradeshow_leads.csv',
    totalRecords: 500,
    successCount: 498,
    failedCount: 2,
    status: 'Completed',
    user: 'Nada S.'
  },
  {
    id: 6,
    date: 'Feb 05, 2026 13:15',
    entity: 'Contacts',
    fileName: 'old_crm_contacts.csv',
    totalRecords: 3200,
    successCount: 0,
    failedCount: 3200,
    status: 'Failed',
    user: 'Sara M.'
  },
  {
    id: 7,
    date: 'Feb 03, 2026 10:00',
    entity: 'Leads',
    fileName: 'webinar_attendees.xlsx',
    totalRecords: 150,
    successCount: 150,
    failedCount: 0,
    status: 'Completed',
    user: 'Tariq N.'
  }
]);

const fieldMappings = ref([
  { source: 'Full Name', target: 'name', required: true },
  { source: 'Email Address', target: 'email', required: true },
  { source: 'Phone Number', target: 'phone', required: false },
  { source: 'Company Name', target: 'company', required: false },
  { source: 'Lead Source', target: 'source', required: false },
  { source: 'City', target: 'city', required: false },
  { source: 'Notes', target: 'notes', required: false }
]);

const crmFieldsByEntity: Record<string, { label: string; value: string }[]> = {
  leads: [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Company', value: 'company' },
    { label: 'Source', value: 'source' },
    { label: 'City', value: 'city' },
    { label: 'Notes', value: 'notes' },
    { label: 'Status', value: 'status' }
  ],
  contacts: [
    { label: 'First Name', value: 'firstName' },
    { label: 'Last Name', value: 'lastName' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Company', value: 'company' },
    { label: 'Role', value: 'role' }
  ],
  deals: [
    { label: 'Deal Name', value: 'name' },
    { label: 'Amount', value: 'amount' },
    { label: 'Stage', value: 'stage' },
    { label: 'Close Date', value: 'closeDate' },
    { label: 'Client', value: 'clientId' }
  ],
  products: [
    { label: 'Product Name', value: 'name' },
    { label: 'SKU', value: 'sku' },
    { label: 'Price', value: 'price' },
    { label: 'Category', value: 'category' },
    { label: 'Quantity', value: 'quantity' }
  ]
};

function getCrmFields(entity: string) {
  return crmFieldsByEntity[entity] || crmFieldsByEntity.leads;
}

function getImportStatusType(status: string): 'success' | 'danger' | 'warning' | undefined {
  const map: Record<string, 'success' | 'danger' | 'warning'> = {
    Completed: 'success',
    Failed: 'danger',
    'In Progress': 'warning'
  };
  return map[status] ?? undefined;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    uploadedFile.value = input.files[0] ?? null;
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files?.length) {
    const file = files[0]!;
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (validTypes.includes(ext)) {
      uploadedFile.value = file ?? null;
    } else {
      ElMessage.warning(t('dataImport.uploadFileRequired'));
    }
  }
}

function startImport() {
  importing.value = true;
  setTimeout(() => {
    importing.value = false;
    ElMessage.success(`Import completed for ${selectedEntity.value}`);
    activeTab.value = 'history';
  }, 2000);
}

function resetMapping() {
  fieldMappings.value.forEach(m => {
    m.target = '';
  });
  ElMessage.info(t('dataImport.mappingReset'));
}

function saveMapping() {
  ElMessage.success(t('dataImport.mappingSaved'));
}
</script>
