<template lang="pug">
div
  ModuleHeader(
    :title="$t('marketing.socialCrm.title')"
    :subtitle="$t('marketing.socialCrm.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openCreateDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('marketing.socialCrm.addProfile') }}

  StatCards(:stats="summaryStats")

  //- Social CRM Dashboard
  .glass-card.p-6.mb-6(v-if="socialDashboard && !loading")
    .flex.items-center.gap-2.mb-5
      Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
      h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('marketing.socialCrm.dashboard') }}

    el-row(:gutter="20")
      el-col(:xs="24" :sm="12" :md="6")
        .glass-card.p-4.text-center
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.socialCrm.totalProfiles') }}
          p.text-2xl.font-bold(style="color: #7849ff") {{ (socialDashboard.totalProfiles || 0).toLocaleString() }}
      el-col(:xs="24" :sm="12" :md="6")
        .glass-card.p-4.text-center
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.socialCrm.avgEngagement') }}
          p.text-2xl.font-bold(style="color: #3b82f6") {{ socialDashboard.avgEngagementScore != null ? socialDashboard.avgEngagementScore.toFixed(1) + '%' : '--' }}
      el-col(:xs="24" :sm="12" :md="6")
        .glass-card.p-4.text-center
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.socialCrm.totalEngagements') }}
          p.text-2xl.font-bold(style="color: #22c55e") {{ formatNumber(socialDashboard.totalEngagements || 0) }}
      el-col(:xs="24" :sm="12" :md="6")
        .glass-card.p-4.text-center
          p.text-xs.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('marketing.socialCrm.profileHealth') }}
          .flex.items-center.justify-center.gap-2
            el-progress(
              type="circle"
              :percentage="socialDashboard.avgProfileHealth || 0"
              :width="60"
              :stroke-width="6"
              :color="getHealthColor(socialDashboard.avgProfileHealth)"
            )

    //- Engagement Trends & Follower Growth
    el-row(:gutter="20" class="mt-4")
      el-col(:xs="24" :md="12")
        .glass-card.p-4
          .flex.items-center.gap-2.mb-3
            Icon(name="ph:trend-up-bold" size="18" style="color: #3b82f6")
            h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('marketing.socialCrm.engagementTrends') }}
          .flex.items-end.gap-1(style="height: 100px" v-if="socialDashboard.engagementTrends?.length")
            .flex.flex-col.items-center.flex-1(v-for="trend in socialDashboard.engagementTrends" :key="trend.date")
              .w-full.rounded-t-md.transition-all(
                :style="{ height: maxEngagement > 0 ? Math.max((trend.count / maxEngagement) * 100, 4) + 'px' : '4px', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', minHeight: '4px' }"
              )
              p.text-xs.mt-1(style="color: var(--text-muted); font-size: 10px") {{ formatShortDate(trend.date) }}
          p.text-xs.text-center.py-4(v-else style="color: var(--text-muted)") {{ $t('marketing.socialCrm.noData') }}

      el-col(:xs="24" :md="12")
        .glass-card.p-4
          .flex.items-center.gap-2.mb-3
            Icon(name="ph:users-three-bold" size="18" style="color: #22c55e")
            h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('marketing.socialCrm.followerGrowth') }}
          .flex.items-end.gap-1(style="height: 100px" v-if="socialDashboard.followerGrowth?.length")
            .flex.flex-col.items-center.flex-1(v-for="growth in socialDashboard.followerGrowth" :key="growth.date")
              .w-full.rounded-t-md.transition-all(
                :style="{ height: maxFollowers > 0 ? Math.max((growth.count / maxFollowers) * 100, 4) + 'px' : '4px', background: 'linear-gradient(to top, #22c55e, #4ade80)', minHeight: '4px' }"
              )
              p.text-xs.mt-1(style="color: var(--text-muted); font-size: 10px") {{ formatShortDate(growth.date) }}
          p.text-xs.text-center.py-4(v-else style="color: var(--text-muted)") {{ $t('marketing.socialCrm.noData') }}

    //- Sentiment Bar
    .glass-card.p-4.mt-4
      p.text-xs.uppercase.tracking-wider.mb-3.text-center(style="color: var(--text-muted)") {{ $t('marketing.socialCrm.sentimentBreakdown') }}
      .flex.items-center.justify-center.gap-3.mb-3
        .flex.items-center.gap-2
          el-tag(type="success" size="default" effect="dark" round)
            Icon(name="ph:smiley-bold" size="14" class="mr-1")
            | {{ socialDashboard.sentimentBreakdown?.positive || 0 }}
        .flex.items-center.gap-2
          el-tag(type="warning" size="default" effect="plain" round)
            Icon(name="ph:smiley-meh-bold" size="14" class="mr-1")
            | {{ socialDashboard.sentimentBreakdown?.neutral || 0 }}
        .flex.items-center.gap-2
          el-tag(type="danger" size="default" effect="dark" round)
            Icon(name="ph:smiley-sad-bold" size="14" class="mr-1")
            | {{ socialDashboard.sentimentBreakdown?.negative || 0 }}
      .flex.h-4.rounded-lg.overflow-hidden(v-if="sentimentTotal > 0")
        .transition-all(
          v-if="socialDashboard.sentimentBreakdown?.positive"
          :style="{ width: ((socialDashboard.sentimentBreakdown.positive / sentimentTotal) * 100) + '%', background: '#22c55e' }"
        )
        .transition-all(
          v-if="socialDashboard.sentimentBreakdown?.neutral"
          :style="{ width: ((socialDashboard.sentimentBreakdown.neutral / sentimentTotal) * 100) + '%', background: '#f59e0b' }"
        )
        .transition-all(
          v-if="socialDashboard.sentimentBreakdown?.negative"
          :style="{ width: ((socialDashboard.sentimentBreakdown.negative / sentimentTotal) * 100) + '%', background: '#ef4444' }"
        )

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Table
  template(v-else)
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        el-input(
          v-model="search"
          :placeholder="$t('common.search')"
          clearable
          style="max-width: 280px"
          size="large"
          class="!rounded-xl"
        )
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
        .flex.items-center.gap-2
          el-select(v-model="filterPlatform" clearable :placeholder="$t('marketing.socialCrm.platform')" style="width: 160px")
            el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
          el-select(v-model="filterSentiment" clearable :placeholder="$t('marketing.socialCrm.sentiment')" style="width: 160px")
            el-option(:label="$t('socialCrm.positive')" value="POSITIVE")
            el-option(:label="$t('socialCrm.neutral')" value="NEUTRAL")
            el-option(:label="$t('socialCrm.negative')" value="NEGATIVE")

      el-table(
        :data="filteredData"
        v-loading="loading"
        style="width: 100%"
        stripe
      )
        el-table-column(:label="$t('marketing.socialCrm.client')" prop="clientName" min-width="180" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-3
              .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getPlatformColor(row.platform) + '15' }")
                Icon(:name="getPlatformIcon(row.platform)" size="18" :style="{ color: getPlatformColor(row.platform) }")
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName || row.clientId || '--' }}
                p.text-xs(style="color: var(--text-muted)") @{{ row.handle || '--' }}
        el-table-column(:label="$t('marketing.socialCrm.platform')" prop="platform" width="140" sortable)
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(:name="getPlatformIcon(row.platform)" size="16" :style="{ color: getPlatformColor(row.platform) }")
              span.text-sm {{ row.platform }}
        el-table-column(:label="$t('marketing.socialCrm.followers')" prop="followers" width="130" align="center" sortable)
          template(#default="{ row }")
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatNumber(row.followers) }}
        el-table-column(:label="$t('marketing.socialCrm.engagement')" prop="engagementRate" width="160" align="center" sortable)
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-2(v-if="row.engagementRate != null")
              el-progress(
                :percentage="Math.min(row.engagementRate * 10, 100)"
                :stroke-width="6"
                :show-text="false"
                :color="row.engagementRate >= 3 ? '#22c55e' : row.engagementRate >= 1 ? '#f59e0b' : '#ef4444'"
                style="width: 50px"
              )
              span.text-sm.font-semibold(:style="{ color: row.engagementRate >= 3 ? '#22c55e' : row.engagementRate >= 1 ? '#f59e0b' : '#ef4444' }") {{ row.engagementRate }}%
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.socialCrm.sentiment')" prop="sentiment" width="130" align="center")
          template(#default="{ row }")
            el-tag(v-if="row.sentiment" :type="getSentimentType(row.sentiment)" size="small" effect="dark") {{ row.sentiment }}
            span.text-sm(v-else style="color: var(--text-muted)") --
        el-table-column(:label="$t('marketing.socialCrm.lastActivity')" prop="lastActivity" width="150" sortable)
          template(#default="{ row }")
            span.text-sm {{ formatDate(row.lastActivity) }}
        el-table-column(:label="$t('common.actions')" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-1
              el-button(text size="small" type="primary" @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="16")
              el-button(text size="small" type="danger" @click.stop="handleDelete(row)")
                Icon(name="ph:trash-bold" size="16")

      .text-center.py-8(v-if="!filteredData.length && !loading")
        Icon(name="ph:users-three" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .flex.justify-end.mt-4
        el-pagination(
          :current-page="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { pagination.page = p; fetchData() }"
        )

  //- Create / Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingItem ? $t('common.edit') : $t('marketing.socialCrm.addProfile')" width="560px" destroy-on-close)
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('marketing.socialCrm.clientId')" required)
        el-input(v-model="form.clientId" :placeholder="$t('marketing.socialCrm.clientIdPlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.socialCrm.platform')" required)
          el-select(v-model="form.platform" class="w-full")
            el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
        el-form-item(:label="$t('marketing.socialCrm.handle')" required)
          el-input(v-model="form.handle" :placeholder="$t('marketing.socialCrm.handlePlaceholder')")
      el-form-item(:label="$t('marketing.socialCrm.profileUrl')")
        el-input(v-model="form.profileUrl" :placeholder="$t('marketing.socialCrm.urlPlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('marketing.socialCrm.followers')")
          el-input-number(v-model="form.followers" :min="0" class="!w-full")
        el-form-item(:label="$t('marketing.socialCrm.sentiment')")
          el-select(v-model="form.sentiment" class="w-full" clearable)
            el-option(:label="$t('socialCrm.positive')" value="POSITIVE")
            el-option(:label="$t('socialCrm.neutral')" value="NEUTRAL")
            el-option(:label="$t('socialCrm.negative')" value="NEGATIVE")
      el-form-item(:label="$t('common.notes')")
        el-input(v-model="form.notes" type="textarea" :rows="2" :placeholder="$t('marketing.socialCrm.notesPlaceholder')")
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const socialDashboard = ref<any>(null);

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
  const platformBreakdown = platformOptions
    .map(p => ({
      platform: p.label,
      count: data.filter((i: any) => i.platform === p.value).length
    }))
    .filter(p => p.count > 0);
  const breakdownText = platformBreakdown.map(p => `${p.platform}: ${p.count}`).join(', ') || '--';
  const totalFollowers = data.reduce((sum: number, i: any) => sum + (i.followers || 0), 0);
  const positiveSentiment = data.filter((i: any) => i.sentiment === 'POSITIVE').length;

  return [
    { label: t('marketing.socialCrm.totalProfiles'), value: total, icon: 'ph:users-three-bold', color: '#7849ff' },
    { label: t('marketing.socialCrm.totalFollowers'), value: formatNumber(totalFollowers), icon: 'ph:user-circle-plus-bold', color: '#3b82f6' },
    { label: t('marketing.socialCrm.platforms'), value: platformBreakdown.length, icon: 'ph:share-network-bold', color: '#f59e0b' },
    { label: t('marketing.socialCrm.positiveSentiment'), value: positiveSentiment, icon: 'ph:smiley-bold', color: '#22c55e' }
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
  return data.filter(
    (i: any) =>
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
    const res = await useApiFetch(`social-crm?page=${pagination.page}&limit=${pagination.limit}`);
    if (res.success && res.body) {
      const data = res.body as any;
      items.value = data.rows || data.docs || (Array.isArray(data) ? data : []);
      pagination.total = data.count ?? data.total ?? items.value.length;
    }
  } catch {
    ElMessage.error(t('common.error'));
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
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form.value };

    if (editingItem.value) {
      const res = await useApiFetch(`social-crm/${editingItem.value.id}`, 'PUT', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    } else {
      const res = await useApiFetch('social-crm', 'POST', payload);
      if (res.success) {
        ElMessage.success(t('common.saved'));
      } else {
        ElMessage.error(res.message || t('common.error'));
      }
    }
    dialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(item: any) {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const res = await useApiFetch(`social-crm/${item.id}`, 'DELETE');
    if (res.success) {
      ElMessage.success(t('common.deleted'));
      await fetchData();
    } else {
      ElMessage.error(res.message || t('common.error'));
    }
  } catch {
    // User cancelled
  }
}

// Dashboard
async function fetchDashboard() {
  try {
    const res = await useApiFetch('social-crm/dashboard');
    if (res.success && res.body) {
      socialDashboard.value = res.body;
    }
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

const sentimentTotal = computed(() => {
  if (!socialDashboard.value?.sentimentBreakdown) return 0;
  const s = socialDashboard.value.sentimentBreakdown;
  return (s.positive || 0) + (s.neutral || 0) + (s.negative || 0);
});

const maxEngagement = computed(() => {
  if (!socialDashboard.value?.engagementTrends?.length) return 0;
  return Math.max(...socialDashboard.value.engagementTrends.map((t: any) => t.count || 0));
});

const maxFollowers = computed(() => {
  if (!socialDashboard.value?.followerGrowth?.length) return 0;
  return Math.max(...socialDashboard.value.followerGrowth.map((g: any) => g.count || 0));
});

function getHealthColor(health: number): string {
  if (health >= 80) return '#22c55e';
  if (health >= 50) return '#f59e0b';
  return '#ef4444';
}

function formatShortDate(d: string): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch {
    return d;
  }
}

onMounted(() => {
  fetchData();
  fetchDashboard();
});
</script>

<style lang="scss" scoped>
.glass-card {
  border-radius: 16px;
}
</style>
