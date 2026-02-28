<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">Form Builder</h1>
          <p class="text-slate-400 text-sm mt-1">Create public lead capture forms, surveys, and registration pages.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="createNewForm">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          New Form
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ forms.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Forms</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ totalSubmissions }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Submissions</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ activeForms }}</div>
        <div class="text-xs text-slate-500 mt-1">Active Forms</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ avgConversion }}%</div>
        <div class="text-xs text-slate-500 mt-1">Avg Conversion</div>
      </div>
    </div>

    <!-- Tabs: My Forms / Templates -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- My Forms -->
      <el-tab-pane label="My Forms" name="forms">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {{ form.isActive ? 'Active' : 'Draft' }}
              </el-tag>
            </div>

            <!-- Form Stats -->
            <div class="grid grid-cols-3 gap-2 my-3 py-3 border-t border-b border-slate-800/60">
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ form.submissions }}</div>
                <div class="text-[10px] text-slate-500">Submissions</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold text-slate-200">{{ form.views }}</div>
                <div class="text-[10px] text-slate-500">Views</div>
              </div>
              <div class="text-center">
                <div class="text-sm font-bold" :class="form.conversionRate > 20 ? 'text-emerald-400' : 'text-amber-400'">
                  {{ form.conversionRate }}%
                </div>
                <div class="text-[10px] text-slate-500">Conversion</div>
              </div>
            </div>

            <!-- Field Count & Date -->
            <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>{{ form.fieldCount }} fields</span>
              <span>Updated {{ formatDate(form.updatedAt) }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <el-button size="small" text type="primary" @click="editForm(form)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                Edit
              </el-button>
              <el-button size="small" text @click="previewForm(form)">
                <Icon name="ph:eye" class="w-4 h-4 mr-1" />
                Preview
              </el-button>
              <el-button size="small" text @click="copyFormLink(form)">
                <Icon name="ph:link" class="w-4 h-4 mr-1" />
                Link
              </el-button>
              <el-button size="small" text @click="viewSubmissions(form)">
                <Icon name="ph:list-bullets" class="w-4 h-4 mr-1" />
                Data
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Form Templates -->
      <el-tab-pane label="Templates" name="templates">
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
                <p class="text-xs text-slate-500">{{ tmpl.fieldCount }} fields</p>
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
      <el-tab-pane label="Builder" name="builder">
        <div class="grid grid-cols-12 gap-4">
          <!-- Field Palette -->
          <div class="col-span-3 glass-panel p-4 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-3">Field Types</h3>
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
                <span class="text-xs text-slate-300">{{ field.label }}</span>
              </div>
            </div>
          </div>

          <!-- Form Canvas -->
          <div class="col-span-6 glass-panel p-6 rounded-xl min-h-[400px]" @dragover.prevent @drop="onDropField">
            <div class="text-center mb-6">
              <h2 class="text-lg font-bold text-slate-200">{{ currentForm.title || 'Untitled Form' }}</h2>
              <p class="text-sm text-slate-500">{{ currentForm.description || 'Add a description' }}</p>
            </div>

            <div v-if="currentForm.fields.length === 0" class="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl">
              <Icon name="ph:cursor-click-bold" class="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p class="text-sm text-slate-500">Click or drag fields from the palette to start building</p>
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
                <p class="text-xs text-slate-500">Upload file</p>
              </el-upload>
            </div>
          </div>

          <!-- Properties Panel -->
          <div class="col-span-3 glass-panel p-4 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-3">Form Settings</h3>
            <el-form label-position="top" size="small">
              <el-form-item label="Form Title">
                <el-input v-model="currentForm.title" placeholder="Form title" />
              </el-form-item>
              <el-form-item label="Description">
                <el-input v-model="currentForm.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="Submit Button Text">
                <el-input v-model="currentForm.submitText" placeholder="Submit" />
              </el-form-item>
              <el-form-item label="Redirect URL">
                <el-input v-model="currentForm.redirectUrl" placeholder="https://..." />
              </el-form-item>
              <el-form-item label="Notify on Submit">
                <el-switch v-model="currentForm.notifyOnSubmit" />
              </el-form-item>
              <el-form-item label="Map to Entity">
                <el-select v-model="currentForm.mapToEntity" class="w-full">
                  <el-option label="Lead" value="lead" />
                  <el-option label="Contact" value="contact" />
                  <el-option label="Support Ticket" value="ticket" />
                </el-select>
              </el-form-item>
            </el-form>
            <el-button type="primary" class="w-full mt-4" @click="saveForm">
              <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
              Save Form
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

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const activeTab = ref('forms');
let dragField = '';

interface FormField {
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
}
interface FormDef {
  title: string;
  description: string;
  submitText: string;
  redirectUrl: string;
  notifyOnSubmit: boolean;
  mapToEntity: string;
  fields: FormField[];
}

const currentForm = ref<FormDef>({
  title: 'Contact Us',
  description: 'Get in touch with our team',
  submitText: 'Submit',
  redirectUrl: '',
  notifyOnSubmit: true,
  mapToEntity: 'lead',
  fields: []
});

const forms = ref([
  {
    id: 1,
    name: 'Website Contact Form',
    type: 'Lead Capture',
    isActive: true,
    submissions: 342,
    views: 1820,
    conversionRate: 18.8,
    fieldCount: 5,
    updatedAt: '2026-02-18'
  },
  {
    id: 2,
    name: 'Event Registration',
    type: 'Registration',
    isActive: true,
    submissions: 128,
    views: 450,
    conversionRate: 28.4,
    fieldCount: 8,
    updatedAt: '2026-02-15'
  },
  {
    id: 3,
    name: 'Product Feedback Survey',
    type: 'Survey',
    isActive: false,
    submissions: 89,
    views: 210,
    conversionRate: 42.4,
    fieldCount: 12,
    updatedAt: '2026-02-10'
  },
  {
    id: 4,
    name: 'Newsletter Signup',
    type: 'Lead Capture',
    isActive: true,
    submissions: 567,
    views: 3200,
    conversionRate: 17.7,
    fieldCount: 3,
    updatedAt: '2026-02-19'
  },
  {
    id: 5,
    name: 'Demo Request',
    type: 'Lead Capture',
    isActive: true,
    submissions: 45,
    views: 320,
    conversionRate: 14.1,
    fieldCount: 7,
    updatedAt: '2026-02-17'
  },
  {
    id: 6,
    name: 'Partner Application',
    type: 'Application',
    isActive: false,
    submissions: 23,
    views: 150,
    conversionRate: 15.3,
    fieldCount: 15,
    updatedAt: '2026-01-20'
  }
]);

const templates = ref([
  {
    id: 1,
    name: 'Contact Us',
    icon: 'ph:envelope-simple-bold',
    gradient: 'from-blue-500 to-blue-600',
    fieldCount: 5,
    description: 'Standard contact form with name, email, phone, subject, message.',
    tags: ['Lead Capture', 'Basic']
  },
  {
    id: 2,
    name: 'Event Registration',
    icon: 'ph:ticket-bold',
    gradient: 'from-purple-500 to-purple-600',
    fieldCount: 8,
    description: 'Event signup with attendee details, dietary preferences, session selection.',
    tags: ['Events', 'Registration']
  },
  {
    id: 3,
    name: 'Customer Feedback',
    icon: 'ph:star-bold',
    gradient: 'from-amber-500 to-amber-600',
    fieldCount: 10,
    description: 'NPS-style feedback form with rating scales and open-ended questions.',
    tags: ['Survey', 'Feedback']
  },
  {
    id: 4,
    name: 'Job Application',
    icon: 'ph:briefcase-bold',
    gradient: 'from-emerald-500 to-emerald-600',
    fieldCount: 12,
    description: 'Job application form with resume upload, experience, education.',
    tags: ['HR', 'Application']
  },
  {
    id: 5,
    name: 'Product Demo Request',
    icon: 'ph:presentation-chart-bold',
    gradient: 'from-rose-500 to-rose-600',
    fieldCount: 7,
    description: 'Demo request with company info, use case, and preferred time.',
    tags: ['Sales', 'Demo']
  },
  {
    id: 6,
    name: 'Newsletter Signup',
    icon: 'ph:newspaper-bold',
    gradient: 'from-teal-500 to-teal-600',
    fieldCount: 3,
    description: 'Simple email capture with optional name and interests.',
    tags: ['Marketing', 'Simple']
  }
]);

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: 'ph:textbox-bold' },
  { type: 'email', label: 'Email', icon: 'ph:envelope-simple-bold' },
  { type: 'phone', label: 'Phone', icon: 'ph:phone-bold' },
  { type: 'textarea', label: 'Text Area', icon: 'ph:align-left-bold' },
  { type: 'dropdown', label: 'Dropdown', icon: 'ph:caret-down-bold' },
  { type: 'checkbox', label: 'Checkbox', icon: 'ph:check-square-bold' },
  { type: 'date', label: 'Date Picker', icon: 'ph:calendar-bold' },
  { type: 'rating', label: 'Star Rating', icon: 'ph:star-bold' },
  { type: 'file', label: 'File Upload', icon: 'ph:upload-bold' }
];

const totalSubmissions = computed(() => forms.value.reduce((s, f) => s + f.submissions, 0));
const activeForms = computed(() => forms.value.filter(f => f.isActive).length);
const avgConversion = computed(() => {
  const active = forms.value.filter(f => f.isActive);
  if (!active.length) return 0;
  return (active.reduce((s, f) => s + f.conversionRate, 0) / active.length).toFixed(1);
});

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

const getFormTypeBg = (type: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'bg-blue-500/10',
    Registration: 'bg-purple-500/10',
    Survey: 'bg-amber-500/10',
    Application: 'bg-emerald-500/10'
  };
  return m[type] || 'bg-slate-500/10';
};
const getFormTypeIcon = (type: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'ph:magnet-bold',
    Registration: 'ph:ticket-bold',
    Survey: 'ph:chart-bar-bold',
    Application: 'ph:clipboard-text-bold'
  };
  return m[type] || 'ph:file-bold';
};
const getFormTypeColor = (type: string) => {
  const m: Record<string, string> = {
    'Lead Capture': 'text-blue-400',
    Registration: 'text-purple-400',
    Survey: 'text-amber-400',
    Application: 'text-emerald-400'
  };
  return m[type] || 'text-slate-400';
};

const addFieldToForm = (type: string) => {
  const labels: Record<string, string> = {
    text: 'Text Field',
    email: 'Email Address',
    phone: 'Phone Number',
    textarea: 'Message',
    dropdown: 'Select Option',
    checkbox: 'Agreement',
    date: 'Date',
    rating: 'Rating',
    file: 'File Upload'
  };
  currentForm.value.fields.push({
    type,
    label: labels[type] || 'New Field',
    placeholder: `Enter ${labels[type]?.toLowerCase() || 'value'}`,
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

const createNewForm = () => {
  currentForm.value = { title: '', description: '', submitText: 'Submit', redirectUrl: '', notifyOnSubmit: true, mapToEntity: 'lead', fields: [] };
  activeTab.value = 'builder';
};

const editForm = (form: any) => {
  activeTab.value = 'builder';
  ElMessage.info(`Editing: ${form.name}`);
};
const previewForm = (form: any) => ElMessage.info(`Preview: ${form.name}`);
const copyFormLink = (form: any) => {
  navigator.clipboard?.writeText(`https://forms.example.com/${form.id}`);
  ElMessage.success(t('common.copied'));
};
const viewSubmissions = (form: any) => ElMessage.info(`${form.submissions} submissions for ${form.name}`);
const useTemplate = (tmpl: any) => {
  ElMessage.info(`Using template: ${tmpl.name}`);
  activeTab.value = 'builder';
};
const saveForm = () => {
  ElMessage.success(t('common.saved'));
  activeTab.value = 'forms';
};
</script>
