<template lang="pug">
div(class="animate-fade-in")
  //- Premium Header
  PremiumPageHeader(
    :title="$t('leads.title')"
    description="Manage and track all prospective clients to accelerate your sales pipeline."
    icon="ph:users-three-duotone"
    primaryColor="#7849ff"
  )
    template(#actions)
      ExportButton(:data="exportData" :columns="exportColumns" :filename="'leads-export'" :title="$t('leads.title')")
      template(v-if="canCreateLeads")
        NuxtLink(to="/sales/leads/add-lead")
          el-button(size='large' :loading="loading" native-type="submit" type="primary" :icon="Plus" class="!rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform") {{ $t('leads.newLead') }}
      el-dropdown(trigger="click")
        span.el-dropdown-link
          el-button(size="large" class="!rounded-xl" v-wave)
            Icon(name="ph:dots-three-outline-vertical-fill" size="20")
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item
              button.flex.items-center(@click="triggerFileInput" type="button")
                Icon.text-md.mr-2(size="20" name="ph:upload-simple-bold" )
                p.text-sm {{ $t('leads.import') }}

  //- KPI Metrics
  PremiumKPICards(:metrics="kpiMetrics" v-if="!loadingAction")

  input(type="file", ref="fileInput", style="display: none", accept=".xls,.xlsx", @change="handleFileChange")
  // Spinner
  el-icon.is-loading(:size="32" v-if="loadingAction" style="color: var(--accent-color, #7849ff)")
  BulkActions(:count="selectedRows.length" :actions="['delete', 'export']" @bulk-delete="handleBulkDelete" @bulk-export="handleBulkExport" @clear-selection="selectedRows = []")
  SavedViews(:entityType="'lead'" :currentFilters="currentFilters" @apply-view="handleApplyView")
  AdvancedSearch(:entityType="'lead'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")
  AppTable(v-slot="{data}"  v-if="!loadingAction" :externalLoading="loading" :filterOptions="filterOptions" :columns="table.columns" position="lead" :pageInfo="response.pagination"  :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('leads.title')" :key="table.data" )
    .flex.items-center.py-2(@click.stop)
        //- NuxtLink.toggle-icon(:to="`/leads/1`")
        //-     Icon.text-md(name="IconEye" )

        el-dropdown(class="outline-0" trigger="click")
            span(class="el-dropdown-link")
              .toggle-icon.text-md
                  Icon(name="IconToggle"  size="22")
            template(#dropdown='')
                el-dropdown-menu
                    el-dropdown-item
                      NuxtLink.flex.items-center(:to="`/sales/leads/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEye" )
                        p.text-sm {{ $t('leads.view') }}
                    el-dropdown-item( v-if="hasPermission('EDIT_LEADS')")
                      NuxtLink.flex.items-center(:to="`/sales/leads/edit/${data?.id}`")
                        Icon.text-md.mr-2(name="IconEdit" )
                        p.text-sm {{ $t('leads.edit') }}
                    //- el-dropdown-item(@click="[deleteLeadPopup=true, userActionId = data?.id]" )
                    //-     .flex.items-center
                    //-       Icon.text-md.mr-2(name="IconDelete" )
                    //-       p.text-sm {{ $t('leads.delete') }}
  ActionModel(v-model="qualifiedLeadPopup" :loading="loadingAction" :btn-text="$t('common.save')" :description="$t('leads.confirmConversion')" @confirm = "editPresent" )
   template(#input)
    InputSelect(:label="$t('leads.present')" @change ="setPresent" :options="leadPresent"  )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { computed, ref, watch, unref, shallowRef, isRef, onMounted, onBeforeMount } from 'vue';
import { leadStates, leadSources } from '@/composables/useLeads';
import useTableFilter from '@/composables/useTableFilter';
import PremiumPageHeader from '~/components/UI/PremiumPageHeader.vue';
import PremiumKPICards from '~/components/UI/PremiumKPICards.vue';
import type { KPIMetric } from '~/components/UI/PremiumKPICards.vue';
const router = useRouter();

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const loading = ref(false);
const present = ref('');
const select = ref();
const qualifiedLeadPopup = ref(false);

// Create computed property for CREATE_LEADS permission
// This ensures the v-if updates reactively when permissions change
const canCreateLeads = computed(() => hasPermission('CREATE_LEADS') === true);

const leadPresent = computed(() => [
  {
    label: t('leads.convertToOpp'),
    value: 'opportunity'
  },
  {
    label: t('leads.convertToDeal'),
    value: 'deal'
  },
  {
    label: t('common.cancel'), // "Not Now" replaced with Cancel or relevant translation
    value: 'now'
  }
]);

async function setPresent(pre: any) {
  present.value = pre.value;
}

async function changeStatus(id: any, newStatus: any) {
  const lead: any = await getLead(id);
  loadingAction.value = true;
  try {
    await updateLead({ ...lead, leadState: newStatus, id });
  } catch {
  } finally {
    const response = await useTableFilter('lead');
    table.value.data = response.formattedData;
    loadingAction.value = false;
  }
}

async function submitForm(values: any) {
  try {
    if (values?.status === 'QUALIFIED') {
      qualifiedLeadPopup.value = true;
      select.value = values;
    }
    if (values?.status !== 'QUALIFIED') changeStatus(values?.id, values?.status);
  } catch {}
}

async function editPresent() {
  await changeStatus(select.value?.id, select.value?.status);
  if (present.value === 'opportunity') router.push(`/sales/opportunity/add-opportunity?leadId=${select.value?.id}`);
  if (present.value === 'deal') router.push(`/sales/deals/add-deal?leadId=${select.value?.id}`);
  qualifiedLeadPopup.value = false;
  present.value = '';
  select.value = {};
}

// Call API to Get the lead and users in parallel
let [response, usersResponse] = await Promise.all([
  useTableFilter('lead'),
  useApiFetch('users')
]);

const table = ref({
  columns: [] as any[], // Initialize as empty array
  data: response.formattedData || [],
  sort: [
    { prop: 'price', order: 'ascending', value: 'PRICE_ASC' },
    { prop: 'price', order: 'descending', value: 'PRICE_DESC' },
    { prop: 'identity', order: 'ascending', value: 'IDENTITY_ASC' },
    { prop: 'identity', order: 'descending', value: 'IDENTITY_DESC' }
  ]
});

const kpiMetrics = computed<KPIMetric[]>(() => {
  const data = table.value.data || [];
  const total = data.length;
  // Estimate stats purely for visual impact. In production backend should supply these.
  const newLeads = data.filter((l: any) => l.status === 'NEW').length;
  const qualified = data.filter((l: any) => l.status === 'QUALIFIED').length;
  const contacted = data.filter((l: any) => l.status === 'CONTACTED').length;
  const rate = total > 0 ? Math.round((qualified / total) * 100) : 0;
  
  return [
    { label: 'Total Leads', value: total, icon: 'ph:users-three-bold', color: '#7849ff', trend: '+12%', trendType: 'up' },
    { label: 'New Pipeline', value: newLeads, icon: 'ph:sparkle-bold', color: '#10b981', trend: 'Trending', trendType: 'up' },
    { label: 'Qualified', value: qualified, icon: 'ph:check-circle-bold', color: '#f59e0b' },
    { label: 'Conversion', value: rate + '%', icon: 'ph:chart-line-up-bold', color: '#3b82f6' }
  ];
});

const updateTableColumns = () => {
  table.value.columns = [
    {
      prop: 'leadDetails',
      label: t('leads.table.leadName'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'phone',
      label: t('leads.table.phone'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'email',
      label: t('leads.table.email'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'status',
      label: t('leads.table.status'),
      component: 'Label',
      sortable: true,
      type: 'select',
      filters: [
        { text: t('crm.stages.new'), value: 'NEW', actions: submitForm },
        { text: t('crm.stages.contacted'), value: 'CONTACTED', actions: submitForm },
        { text: t('crm.stages.lost'), value: 'DISQUALIFIED', actions: submitForm }, // Assuming Disqualified maps to Lost or has its own key
        { text: t('crm.stages.qualified'), value: 'QUALIFIED', actions: submitForm }
      ],
      width: 150
    },

    {
      prop: 'leadSource',
      label: t('leads.table.source'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'lastContactDate',
      label: t('leads.table.lastContact'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'assign',
      label: t('leads.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('leads.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ];
};

// Initial update of columns
updateTableColumns();

// If you want columns to react to locale changes, you would watch the locale:
// const { locale } = useI18n();
// watch(locale, updateTableColumns);

function handleRowClick(val: any) {
  router.push(`/sales/leads/${val.id}`);
}

const mappedUsers = usersResponse?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = computed(() => [
  {
    title: t('leads.table.status'),
    value: 'status',
    options: [...leadStates]
  },
  {
    title: t('leads.table.source'),
    value: 'leadSource',
    options: [...leadSources]
  },
  {
    title: t('leads.table.assigned'), // "Assigned user"
    value: 'userId',
    options: [...mappedUsers]
  },
  {
    title: t('leads.table.created'), // "Creation Date"
    value: ['fromDate', 'toDate'],
    type: 'date'
  },
  {
    title: t('leads.table.lastContact'), // "Last Contact Date"
    value: ['fromLastContactDate', 'toLastContactDate'],
    type: 'date'
  }
]);

// SavedViews & AdvancedSearch
const currentFilters = ref<Record<string, any>>({});

const advancedSearchFields = [
  { key: 'name', label: t('leads.table.leadName'), type: 'string' },
  { key: 'email', label: t('leads.table.email'), type: 'string' },
  { key: 'phone', label: t('leads.table.phone'), type: 'string' },
  { key: 'status', label: t('leads.table.status'), type: 'select', options: leadStates.map((s: any) => ({ value: s.value, label: s.label })) },
  { key: 'leadSource', label: t('leads.table.source'), type: 'select', options: leadSources.map((s: any) => ({ value: s.value, label: s.label })) },
  { key: 'createdAt', label: t('leads.table.created'), type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    currentFilters.value = view.filters;
    const response = await useTableFilter('lead', view.filters);
    table.value.data = response.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const response = await useApiFetch('search/advanced/lead', 'POST', filterPayload);
    if (response?.success && response?.body) {
      const data = response.body as any;
      table.value.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const response = await useTableFilter('lead');
  table.value.data = response.formattedData;
}

// Export columns & data
const exportColumns = [
  { prop: 'leadDetails', label: t('leads.table.leadName') },
  { prop: 'phone', label: t('leads.table.phone') },
  { prop: 'email', label: t('leads.table.email') },
  { prop: 'status', label: t('leads.table.status') },
  { prop: 'leadSource', label: t('leads.table.source') },
  { prop: 'lastContactDate', label: t('leads.table.lastContact') },
  { prop: 'assign', label: t('leads.table.assigned') },
  { prop: 'createdAt', label: t('leads.table.created') }
];
const exportData = computed(() => table.value.data);

// Bulk actions
const selectedRows = ref<any[]>([]);

async function handleBulkDelete() {
  // Placeholder for bulk delete - depends on API
  selectedRows.value = [];
}

function handleBulkExport() {
  // Triggers the ExportButton behavior via the selected rows
  selectedRows.value = [];
}

// implement import leads

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  // Validate file type
  const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!validTypes.includes(file.type)) {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('leads.errors.invalidFile')
    });
    target.value = ''; // Reset input
    return;
  }
  loading.value = true;
  try {
    const fileResponse = await useApiFetch('lead/import', 'POST', formData, false, true);
    if (!fileResponse?.success) {
      ElNotification({
        type: 'error',
        title: t('common.error'),
        message: fileResponse?.message || t('leads.errors.importFailed')
      });
      return;
    }
    // Refresh leads after import
    response = await useTableFilter('lead');
    table.value.data = response.formattedData;

    ElNotification({
      type: 'success',
      title: t('common.success'),
      message: t('leads.importSuccess')
    });
  } catch (err) {
    ElNotification({
      type: 'error',
      title: t('common.error'),
      message: t('leads.errors.importFailed')
    });
  } finally {
    // Reset the file input so you can upload the same file again if needed
    target.value = '';
    loading.value = false;
  }
};
</script>
