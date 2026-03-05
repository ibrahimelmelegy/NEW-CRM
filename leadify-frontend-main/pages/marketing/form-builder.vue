<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
            {{ $t('formBuilder.title') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('formBuilder.subtitle') }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="loading" @click="createNewForm">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t('formBuilder.newForm') }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ forms.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('formBuilder.totalForms') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ totalSubmissions }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('formBuilder.totalSubmissions') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ activeForms.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('formBuilder.activeForms') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ avgConversion }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('formBuilder.avgConversion') }}</div>
      </div>
    </div>

    <!-- Tabs: My Forms / Templates -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- My Forms -->
      <el-tab-pane :label="$t('formBuilder.myForms')" name="forms">
        <div v-loading="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="form in forms" :key="form.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all group">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getFormTypeBg(form.type)">
                  <Icon :name="getFormTypeIcon(form.type)" class="w-5 h-5" :class="getFormTypeColor(form.type)" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ form.name }}</h4>
                  <p class="text-xs text-slate-500">{{ form.type }}</p>
                </div>
              </div>
              <el-tag :type="form.isActive ? 'success' : 'info'" effect="dark" size="small">
                {{ form.isActive ? $t('formBuilder.active') : $t('formBuilder.draft') }}
              </el-tag>
            </div>

            <!-- Form Stats -->
            <div class="grid grid-cols-3 gap-2 my-3 py-3 border-t border-b border-slate-800/60">
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ form.submissions }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('formBuilder.submissions') }}</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ form.views }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('formBuilder.views') }}</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold" :class="form.conversionRate > 20 ? 'text-emerald-400' : 'text-amber-400'">
                  {{ form.conversionRate }}%
                </div>
                <div class="text-[10px] text-slate-500">{{ $t('formBuilder.conversion') }}</div>
              </div>
            </div>

            <!-- Field Count & Date -->
            <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>{{ form.fieldCount }} {{ $t('formBuilder.fields') }}</span>
              <span>{{ $t('formBuilder.updated') }} {{ formatDate(form.updatedAt) }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <el-button size="small" text type="primary" @click="editForm(form)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                {{ $t('formBuilder.edit') }}
              </el-button>
              <el-button size="small" text @click="previewForm(form)">
                <Icon name="ph:eye" class="w-4 h-4 mr-1" />
                {{ $t('formBuilder.preview') }}
              </el-button>
              <el-button size="small" text @click="copyFormLink(form)">
                <Icon name="ph:link" class="w-4 h-4 mr-1" />
                {{ $t('formBuilder.link') }}
              </el-button>
              <el-button size="small" text @click="viewSubmissions(form)">
                <Icon name="ph:list-bullets" class="w-4 h-4 mr-1" />
                {{ $t('formBuilder.data') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Form Templates -->
      <el-tab-pane :label="$t('formBuilder.templates')" name="templates">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="tmpl in templates"
            :key="tmpl.id"
            class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer"
            @click="useTemplate(tmpl)"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center" :class="tmpl.gradient">
                <Icon :name="tmpl.icon" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ tmpl.name }}</h4>
                <p class="text-xs text-slate-500">{{ tmpl.fieldCount }} {{ $t('formBuilder.fields') }}</p>
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-3">{{ tmpl.description }}</p>
            <div class="flex gap-1 flex-wrap">
              <el-tag v-for="tag in tmpl.tags" :key="tag" effect="plain" size="small" class="!text-[10px]">{{ tag }}</el-tag>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Form Builder (inline) -->
      <el-tab-pane :label="$t('formBuilder.builder')" name="builder">
        <div class="grid grid-cols-12 gap-4">
          <!-- Field Palette -->
          <div class="col-span-3 glass-panel p-4 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-3">{{ $t('formBuilder.fieldTypes') }}</h3>
            <div class="space-y-2">
              <div
                v-for="field in fieldTypes"
                :key="field.type"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer transition"
                draggable="true"
                @dragstart="dragField = field.type"
                @click="addFieldToForm(field.type)"
              >
                <Icon :name="field.icon" class="w-4 h-4 text-slate-400" />
                <span class="text-xs text-slate-300">{{ $t(field.labelKey) }}</span>
              </div>
            </div>
          </div>

          <!-- Form Canvas -->
          <div class="col-span-6 glass-panel p-6 rounded-xl min-h-[400px]" @dragover.prevent @drop="onDropField">
            <div class="text-center mb-6">
              <h2 class="text-lg font-bold text-slate-200">{{ currentForm.title || $t('formBuilder.untitledForm') }}</h2>
              <p class="text-sm text-slate-500">{{ currentForm.description || $t('formBuilder.addDescription') }}</p>
            </div>

            <div v-if="currentForm.fields.length === 0" class="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl">
              <Icon name="ph:cursor-click-bold" class="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p class="text-sm text-slate-500">{{ $t('formBuilder.dragDropHint') }}</p>
            </div>

            <div
              v-for="(field, idx) in currentForm.fields"
              :key="idx"
              class="mb-4 p-3 rounded-lg border border-slate-800/60 hover:border-primary-500/30 transition group relative"
            >
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm text-slate-300">{{ field.label }}</label>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <el-button text size="small" @click="removeField(idx)">
                    <Icon name="ph:trash" class="w-3 h-3 text-red-400" />
                  </el-button>
                </div>
              </div>
              <el-input v-if="field.type === 'text' || field.type === 'email' || field.type === 'phone'" :placeholder="field.placeholder" disabled />
              <el-input v-else-if="field.type === 'textarea'" type="textarea" :rows="2" :placeholder="field.placeholder" disabled />
              <el-select v-else-if="field.type === 'dropdown'" class="w-full" disabled :placeholder="field.placeholder" />
              <el-date-picker v-else-if="field.type === 'date'" class="w-full" disabled :placeholder="field.placeholder" />
              <el-checkbox v-else-if="field.type === 'checkbox'" disabled>{{ field.placeholder }}</el-checkbox>
              <el-rate v-else-if="field.type === 'rating'" disabled />
              <el-upload v-else-if="field.type === 'file'" drag :auto-upload="false" disabled class="w-full">
                <p class="text-xs text-slate-500">{{ $t('formBuilder.uploadFile') }}</p>
              </el-upload>
            </div>
          </div>

          <!-- Properties Panel -->
          <div class="col-span-3 glass-panel p-4 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-3">{{ $t('formBuilder.formSettings') }}</h3>
            <el-form label-position="top" size="small">
              <el-form-item :label="$t('formBuilder.formTitle')">
                <el-input v-model="currentForm.title" :placeholder="$t('formBuilder.formTitlePlaceholder')" />
              </el-form-item>
              <el-form-item :label="$t('formBuilder.description')">
                <el-input v-model="currentForm.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item :label="$t('formBuilder.submitButtonText')">
                <el-input v-model="currentForm.submitText" :placeholder="$t('formBuilder.submitPlaceholder')" />
              </el-form-item>
              <el-form-item :label="$t('formBuilder.redirectUrl')">
                <el-input v-model="currentForm.redirectUrl" :placeholder="$t('formBuilder.redirectPlaceholder')" />
              </el-form-item>
              <el-form-item :label="$t('formBuilder.notifyOnSubmit')">
                <el-switch v-model="currentForm.notifyOnSubmit" />
              </el-form-item>
              <el-form-item :label="$t('formBuilder.mapToEntity')">
                <el-select v-model="currentForm.mapToEntity" class="w-full">
                  <el-option :label="$t('formBuilder.entityLead')" value="lead" />
                  <el-option :label="$t('formBuilder.entityContact')" value="contact" />
                  <el-option :label="$t('formBuilder.entityTicket')" value="ticket" />
                </el-select>
              </el-form-item>
            </el-form>
            <el-button type="primary" class="w-full mt-4" :loading="saving" @click="saveForm">
              <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
              {{ $t('formBuilder.saveForm') }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useFormBuilder, type FormBuilderField, type FormBuilderDef } from '~/composables/formBuilder';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const { forms, loading, totalSubmissions, activeForms, avgConversion, fetchForms, createForm, updateForm } = useFormBuilder();

const activeTab = ref('forms');
let dragField = '';
const saving = ref(false);

// ID of the form currently being edited (null = create mode)
const editingFormId = ref<number | null>(null);

interface FormDef {
  title: string;
  description: string;
  submitText: string;
  redirectUrl: string;
  notifyOnSubmit: boolean;
  mapToEntity: string;
  fields: FormBuilderField[];
}

const currentForm = ref<FormDef>({
  title: t('formBuilder.untitledForm'),
  description: '',
  submitText: t('formBuilder.submitPlaceholder'),
  redirectUrl: '',
  notifyOnSubmit: true,
  mapToEntity: 'lead',
  fields: []
});

const templates = ref([
  {
    id: 1,
    name: t('formBuilder.templateContactUs'),
    icon: 'ph:envelope-simple-bold',
    gradient: 'from-blue-500 to-blue-600',
    fieldCount: 5,
    description: t('formBuilder.templateContactUsDesc'),
    tags: [t('formBuilder.tagLeadCapture'), t('formBuilder.tagBasic')]
  },
  {
    id: 2,
    name: t('formBuilder.templateEventReg'),
    icon: 'ph:ticket-bold',
    gradient: 'from-purple-500 to-purple-600',
    fieldCount: 8,
    description: t('formBuilder.templateEventRegDesc'),
    tags: [t('formBuilder.tagEvents'), t('formBuilder.tagRegistration')]
  },
  {
    id: 3,
    name: t('formBuilder.templateFeedback'),
    icon: 'ph:star-bold',
    gradient: 'from-amber-500 to-amber-600',
    fieldCount: 10,
    description: t('formBuilder.templateFeedbackDesc'),
    tags: [t('formBuilder.tagSurvey'), t('formBuilder.tagFeedback')]
  },
  {
    id: 4,
    name: t('formBuilder.templateJobApp'),
    icon: 'ph:briefcase-bold',
    gradient: 'from-emerald-500 to-emerald-600',
    fieldCount: 12,
    description: t('formBuilder.templateJobAppDesc'),
    tags: [t('formBuilder.tagHR'), t('formBuilder.tagApplication')]
  },
  {
    id: 5,
    name: t('formBuilder.templateDemoReq'),
    icon: 'ph:presentation-chart-bold',
    gradient: 'from-rose-500 to-rose-600',
    fieldCount: 7,
    description: t('formBuilder.templateDemoReqDesc'),
    tags: [t('formBuilder.tagSales'), t('formBuilder.tagDemo')]
  },
  {
    id: 6,
    name: t('formBuilder.templateNewsletter'),
    icon: 'ph:newspaper-bold',
    gradient: 'from-teal-500 to-teal-600',
    fieldCount: 3,
    description: t('formBuilder.templateNewsletterDesc'),
    tags: [t('formBuilder.tagMarketing'), t('formBuilder.tagSimple')]
  }
]);

const fieldTypes = [
  { type: 'text', labelKey: 'formBuilder.fieldText', icon: 'ph:textbox-bold' },
  { type: 'email', labelKey: 'formBuilder.fieldEmail', icon: 'ph:envelope-simple-bold' },
  { type: 'phone', labelKey: 'formBuilder.fieldPhone', icon: 'ph:phone-bold' },
  { type: 'textarea', labelKey: 'formBuilder.fieldTextarea', icon: 'ph:align-left-bold' },
  { type: 'dropdown', labelKey: 'formBuilder.fieldDropdown', icon: 'ph:caret-down-bold' },
  { type: 'checkbox', labelKey: 'formBuilder.fieldCheckbox', icon: 'ph:check-square-bold' },
  { type: 'date', labelKey: 'formBuilder.fieldDate', icon: 'ph:calendar-bold' },
  { type: 'rating', labelKey: 'formBuilder.fieldRating', icon: 'ph:star-bold' },
  { type: 'file', labelKey: 'formBuilder.fieldFile', icon: 'ph:upload-bold' }
];

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

const getFormTypeBg = (type?: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'bg-blue-500/10',
    Registration: 'bg-purple-500/10',
    Survey: 'bg-amber-500/10',
    Application: 'bg-emerald-500/10'
  };
  return m[type || ''] || 'bg-slate-500/10';
};
const getFormTypeIcon = (type?: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'ph:magnet-bold',
    Registration: 'ph:ticket-bold',
    Survey: 'ph:chart-bar-bold',
    Application: 'ph:clipboard-text-bold'
  };
  return m[type || ''] || 'ph:file-bold';
};
const getFormTypeColor = (type?: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'text-blue-400',
    Registration: 'text-purple-400',
    Survey: 'text-amber-400',
    Application: 'text-emerald-400'
  };
  return m[type || ''] || 'text-slate-400';
};

const addFieldToForm = (type: string) => {
  const labelKeys: Record<string, string> = {
    text: 'formBuilder.fieldText',
    email: 'formBuilder.fieldEmail',
    phone: 'formBuilder.fieldPhone',
    textarea: 'formBuilder.fieldTextarea',
    dropdown: 'formBuilder.fieldDropdown',
    checkbox: 'formBuilder.fieldCheckbox',
    date: 'formBuilder.fieldDate',
    rating: 'formBuilder.fieldRating',
    file: 'formBuilder.fieldFile'
  };
  const label = t(labelKeys[type] || 'formBuilder.fieldText');
  currentForm.value.fields.push({
    type,
    label,
    placeholder: label,
    required: false
  });
  if (activeTab.value !== 'builder') activeTab.value = 'builder';
};

const onDropField = () => {
  if (dragField) {
    addFieldToForm(dragField);
    dragField = '';
  }
};

const removeField = (idx: number) => currentForm.value.fields.splice(idx, 1);

const resetCurrentForm = () => {
  editingFormId.value = null;
  currentForm.value = {
    title: '',
    description: '',
    submitText: t('formBuilder.submitPlaceholder'),
    redirectUrl: '',
    notifyOnSubmit: true,
    mapToEntity: 'lead',
    fields: []
  };
};

const createNewForm = () => {
  resetCurrentForm();
  activeTab.value = 'builder';
};

const editForm = (form: unknown) => {
  editingFormId.value = form.id;
  currentForm.value = {
    title: form.title || form.name || '',
    description: form.description || '',
    submitText: form.submitText || t('formBuilder.submitPlaceholder'),
    redirectUrl: form.redirectUrl || '',
    notifyOnSubmit: form.notifyOnSubmit ?? true,
    mapToEntity: form.mapToEntity || 'lead',
    fields: form.fields ? [...form.fields] : []
  };
  activeTab.value = 'builder';
  ElMessage.info(`${t('formBuilder.editingForm')}: ${form.name}`);
};

const previewForm = (form: unknown) => ElMessage.info(`${t('formBuilder.previewForm')}: ${form.name}`);

const copyFormLink = (form: unknown) => {
  navigator.clipboard?.writeText(`https://forms.example.com/${form.id}`);
  ElMessage.success(t('common.copied'));
};

const viewSubmissions = (form: unknown) => ElMessage.info(`${form.submissions} ${t('formBuilder.submissionsFor')} ${form.name}`);

const useTemplate = (tmpl: unknown) => {
  ElMessage.info(`${t('formBuilder.editingForm')}: ${tmpl.name}`);
  resetCurrentForm();
  currentForm.value.title = tmpl.name;
  currentForm.value.description = tmpl.description;
  activeTab.value = 'builder';
};

const saveForm = async () => {
  saving.value = true;
  try {
    const payload: FormBuilderDef = { ...currentForm.value };
    let ok: boolean;
    if (editingFormId.value !== null) {
      ok = await updateForm(editingFormId.value, payload as unknown as Record<string, unknown>);
    } else {
      ok = await createForm(payload);
    }
    if (ok) {
      ElMessage.success(t('formBuilder.saveSuccess'));
      resetCurrentForm();
      activeTab.value = 'forms';
    } else {
      ElMessage.error(t('formBuilder.saveError'));
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchForms();
  } catch {
    ElMessage.error(t('formBuilder.loadError'));
  }
});
</script>
