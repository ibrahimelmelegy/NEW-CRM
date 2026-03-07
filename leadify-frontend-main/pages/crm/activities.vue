<template lang="pug">
.activities-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('activities.timeline') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('activities.subtitle') }}
    .flex.items-center.gap-3
      el-button(type="primary" @click="showCreateDialog = true" class="!bg-[#7849ff] !border-none")
        Icon(name="ph:plus" size="16")
        span.ml-1 {{ $t('activities.logActivity') }}

  //- Filters
  .glass-card.p-4.rounded-2xl.mb-6
    .flex.items-center.flex-wrap.gap-3
      el-select(v-model="filterType" clearable :placeholder="$t('activities.activityType')" @change="loadActivities" class="w-40")
        el-option(value="" :label="$t('activities.allTypes')")
        el-option(v-for="t in activityTypes" :key="t.value" :value="t.value" :label="t.label")
      el-select(v-model="filterEntity" clearable :placeholder="$t('activities.entity')" @change="loadActivities" class="w-40")
        el-option(value="" :label="$t('activities.allEntities')")
        el-option(value="deal" :label="$t('navigation.deals')")
        el-option(value="lead" :label="$t('navigation.leads')")
        el-option(value="client" :label="$t('navigation.clients')")
        el-option(value="ticket" :label="$t('navigation.tickets')")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :range-separator="$t('common.to')"
        :start-placeholder="$t('common.from')"
        :end-placeholder="$t('common.to')"
        @change="loadActivities"
      )
      el-input(
        v-model="searchQuery"
        :placeholder="$t('activities.searchPlaceholder')"
        clearable
        class="w-60"
        @input="debounceLoad"
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16")

  //- Layout: Timeline + Sidebar
  .grid.gap-6(class="lg:grid-cols-4")
    //- Timeline (3 cols)
    .space-y-0(class="lg:col-span-3")
      .relative
        //- Vertical line
        .absolute.top-0.bottom-0(style="left: 23px; width: 2px; background: var(--glass-border)")

        //- Activity Items
        .space-y-4
          .timeline-item.flex.gap-4(v-for="activity in activities" :key="activity.id")
            //- Icon dot
            .flex-shrink-0.relative.z-10
              .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: getActivityColor(activity.type) + '20', border: '2px solid ' + getActivityColor(activity.type) }")
                Icon(:name="getActivityIcon(activity.type)" size="20" :style="{ color: getActivityColor(activity.type) }")

            //- Content Card
            .glass-card.p-4.rounded-xl.flex-1
              .flex.items-start.justify-between
                div
                  .flex.items-center.gap-2
                    h4.text-sm.font-bold(style="color: var(--text-primary)") {{ activity.title }}
                    el-tag(:color="getActivityColor(activity.type)" effect="dark" size="small" round) {{ activity.type }}
                  p.text-sm.mt-1(v-if="activity.description" style="color: var(--text-secondary)") {{ activity.description }}
                  .flex.items-center.gap-3.mt-2
                    .flex.items-center.gap-1(v-if="activity.user")
                      Icon(name="ph:user" size="12" style="color: var(--text-muted)")
                      span.text-xs(style="color: var(--text-muted)") {{ activity.user }}
                    .flex.items-center.gap-1(v-if="activity.entity")
                      Icon(:name="getEntityIcon(activity.entityType)" size="12" style="color: var(--text-muted)")
                      NuxtLink.text-xs(:to="activity.entityLink || '#'" style="color: #7849ff") {{ activity.entity }}
                    .flex.items-center.gap-1(v-if="activity.duration")
                      Icon(name="ph:clock" size="12" style="color: var(--text-muted)")
                      span.text-xs(style="color: var(--text-muted)") {{ activity.duration }}
                .flex.items-center.gap-2
                  span.text-xs.whitespace-nowrap(style="color: var(--text-muted)") {{ formatTime(activity.createdAt) }}

          //- Loading
          .flex.justify-center.py-8(v-if="loading")
            el-icon.is-loading(:size="24" style="color: #7849ff")

          //- Empty
          .text-center.py-12(v-if="!loading && !activities.length")
            Icon(name="ph:clock-counter-clockwise" size="48" style="color: var(--text-muted)")
            p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('activities.noActivitiesYet') }}
            p.mt-1(style="color: var(--text-muted)") {{ $t('activities.startLoggingMessage') }}

          //- Load more
          .text-center.py-4(v-if="hasMore && activities.length")
            el-button(@click="loadMore") {{ $t('common.loadMore') }}

    //- Sidebar
    .space-y-6
      //- Activity Summary
      .glass-card.p-5.rounded-2xl
        h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:chart-pie" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('common.summary') }}
        .space-y-3
          .flex.items-center.justify-between(v-for="stat in activityStats" :key="stat.label")
            .flex.items-center.gap-2
              .w-3.h-3.rounded-full(:style="{ background: stat.color }")
              span.text-xs(style="color: var(--text-muted)") {{ stat.label }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ stat.count }}

      //- Recent People
      .glass-card.p-5.rounded-2xl
        h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
          Icon(name="ph:users" size="16" class="mr-2" style="color: #7849ff")
          | {{ $t('activities.activeContacts') }}
        .space-y-2
          .flex.items-center.gap-3(v-for="person in recentPeople" :key="person.name")
            .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(style="background: rgba(120,73,255,0.15); color: #7849ff") {{ person.name?.charAt(0) }}
            div
              p.text-sm.font-medium(style="color: var(--text-primary)") {{ person.name }}
              p.text-xs(style="color: var(--text-muted)") {{ person.lastActivity }}

  //- Create Activity Dialog
  el-dialog(v-model="showCreateDialog" :title="$t('activities.logActivity')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('activities.activityType')")
        el-select(v-model="newActivity.type" style="width: 100%")
          el-option(v-for="t in activityTypes" :key="t.value" :value="t.value" :label="t.label")
      el-form-item(:label="$t('common.title')")
        el-input(v-model="newActivity.title" :placeholder="$t('activities.titlePlaceholder')")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="newActivity.description" type="textarea" :rows="3" :placeholder="$t('activities.descriptionPlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('common.date')")
          el-date-picker(v-model="newActivity.date" type="datetime" style="width: 100%")
        el-form-item(:label="$t('activities.duration')")
          el-input(v-model="newActivity.duration" :placeholder="$t('activities.durationPlaceholder')")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showCreateDialog = false") {{ $t('common.cancel') }}
        el-button(type="primary" @click="createActivity" :loading="saving" class="!bg-[#7849ff] !border-none") {{ $t('activities.saveActivity') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ElNotification } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  user?: string;
  entity?: string;
  entityType?: string;
  entityLink?: string;
  duration?: string;
  createdAt: string;
}

const loading = ref(false);
const saving = ref(false);
const activities = ref<Activity[]>([]);
const hasMore = ref(false);
const page = ref(1);

const filterType = ref('');
const filterEntity = ref('');
const dateRange = ref<[Date, Date] | null>(null);
const searchQuery = ref('');
const showCreateDialog = ref(false);

let debounceTimer: ReturnType<typeof setTimeout>;

const activityTypes = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
  { value: 'deal_update', label: 'Deal Update' },
  { value: 'ticket_update', label: 'Ticket Update' }
];

const newActivity = ref({
  type: 'call',
  title: '',
  description: '',
  date: new Date(),
  duration: ''
});

const activityStats = computed(() => {
  const typeCounts: Record<string, number> = {};
  activities.value.forEach(a => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  return [
    { label: 'Calls', count: typeCounts.call || 0, color: '#7849ff' },
    { label: 'Emails', count: typeCounts.email || 0, color: '#3b82f6' },
    { label: 'Meetings', count: typeCounts.meeting || 0, color: '#10b981' },
    { label: 'Notes', count: typeCounts.note || 0, color: '#f59e0b' },
    { label: 'Tasks', count: typeCounts.task || 0, color: '#a855f7' },
    { label: 'Updates', count: (typeCounts.deal_update || 0) + (typeCounts.ticket_update || 0), color: '#06b6d4' }
  ];
});

const recentPeople = ref<Array<{ name: string; lastActivity: string }>>([]);

function getActivityIcon(type: string): string {
  return (
    {
      call: 'ph:phone',
      email: 'ph:envelope',
      meeting: 'ph:video-camera',
      note: 'ph:note',
      task: 'ph:check-square',
      deal_update: 'ph:handshake',
      ticket_update: 'ph:ticket'
    }[type] || 'ph:clock'
  );
}

function getActivityColor(type: string): string {
  return (
    {
      call: '#7849ff',
      email: '#3b82f6',
      meeting: '#10b981',
      note: '#f59e0b',
      task: '#a855f7',
      deal_update: '#06b6d4',
      ticket_update: '#ef4444'
    }[type] || '#7849ff'
  );
}

function getEntityIcon(type?: string): string {
  return (
    {
      deal: 'ph:handshake',
      lead: 'ph:user',
      client: 'ph:buildings',
      ticket: 'ph:ticket'
    }[type || ''] || 'ph:circle'
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    loadActivities();
  }, 400);
}

// Store all raw activities for client-side filtering
const allRawActivities = ref<Activity[]>([]);
const itemsPerPage = 20;

async function loadActivities(append = false) {
  loading.value = true;

  if (!append) {
    page.value = 1;
    allRawActivities.value = [];
  }

  const fetched: Activity[] = [];
  const limit = itemsPerPage * page.value;

  try {
    // Load from deals, tasks, tickets in parallel
    const [dealRes, taskRes, ticketRes] = await Promise.all([
      useApiFetch(`deal?limit=${limit}&sort=DESC&sortBy=createdAt`, 'GET', {}, true),
      useApiFetch(`tasks?limit=${limit}&sort=DESC&sortBy=createdAt`, 'GET', {}, true),
      useApiFetch(`support/tickets?limit=${Math.ceil(limit / 2)}`, 'GET', {}, true)
    ]);

    if (dealRes.success && dealRes.body) {
      const deals = (dealRes.body as unknown).docs || dealRes.body || [];
      deals.forEach(d => {
        fetched.push({
          id: `deal-${d.id}`,
          type: 'deal_update',
          title: `Deal "${d.name}" - ${d.stage || 'Updated'}`,
          description:
            d.status === 'WON'
              ? 'Deal closed as won!'
              : d.status === 'LOST'
                ? 'Deal marked as lost'
                : `Value: $${Number(d.value || 0).toLocaleString()}`,
          user: d.owner?.name || d.assignee?.name,
          entity: d.name,
          entityType: 'deal',
          entityLink: `/sales/deals/${d.id}`,
          createdAt: d.updatedAt || d.createdAt
        });
      });
    }

    if (taskRes.success && taskRes.body) {
      const tasks = (taskRes.body as unknown).docs || taskRes.body || [];
      tasks.forEach(t => {
        fetched.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          description: `Priority: ${t.priority || 'Normal'} - Status: ${t.status}`,
          user: t.assignee?.name,
          entity: t.title,
          entityType: 'task',
          entityLink: `/tasks/${t.id}`,
          createdAt: t.updatedAt || t.createdAt
        });
      });
    }

    if (ticketRes.success && ticketRes.body) {
      const tickets = (ticketRes.body as unknown).docs || ticketRes.body || [];
      tickets.forEach(tk => {
        fetched.push({
          id: `ticket-${tk.id}`,
          type: 'ticket_update',
          title: tk.subject,
          description: `Status: ${tk.status} - ${tk.ticketNumber || ''}`,
          user: tk.assignee?.name,
          entity: tk.subject,
          entityType: 'ticket',
          entityLink: `/support/tickets/${tk.id}`,
          createdAt: tk.updatedAt || tk.createdAt
        });
      });
    }

    // Sort all by date
    fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    allRawActivities.value = fetched;

    // Apply filters
    let filtered = fetched;
    if (filterType.value) filtered = filtered.filter(a => a.type === filterType.value);
    if (filterEntity.value) filtered = filtered.filter(a => a.entityType === filterEntity.value);
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        a => a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.entity?.toLowerCase().includes(q)
      );
    }
    // Apply date range filter
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      const start = new Date(dateRange.value[0]).getTime();
      const end = new Date(dateRange.value[1]).getTime() + 86400000; // include end day
      filtered = filtered.filter(a => {
        const t = new Date(a.createdAt).getTime();
        return t >= start && t <= end;
      });
    }

    // Paginate results
    const paged = filtered.slice(0, page.value * itemsPerPage);
    activities.value = paged;
    hasMore.value = paged.length < filtered.length;

    // Build recent people
    const peopleMap: Record<string, string> = {};
    fetched.forEach(a => {
      if (a.user && !peopleMap[a.user]) {
        peopleMap[a.user] = formatTime(a.createdAt);
      }
    });
    recentPeople.value = Object.entries(peopleMap)
      .slice(0, 5)
      .map(([name, lastActivity]) => ({ name, lastActivity }));
  } catch {
    /* silent */
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  page.value++;
  // Re-apply pagination from already-loaded data
  const filtered = applyFilters(allRawActivities.value);
  const paged = filtered.slice(0, page.value * itemsPerPage);
  activities.value = paged;
  hasMore.value = paged.length < filtered.length;
}

function applyFilters(list: Activity[]): Activity[] {
  let filtered = list;
  if (filterType.value) filtered = filtered.filter(a => a.type === filterType.value);
  if (filterEntity.value) filtered = filtered.filter(a => a.entityType === filterEntity.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      a => a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.entity?.toLowerCase().includes(q)
    );
  }
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime();
    const end = new Date(dateRange.value[1]).getTime() + 86400000;
    filtered = filtered.filter(a => {
      const t = new Date(a.createdAt).getTime();
      return t >= start && t <= end;
    });
  }
  return filtered;
}

async function createActivity() {
  if (!newActivity.value.title.trim()) {
    ElNotification({ type: 'warning', title: 'Validation', message: 'Please enter a title' });
    return;
  }

  saving.value = true;
  try {
    activities.value.unshift({
      id: `manual-${Date.now()}`,
      type: newActivity.value.type,
      title: newActivity.value.title,
      description: newActivity.value.description,
      user: 'You',
      duration: newActivity.value.duration,
      createdAt: (newActivity.value.date || new Date()).toISOString()
    });

    showCreateDialog.value = false;
    newActivity.value = { type: 'call', title: '', description: '', date: new Date(), duration: '' };
    ElNotification({ type: 'success', title: 'Activity Logged', message: 'Activity saved successfully' });
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadActivities();
});
</script>

<style scoped>
.activities-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.timeline-item .glass-card {
  transition: border-color 0.2s;
}
.timeline-item .glass-card:hover {
  border-color: rgba(120, 73, 255, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
