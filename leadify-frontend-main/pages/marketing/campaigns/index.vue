<template lang="pug">
div
  ModuleHeader(
    :title="$t('campaigns.title')"
    :subtitle="$t('campaigns.subtitle')"
  )
    template(#actions)
      ExportButton(:data="filteredCampaigns" :columns="exportColumns" :filename="'campaigns-export'" :title="$t('campaigns.title')")
      el-button(size="large" @click="showTemplates = true" class="!rounded-2xl")
        Icon(name="ph:file-text" size="16")
        span.ml-1 {{ $t('campaigns.templates') }}
      el-button(size="large" type="primary" @click="openForm()" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('campaigns.create') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.mb-6.flex.items-center.gap-4
      el-input(
        size="large"
        style="height: 50px; max-width: 250px"
        v-model="searchText"
        :placeholder="$t('common.search') + ' ' + $t('campaigns.title')"
        clearable
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16")
      el-select(
        v-model="filterStatus"
        :placeholder="$t('campaigns.status')"
        clearable
        size="large"
        style="max-width: 180px"
      )
        el-option(:label="$t('campaigns.allCampaigns')" value="")
        el-option(:label="$t('common.draft')" value="DRAFT")
        el-option(:label="$t('campaigns.scheduled')" value="SCHEDULED")
        el-option(:label="$t('campaigns.sending')" value="SENDING")
        el-option(:label="$t('campaigns.sent')" value="SENT")
        el-option(:label="$t('common.cancelled')" value="CANCELLED")

    el-table(:data="paginatedCampaigns" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('campaigns.name')" min-width="180")
        template(#default="{ row }")
          .font-bold(style="color: var(--text-primary)") {{ row.name }}
      el-table-column(:label="$t('campaigns.subject')" min-width="200")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ row.subject }}
      el-table-column(:label="$t('campaigns.status')" width="130")
        template(#default="{ row }")
          span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getCampaignStatusColor(row.status)}`") {{ row.status }}
      el-table-column(:label="$t('campaigns.recipients')" width="110" align="center")
        template(#default="{ row }")
          span(style="color: var(--text-primary)") {{ row.recipients?.length || 0 }}
      el-table-column(:label="$t('campaigns.sentAt')" width="160")
        template(#default="{ row }")
          span(style="color: var(--text-muted)") {{ row.sentAt ? formatDate(row.sentAt) : '—' }}
      el-table-column(:label="$t('common.action')" width="120" fixed="right")
        template(#default="{ row }")
          .flex.items-center(@click.stop)
            el-dropdown(trigger="click")
              span.el-dropdown-link
                .toggle-icon.text-md
                  Icon(name="IconToggle" size="22")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(v-if="row.status === 'SENT'" @click="viewAnalytics(row.id)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="ph:chart-bar-bold")
                      p.text-sm {{ $t('campaigns.analytics') }}
                  el-dropdown-item(v-if="row.status === 'DRAFT'" @click="openForm(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEdit")
                      p.text-sm {{ $t('common.edit') }}
                  el-dropdown-item(v-if="row.status === 'DRAFT'" @click="handleSend(row.id)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="ph:paper-plane-tilt-bold")
                      p.text-sm {{ $t('campaigns.sent') }}
                  el-dropdown-item(@click="[deleteId = row.id, deletePopup = true]")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconDelete")
                      p.text-sm {{ $t('common.delete') }}
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    //- Pagination
    .px-6.pt-6.flex.items-center.justify-between(v-if="filteredCampaigns.length > 0")
      span.text-sm(style="color: var(--text-muted)") {{ $t('common.showing') }} {{ paginationStart }}-{{ paginationEnd }} {{ $t('common.of') }} {{ filteredCampaigns.length }} {{ $t('common.entries') }}
      el-pagination(
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredCampaigns.length"
        layout="prev, pager, next"
        background
      )

  //- Create/Edit Dialog
  el-dialog(v-model="showForm" :title="editingId ? $t('campaigns.edit') : $t('campaigns.create')" width="700px" :close-on-click-modal="false")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('campaigns.name') }}
        el-input(v-model="form.name" :placeholder="$t('campaigns.namePlaceholder')")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('campaigns.subject') }}
        el-input(v-model="form.subject" :placeholder="$t('campaigns.subjectPlaceholder')")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('campaigns.content') }}
        el-input(v-model="form.htmlContent" type="textarea" :rows="8" placeholder="HTML email content...")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('campaigns.recipientEmails') }}
        el-input(v-model="recipientInput" type="textarea" :rows="3" :placeholder="$t('campaigns.recipientPlaceholder')")

    template(#footer)
      el-button(@click="showForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveCampaign" class="!rounded-2xl") {{ $t('common.save') }}

  //- Analytics Dialog
  el-dialog(v-model="showAnalytics" :title="$t('campaigns.analytics')" width="500px")
    .space-y-4(v-if="analytics")
      .grid.grid-cols-2.gap-4
        .text-center.p-4.rounded-xl(style="background: var(--bg-input)")
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ analytics.totalSent }}
          p.text-sm(style="color: var(--text-muted)") {{ $t('campaigns.sent') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-input)")
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ analytics.openRate }}%
          p.text-sm(style="color: var(--text-muted)") {{ $t('campaigns.openRate') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-input)")
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ analytics.clickRate }}%
          p.text-sm(style="color: var(--text-muted)") {{ $t('campaigns.clickRate') }}
        .text-center.p-4.rounded-xl(style="background: var(--bg-input)")
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ analytics.failedCount }}
          p.text-sm(style="color: var(--text-muted)") {{ $t('campaigns.failed') }}

  //- Templates Dialog
  el-dialog(v-model="showTemplates" :title="$t('campaigns.templates')" width="600px")
    .space-y-3(v-if="templates.length")
      .p-3.rounded-xl.flex.justify-between.items-center(
        v-for="tmpl in templates"
        :key="tmpl.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
      )
        div
          span.font-bold(style="color: var(--text-primary)") {{ tmpl.name }}
          p.text-sm(style="color: var(--text-muted)") {{ tmpl.subject }}
        .flex.gap-2
          el-button(link size="small" @click="useTemplate(tmpl)")
            Icon(name="ph:copy" size="16" aria-label="Use template")
          el-button(link size="small" @click="removeTemplate(tmpl.id)")
            Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")
    .text-center.py-4(v-else)
      p.text-sm(style="color: var(--text-muted)") {{ $t('campaigns.noTemplates') }}

  //- Delete Confirmation
  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  fetchCampaignAnalytics,
  addRecipients,
  fetchTemplates,
  deleteTemplate,
  type Campaign,
  type EmailTemplate
} from '~/composables/useCampaigns';

definePageMeta({ middleware: 'permissions' });
const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'name', label: t('campaigns.name') },
  { prop: 'subject', label: t('campaigns.subject') },
  { prop: 'status', label: t('campaigns.status') },
  { prop: 'sentAt', label: t('campaigns.sentAt') }
];

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const campaigns = ref<Campaign[]>([]);
const templates = ref<EmailTemplate[]>([]);
const showForm = ref(false);
const showAnalytics = ref(false);
const showTemplates = ref(false);
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const analytics = ref<any>(null);
const recipientInput = ref('');
const form = ref({ name: '', subject: '', htmlContent: '' });
const searchText = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const pageSize = 10;

const summaryStats = computed(() => [
  { label: t('campaigns.allCampaigns'), value: campaigns.value.length, icon: 'ph:envelope-bold', color: '#7849ff' },
  {
    label: t('campaigns.status') + ': Draft',
    value: campaigns.value.filter(c => c.status === 'DRAFT').length,
    icon: 'ph:pencil-bold',
    color: '#64748b'
  },
  {
    label: t('campaigns.sent'),
    value: campaigns.value.filter(c => c.status === 'SENT').length,
    icon: 'ph:check-circle-bold',
    color: '#22c55e'
  },
  {
    label: t('campaigns.status') + ': Sending',
    value: campaigns.value.filter(c => c.status === 'SENDING').length,
    icon: 'ph:paper-plane-tilt-bold',
    color: '#3b82f6'
  }
]);

const filteredCampaigns = computed(() => {
  let result = campaigns.value;
  if (searchText.value) {
    const s = searchText.value.toLowerCase();
    result = result.filter(c => c.name?.toLowerCase().includes(s) || c.subject?.toLowerCase().includes(s));
  }
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }
  return result;
});

const paginatedCampaigns = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredCampaigns.value.slice(start, start + pageSize);
});

const paginationStart = computed(() => {
  if (filteredCampaigns.value.length === 0) return 0;
  return (currentPage.value - 1) * pageSize + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize, filteredCampaigns.value.length);
});

// Reset to page 1 when filters change
watch([searchText, filterStatus], () => {
  currentPage.value = 1;
});

onMounted(async () => {
  const [campaignsData, templatesData] = await Promise.all([fetchCampaigns(), fetchTemplates()]);
  campaigns.value = campaignsData;
  templates.value = templatesData;
  loading.value = false;
});

function getCampaignStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'gray',
    SCHEDULED: 'orange',
    SENDING: 'blue',
    SENT: 'green',
    CANCELLED: 'red'
  };
  return map[status] || 'gray';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function openForm(campaign?: Campaign) {
  if (campaign) {
    editingId.value = campaign.id;
    form.value = { name: campaign.name, subject: campaign.subject, htmlContent: campaign.htmlContent };
    recipientInput.value = '';
  } else {
    editingId.value = null;
    form.value = { name: '', subject: '', htmlContent: '' };
    recipientInput.value = '';
  }
  showForm.value = true;
}

async function saveCampaign() {
  saving.value = true;
  let response;
  if (editingId.value) {
    response = await updateCampaign(editingId.value, form.value);
  } else {
    response = await createCampaign(form.value);
  }
  // Add recipients if specified
  if (response.success && recipientInput.value.trim()) {
    const campaignId = editingId.value || response.body?.id;
    if (campaignId) {
      const emails = recipientInput.value
        .split(/[\n,]+/)
        .map(e => e.trim())
        .filter(Boolean);
      const recipients = emails.map(email => ({ email, name: email.split('@')[0] || email }));
      await addRecipients(campaignId, recipients);
    }
  }
  campaigns.value = await fetchCampaigns();
  showForm.value = false;
  saving.value = false;
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    await deleteCampaign(deleteId.value);
    campaigns.value = campaigns.value.filter(c => c.id !== deleteId.value);
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function handleSend(id: string) {
  await sendCampaign(id);
  campaigns.value = await fetchCampaigns();
}

async function viewAnalytics(id: string) {
  showAnalytics.value = true;
  analytics.value = await fetchCampaignAnalytics(id);
}

function useTemplate(tmpl: EmailTemplate) {
  form.value.subject = tmpl.subject;
  form.value.htmlContent = tmpl.htmlContent;
  showTemplates.value = false;
  showForm.value = true;
}

async function removeTemplate(id: string) {
  await deleteTemplate(id);
  templates.value = templates.value.filter(t => t.id !== id);
}
</script>
