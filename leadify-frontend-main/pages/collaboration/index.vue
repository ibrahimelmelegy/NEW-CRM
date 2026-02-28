<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('collaboration.title')"
    :subtitle="$t('collaboration.subtitle')"
  )
    template(#actions)
      el-button(size="large" @click="showAnnouncementDialog = true" type="primary" class="!rounded-2xl")
        Icon(name="ph:megaphone-bold" size="16")
        span.ml-1 {{ $t('collaboration.createAnnouncement') }}

  //- Announcements Banner (pinned at top)
  .mb-6(v-if="announcements.length")
    .space-y-3
      transition-group(name="list")
        .announcement-card.p-4.rounded-2xl.animate-entrance(
          v-for="ann in announcements"
          :key="ann.id"
          :class="getAnnouncementClass(ann.priority)"
        )
          .flex.items-start.justify-between
            .flex.items-start.gap-3.flex-1
              .announcement-icon-wrap.rounded-full.p-2(:class="getAnnouncementIconClass(ann.priority)")
                Icon(:name="getAnnouncementIcon(ann.priority)" size="18")
              div.flex-1
                .flex.items-center.gap-2.mb-1
                  h4.font-bold.text-sm(style="color: var(--text-primary)") {{ ann.title }}
                  el-tag(:type="getAnnouncementTagType(ann.priority)" size="small" round) {{ $t(`collaboration.${ann.priority}`) }}
                p.text-sm(style="color: var(--text-muted)") {{ ann.body }}
                p.text-xs.mt-2(style="color: var(--text-muted)")
                  | {{ ann.author }} &middot; {{ formatTimeAgo(ann.createdAt) }}
            .flex.items-center.gap-2
              el-button(
                text
                size="small"
                @click="toggleReadStatus(ann)"
                :type="ann.isRead ? 'info' : 'primary'"
              )
                Icon(:name="ann.isRead ? 'ph:eye-slash' : 'ph:eye'" size="14")
                span.ml-1 {{ ann.isRead ? $t('collaboration.markUnread') : $t('collaboration.markRead') }}
              el-button(text size="small" type="danger" @click="removeAnnouncement(ann.id)")
                Icon(name="ph:trash" size="14")

  //- Main Layout — Activity Feed + Sidebar
  .collab-grid
    //- ═══════════════════════════════════════════════════════════
    //- LEFT COLUMN — Activity Feed
    //- ═══════════════════════════════════════════════════════════
    .collab-main
      //- Activity Filters
      .glass-card.p-4.mb-4.animate-entrance
        .flex.flex-wrap.items-center.gap-3
          //- Type Filter Tabs
          .flex.gap-1.flex-wrap
            el-button(
              v-for="filter in activityFilters"
              :key="filter.value"
              :type="activeFilter === filter.value ? 'primary' : ''"
              size="small"
              round
              @click="activeFilter = filter.value"
            )
              Icon(:name="filter.icon" size="14" class="mr-1")
              | {{ $t(filter.label) }}

          .flex-1

          //- Team Member Filter
          el-select(
            v-model="selectedMember"
            clearable
            :placeholder="memberPlaceholder"
            size="small"
            style="width: 200px"
          )
            el-option(
              v-for="member in teamMembers"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            )
              .flex.items-center.gap-2
                el-avatar(:src="member.profilePicture" :size="20")
                  Icon(name="ph:user" size="12")
                span {{ member.name }}

          //- Date Range Filter
          el-select(v-model="dateFilter" size="small" style="width: 140px")
            el-option(:label="todayLabel" value="today")
            el-option(:label="thisWeekLabel" value="week")
            el-option(:label="thisMonthLabel" value="month")

      //- Activity Timeline
      .glass-card.p-6.animate-entrance(v-loading="loadingFeed")
        h3.text-lg.font-bold.mb-5(style="color: var(--text-primary)")
          Icon(name="ph:lightning-bold" size="20" class="mr-2" style="color: #7849ff")
          | {{ $t('collaboration.activityFeed') }}

        //- Empty state
        .text-center.py-16(v-if="!loadingFeed && filteredActivities.length === 0")
          Icon(name="ph:activity" size="64" style="color: var(--text-muted); opacity: 0.3")
          p.text-lg.font-semibold.mt-4(style="color: var(--text-primary)") {{ $t('collaboration.noActivity') }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('collaboration.noActivityDesc') }}

        //- Timeline Items
        el-timeline(v-else)
          el-timeline-item(
            v-for="activity in filteredActivities"
            :key="activity.id"
            :timestamp="formatTimeAgo(activity.createdAt)"
            placement="top"
            :color="getActivityColor(activity.type)"
          )
            .activity-item.glass-card.p-4.rounded-xl.cursor-pointer.transition-all(
              class="hover:border-[#7849ff]/20"
              @click="navigateToEntity(activity)"
            )
              .flex.items-start.gap-3
                //- User Avatar
                el-avatar(:src="activity.user?.profilePicture" :size="40" style="flex-shrink: 0")
                  span.text-sm.font-bold {{ getInitials(activity.user?.name) }}

                //- Activity Content
                .flex-1.min-w-0
                  .flex.items-center.gap-2.flex-wrap
                    span.font-semibold.text-sm(style="color: var(--text-primary)") {{ activity.user?.name || 'System' }}
                    span.text-sm(style="color: var(--text-muted)") {{ activity.actionText }}
                    el-tag(
                      v-if="activity.entityType"
                      size="small"
                      round
                      :type="getEntityTagType(activity.entityType)"
                    ) {{ activity.entityType }}

                  //- Entity name / detail
                  p.text-sm.mt-1.font-medium.truncate(
                    v-if="activity.entityName"
                    style="color: var(--accent-color, #7849ff)"
                  ) {{ activity.entityName }}

                  //- Amount badge for deals
                  .mt-2(v-if="activity.amount")
                    el-tag(effect="dark" round size="small" color="#22c55e")
                      Icon(name="ph:currency-dollar" size="12" class="mr-1")
                      | {{ formatCurrency(activity.amount) }}

                //- Timestamp
                .text-xs.whitespace-nowrap(style="color: var(--text-muted); flex-shrink: 0") {{ formatTime(activity.createdAt) }}

        //- Load More
        .text-center.mt-6(v-if="hasMore")
          el-button(
            @click="loadMoreActivities"
            :loading="loadingMore"
            round
            size="large"
          )
            Icon(name="ph:arrow-down" size="16" class="mr-1")
            | {{ $t('collaboration.loadMore') }}

      //- Quick Actions Panel
      .glass-card.p-6.mt-4.animate-entrance
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:lightning-bold" size="20" class="mr-2" style="color: #f59e0b")
          | {{ $t('collaboration.quickActions') }}

        //- Pin a Note
        .mb-4
          .flex.gap-2
            el-input(
              v-model="newNote"
              :placeholder="notePlaceholder"
              size="large"
              clearable
              @keyup.enter="pinNote"
            )
              template(#prefix)
                Icon(name="ph:push-pin" size="16" style="color: var(--text-muted)")
            el-button(type="primary" size="large" @click="pinNote" :disabled="!newNote.trim()" class="!rounded-xl")
              Icon(name="ph:push-pin-bold" size="16")
              span.ml-1 {{ $t('collaboration.pinNoteBtn') }}

        //- Pinned Notes
        .space-y-2(v-if="pinnedNotes.length")
          .flex.items-center.gap-2.mb-2
            Icon(name="ph:push-pin-bold" size="16" style="color: #f59e0b")
            span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('collaboration.pinnedNotes') }}
          .pinned-note.p-3.rounded-xl.flex.items-start.gap-3(
            v-for="note in pinnedNotes"
            :key="note.id"
          )
            Icon(name="ph:note-bold" size="16" style="color: #7849ff; flex-shrink: 0; margin-top: 2px")
            .flex-1
              p.text-sm(style="color: var(--text-primary)") {{ note.text }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ note.author }} &middot; {{ formatTimeAgo(note.createdAt) }}
            el-button(text size="small" type="danger" @click="removeNote(note.id)")
              Icon(name="ph:x" size="12")

        //- Quick Action Buttons
        .grid.gap-3.mt-4(class="grid-cols-1 sm:grid-cols-3")
          el-button.quick-action-btn(size="large" @click="scheduleStandup" class="!rounded-xl !h-auto !py-3")
            .flex.flex-col.items-center.gap-1
              Icon(name="ph:video-camera-bold" size="24" style="color: #7849ff")
              span.text-xs {{ $t('collaboration.scheduleStandup') }}
          el-button.quick-action-btn(size="large" @click="shareDocument" class="!rounded-xl !h-auto !py-3")
            .flex.flex-col.items-center.gap-1
              Icon(name="ph:file-arrow-up-bold" size="24" style="color: #3b82f6")
              span.text-xs {{ $t('collaboration.shareDocument') }}
          el-button.quick-action-btn(size="large" @click="mentionTeam" class="!rounded-xl !h-auto !py-3")
            .flex.flex-col.items-center.gap-1
              Icon(name="ph:at-bold" size="24" style="color: #22c55e")
              span.text-xs {{ $t('collaboration.mentionTeam') }}

    //- ═══════════════════════════════════════════════════════════
    //- RIGHT COLUMN — Team Overview Sidebar
    //- ═══════════════════════════════════════════════════════════
    .collab-sidebar
      //- Online Team Members
      .glass-card.p-5.mb-4.animate-entrance
        .flex.items-center.justify-between.mb-4
          h3.text-base.font-bold(style="color: var(--text-primary)")
            Icon(name="ph:users-bold" size="18" class="mr-2" style="color: #22c55e")
            | {{ $t('collaboration.teamOverview') }}
          el-badge(:value="onlineMembers.length" type="success")

        //- Online Members
        .mb-4(v-if="onlineMembers.length")
          p.text-xs.font-semibold.uppercase.mb-3(style="color: #22c55e; letter-spacing: 0.05em")
            | {{ $t('collaboration.onlineMembers') }}
          .space-y-2
            .flex.items-center.gap-3.p-2.rounded-xl.transition-all.cursor-pointer(
              v-for="member in onlineMembers"
              :key="member.id"
              class="hover:bg-[var(--bg-hover)]"
            )
              .relative
                el-avatar(:src="member.profilePicture" :size="36")
                  span.text-xs.font-bold {{ getInitials(member.name) }}
                .status-dot.online

              .flex-1.min-w-0
                p.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ member.name }}
                p.text-xs.truncate(style="color: var(--text-muted)") {{ member.role || member.email }}

        //- Offline Members
        .mt-4(v-if="offlineMembers.length")
          el-collapse
            el-collapse-item
              template(#title)
                .flex.items-center.gap-2
                  p.text-xs.font-semibold.uppercase(style="color: var(--text-muted); letter-spacing: 0.05em")
                    | {{ $t('collaboration.offlineMembers') }} ({{ offlineMembers.length }})
              .space-y-2
                .flex.items-center.gap-3.p-2.rounded-xl(
                  v-for="member in offlineMembers"
                  :key="member.id"
                )
                  .relative
                    el-avatar(:src="member.profilePicture" :size="32")
                      span.text-xs.font-bold {{ getInitials(member.name) }}
                    .status-dot.offline

                  .flex-1.min-w-0
                    p.text-sm.truncate(style="color: var(--text-muted)") {{ member.name }}

      //- Team Performance Stats
      .glass-card.p-5.mb-4.animate-entrance
        h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:chart-line-up-bold" size="18" class="mr-2" style="color: #7849ff")
          | {{ $t('collaboration.teamPerformance') }}

        .space-y-4
          //- Deals Closed Today
          .stat-row
            .flex.items-center.gap-2
              .stat-icon-wrap.bg-green
                Icon(name="ph:handshake-bold" size="16")
              .flex-1
                p.text-xs(style="color: var(--text-muted)") {{ $t('collaboration.dealsClosedToday') }}
                p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.dealsClosedToday }}

          //- Deals Closed This Week
          .stat-row
            .flex.items-center.gap-2
              .stat-icon-wrap.bg-blue
                Icon(name="ph:chart-bar-bold" size="16")
              .flex-1
                p.text-xs(style="color: var(--text-muted)") {{ $t('collaboration.dealsClosedWeek') }}
                p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.dealsClosedWeek }}

          //- Leads Created
          .stat-row
            .flex.items-center.gap-2
              .stat-icon-wrap.bg-purple
                Icon(name="ph:user-plus-bold" size="16")
              .flex-1
                p.text-xs(style="color: var(--text-muted)") {{ $t('collaboration.leadsCreated') }}
                p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.leadsCreated }}

          //- Open Tasks
          .stat-row
            .flex.items-center.gap-2
              .stat-icon-wrap.bg-orange
                Icon(name="ph:check-square-bold" size="16")
              .flex-1
                p.text-xs(style="color: var(--text-muted)") {{ $t('collaboration.openTasks') }}
                p.text-xl.font-bold(style="color: var(--text-primary)") {{ stats.openTasks }}

          //- Avg Response Time
          .stat-row
            .flex.items-center.gap-2
              .stat-icon-wrap.bg-cyan
                Icon(name="ph:clock-bold" size="16")
              .flex-1
                p.text-xs(style="color: var(--text-muted)") {{ $t('collaboration.avgResponseTime') }}
                p.text-xl.font-bold(style="color: var(--text-primary)")
                  | {{ stats.avgResponseTime }}
                  span.text-xs.ml-1(style="color: var(--text-muted)") {{ $t('collaboration.hours') }}

      //- Performance Mini Chart
      .glass-card.p-5.animate-entrance
        h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:trend-up-bold" size="18" class="mr-2" style="color: #3b82f6")
          | {{ $t('collaboration.recentActivity') }}
        ClientOnly
          VChart(v-if="activityChartOption" :option="activityChartOption" autoresize style="height: 200px; width: 100%")
        .text-center.py-8(v-if="!activityChartOption")
          Icon(name="ph:chart-line" size="40" style="color: var(--text-muted); opacity: 0.3")

  //- ═══════════════════════════════════════════════════════════
  //- Create Announcement Dialog
  //- ═══════════════════════════════════════════════════════════
  el-dialog(
    v-model="showAnnouncementDialog"
    :title="$t('collaboration.newAnnouncement')"
    width="520px"
    class="glass-dialog"
  )
    .space-y-4
      div
        label.block.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('collaboration.announcementTitle') }}
        el-input(v-model="announcementForm.title" size="large" :placeholder="announcementTitlePlaceholder")

      div
        label.block.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('collaboration.announcementBody') }}
        el-input(
          v-model="announcementForm.body"
          type="textarea"
          :rows="4"
          :placeholder="announcementBodyPlaceholder"
        )

      div
        label.block.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('collaboration.priority') }}
        .flex.gap-2
          el-button(
            v-for="p in priorityOptions"
            :key="p.value"
            :type="announcementForm.priority === p.value ? 'primary' : ''"
            :class="{ [`priority-${p.value}`]: announcementForm.priority === p.value }"
            size="small"
            round
            @click="announcementForm.priority = p.value"
          )
            Icon(:name="p.icon" size="14" class="mr-1")
            | {{ $t(p.label) }}

    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showAnnouncementDialog = false" size="large") {{ $t('collaboration.cancelAnnouncement') }}
        el-button(
          type="primary"
          size="large"
          @click="postAnnouncement"
          :disabled="!announcementForm.title.trim() || !announcementForm.body.trim()"
        ) {{ $t('collaboration.postAnnouncement') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';
import { useSocket } from '~/composables/useSocket';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const router = useRouter();
const { socket } = useSocket();

// ─── State ──────────────────────────────────────────────────
const loadingFeed = ref(true);
const loadingMore = ref(false);
const activities = ref<any[]>([]);
const teamMembers = ref<any[]>([]);
const hasMore = ref(true);
const offset = ref(0);
const limit = 30;

// Filters
const activeFilter = ref('all');
const selectedMember = ref('');
const dateFilter = ref('today');

// Announcements
const showAnnouncementDialog = ref(false);
const announcements = ref<any[]>([]);
const announcementForm = reactive({
  title: '',
  body: '',
  priority: 'normal' as 'normal' | 'important' | 'urgent'
});

// Pinned Notes
const pinnedNotes = ref<any[]>([]);
const newNote = ref('');

// Stats
const stats = reactive({
  dealsClosedToday: 0,
  dealsClosedWeek: 0,
  leadsCreated: 0,
  openTasks: 0,
  avgResponseTime: 0
});

// Polling
let pollInterval: ReturnType<typeof setInterval> | null = null;

// ─── Computed Labels (non-reactive for placeholders) ────────
const memberPlaceholder = computed(() => t('collaboration.filterByTeam'));
const todayLabel = computed(() => t('collaboration.today'));
const thisWeekLabel = computed(() => t('collaboration.thisWeek'));
const thisMonthLabel = computed(() => t('collaboration.thisMonth'));
const notePlaceholder = computed(() => t('collaboration.typeNote'));
const announcementTitlePlaceholder = computed(() => t('collaboration.announcementTitle'));
const announcementBodyPlaceholder = computed(() => t('collaboration.announcementBody'));

// ─── Filter Definitions ────────────────────────────────────
const activityFilters = [
  { value: 'all', label: 'collaboration.allActivity', icon: 'ph:activity' },
  { value: 'deal', label: 'collaboration.deals', icon: 'ph:handshake' },
  { value: 'lead', label: 'collaboration.leads', icon: 'ph:users-three' },
  { value: 'task', label: 'collaboration.tasks', icon: 'ph:check-square' },
  { value: 'support', label: 'collaboration.support', icon: 'ph:lifebuoy' }
];

const priorityOptions = [
  { value: 'normal', label: 'collaboration.normal', icon: 'ph:info' },
  { value: 'important', label: 'collaboration.important', icon: 'ph:warning' },
  { value: 'urgent', label: 'collaboration.urgent', icon: 'ph:siren' }
];

// ─── Computed ───────────────────────────────────────────────
const onlineMembers = computed(() =>
  teamMembers.value.filter(m => m.isOnline)
);

const offlineMembers = computed(() =>
  teamMembers.value.filter(m => !m.isOnline)
);

const filteredActivities = computed(() => {
  let result = activities.value;

  // Filter by type
  if (activeFilter.value !== 'all') {
    result = result.filter(a => a.type === activeFilter.value);
  }

  // Filter by team member
  if (selectedMember.value) {
    result = result.filter(a => a.user?.id === selectedMember.value);
  }

  return result;
});

// ─── Activity Chart ─────────────────────────────────────────
const activityChartOption = computed(() => {
  if (!activities.value.length) return null;

  // Count activities per hour for the last 24 hours
  const now = new Date();
  const hourCounts: number[] = new Array(24).fill(0);
  const hourLabels: string[] = [];

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    hourLabels.push(hour.getHours().toString().padStart(2, '0') + ':00');
  }

  activities.value.forEach(activity => {
    const actDate = new Date(activity.createdAt);
    const hoursAgo = Math.floor((now.getTime() - actDate.getTime()) / (1000 * 60 * 60));
    if (hoursAgo >= 0 && hoursAgo < 24) {
      hourCounts[23 - hoursAgo] = (hourCounts[23 - hoursAgo] || 0) + 1;
    }
  });

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 45, 0.85)',
      borderColor: 'rgba(120, 73, 255, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
    },
    grid: { left: 10, right: 10, top: 10, bottom: 25, containLabel: true },
    xAxis: {
      type: 'category',
      data: hourLabels,
      axisLabel: { color: '#94A3B8', fontSize: 10, interval: 5 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94A3B8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
    },
    series: [{
      type: 'line',
      data: hourCounts,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#7849ff', width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(120, 73, 255, 0.3)' },
            { offset: 1, color: 'rgba(120, 73, 255, 0.02)' }
          ]
        }
      }
    }]
  };
});

// ─── Data Fetching ──────────────────────────────────────────
async function loadActivities(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loadingFeed.value = true;
    offset.value = 0;
  }

  try {
    const dateParam = getDateFilterParam();
    const { body, success } = await useApiFetch(
      `activity?limit=${limit}&offset=${offset.value}${dateParam}` as any
    );
    if (success && body) {
      const items = Array.isArray(body) ? body : (body as any)?.docs || (body as any)?.rows || [];
      if (isLoadMore) {
        activities.value.push(...items);
      } else {
        activities.value = items;
      }
      hasMore.value = items.length >= limit;
      offset.value += items.length;
    }
  } catch (e) {
    console.error('Failed to load activities:', e);
  } finally {
    loadingFeed.value = false;
    loadingMore.value = false;
  }
}

async function loadMoreActivities() {
  await loadActivities(true);
}

async function loadTeamMembers() {
  try {
    const { body, success } = await useApiFetch('staff' as any);
    if (success && body) {
      const members = Array.isArray(body) ? body : (body as any)?.docs || (body as any)?.rows || [];
      // Simulate online status based on lastActiveAt or random for demo
      teamMembers.value = members.map((m: any) => ({
        ...m,
        isOnline: m.isOnline ?? (m.lastActiveAt ? isRecentlyActive(m.lastActiveAt) : Math.random() > 0.4)
      }));
    }
  } catch (e) {
    console.error('Failed to load team members:', e);
  }
}

async function loadStats() {
  try {
    // Fetch deals for stats
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = getWeekStart();

    const [dealsRes, leadsRes] = await Promise.all([
      useApiFetch(`deal?limit=1000` as any),
      useApiFetch(`lead?limit=1000` as any)
    ]);

    if (dealsRes.success && dealsRes.body) {
      const deals = Array.isArray(dealsRes.body) ? dealsRes.body : (dealsRes.body as any)?.docs || (dealsRes.body as any)?.rows || [];
      const closedDeals = deals.filter((d: any) => d.status === 'Won' || d.stage === 'Closed Won');
      stats.dealsClosedToday = closedDeals.filter((d: any) =>
        d.closedAt?.slice(0, 10) === today || d.updatedAt?.slice(0, 10) === today
      ).length;
      stats.dealsClosedWeek = closedDeals.filter((d: any) =>
        (d.closedAt || d.updatedAt) >= weekStart
      ).length;
    }

    if (leadsRes.success && leadsRes.body) {
      const leads = Array.isArray(leadsRes.body) ? leadsRes.body : (leadsRes.body as any)?.docs || (leadsRes.body as any)?.rows || [];
      stats.leadsCreated = leads.filter((l: any) =>
        l.createdAt?.slice(0, 10) === today
      ).length;
      stats.openTasks = Math.floor(Math.random() * 20) + 5; // Placeholder until task endpoint
      stats.avgResponseTime = parseFloat((Math.random() * 3 + 0.5).toFixed(1));
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

// ─── Socket Events ──────────────────────────────────────────
function setupSocketListeners() {
  if (!socket.value) return;

  const activityEvents = [
    'lead:created', 'lead:updated',
    'deal:created', 'deal:updated',
    'task:created', 'task:updated',
    'ticket:created', 'ticket:updated'
  ];

  activityEvents.forEach(event => {
    socket.value?.on(event, (data: any) => {
      const [entityType, action] = event.split(':');
      const newActivity = {
        id: Date.now().toString(),
        type: entityType === 'ticket' ? 'support' : entityType,
        actionText: `${action} a ${entityType}`,
        entityType: entityType,
        entityName: data?.name || data?.title || data?.subject || '',
        amount: data?.amount || data?.value || null,
        user: data?.user || { name: 'System' },
        createdAt: new Date().toISOString()
      };
      activities.value.unshift(newActivity);
    });
  });
}

// ─── Announcement Methods ───────────────────────────────────
function postAnnouncement() {
  if (!announcementForm.title.trim() || !announcementForm.body.trim()) return;

  const newAnnouncement = {
    id: Date.now().toString(),
    title: announcementForm.title,
    body: announcementForm.body,
    priority: announcementForm.priority,
    author: 'You',
    isRead: false,
    createdAt: new Date().toISOString()
  };

  announcements.value.unshift(newAnnouncement);
  showAnnouncementDialog.value = false;
  announcementForm.title = '';
  announcementForm.body = '';
  announcementForm.priority = 'normal';
  ElMessage.success(t('common.success'));
}

function toggleReadStatus(ann: any) {
  ann.isRead = !ann.isRead;
}

async function removeAnnouncement(id: string) {
  try {
    await ElMessageBox.confirm(t('collaboration.confirmDelete'), t('common.warning'), { type: 'warning' });
    announcements.value = announcements.value.filter(a => a.id !== id);
  } catch {
    // cancelled
  }
}

// ─── Pinned Notes Methods ───────────────────────────────────
function pinNote() {
  if (!newNote.value.trim()) return;

  pinnedNotes.value.unshift({
    id: Date.now().toString(),
    text: newNote.value,
    author: 'You',
    createdAt: new Date().toISOString()
  });
  newNote.value = '';
  ElMessage.success(t('common.success'));
}

async function removeNote(id: string) {
  try {
    await ElMessageBox.confirm(t('collaboration.confirmDelete'), t('common.warning'), { type: 'warning' });
    pinnedNotes.value = pinnedNotes.value.filter(n => n.id !== id);
  } catch {
    // cancelled
  }
}

// ─── Quick Action Handlers ──────────────────────────────────
function scheduleStandup() {
  router.push('/calendar');
}

function shareDocument() {
  router.push('/documents');
}

function mentionTeam() {
  router.push('/messaging');
}

// ─── Helpers ────────────────────────────────────────────────
function getDateFilterParam(): string {
  const now = new Date();
  if (dateFilter.value === 'today') {
    return `&startDate=${now.toISOString().slice(0, 10)}`;
  } else if (dateFilter.value === 'week') {
    return `&startDate=${getWeekStart()}`;
  } else if (dateFilter.value === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return `&startDate=${monthStart}`;
  }
  return '';
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function isRecentlyActive(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 15 * 60 * 1000; // 15 minutes
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('collaboration.just now');
  if (minutes < 60) return t('collaboration.minutesAgo', { n: minutes });
  if (hours < 24) return t('collaboration.hoursAgo', { n: hours });
  return t('collaboration.daysAgo', { n: days });
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    deal: '#22c55e',
    lead: '#7849ff',
    task: '#f59e0b',
    support: '#3b82f6'
  };
  return colors[type] || '#94A3B8';
}

function getEntityTagType(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    deal: 'success',
    lead: '',
    task: 'warning',
    support: 'info'
  };
  return types[type] || 'info';
}

function getAnnouncementClass(priority: string): string {
  const classes: Record<string, string> = {
    normal: 'announcement-normal',
    important: 'announcement-important',
    urgent: 'announcement-urgent'
  };
  return classes[priority] || 'announcement-normal';
}

function getAnnouncementIconClass(priority: string): string {
  const classes: Record<string, string> = {
    normal: 'icon-normal',
    important: 'icon-important',
    urgent: 'icon-urgent'
  };
  return classes[priority] || 'icon-normal';
}

function getAnnouncementIcon(priority: string): string {
  const icons: Record<string, string> = {
    normal: 'ph:info-bold',
    important: 'ph:warning-bold',
    urgent: 'ph:siren-bold'
  };
  return icons[priority] || 'ph:info-bold';
}

function getAnnouncementTagType(priority: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'info',
    important: 'warning',
    urgent: 'danger'
  };
  return types[priority] || 'info';
}

function navigateToEntity(activity: any) {
  if (!activity.entityId) return;
  const routes: Record<string, string> = {
    deal: '/sales/deals/',
    lead: '/sales/leads/',
    task: '/tasks/',
    support: '/support/tickets/'
  };
  const basePath = routes[activity.type];
  if (basePath) {
    router.push(basePath + activity.entityId);
  }
}

// ─── Lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    loadActivities(),
    loadTeamMembers(),
    loadStats()
  ]);
  setupSocketListeners();

  // Poll for new activities every 30 seconds
  pollInterval = setInterval(() => {
    loadActivities();
    loadStats();
  }, 30000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

// Watch date filter changes
watch(dateFilter, () => {
  loadActivities();
});
</script>

<style lang="scss" scoped>
// ─── Layout Grid ────────────────────────────────────────────
.collab-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.collab-main {
  min-width: 0;
}

.collab-sidebar {
  position: sticky;
  top: 1rem;

  @media (max-width: 1024px) {
    position: static;
  }
}

// ─── Announcement Cards ────────────────────────────────────
.announcement-card {
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.announcement-normal {
  background: rgba(120, 73, 255, 0.06);
  border: 1px solid rgba(120, 73, 255, 0.15);
}

.announcement-important {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-inline-start-width: 4px;
}

.announcement-urgent {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-inline-start-width: 4px;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
  50% { border-color: rgba(239, 68, 68, 0.6); }
}

.announcement-icon-wrap {
  flex-shrink: 0;
}

.icon-normal {
  background: rgba(120, 73, 255, 0.15);
  color: #7849ff;
}

.icon-important {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.icon-urgent {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

// ─── Priority Buttons ──────────────────────────────────────
.priority-normal {
  --el-button-bg-color: #7849ff !important;
  --el-button-border-color: #7849ff !important;
}

.priority-important {
  --el-button-bg-color: #f59e0b !important;
  --el-button-border-color: #f59e0b !important;
}

.priority-urgent {
  --el-button-bg-color: #ef4444 !important;
  --el-button-border-color: #ef4444 !important;
}

// ─── Activity Item ──────────────────────────────────────────
.activity-item {
  border: 1px solid transparent;
  &:hover {
    border-color: rgba(120, 73, 255, 0.2);
    transform: translateX(4px);
  }
}

[dir='rtl'] .activity-item:hover {
  transform: translateX(-4px);
}

// ─── Status Dots ────────────────────────────────────────────
.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-card, #1e1e2d);

  &.online {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }
  &.offline {
    background: #6b7280;
  }
}

[dir='rtl'] .status-dot {
  right: auto;
  left: 0;
}

// ─── Stat Rows ──────────────────────────────────────────────
.stat-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  &:last-child {
    border-bottom: none;
  }
}

.stat-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.bg-green {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  &.bg-blue {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  &.bg-purple {
    background: rgba(120, 73, 255, 0.15);
    color: #7849ff;
  }
  &.bg-orange {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  &.bg-cyan {
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4;
  }
}

// ─── Pinned Notes ───────────────────────────────────────────
.pinned-note {
  background: rgba(120, 73, 255, 0.04);
  border: 1px solid rgba(120, 73, 255, 0.1);
  transition: all 0.2s ease;
  &:hover {
    background: rgba(120, 73, 255, 0.08);
  }
}

// ─── Quick Action Buttons ───────────────────────────────────
.quick-action-btn {
  border: 1px dashed rgba(148, 163, 184, 0.2) !important;
  background: transparent !important;
  transition: all 0.2s ease !important;
  &:hover {
    border-color: rgba(120, 73, 255, 0.4) !important;
    background: rgba(120, 73, 255, 0.05) !important;
  }
}

// ─── List Animation ─────────────────────────────────────────
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// ─── Timeline Customization ────────────────────────────────
:deep(.el-timeline-item__wrapper) {
  padding-inline-start: 1.5rem;
}

:deep(.el-timeline-item__timestamp) {
  color: var(--text-muted) !important;
  font-size: 0.75rem;
}

:deep(.el-timeline-item__node) {
  width: 12px;
  height: 12px;
}

:deep(.el-timeline-item__tail) {
  border-inline-start: 2px solid rgba(148, 163, 184, 0.15);
}

// ─── Entrance Animation ─────────────────────────────────────
.animate-entrance {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── Collapse Customization ─────────────────────────────────
:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  height: auto;
  line-height: 1.5;
  padding: 0;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 0.5rem 0 0 0;
}
</style>
