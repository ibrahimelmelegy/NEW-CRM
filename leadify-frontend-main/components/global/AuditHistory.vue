<template lang="pug">
.audit-history
  //- Header
  .flex.items-center.gap-2.mb-4
    Icon(name="ph:clock-counter-clockwise-bold" size="18" style="color: var(--accent-color, #7849ff)")
    span.font-semibold(style="color: var(--text-primary)") {{ $t('common.auditHistory') || 'Change History' }}

  //- Timeline
  .audit-timeline(v-if="entries.length > 0")
    .timeline-entry(v-for="entry in entries" :key="entry.id")
      .timeline-dot-wrapper
        .timeline-dot(:style="{ background: actionColor(entry.action) }")
          Icon(:name="actionIcon(entry.action)" size="12" style="color: #fff")
        .timeline-line(v-if="entries.indexOf(entry) < entries.length - 1 || hasMore")

      .timeline-content.glass-card.p-3
        .flex.items-start.gap-2
          img.w-6.h-6.rounded-full.object-cover.mt-0.5(
            :src="entry.user?.profilePicture || '/images/avatar.png'"
            :alt="entry.user?.name || 'User'"
          )
          .flex-1.min-w-0
            p.text-sm(style="color: var(--text-primary)")
              span.font-medium {{ entry.user?.name || 'System' }}
              span(style="color: var(--text-muted)") &nbsp;{{ actionVerb(entry.action) }}&nbsp;
              template(v-if="entry.action === 'UPDATE' && entry.fieldName")
                span.font-medium {{ formatFieldName(entry.fieldName) }}
                span(style="color: var(--text-muted)") &nbsp;from&nbsp;
                span.audit-value.old "{{ entry.oldValue || '(empty)' }}"
                span(style="color: var(--text-muted)") &nbsp;to&nbsp;
                span.audit-value.new "{{ entry.newValue }}"
              template(v-else-if="entry.action === 'STATUS_CHANGE'")
                span(style="color: var(--text-muted)") status from&nbsp;
                el-tag(size="small" :type="statusTagType(entry.oldValue)" effect="plain" round) {{ entry.oldValue || '(none)' }}
                span(style="color: var(--text-muted)") &nbsp;to&nbsp;
                el-tag(size="small" :type="statusTagType(entry.newValue)" effect="plain" round) {{ entry.newValue }}
              template(v-else-if="entry.action === 'ASSIGN'")
                span(style="color: var(--text-muted)") to&nbsp;
                span.font-medium {{ entry.newValue }}
              template(v-else-if="entry.description")
                span(style="color: var(--text-muted)") {{ entry.description }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ formatTimeAgo(entry.createdAt) }}

  //- Loading
  .flex.justify-center.py-4(v-if="loading")
    el-skeleton(:rows="3" animated)

  //- Empty state
  .text-center.py-6(v-else-if="entries.length === 0")
    Icon(name="ph:clock-counter-clockwise" size="32" style="color: var(--text-muted)")
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noHistory') || 'No changes recorded yet' }}

  //- Load more
  .flex.justify-center.mt-4(v-if="hasMore")
    el-button(text :loading="loading" @click="loadMore")
      Icon(name="ph:arrow-down-bold" size="14")
      span.ml-1 {{ $t('common.loadMore') || 'Load More' }}
</template>

<script setup lang="ts">
import { fetchAuditTrail, type AuditEntry } from '~/composables/useAudit';

const props = defineProps<{
  entityType: string;
  entityId: string | number;
}>();

const entries = ref<AuditEntry[]>([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const limit = 15;

const hasMore = computed(() => page.value < totalPages.value);

async function loadEntries(pageNum: number) {
  loading.value = true;
  try {
    const result = await fetchAuditTrail(props.entityType, props.entityId, pageNum, limit);
    if (pageNum === 1) {
      entries.value = result.docs;
    } else {
      entries.value = [...entries.value, ...result.docs];
    }
    totalPages.value = result.pagination?.totalPages || 1;
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  page.value++;
  await loadEntries(page.value);
}

function actionIcon(action: string): string {
  const map: Record<string, string> = {
    CREATE: 'ph:plus-bold',
    UPDATE: 'ph:pencil-simple-bold',
    DELETE: 'ph:trash-bold',
    ASSIGN: 'ph:user-switch-bold',
    STATUS_CHANGE: 'ph:swap-bold'
  };
  return map[action] || 'ph:note-bold';
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    CREATE: '#22c55e',
    UPDATE: '#3b82f6',
    DELETE: '#ef4444',
    ASSIGN: '#8b5cf6',
    STATUS_CHANGE: '#f59e0b'
  };
  return map[action] || '#6b7280';
}

function actionVerb(action: string): string {
  const map: Record<string, string> = {
    CREATE: 'created this record',
    UPDATE: 'changed',
    DELETE: 'deleted this record',
    ASSIGN: 'assigned this',
    STATUS_CHANGE: 'changed'
  };
  return map[action] || action.toLowerCase();
}

function formatFieldName(field: string): string {
  // Convert camelCase/snake_case to readable
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s/, '')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function statusTagType(value?: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (!value) return 'info';
  const lower = value.toLowerCase();
  if (['won', 'closed', 'completed', 'done', 'active', 'qualified'].includes(lower)) return 'success';
  if (['lost', 'cancelled', 'rejected', 'failed'].includes(lower)) return 'danger';
  if (['pending', 'in_progress', 'in progress', 'negotiation'].includes(lower)) return 'warning';
  return 'info';
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => loadEntries(1));
watch(() => [props.entityType, props.entityId], () => {
  page.value = 1;
  loadEntries(1);
});
</script>

<style scoped>
.audit-timeline {
  position: relative;
}

.timeline-entry {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.timeline-dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 28px;
}

.timeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: var(--glass-border-color, rgba(255,255,255,0.08));
}

.timeline-content {
  flex: 1;
  min-width: 0;
  margin-bottom: 8px;
}

.audit-value.old {
  color: #ef4444;
  font-weight: 500;
  text-decoration: line-through;
  opacity: 0.8;
}

.audit-value.new {
  color: #22c55e;
  font-weight: 600;
}
</style>
