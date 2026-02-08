<template>
  <div class="activity-timeline">
    <div v-if="groupedActivities.length > 0" class="timeline-container">
      <div v-for="group in groupedActivities" :key="group.date" class="timeline-group">
        <div class="date-header">{{ group.dateLabel }}</div>

        <div v-for="item in group.items" :key="item.id" class="timeline-item">
          <!-- Icon & Line -->
          <div class="timeline-visual">
            <div class="timeline-icon" :class="getTypeStyle(item.status)">
              <Icon :name="getIconName(item.status)" size="20" />
            </div>
            <div class="timeline-connector"></div>
          </div>

          <!-- Content Card -->
          <div class="timeline-content">
            <div class="content-header">
              <span class="activity-type">{{ formatStatus(item.status) }}</span>
              <span class="activity-time">{{ formatTime(item.createdAt) }}</span>
            </div>

            <div class="glass-card activity-card">
              <p class="description">{{ item.description }}</p>

              <div v-if="item.user" class="user-info">
                <Avatar :src="item.user.profilePicture || '/images/avatar.png'" small />
                <span class="user-name">{{ item.user.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty :description="$t('common.noData')" image="/images/empty.png" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  activities?: any[];
}

const props = defineProps<Props>();
const { t, d, locale } = useI18n();

// Group activities by date
const groupedActivities = computed(() => {
  if (!props.activities || props.activities.length === 0) return [];

  const groups: Record<string, any[]> = {};

  props.activities.forEach(item => {
    const date = new Date(item.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });

  return Object.keys(groups).map(date => {
    const dObj = new Date(date);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let label = date;
    if (date === today) label = t('common.today');
    else if (date === yesterday) label = t('common.yesterday');
    else label = dObj.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long' });

    return {
      date,
      dateLabel: label,
      items: groups[date]
    };
  });
});

const getTypeStyle = (type: string): string => {
  const styles: Record<string, string> = {
    assigned: 'assigned-style',
    update: 'update-style',
    restored: 'restore-style',
    create: 'create-style',
    delete: 'delete-style',
    archived: 'archive-style',
    import: 'import-style',
    export: 'export-style'
  };
  return styles[type] || 'default-style';
};

const getIconName = (type: string): string => {
  const icons: Record<string, string> = {
    assigned: 'ph:user-plus-bold',
    update: 'ph:pencil-line-bold',
    restored: 'ph:arrow-counter-clockwise-bold',
    create: 'ph:star-bold',
    delete: 'ph:trash-bold',
    archived: 'ph:archive-bold',
    import: 'ph:upload-simple-bold',
    export: 'ph:download-simple-bold'
  };
  return icons[type] || 'ph:activity-bold';
};

const formatStatus = (status: string) => {
  // Use translation keys if available, fallback to capitalized status
  const key = `activities.types.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status.charAt(0).toUpperCase() + status.slice(1);
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
</script>

<style lang="scss" scoped>
.activity-timeline {
  width: 100%;
  padding: 1rem 0;

  .timeline-group {
    margin-bottom: 2rem;

    .date-header {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      padding-left: 0.5rem;
      border-left: 3px solid var(--primary);
    }
  }

  .timeline-item {
    display: flex;
    gap: 1.5rem;
    position: relative;
    padding-bottom: 1.5rem;

    &:last-child {
      padding-bottom: 0;
      .timeline-connector {
        display: none;
      }
    }
  }

  .timeline-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 48px;

    .timeline-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg-secondary);
      border: 1px solid var(--glass-border-color);
      box-shadow: var(--glass-shadow);
      z-index: 2;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      &.assigned-style {
        color: #a855f7;
        background: rgba(168, 85, 247, 0.1);
      }
      &.update-style {
        color: #14b8a6;
        background: rgba(20, 184, 166, 0.1);
      }
      &.restore-style {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      &.create-style {
        color: #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
      }
      &.delete-style {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }
      &.archive-style {
        color: #64748b;
        background: rgba(100, 116, 139, 0.1);
      }
      &.import-style {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }
      &.export-style {
        color: #06b6d4;
        background: rgba(6, 182, 212, 0.1);
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

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .activity-type {
        font-weight: 700;
        font-size: 0.813rem;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .activity-time {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .activity-card {
      padding: 1.25rem;
      border-radius: 1.5rem;

      .description {
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 0.75rem;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .user-name {
          font-size: 0.813rem;
          font-weight: 500;
          color: var(--text-primary);
        }
      }
    }
  }
}

// RTL Support
[dir='rtl'] {
  .activity-timeline {
    .timeline-group .date-header {
      padding-left: 0;
      padding-right: 0.5rem;
      border-left: 0;
      border-right: 3px solid var(--primary);
    }

    .timeline-visual .timeline-icon {
      /* Ensure icons don't flip unless they are directional */
    }
  }
}
</style>
