<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.socialCrm.title') || 'Social CRM'"
    :subtitle="$t('marketing.socialCrm.subtitle') || 'Monitor social media profiles, track engagement, and manage customer sentiment.'"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.socialCrm.addProfile') || 'Add Profile' }}

  StatCards(:stats="summaryStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Table
  template(v-else)
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="search"
          :placeholder="$t('common.search') || 'Search'"
          clearable
          style="max-width: 280px"
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        .flex.items-center.gap-2
          el-select(v-model="filterPlatform" clearable :placeholder="$t('marketing.socialCrm.platform') || 'Platform'" style="width: 160px")
            el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
          el-select(v-model="filterSentiment" clearable :placeholder="$t('marketing.socialCrm.sentiment') || 'Sentiment'" style="width: 160px")
            el-option(label="Positive" value="POSITIVE")
            el-option(label="Neutral" value="NEUTRAL")
            el-option(label="Negative" value="NEGATIVE")

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        stripe
      )
        el-table-column(:label="$t('marketing.socialCrm.client') || 'Client'" prop="clientName" min-width="180" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getPlatformColor(row.platform) + '15' }")
                Icon(:name="getPlatformIcon(row.platform)" size="18" :style="{ color: getPlatformColor(row.platform) }")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || row.clientId || '--' }}
                p.text-xs(style="color: var(--text-muted)") @{{ row.handle || '--' }}
        el-table-column(:label="$t('marketing.socialCrm.platform') || 'Platform'" prop="platform" width="140" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(:name="getPlatformIcon(row.platform)" size="16" :style="{ color: getPlatformColor(row.platform) }")
              span.text-sm {{ row.platform }}
        el-table-column(:label="$t('marketing.socialCrm.followers') || 'Followers'" prop="followers" width="130" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatNumber(row.followers) }}
        el-table-column(:label="$t('marketing.socialCrm.engagement') || 'Engagement'" prop="engagementRate" width="140" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-semibold(v-if="row.engagementRate != null" :style="{ color: row.engagementRate >= 3 ? '#22c55e' : row.engagementRate >= 1 ? '#f59e0b' : 'var(--text-muted)' }") {{ row.engagementRate }}%
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.socialCrm.sentiment') || 'Sentiment'" prop="sentiment" width="130" align="center")
          template(#default="{ row }")
            el-tag(v-if="row.sentiment" :type="getSentimentType(row.sentiment)" size="small" effect="dark") {{ row.sentiment }}
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.socialCrm.lastActivity') || 'Last Activity'" prop="lastActivity" width="150" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.lastActivity) }}
        el-table-column(:label="$t('common.actions') || 'Actions'" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(text size="small" type="primary" @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text size="small" type="danger" @click.stop="handleDelete(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!filteredData.length && !loading")
        Icon(name="ph:users-three" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') || 'No social profiles found' }}

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? ($t('common.edit') || 'Edit Profile') : ($t('marketing.socialCrm.addProfile') || 'Add Social Profile')" width="560px" destroy-on-close)
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('marketing.socialCrm.clientId') || 'Client ID'" required)
        el-input(v-model="form.clientId" :placeholder="$t('marketing.socialCrm.clientIdPlaceholder') || 'Enter client ID or search'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.socialCrm.platform') || 'Platform'" required)
          el-select(v-model="form.platform" class="w-full")
            el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
        el-form-item(:label="$t('marketing.socialCrm.handle') || 'Handle'" required)
          el-input(v-model="form.handle" :placeholder="$t('marketing.socialCrm.handlePlaceholder') || '@username'")
      el-form-item(:label="$t('marketing.socialCrm.profileUrl') || 'Profile URL'")
        el-input(v-model="form.profileUrl" :placeholder="$t('marketing.socialCrm.urlPlaceholder') || 'https://...'")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.socialCrm.followers') || 'Followers'")
          el-input-number(v-model="form.followers" :min="0" class="!w-full")
        el-form-item(:label="$t('marketing.socialCrm.sentiment') || 'Sentiment'")
          el-select(v-model="form.sentiment" class="w-full" clearable)
            el-option(label="Positive" value="POSITIVE")
            el-option(label="Neutral" value="NEUTRAL")
            el-option(label="Negative" value="NEGATIVE")
      el-form-item(:label="$t('common.notes') || 'Notes'")
        el-input(v-model="form.notes" type="textarea" :rows="2" :placeholder="$t('marketing.socialCrm.notesPlaceholder') || 'Additional notes'")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') || 'Save' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingItem = ref<any>(null);
const search = ref('');
const filterPlatform = ref('');
const filterSentiment = ref('');
const items = ref<any[]>([]);

const platformOptions = [
  { label: 'Twitter', value: 'TWITTER' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'TikTok', value: 'TIKTOK' },
  { label: 'YouTube', value: 'YOUTUBE' }
];

const defaultForm = () => ({
  clientId: '',
  platform: 'TWITTER',
  handle: '',
  profileUrl: '',
  followers: 0,
  sentiment: '',
  notes: ''
});

const form = ref(defaultForm());

// Stats
const summaryStats = computed(() => {
  const data = items.value;
  const total = data.length;
  const platformBreakdown = platformOptions.map(p => ({
    platform: p.label,
    count: data.filter((i: any) => i.platform === p.value).length
  })).filter(p => p.count > 0);
  const breakdownText = platformBreakdown.map(p => `${p.platform}: ${p.count}`).join(', ') || '--';
  const totalFollowers = data.reduce((sum: number, i: any) => sum + (i.followers || 0), 0);
  const positiveSentiment = data.filter((i: any) => i.sentiment === 'POSITIVE').length;

  return [
    { label: t('marketing.socialCrm.totalProfiles') || 'Total Profiles', value: total, icon: 'ph:users-three-bold', color: '#7849ff' },
    { label: t('marketing.socialCrm.totalFollowers') || 'Total Followers', value: formatNumber(totalFollowers), icon: 'ph:user-circle-plus-bold', color: '#3b82f6' },
    { label: t('marketing.socialCrm.platforms') || 'Platforms', value: platformBreakdown.length, icon: 'ph:share-network-bold', color: '#f59e0b' },
    { label: t('marketing.socialCrm.positiveSentiment') || 'Positive Sentiment', value: positiveSentiment, icon: 'ph:smiley-bold', color: '#22c55e' }
  ];
});

const filteredData = computed(() => {
  let data = items.value;
  if (filterPlatform.value) {
    data = data.filter((i: any) => i.platform === filterPlatform.value);
  }
  if (filterSentiment.value) {
    data = data.filter((i: any) => i.sentiment === filterSentiment.value);
  }
  if (!search.value) return data;
  const q = search.value.toLowerCase();
  return data.filter((i: any) =>
    (i.clientName || i.clientId || '').toLowerCase().includes(q) ||
    (i.handle || '').toLowerCase().includes(q) ||
    (i.platform || '').toLowerCase().includes(q)
  );
});

function getPlatformIcon(platform: string): string {
  const map: Record<string, string> = {
    TWITTER: 'ph:twitter-logo-bold',
    LINKEDIN: 'ph:linkedin-logo-bold',
    FACEBOOK: 'ph:facebook-logo-bold',
    INSTAGRAM: 'ph:instagram-logo-bold',
    TIKTOK: 'ph:tiktok-logo-bold',
    YOUTUBE: 'ph:youtube-logo-bold'
  };
  return map[platform] || 'ph:globe-bold';
}

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    TWITTER: '#1da1f2',
    LINKEDIN: '#0077b5',
    FACEBOOK: '#1877f2',
    INSTAGRAM: '#e4405f',
    TIKTOK: '#010101',
    YOUTUBE: '#ff0000'
  };
  return map[platform] || '#7849ff';
}

function getSentimentType(sentiment: string): string {
  const map: Record<string, string> = {
    POSITIVE: 'success',
    NEUTRAL: 'warning',
    NEGATIVE: 'danger'
  };
  return map[sentiment] || 'info';
}

function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

// CRUD
async function fetchData() {
  loading.value = true;
  try {
    const res = await useApiFetch('social-crm');
    if (res.success && res.body) {
      items.value = Array.isArray(res.body) ? res.body : (res.body as any).docs || [];
    }
  } catch {
    ElMessage.error(t('common.error') || 'Failed to load social profiles');
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editingItem.value = null;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(item: any) {
  editingItem.value = item;
  form.value = {
    clientId: item.clientId || '',
    platform: item.platform || 'TWITTER',
    handle: item.handle || '',
    profileUrl: item.profileUrl || '',
    followers: item.followers || 0,
    sentiment: item.sentiment || '',
    notes: item.notes || ''
  };
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.value.clientId.trim() || !form.value.handle.trim()) {
    ElMessage.warning(t('common.fillRequired') || 'Please fill in required fields');
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form.value };

    if (editingItem.value) {
      const res = await useApiFetch(`social-crm/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Saved successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Save failed');
      }
    } else {
      const res = await useApiFetch('social-crm', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved') || 'Created successfully');
      } else {
        ElMessage.error(res.message || t('common.error') || 'Create failed');
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error(t('common.error') || 'An error occurred');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete') || 'Are you sure you want to delete this profile?',
      t('common.warning') || 'Warning',
      { type: 'warning', confirmButtonText: t('common.delete') || 'Delete', cancelButtonText: t('common.cancel') || 'Cancel' }
    );
    const res = await useApiFetch(`social-crm/${item.id}`, 'DELETE');
    if (res.success) {
      ElMessage.success(t('common.deleted') || 'Deleted successfully');
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error') || 'Delete failed');
    }
  } catch {
    // User cancelled
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
