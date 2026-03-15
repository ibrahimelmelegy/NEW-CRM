<template lang="pug">
.execution-log
  //- Header with filters
  .log-header
    .flex.items-center.gap-3
      h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('workflows.executionLogs') }}
      .status-indicator(v-if="autoRefreshEnabled")
        .pulse-dot
        span.text-xs(style="color: var(--text-muted)") {{ $t('workflows.liveUpdates') }}

    .flex.items-center.gap-2
      el-select(
        v-model="filterWorkflowId"
        :placeholder="$t('workflows.allWorkflows')"
        clearable
        size="small"
        class="w-48"
        @change="fetchLogs"
      )
        el-option(
          v-for="wf in workflowOptions"
          :key="wf.id"
          :label="wf.name"
          :value="wf.id"
        )

      el-date-picker(
        v-model="filterDateRange"
        type="daterange"
        size="small"
        :start-placeholder="$t('workflows.startDate')"
        :end-placeholder="$t('workflows.endDate')"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="fetchLogs"
      )

      el-button(size="small" @click="fetchLogs" :loading="loading" circle)
        Icon(name="ph:arrows-clockwise-bold" size="14")

      el-switch(
        v-model="autoRefreshEnabled"
        size="small"
        :active-text="$t('workflows.autoRefresh')"
      )

  //- Loading state
  el-skeleton(:rows="4" animated v-if="loading && !executions.length")

  //- Execution list
  .executions-list(v-else-if="executions.length")
    .execution-item(
      v-for="exec in executions"
      :key="exec.id"
      @click="toggleExpand(exec.id)"
    )
      .execution-summary
        .flex.items-center.gap-3
          .status-badge(:class="statusClass(exec.status)")
            Icon(:name="statusIcon(exec.status)" size="14")
          div
            .execution-name {{ exec.workflowRule?.name || $t('workflows.unknownWorkflow') }}
            .execution-meta
              span {{ exec.entityType }}
              span.mx-1 /
              span {{ exec.entityId }}
        .flex.items-center.gap-3
          .execution-timing
            .execution-duration(v-if="exec.executionTimeMs")
              Icon(name="ph:timer-bold" size="12")
              span {{ formatDuration(exec.executionTimeMs) }}
            .execution-date {{ formatDate(exec.createdAt) }}
          el-tag(:type="statusTagType(exec.status)" size="small" effect="dark") {{ exec.status }}

      //- Expanded detail view
      Transition(name="expand")
        .execution-detail(v-if="expandedId === exec.id")
          .detail-header
            span.detail-label {{ $t('workflows.runId') + ': #' + exec.id }}
            span.detail-label {{ $t('workflows.trigger') }}: {{ exec.triggerType }}

          .action-timeline(v-if="exec.actionsExecuted?.length")
            .timeline-item(
              v-for="(action, idx) in exec.actionsExecuted"
              :key="idx"
              :class="timelineClass(action.status)"
            )
              .timeline-marker
                .timeline-dot
                .timeline-line(v-if="idx < exec.actionsExecuted.length - 1")
              .timeline-content
                .timeline-header
                  span.action-type {{ action.actionType }}
                  el-tag(:type="actionStatusTag(action.status)" size="small") {{ action.status }}
                .timeline-result(v-if="action.result")
                  pre.result-json {{ formatResult(action.result) }}
                .timeline-error(v-if="action.error")
                  Icon(name="ph:warning-bold" size="12")
                  span {{ action.error }}

          .no-actions(v-else)
            span.text-sm(style="color: var(--text-muted)") {{ $t('workflows.noActionData') }}

  //- Empty state
  .empty-state(v-else)
    Icon(name="ph:list-magnifying-glass" size="48" style="color: var(--text-muted)")
    p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('workflows.noExecutions') }}

  //- Pagination
  .log-pagination(v-if="pagination.totalPages > 1")
    el-pagination(
      :current-page="pagination.page"
      :page-size="pagination.limit"
      :total="pagination.totalItems"
      layout="prev, pager, next"
      @current-change="onPageChange"
    )
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import logger from '~/utils/logger'

interface ActionResult {
  actionType: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  result?: unknown;
  error?: string;
}

interface Execution {
  id: number;
  workflowRuleId: number;
  entityType: string;
  entityId: string;
  triggerType: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  actionsExecuted?: ActionResult[];
  executionTimeMs?: number;
  createdAt: string;
  workflowRule?: { id: number; name: string; entityType: string };
}

interface WorkflowOption {
  id: number;
  name: string;
}

const loading = ref(false);
const executions = ref<Execution[]>([]);
const expandedId = ref<number | null>(null);
const autoRefreshEnabled = ref(true);
const filterWorkflowId = ref<number | null>(null);
const filterDateRange = ref<string[] | null>(null);
const workflowOptions = ref<WorkflowOption[]>([]);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const pagination = ref({
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0
});

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id;
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'status-success',
    PARTIAL: 'status-partial',
    FAILED: 'status-failed',
    RUNNING: 'status-running'
  };
  return map[status] || 'status-pending';
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'ph:check-circle-bold',
    PARTIAL: 'ph:warning-circle-bold',
    FAILED: 'ph:x-circle-bold',
    RUNNING: 'ph:spinner-bold'
  };
  return map[status] || 'ph:circle-bold';
}

function statusTagType(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'success',
    PARTIAL: 'warning',
    FAILED: 'danger',
    RUNNING: 'primary'
  };
  return map[status] || 'info';
}

function actionStatusTag(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'success',
    FAILED: 'danger',
    SKIPPED: 'info'
  };
  return map[status] || 'info';
}

function timelineClass(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'timeline-success',
    FAILED: 'timeline-failed',
    SKIPPED: 'timeline-skipped'
  };
  return map[status] || '';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString();
}

function formatResult(result: unknown): string {
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

async function fetchLogs() {
  loading.value = true;
  try {
    let query = `workflows/executions?page=${pagination.value.page}&limit=${pagination.value.limit}`;
    if (filterWorkflowId.value) {
      query += `&workflowRuleId=${filterWorkflowId.value}`;
    }
    if (filterDateRange.value && filterDateRange.value.length === 2) {
      query += `&startDate=${filterDateRange.value[0]}&endDate=${filterDateRange.value[1]}`;
    }

    const { body, success } = await useApiFetch(query as unknown);
    if (success && body) {
      executions.value = body.docs || [];
      if (body.pagination) {
        pagination.value = body.pagination;
      }
    }
  } catch (err) {
    logger.error('Failed to fetch execution logs:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchWorkflowOptions() {
  try {
    const { body, success } = await useApiFetch('workflows/rules?limit=100' as unknown);
    if (success && body?.docs) {
      workflowOptions.value = body.docs.map(w => ({ id: w.id, name: w.name }));
    }
  } catch (err) {
    logger.error('Failed to fetch workflow options:', err);
  }
}

function onPageChange(page: number) {
  pagination.value.page = page;
  fetchLogs();
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    if (autoRefreshEnabled.value) {
      fetchLogs();
    }
  }, 10000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

onMounted(() => {
  fetchWorkflowOptions();
  fetchLogs();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.execution-log {
  max-width: 100%;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.executions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.execution-item {
  border-radius: 12px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
}

.execution-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.status-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.status-success {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  &.status-partial {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
  }
  &.status-failed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  &.status-running {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  &.status-pending {
    background: rgba(113, 113, 122, 0.15);
    color: #71717a;
  }
}

.execution-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #e4e4e7);
}

.execution-meta {
  font-size: 12px;
  color: var(--text-secondary, #71717a);
  margin-top: 2px;
}

.execution-timing {
  text-align: right;
}

.execution-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #71717a);
  justify-content: flex-end;
}

.execution-date {
  font-size: 11px;
  color: var(--text-muted, #52525b);
  margin-top: 2px;
}

// Expanded detail view
.execution-detail {
  padding: 0 16px 16px;
  border-top: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.06));
}

.detail-header {
  display: flex;
  gap: 16px;
  padding: 12px 0;
}

.detail-label {
  font-size: 12px;
  color: var(--text-secondary, #71717a);
}

.action-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #71717a;
  flex-shrink: 0;
}

.timeline-success .timeline-dot {
  background: #22c55e;
}
.timeline-failed .timeline-dot {
  background: #ef4444;
}
.timeline-skipped .timeline-dot {
  background: #71717a;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  min-height: 20px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 16px;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.action-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #e4e4e7);
}

.timeline-result {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 4px;
}

.result-json {
  font-size: 11px;
  color: var(--text-secondary, #71717a);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  max-height: 150px;
  overflow-y: auto;
}

.timeline-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.no-actions {
  padding: 12px 0;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.log-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

// Expand transition
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0 16px;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>
