<template lang="pug">
Transition(name="slide-up")
  .bulk-actions-bar(v-if="selectedCount > 0")
    .bulk-actions-inner
      .bulk-info
        .bulk-count {{ selectedCount }}
        span.bulk-label {{ $t('common.selected') || 'Selected' }}

      .bulk-buttons
        el-button(
          type="danger"
          size="default"
          @click="$emit('bulk-delete')"
        )
          el-icon
            Delete
          span {{ $t('common.delete') }}

        el-button(
          size="default"
          @click="$emit('bulk-export')"
        )
          el-icon
            Download
          span {{ $t('common.export') }}

        el-dropdown(
          trigger="click"
          @command="handleStatusChange"
        )
          el-button(size="default")
            el-icon
              Switch
            span {{ $t('common.status') || 'Change Status' }}
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(
                v-for="option in statusOptions"
                :key="option.value"
                :command="option.value"
              ) {{ option.label }}

      el-button.clear-btn(
        text
        size="default"
        @click="$emit('clear-selection')"
      )
        el-icon
          Close
        span {{ $t('common.close') }}
</template>

<script setup lang="ts">
import { Delete, Download, Switch, Close } from '@element-plus/icons-vue';

const props = defineProps({
  selectedCount: {
    type: Number,
    required: true,
    default: 0,
  },
  statusOptions: {
    type: Array as PropType<Array<{ label: string; value: string }>>,
    default: () => [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Archived', value: 'archived' },
    ],
  },
});

const emit = defineEmits<{
  'bulk-delete': [];
  'bulk-export': [];
  'bulk-status-change': [status: string];
  'clear-selection': [];
}>();

const handleStatusChange = (status: string) => {
  emit('bulk-status-change', status);
};
</script>

<style lang="scss" scoped>
.bulk-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.bulk-actions-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--glass-bg-primary, var(--glass-bg));
  backdrop-filter: var(--glass-blur, blur(30px));
  -webkit-backdrop-filter: var(--glass-blur, blur(30px));
  border: 1px solid var(--glass-border-color, var(--border-default));
  border-radius: 16px;
  box-shadow: var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
  border-right: 1px solid var(--border-default);
}

.bulk-count {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #a855f7));
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.bulk-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.bulk-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  color: var(--text-muted) !important;
  margin-left: 4px;
}

// Transition
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
