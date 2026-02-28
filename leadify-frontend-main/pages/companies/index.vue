<template lang="pug">
.p-6.animate-entrance
  //- Header Section
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('companies.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('companies.subtitle') }}
    .flex.gap-2
      el-button(
        v-if="selectedCompanies.length > 0"
        type="warning"
        size="default"
        @click="showBulkDialog = true"
        style="border-radius: 12px;"
      )
        Icon(name="ph:pencil-simple" size="16" style="margin-right: 4px;")
        | {{ $t('companies.bulkUpdate') }} ({{ selectedCompanies.length }})
      el-button(
        v-if="selectedCompanies.length === 2"
        type="danger"
        size="default"
        @click="showMergeDialog = true"
        style="border-radius: 12px;"
      )
        Icon(name="ph:git-merge" size="16" style="margin-right: 4px;")
        | {{ $t('companies.merge') }}
      el-button(
        type="primary"
        size="default"
        @click="openAddDialog"
        style="background: var(--bg-obsidian); border: none; border-radius: 12px;"
      )
        Icon(name="ph:buildings" size="16" style="margin-right: 4px;")
        | {{ $t('companies.addCompany') }}

  //- Stats Cards
  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('companies.totalCompanies') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ analytics.totalCompanies || companies.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('companies.active') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ companies.filter(c => c.clientStatus === 'ACTIVE').length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('companies.industries') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ uniqueIndustries }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ avgHealthScoreLabel }}
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ analytics.avgHealthScore || 0 }}

  //- Main Table Card
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    el-table(
      :data="companies"
      style="width: 100%"
      :empty-text="emptyText"
      @selection-change="handleSelectionChange"
    )
      el-table-column(type="selection" width="55")
      el-table-column(:label="labelCompany" min-width="280")
        template(#default="{ row }")
          .flex.items-center.gap-3
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.text-white.font-bold.text-sm(:style="avatarStyle")
              | {{ getInitials(row) }}
            div
              .flex.items-center.gap-2
                p.text-sm.font-bold.cursor-pointer(@click="viewCompanyDetail(row)") {{ row.clientName || row.companyName }}
                el-tag(v-if="row.parentCompanyId" type="info" size="small") {{ $t('companies.subsidiaries') }}
              p.text-xs.text-gray-400 {{ row.industry || '—' }}
      el-table-column(:label="labelWebsite" width="200")
        template(#default="{ row }")
          a.text-xs.text-violet-600(v-if="row.website" :href="row.website" target="_blank") {{ row.website }}
          span.text-gray-400(v-else) —
      el-table-column(:label="labelContacts" width="100" align="center")
        template(#default="{ row }")
          el-badge(:value="row.contactCount || 0" type="primary")
      el-table-column(:label="labelRevenue" width="140" align="right")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ formatRevenue(row.annualRevenue) }}
      el-table-column(:label="labelHealthScore" width="120" align="center")
        template(#default="{ row }")
          el-tooltip(:content="healthScoreTooltip" placement="top")
            el-progress(
              :percentage="row.healthScore || 0"
              :color="getHealthColor(row.healthScore || 0)"
              :stroke-width="8"
              style="width: 80px;"
            )
      el-table-column(:label="labelStatus" width="100")
        template(#default="{ row }")
          el-tag(:type="row.clientStatus === 'ACTIVE' ? 'success' : 'info'" size="small" round) {{ row.clientStatus }}
      el-table-column(width="120")
        template(#default="{ row }")
          .flex.gap-1
            el-button(text circle size="small" @click="viewCompanyDetail(row)")
              Icon(name="ph:eye" size="14")
            el-button(text circle size="small" type="primary" @click="editCompany(row)")
              Icon(name="ph:pencil" size="14")
            el-button(text circle size="small" type="danger" @click="removeCompany(row.id)")
              Icon(name="ph:trash" size="14")

  //- Add/Edit Company Dialog
  el-dialog(
    v-model="showDialog"
    :title="dialogTitle"
    width="700px"
  )
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="labelCompanyName")
          el-input(v-model="form.clientName" :placeholder="placeholderCompanyName")
        el-form-item(:label="labelIndustry")
          el-select(v-model="form.industry" class="w-full")
            el-option(label="Technology" value="Information Technology (IT) & Software")
            el-option(label="Finance" value="Banking & Financial Services")
            el-option(label="Healthcare" value="Healthcare & Medical Services")
            el-option(label="Manufacturing" value="Manufacturing")
            el-option(label="Real Estate" value="Construction & Real Estate")
            el-option(label="Retail" value="Consumer Goods & Retail")
            el-option(label="Education" value="Education & E-Learning")
            el-option(label="Other" value="Other")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="labelWebsite")
          el-input(v-model="form.website" placeholder="https://...")
        el-form-item(:label="labelAnnualRevenue")
          el-input-number(v-model="form.annualRevenue" :min="0" class="!w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="labelStatus")
          el-select(v-model="form.clientStatus" class="w-full")
            el-option(label="Active" value="ACTIVE")
            el-option(label="Inactive" value="INACTIVE")
        el-form-item(:label="labelParentCompany")
          el-select(v-model="form.parentCompanyId" class="w-full" clearable filterable :placeholder="placeholderSelectParent")
            el-option(
              v-for="company in availableParentCompanies"
              :key="company.id"
              :label="company.clientName"
              :value="company.id"
            )
      el-form-item(:label="labelCustomFields")
        .space-y-2
          .flex.gap-2(v-for="(field, idx) in customFieldsArray" :key="idx")
            el-input(v-model="field.name" :placeholder="placeholderFieldName" style="flex: 1;")
            el-input(v-model="field.value" :placeholder="placeholderFieldValue" style="flex: 1;")
            el-button(text type="danger" @click="removeCustomField(idx)")
              Icon(name="ph:trash" size="16")
          el-button(text type="primary" @click="addCustomField")
            Icon(name="ph:plus" size="16" style="margin-right: 4px;")
            | {{ $t('companies.addCustomField') }}
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveCompany" :loading="saving" style="border-radius: 12px;") {{ $t('common.save') }}

  //- Company Detail Drawer
  el-drawer(
    v-model="showDetailDrawer"
    :title="selectedCompany?.clientName || ''"
    size="60%"
    direction="rtl"
  )
    el-tabs(v-model="activeTab" v-if="selectedCompany")
      el-tab-pane(:label="labelOverview" name="overview")
        .space-y-6
          //- Health Score Card
          .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold {{ $t('companies.healthScore') }}
              el-tooltip(:content="healthScoreTooltip" placement="top")
                Icon(name="ph:info" size="20")
            .flex.items-center.justify-center.mb-4
              el-progress(
                type="dashboard"
                :percentage="companyHealthScore?.score || 0"
                :width="150"
                :color="getHealthColor(companyHealthScore?.score || 0)"
              )
                template(#default="{ percentage }")
                  .text-3xl.font-black {{ percentage }}
            .space-y-2(v-if="companyHealthScore?.factors")
              .flex.items-center.justify-between(v-for="factor in companyHealthScore.factors" :key="factor.name")
                .flex.items-center.gap-2
                  Icon(:name="factor.met ? 'ph:check-circle' : 'ph:x-circle'" :style="{ color: factor.met ? '#22c55e' : '#ef4444' }")
                  span.text-sm {{ factor.name }}
                span.text-sm.font-bold +{{ factor.points }}

          //- Revenue Analytics
          .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
            h3.text-lg.font-bold.mb-4 {{ $t('companies.revenueAnalytics') }}
            .grid.grid-cols-2.gap-4.mb-4
              div
                p.text-xs.text-gray-400 {{ $t('companies.totalRevenue') }}
                p.text-2xl.font-bold {{ formatCurrency(companyRevenue?.totalRevenue || 0) }}
              div
                p.text-xs.text-gray-400 {{ $t('companies.wonDeals') }}
                p.text-2xl.font-bold {{ companyRevenue?.wonDeals || 0 }}
              div
                p.text-xs.text-gray-400 {{ $t('companies.avgDealSize') }}
                p.text-2xl.font-bold {{ formatCurrency(companyRevenue?.avgDealSize || 0) }}
              div
                p.text-xs.text-gray-400 {{ $t('companies.lifetimeValue') }}
                p.text-2xl.font-bold {{ formatCurrency(companyRevenue?.lifetimeValue || 0) }}
            div(ref="revenueChartRef" style="width: 100%; height: 300px;")

          //- Hierarchy
          .p-6.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
            h3.text-lg.font-bold.mb-4 {{ $t('companies.hierarchy') }}
            .mb-4(v-if="companyHierarchy?.parentChain?.length")
              p.text-sm.text-gray-400.mb-2 {{ $t('companies.parentCompany') }}
              .flex.items-center.gap-2
                span.text-sm(v-for="(parent, idx) in companyHierarchy.parentChain" :key="parent.id")
                  span(v-if="idx > 0") →
                  span.font-bold {{ parent.name }}
            div(v-if="companyHierarchy?.subsidiaries?.length")
              p.text-sm.text-gray-400.mb-2 {{ $t('companies.subsidiaries') }}
              el-tree(
                :data="companyHierarchy.subsidiaries"
                :props="{ label: 'name', children: 'children' }"
                default-expand-all
              )
            p.text-sm.text-gray-400(v-else) {{ $t('companies.noSubsidiaries') }}

      el-tab-pane(:label="labelTimeline" name="timeline")
        .space-y-4(v-if="companyTimeline.length")
          el-timeline
            el-timeline-item(
              v-for="item in companyTimeline"
              :key="item.id"
              :timestamp="formatTimestamp(item.timestamp)"
              :type="getTimelineType(item.type)"
            )
              .flex.items-start.gap-3
                .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="getTimelineIconStyle(item.type)")
                  Icon(:name="getTimelineIcon(item.type)" size="16")
                div
                  p.font-bold.text-sm {{ item.title }}
                  p.text-xs.text-gray-400 {{ item.description }}
        .text-center.py-8(v-else)
          Icon(name="ph:clock" size="48" style="color: var(--text-muted); margin: 0 auto 16px;")
          p.text-gray-400 {{ $t('companies.noTimeline') }}

      el-tab-pane(:label="labelNotes" name="notes")
        .mb-4
          el-button(type="primary" @click="showNoteDialog = true")
            Icon(name="ph:plus" size="16" style="margin-right: 4px;")
            | {{ $t('companies.addNote') }}
        .space-y-4(v-if="companyNotes.length")
          .p-4.rounded-xl.border(
            v-for="note in companyNotes"
            :key="note.id"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
          )
            .flex.items-start.justify-between.mb-2
              .flex.items-center.gap-2
                .w-8.h-8.rounded-full.bg-violet-600.flex.items-center.justify-center.text-white.text-xs.font-bold
                  | {{ note.user?.name?.charAt(0) || 'U' }}
                div
                  p.font-bold.text-sm {{ note.user?.name }}
                  p.text-xs.text-gray-400 {{ formatTimestamp(note.createdAt) }}
              .flex.gap-1
                el-button(text circle size="small" @click="togglePinNote(note)")
                  Icon(:name="note.isPinned ? 'ph:push-pin-slash' : 'ph:push-pin'" size="14")
                el-button(text circle size="small" type="danger" @click="deleteNote(note.id)")
                  Icon(name="ph:trash" size="14")
            p.text-sm {{ note.content }}
            .flex.gap-2.mt-2(v-if="note.attachments?.length")
              el-tag(v-for="file in note.attachments" :key="file" size="small") {{ file }}
        .text-center.py-8(v-else)
          Icon(name="ph:note" size="48" style="color: var(--text-muted); margin: 0 auto 16px;")
          p.text-gray-400 {{ $t('companies.noNotes') }}

      el-tab-pane(:label="labelRelatedContacts" name="contacts")
        .space-y-3(v-if="relatedContacts.length")
          .p-4.rounded-xl.border(
            v-for="contact in relatedContacts"
            :key="contact.id"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
          )
            .flex.items-center.gap-3
              .w-10.h-10.rounded-full.bg-blue-600.flex.items-center.justify-center.text-white.font-bold
                | {{ contact.name?.charAt(0) || 'C' }}
              div
                p.font-bold {{ contact.name }}
                p.text-xs.text-gray-400 {{ contact.email }}
        .text-center.py-8(v-else)
          Icon(name="ph:users" size="48" style="color: var(--text-muted); margin: 0 auto 16px;")
          p.text-gray-400 No contacts assigned

  //- Note Dialog
  el-dialog(v-model="showNoteDialog" :title="labelAddNote" width="500px")
    el-form(label-position="top")
      el-form-item(:label="labelNoteContent")
        el-input(
          v-model="noteForm.content"
          type="textarea"
          :rows="4"
          :placeholder="placeholderNoteContent"
        )
    template(#footer)
      el-button(@click="showNoteDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveNote" :loading="savingNote") {{ $t('common.save') }}

  //- Bulk Update Dialog
  el-dialog(v-model="showBulkDialog" :title="labelBulkUpdate" width="500px")
    el-form(label-position="top")
      el-form-item(:label="labelIndustry")
        el-select(v-model="bulkForm.industry" class="w-full" clearable)
          el-option(label="Technology" value="Information Technology (IT) & Software")
          el-option(label="Finance" value="Banking & Financial Services")
          el-option(label="Healthcare" value="Healthcare & Medical Services")
      el-form-item(:label="labelStatus")
        el-select(v-model="bulkForm.clientStatus" class="w-full" clearable)
          el-option(label="Active" value="ACTIVE")
          el-option(label="Inactive" value="INACTIVE")
    template(#footer)
      el-button(@click="showBulkDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="bulkUpdate" :loading="bulkUpdating") {{ $t('common.save') }}

  //- Merge Dialog
  el-dialog(v-model="showMergeDialog" :title="labelMerge" width="500px")
    el-alert(:title="labelMergeWarning" type="warning" :closable="false" class="mb-4")
    el-form(label-position="top")
      el-form-item(:label="labelMergeSource")
        el-select(v-model="mergeForm.sourceId" class="w-full")
          el-option(
            v-for="company in selectedCompanies"
            :key="company.id"
            :label="company.clientName"
            :value="company.id"
          )
      el-form-item(:label="labelMergeTarget")
        el-select(v-model="mergeForm.targetId" class="w-full")
          el-option(
            v-for="company in selectedCompanies"
            :key="company.id"
            :label="company.clientName"
            :value="company.id"
            :disabled="company.id === mergeForm.sourceId"
          )
    template(#footer)
      el-button(@click="showMergeDialog = false") {{ $t('common.cancel') }}
      el-button(type="danger" @click="mergeCompanies" :loading="merging") {{ $t('companies.merge') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import * as echarts from 'echarts';

definePageMeta({});

const { $t } = useNuxtApp() as any;

interface Company {
  id: string;
  clientName: string;
  companyName?: string;
  industry?: string;
  website?: string;
  clientStatus: string;
  annualRevenue?: number;
  contactCount?: number;
  healthScore?: number;
  parentCompanyId?: string;
  customFields?: Record<string, any>;
}

const companies = ref<Company[]>([]);
const selectedCompanies = ref<Company[]>([]);
const showDialog = ref(false);
const showDetailDrawer = ref(false);
const showNoteDialog = ref(false);
const showBulkDialog = ref(false);
const showMergeDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const savingNote = ref(false);
const bulkUpdating = ref(false);
const merging = ref(false);
const editMode = ref(false);
const activeTab = ref('overview');

const form = reactive({
  id: '',
  clientName: '',
  industry: 'Information Technology (IT) & Software',
  website: '',
  clientStatus: 'ACTIVE',
  annualRevenue: 0,
  parentCompanyId: '',
  customFields: {} as Record<string, any>
});

const customFieldsArray = ref<Array<{ name: string; value: string }>>([]);

const noteForm = reactive({ content: '' });
const bulkForm = reactive({ industry: '', clientStatus: '' });
const mergeForm = reactive({ sourceId: '', targetId: '' });

const selectedCompany = ref<Company | null>(null);
const companyHealthScore = ref<any>(null);
const companyRevenue = ref<any>(null);
const companyHierarchy = ref<any>(null);
const companyTimeline = ref<any[]>([]);
const companyNotes = ref<any[]>([]);
const relatedContacts = ref<any[]>([]);
const analytics = ref<any>({});

const revenueChartRef = ref<HTMLElement | null>(null);
let revenueChart: echarts.ECharts | null = null;

// Computed properties for i18n
const dialogTitle = computed(() => editMode.value ? $t('common.edit') : $t('companies.addCompany'));
const emptyText = computed(() => $t('companies.noCompanies'));
const labelCompany = computed(() => $t('companies.company'));
const labelWebsite = computed(() => $t('companies.website'));
const labelContacts = computed(() => $t('companies.contacts'));
const labelRevenue = computed(() => $t('companies.revenue'));
const labelHealthScore = computed(() => $t('companies.healthScore'));
const labelStatus = computed(() => $t('companies.status'));
const labelCompanyName = computed(() => $t('companies.companyName'));
const labelIndustry = computed(() => $t('companies.industry'));
const labelAnnualRevenue = computed(() => $t('companies.annualRevenue'));
const labelParentCompany = computed(() => $t('companies.parentCompany'));
const labelCustomFields = computed(() => $t('companies.customFields'));
const labelOverview = computed(() => $t('companies.overview'));
const labelTimeline = computed(() => $t('companies.timeline'));
const labelNotes = computed(() => $t('companies.notes'));
const labelRelatedContacts = computed(() => $t('companies.relatedContacts'));
const labelAddNote = computed(() => $t('companies.addNote'));
const labelNoteContent = computed(() => $t('companies.noteContent'));
const labelBulkUpdate = computed(() => $t('companies.bulkUpdate'));
const labelMerge = computed(() => $t('companies.merge'));
const labelMergeSource = computed(() => $t('companies.mergeSource'));
const labelMergeTarget = computed(() => $t('companies.mergeTarget'));
const labelMergeWarning = computed(() => $t('companies.mergeWarning'));
const placeholderCompanyName = computed(() => 'Acme Corp');
const placeholderSelectParent = computed(() => $t('companies.selectParent'));
const placeholderFieldName = computed(() => $t('companies.customFieldName'));
const placeholderFieldValue = computed(() => $t('companies.customFieldValue'));
const placeholderNoteContent = computed(() => $t('companies.noteContent'));
const healthScoreTooltip = computed(() => $t('companies.healthScoreDetails'));
const avgHealthScoreLabel = computed(() => $t('companies.healthScore'));
const avatarStyle = computed(() => ({ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }));

const uniqueIndustries = computed(() => {
  return new Set(companies.value.map(c => c.industry).filter(Boolean)).size;
});

const availableParentCompanies = computed(() => {
  return companies.value.filter(c => c.id !== form.id);
});

function getInitials(row: Company) {
  return (row.clientName || row.companyName || 'C').slice(0, 2).toUpperCase();
}

function formatRevenue(value?: number) {
  if (!value) return '—';
  return value.toLocaleString();
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function getHealthColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#6b7280';
}

function getTimelineType(type: string) {
  const types: Record<string, string> = {
    DEAL: 'success',
    ACTIVITY: 'primary',
    CALL: 'warning',
    MEETING: 'info'
  };
  return types[type] || 'primary';
}

function getTimelineIcon(type: string) {
  const icons: Record<string, string> = {
    DEAL: 'ph:handshake',
    ACTIVITY: 'ph:activity',
    CALL: 'ph:phone',
    MEETING: 'ph:users'
  };
  return icons[type] || 'ph:circle';
}

function getTimelineIconStyle(type: string) {
  const styles: Record<string, any> = {
    DEAL: { background: '#22c55e', color: 'white' },
    ACTIVITY: { background: '#3b82f6', color: 'white' },
    CALL: { background: '#f59e0b', color: 'white' },
    MEETING: { background: '#8b5cf6', color: 'white' }
  };
  return styles[type] || { background: '#6b7280', color: 'white' };
}

function handleSelectionChange(selection: Company[]) {
  selectedCompanies.value = selection;
}

async function fetchCompanies() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('client', 'GET');
    if (success && body) {
      companies.value = body.docs || body;

      // Fetch health scores for all companies
      for (const company of companies.value) {
        try {
          const { body: healthBody } = await useApiFetch(`client/${company.id}/health-score`, 'GET');
          if (healthBody) {
            company.healthScore = healthBody.score;
          }
        } catch (e) {
          console.error(`Failed to fetch health score for ${company.id}:`, e);
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch companies:', e);
  } finally {
    loading.value = false;
  }
}

async function fetchAnalytics() {
  try {
    const { body, success } = await useApiFetch('client/analytics', 'GET');
    if (success && body) {
      analytics.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch analytics:', e);
  }
}

function openAddDialog() {
  editMode.value = false;
  Object.assign(form, {
    id: '',
    clientName: '',
    industry: 'Information Technology (IT) & Software',
    website: '',
    clientStatus: 'ACTIVE',
    annualRevenue: 0,
    parentCompanyId: '',
    customFields: {}
  });
  customFieldsArray.value = [];
  showDialog.value = true;
}

function editCompany(company: Company) {
  editMode.value = true;
  Object.assign(form, {
    id: company.id,
    clientName: company.clientName,
    industry: company.industry || '',
    website: company.website || '',
    clientStatus: company.clientStatus,
    annualRevenue: company.annualRevenue || 0,
    parentCompanyId: company.parentCompanyId || '',
    customFields: company.customFields || {}
  });

  // Convert customFields object to array
  customFieldsArray.value = Object.entries(form.customFields).map(([name, value]) => ({
    name,
    value: String(value)
  }));

  showDialog.value = true;
}

function addCustomField() {
  customFieldsArray.value.push({ name: '', value: '' });
}

function removeCustomField(index: number) {
  customFieldsArray.value.splice(index, 1);
}

async function saveCompany() {
  saving.value = true;
  try {
    // Convert custom fields array to object
    const customFields: Record<string, any> = {};
    customFieldsArray.value.forEach(field => {
      if (field.name) {
        customFields[field.name] = field.value;
      }
    });

    const payload = {
      clientName: form.clientName,
      industry: form.industry,
      website: form.website,
      clientStatus: form.clientStatus,
      annualRevenue: form.annualRevenue,
      parentCompanyId: form.parentCompanyId || undefined,
      customFields,
      clientType: 'CORPORATE'
    };

    if (editMode.value) {
      const { body, success } = await useApiFetch(`client/${form.id}`, 'PUT', payload);
      if (success && body) {
        const index = companies.value.findIndex(c => c.id === form.id);
        if (index !== -1) {
          companies.value[index] = { ...companies.value[index], ...body };
        }
        ElMessage.success($t('companies.companyUpdated'));
      }
    } else {
      const { body, success } = await useApiFetch('client', 'POST', payload);
      if (success && body) {
        companies.value.unshift(body);
        ElMessage.success($t('companies.companyAdded'));
      }
    }

    showDialog.value = false;
    await fetchAnalytics();
  } catch (e) {
    console.error('Failed to save company:', e);
    ElMessage.error($t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function removeCompany(id: string) {
  try {
    await ElMessageBox.confirm($t('common.confirmDelete'), $t('common.warning'), {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning'
    });

    const { success } = await useApiFetch(`client/${id}`, 'DELETE');
    if (success) {
      companies.value = companies.value.filter(c => c.id !== id);
      ElMessage.success($t('companies.companyDeleted'));
      await fetchAnalytics();
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('Failed to delete company:', e);
      ElMessage.error($t('common.error'));
    }
  }
}

async function viewCompanyDetail(company: Company) {
  selectedCompany.value = company;
  showDetailDrawer.value = true;
  activeTab.value = 'overview';

  // Fetch detailed data
  await Promise.all([
    fetchHealthScore(company.id),
    fetchRevenue(company.id),
    fetchHierarchy(company.id),
    fetchTimeline(company.id),
    fetchNotes(company.id),
    fetchContacts(company.id)
  ]);

  // Render revenue chart
  await nextTick();
  renderRevenueChart();
}

async function fetchHealthScore(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/health-score`, 'GET');
    if (success && body) {
      companyHealthScore.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch health score:', e);
  }
}

async function fetchRevenue(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/revenue`, 'GET');
    if (success && body) {
      companyRevenue.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch revenue:', e);
  }
}

async function fetchHierarchy(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/hierarchy`, 'GET');
    if (success && body) {
      companyHierarchy.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch hierarchy:', e);
  }
}

async function fetchTimeline(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/timeline`, 'GET');
    if (success && body) {
      companyTimeline.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch timeline:', e);
  }
}

async function fetchNotes(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/notes`, 'GET');
    if (success && body) {
      companyNotes.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch notes:', e);
  }
}

async function fetchContacts(companyId: string) {
  try {
    const { body, success } = await useApiFetch(`client/${companyId}/contacts`, 'GET');
    if (success && body) {
      relatedContacts.value = body;
    }
  } catch (e) {
    console.error('Failed to fetch contacts:', e);
  }
}

async function saveNote() {
  if (!selectedCompany.value || !noteForm.content) return;

  savingNote.value = true;
  try {
    const { body, success } = await useApiFetch(
      `client/${selectedCompany.value.id}/notes`,
      'POST',
      { content: noteForm.content }
    );
    if (success && body) {
      companyNotes.value.unshift(body);
      noteForm.content = '';
      showNoteDialog.value = false;
      ElMessage.success($t('companies.noteAdded'));
    }
  } catch (e) {
    console.error('Failed to save note:', e);
    ElMessage.error($t('common.error'));
  } finally {
    savingNote.value = false;
  }
}

async function togglePinNote(note: any) {
  try {
    const { success } = await useApiFetch(`client/notes/${note.id}`, 'PUT', {
      isPinned: !note.isPinned
    });
    if (success) {
      note.isPinned = !note.isPinned;
      ElMessage.success($t('companies.noteUpdated'));
    }
  } catch (e) {
    console.error('Failed to update note:', e);
    ElMessage.error($t('common.error'));
  }
}

async function deleteNote(noteId: string) {
  try {
    const { success } = await useApiFetch(`client/notes/${noteId}`, 'DELETE');
    if (success) {
      companyNotes.value = companyNotes.value.filter(n => n.id !== noteId);
      ElMessage.success($t('companies.noteDeleted'));
    }
  } catch (e) {
    console.error('Failed to delete note:', e);
    ElMessage.error($t('common.error'));
  }
}

async function bulkUpdate() {
  if (selectedCompanies.value.length === 0) return;

  bulkUpdating.value = true;
  try {
    const updates: any = {};
    if (bulkForm.industry) updates.industry = bulkForm.industry;
    if (bulkForm.clientStatus) updates.clientStatus = bulkForm.clientStatus;

    const { success } = await useApiFetch('client/bulk-update', 'POST', {
      companyIds: selectedCompanies.value.map(c => c.id),
      updates
    });

    if (success) {
      ElMessage.success($t('companies.bulkUpdateSuccess'));
      showBulkDialog.value = false;
      await fetchCompanies();
      selectedCompanies.value = [];
    }
  } catch (e) {
    console.error('Failed to bulk update:', e);
    ElMessage.error($t('common.error'));
  } finally {
    bulkUpdating.value = false;
  }
}

async function mergeCompanies() {
  if (!mergeForm.sourceId || !mergeForm.targetId) return;

  merging.value = true;
  try {
    const { success } = await useApiFetch('client/merge', 'POST', {
      sourceId: mergeForm.sourceId,
      targetId: mergeForm.targetId
    });

    if (success) {
      ElMessage.success($t('companies.mergeSuccess'));
      showMergeDialog.value = false;
      await fetchCompanies();
      selectedCompanies.value = [];
    }
  } catch (e) {
    console.error('Failed to merge companies:', e);
    ElMessage.error($t('common.error'));
  } finally {
    merging.value = false;
  }
}

function renderRevenueChart() {
  if (!revenueChartRef.value || !companyRevenue.value?.revenueByMonth) return;

  if (revenueChart) {
    revenueChart.dispose();
  }

  revenueChart = echarts.init(revenueChartRef.value);

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: companyRevenue.value.revenueByMonth.map((item: any) => item.month)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        data: companyRevenue.value.revenueByMonth.map((item: any) => item.revenue),
        areaStyle: {
          color: 'rgba(124, 58, 237, 0.1)'
        },
        lineStyle: {
          color: '#7c3aed'
        },
        itemStyle: {
          color: '#7c3aed'
        }
      }
    ]
  };

  revenueChart.setOption(option);
}

onMounted(() => {
  fetchCompanies();
  fetchAnalytics();
});
</script>
