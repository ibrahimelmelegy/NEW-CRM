<template lang="pug">
.unified-timeline
  //- Header
  .timeline-header
    h3.timeline-title {{ $t('communication.timeline') || 'Activity Timeline' }}
    .timeline-actions
      el-button(
        type="primary"
        :icon="Plus"
        circle
        @click="showActivityForm = true"
      )

  //- Loading skeleton
  .timeline-skeleton(v-if="loading && activities.length === 0")
    .skeleton-item(v-for="n in 4" :key="n")
      .skeleton-icon
      .skeleton-content
        .skeleton-line.skeleton-line-short
        .skeleton-line
        .skeleton-line.skeleton-line-medium

  //- Timeline
  .timeline-container(v-else-if="activities.length > 0")
    .timeline-group(v-for="group in groupedActivities" :key="group.date")
      .date-header
        span.date-label {{ group.dateLabel }}
        span.date-count {{ group.items.length }} {{ group.items.length === 1 ? 'activity' : 'activities' }}

      .timeline-item(
        v-for="item in group.items"
        :key="item.id"
        class="group"
      )
        //- Icon and connector line
        .timeline-visual
          .timeline-icon(:style="getIconStyle(item.type)")
            Icon(:name="getIconName(item.type)" size="20")
          .timeline-connector

        //- Content card
        .timeline-content
          .content-header
            .header-left
              span.activity-type-badge(:style="getBadgeStyle(item.type)") {{ getTypeLabel(item.type) }}
              span.direction-badge(
                v-if="item.direction"
                :class="item.direction === 'INBOUND' ? 'direction-inbound' : 'direction-outbound'"
              ) {{ item.direction === 'INBOUND' ? 'Inbound' : 'Outbound' }}
            span.activity-time {{ formatTime(item.createdAt) }}

          .glass-card.activity-card
            h4.activity-subject {{ item.subject }}
            p.activity-body(v-if="item.body") {{ truncateText(item.body, 200) }}

            //- Call details
            .call-details(v-if="item.type === 'CALL' && item.callLog")
              .call-detail-item
                Icon(name="ph:phone-bold" size="14")
                span {{ item.callLog.phoneNumber }}
              .call-detail-item
                Icon(name="ph:timer-bold" size="14")
                span {{ formatCallDuration(item.callLog.duration || item.duration) }}
              .call-detail-item
                .outcome-dot(:style="getOutcomeStyle(item.callLog.outcome)")
                span {{ getOutcomeLabel(item.callLog.outcome) }}

            //- Duration for meetings
            .meeting-duration(v-if="item.type === 'MEETING' && item.duration")
              Icon(name="ph:clock-bold" size="14")
              span {{ formatCallDuration(item.duration) }}

            .activity-footer
              .user-info(v-if="item.user")
                Avatar(:src="item.user.profilePicture || '/images/avatar.png'" small)
                span.user-name {{ item.user.name }}
              .footer-actions
                el-button(
                  text
                  size="small"
                  @click="editActivity(item)"
                )
                  Icon(name="ph:pencil-line-bold" size="14")
                el-button(
                  text
                  size="small"
                  type="danger"
                  @click="confirmDelete(item.id)"
                )
                  Icon(name="ph:trash-bold" size="14")

    //- Load more
    .load-more-container(v-if="hasMore")
      el-button(
        :loading="loading"
        @click="loadMore"
        plain
        round
      ) {{ $t('common.loadMore') || 'Load More' }}

  //- Empty state
  .empty-state(v-else)
    .empty-illustration
      Icon(name="ph:chat-circle-dots-bold" size="64" class="empty-icon")
    p.empty-title {{ $t('communication.noActivities') || 'No activities yet' }}
    p.empty-description {{ $t('communication.noActivitiesDesc') || 'Start logging interactions with this contact' }}
    el-button(type="primary" @click="showActivityForm = true")
      Icon(name="ph:plus-bold" size="16")
      span {{ $t('communication.logActivity') || 'Log Activity' }}

  //- Activity Form Dialog
  CommunicationActivityForm(
    v-if="showActivityForm"
    :visible="showActivityForm"
    :contact-id="contactId"
    :contact-type="contactType"
    :editing-activity="editingActivity"
    @close="closeActivityForm"
    @saved="onActivitySaved"
  )

  //- Delete Confirmation
  el-dialog(
    v-model="showDeleteConfirm"
    :title="$t('common.confirmDelete') || 'Confirm Delete'"
    width="400px"
    append-to-body
  )
    p {{ $t('communication.deleteConfirm') || 'Are you sure you want to delete this activity?' }}
    template(#footer)
      el-button(@click="showDeleteConfirm = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="danger" :loading="loading" @click="handleDelete") {{ $t('common.delete') || 'Delete' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from '@element-plus/icons-vue';
import {
  useCommunication,
  type CommunicationActivity as Activity,
  activityTypeOptions,
  callOutcomeOptions,
  formatCallDuration as formatDuration
} from '../../composables/useCommunication';

interface Props {
  contactId: string;
  contactType: 'CLIENT' | 'LEAD' | 'DEAL';
}

const props = defineProps<Props>();
const { t, locale } = useI18n();

const {
  activities,
  loading,
  pagination,
  hasMore,
  fetchTimeline,
  loadMore,
  deleteActivity
} = useCommunication(props.contactId, props.contactType);

const showActivityForm = ref(false);
const showDeleteConfirm = ref(false);
const deletingId = ref<number | null>(null);
const editingActivity = ref<Activity | null>(null);

// Group activities by date
const groupedActivities = computed(() => {
  if (!activities.value || activities.value.length === 0) return [];

  const groups: Record<string, Activity[]> = {};

  activities.value.forEach((item: Activity) => {
    const date = new Date(item.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });

  return Object.keys(groups).map((date) => {
    const dObj = new Date(date);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let label = date;
    if (date === today) label = t('common.today') || 'Today';
    else if (date === yesterday) label = t('common.yesterday') || 'Yesterday';
    else
      label = dObj.toLocaleDateString(
        locale.value === 'ar' ? 'ar-EG' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      );

    return {
      date,
      dateLabel: label,
      items: groups[date]
    };
  });
});

// Icon & style helpers
function getIconName(type: string): string {
  const opt = activityTypeOptions.find((o) => o.value === type);
  return opt?.icon || 'ph:activity-bold';
}

function getIconStyle(type: string) {
  const opt = activityTypeOptions.find((o) => o.value === type);
  const color = opt?.color || '#64748b';
  return {
    color,
    background: `${color}15`,
    border: `1px solid ${color}30`
  };
}

function getBadgeStyle(type: string) {
  const opt = activityTypeOptions.find((o) => o.value === type);
  const color = opt?.color || '#64748b';
  return {
    color,
    background: `${color}15`,
    border: `1px solid ${color}30`
  };
}

function getTypeLabel(type: string): string {
  const opt = activityTypeOptions.find((o) => o.value === type);
  return opt?.label || type;
}

function getOutcomeLabel(outcome: string): string {
  const opt = callOutcomeOptions.find((o) => o.value === outcome);
  return opt?.label || outcome;
}

function getOutcomeStyle(outcome: string) {
  const opt = callOutcomeOptions.find((o) => o.value === outcome);
  return { background: opt?.color || '#64748b' };
}

function formatCallDuration(seconds?: number): string {
  return formatDuration(seconds || 0);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

// Actions
function editActivity(item: Activity) {
  editingActivity.value = item;
  showActivityForm.value = true;
}

function closeActivityForm() {
  showActivityForm.value = false;
  editingActivity.value = null;
}

function onActivitySaved() {
  closeActivityForm();
  fetchTimeline(1);
}

function confirmDelete(id: number) {
  deletingId.value = id;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (deletingId.value !== null) {
    await deleteActivity(deletingId.value);
    showDeleteConfirm.value = false;
    deletingId.value = null;
  }
}

// Load on mount
onMounted(() => {
  fetchTimeline(1);
});

// Reload when contact changes
watch(
  () => [props.contactId, props.contactType],
  () => {
    fetchTimeline(1);
  }
);
</script>

<style lang="scss" scoped>
.unified-timeline {
  width: 100%;
  padding: 1rem 0;

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    .timeline-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
  }

  // Skeleton loading
  .timeline-skeleton {
    .skeleton-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;

      .skeleton-icon {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--glass-bg);
        animation: pulse 1.5s ease-in-out infinite;
      }

      .skeleton-content {
        flex: 1;

        .skeleton-line {
          height: 12px;
          border-radius: 6px;
          background: var(--glass-bg);
          margin-bottom: 8px;
          animation: pulse 1.5s ease-in-out infinite;

          &.skeleton-line-short { width: 30%; }
          &.skeleton-line-medium { width: 60%; }
        }
      }
    }
  }

  // Date groups
  .timeline-group {
    margin-bottom: 2rem;

    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--glass-border-color);

      .date-label {
        font-size: 0.813rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .date-count {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }
  }

  // Timeline items
  .timeline-item {
    display: flex;
    gap: 1rem;
    position: relative;
    padding-bottom: 1.5rem;

    &:last-child {
      padding-bottom: 0;
      .timeline-connector { display: none; }
    }
  }

  .timeline-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 44px;

    .timeline-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: all 0.3s ease;
      box-shadow: var(--glass-shadow);

      .group:hover & {
        transform: scale(1.1);
      }
    }

    .timeline-connector {
      flex: 1;
      width: 2px;
      background: linear-gradient(to bottom, var(--glass-border-color) 0%, transparent 100%);
      margin-top: 4px;
    }
  }

  .timeline-content {
    flex: 1;
    min-width: 0;

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .activity-type-badge {
        font-size: 0.688rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 6px;
      }

      .direction-badge {
        font-size: 0.688rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 6px;

        &.direction-inbound {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        &.direction-outbound {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
      }

      .activity-time {
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
      }
    }

    .activity-card {
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border-color);
      box-shadow: var(--glass-shadow);
      transition: all 0.3s ease;

      .group:hover & {
        border-color: rgba(255, 255, 255, 0.15);
      }

      .activity-subject {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.25rem;
      }

      .activity-body {
        font-size: 0.813rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0 0 0.75rem;
      }

      .call-details, .meeting-duration {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border-color);

        .call-detail-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-secondary);

          .outcome-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
        }
      }

      .meeting-duration {
        display: inline-flex;
        gap: 0.35rem;
        align-items: center;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .activity-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .user-name {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-primary);
          }
        }

        .footer-actions {
          display: flex;
          gap: 0;
          opacity: 0;
          transition: opacity 0.2s ease;

          .group:hover & {
            opacity: 1;
          }
        }
      }
    }
  }

  // Load more
  .load-more-container {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }

  // Empty state
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;

    .empty-illustration {
      margin-bottom: 1.5rem;

      .empty-icon {
        color: var(--text-muted);
        opacity: 0.4;
      }
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
    }

    .empty-description {
      font-size: 0.813rem;
      color: var(--text-muted);
      margin: 0 0 1.5rem;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// RTL Support
[dir='rtl'] {
  .unified-timeline {
    .timeline-group .date-header {
      .date-label {
        padding-left: 0;
        padding-right: 0.5rem;
      }
    }
  }
}
</style>
