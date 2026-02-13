<template lang="pug">
.campaigns-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('campaigns.title') }}
    p(style="color: var(--text-muted)") {{ $t('campaigns.subtitle') }}

  //- Stats
  .grid.grid-cols-4.gap-4.mb-6(v-if="!loading")
    .glass-card.p-4.text-center(v-for="stat in stats" :key="stat.label")
      p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stat.value }}
      p.text-sm(style="color: var(--text-muted)") {{ stat.label }}

  .glass-card.p-6
    .flex.justify-between.items-center.mb-6
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('campaigns.allCampaigns') }}
      .flex.gap-2
        el-button(@click="showTemplates = true" class="!rounded-xl")
          Icon(name="ph:file-text" size="16" aria-hidden="true")
          span.ml-2 {{ $t('campaigns.templates') }}
        el-button(type="primary" @click="openForm()" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
          Icon(name="ph:plus-bold" size="16" aria-hidden="true")
          span.ml-2 {{ $t('campaigns.create') }}

    el-skeleton(:rows="3" animated v-if="loading")

    el-table(:data="campaigns" v-else style="width: 100%")
      el-table-column(:label="$t('campaigns.name')" prop="name" min-width="180")
      el-table-column(:label="$t('campaigns.subject')" prop="subject" min-width="200")
      el-table-column(:label="$t('campaigns.status')" width="120")
        template(#default="{ row }")
          el-tag(:type="getStatusType(row.status)" size="small" effect="dark") {{ row.status }}
      el-table-column(:label="$t('campaigns.recipients')" width="110" align="center")
        template(#default="{ row }")
          span {{ row.recipients?.length || 0 }}
      el-table-column(:label="$t('campaigns.sentAt')" width="160")
        template(#default="{ row }")
          span {{ row.sentAt ? formatDate(row.sentAt) : '-' }}
      el-table-column(:label="$t('common.actions')" width="200" align="center")
        template(#default="{ row }")
          .flex.gap-1.justify-center
            el-button(link @click="viewAnalytics(row.id)" size="small" v-if="row.status === 'SENT'")
              Icon(name="ph:chart-bar" size="16" aria-label="Analytics")
            el-button(link @click="openForm(row)" size="small" v-if="row.status === 'DRAFT'")
              Icon(name="ph:pencil" size="16" aria-label="Edit")
            el-button(link @click="handleSend(row.id)" size="small" v-if="row.status === 'DRAFT'")
              Icon(name="ph:paper-plane-tilt" size="16" aria-label="Send")
            el-button(link @click="removeCampaign(row.id)" size="small")
              Icon(name="ph:trash" size="16" class="text-red-400" aria-label="Delete")

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
      el-button(type="primary" :loading="saving" @click="saveCampaign" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}

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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign,
  fetchCampaignAnalytics, addRecipients, fetchTemplates, deleteTemplate,
  type Campaign, type EmailTemplate
} from '~/composables/useCampaigns';

const loading = ref(true);
const saving = ref(false);
const campaigns = ref<Campaign[]>([]);
const templates = ref<EmailTemplate[]>([]);
const showForm = ref(false);
const showAnalytics = ref(false);
const showTemplates = ref(false);
const editingId = ref<string | null>(null);
const analytics = ref<any>(null);
const recipientInput = ref('');
const form = ref({ name: '', subject: '', htmlContent: '' });

const stats = computed(() => [
  { label: 'Total', value: campaigns.value.length },
  { label: 'Draft', value: campaigns.value.filter(c => c.status === 'DRAFT').length },
  { label: 'Sent', value: campaigns.value.filter(c => c.status === 'SENT').length },
  { label: 'Sending', value: campaigns.value.filter(c => c.status === 'SENDING').length }
]);

onMounted(async () => {
  campaigns.value = await fetchCampaigns();
  templates.value = await fetchTemplates();
  loading.value = false;
});

function getStatusType(status: string) {
  const map: Record<string, string> = { DRAFT: 'info', SCHEDULED: 'warning', SENDING: '', SENT: 'success', CANCELLED: 'danger' };
  return map[status] || 'info';
}

function formatDate(d: string) { return new Date(d).toLocaleDateString(); }

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
      const emails = recipientInput.value.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
      const recipients = emails.map(email => ({ email, name: email.split('@')[0] }));
      await addRecipients(campaignId, recipients);
    }
  }
  campaigns.value = await fetchCampaigns();
  showForm.value = false;
  saving.value = false;
}

async function removeCampaign(id: string) {
  await deleteCampaign(id);
  campaigns.value = campaigns.value.filter(c => c.id !== id);
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
