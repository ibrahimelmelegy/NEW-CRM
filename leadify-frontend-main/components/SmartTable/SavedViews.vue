<template lang="pug">
.saved-views
  el-dropdown(trigger="click" max-height="320" @command="handleCommand")
    el-button(size="default" class="premium-btn-outline")
      el-icon
        FolderOpened
      span Views
      el-icon.ml-1
        ArrowDown
    template(#dropdown)
      el-dropdown-menu
        .saved-views-header
          span.saved-views-title Saved Views
          el-button(
            text
            size="small"
            type="primary"
            @click.stop="showSaveDialog = true"
          )
            el-icon
              Plus
            span Save Current

        el-dropdown-item(
          v-if="views.length === 0"
          disabled
        ) No saved views yet

        el-dropdown-item(
          v-for="view in views"
          :key="view.id"
          :command="view.id"
        )
          .saved-view-item
            .saved-view-info
              .saved-view-name {{ view.name }}
              .saved-view-meta
                el-tag(size="small" effect="plain" round) {{ view.viewType }}
                span.saved-view-date {{ formatDate(view.createdAt) }}
            el-button.saved-view-delete(
              text
              type="danger"
              size="small"
              @click.stop="deleteView(view.id)"
            )
              el-icon
                Delete

  //- Save dialog
  el-dialog(
    v-model="showSaveDialog"
    title="Save Current View"
    width="400px"
    append-to-body
    destroy-on-close
  )
    el-form(@submit.prevent="saveCurrentView")
      el-form-item(label="View Name" required)
        el-input(
          v-model="newViewName"
          placeholder="e.g. My Active Deals"
          size="large"
          autofocus
          @keyup.enter="saveCurrentView"
        )
    template(#footer)
      el-button(@click="showSaveDialog = false") {{ $t('common.cancel') }}
      el-button(
        type="primary"
        @click="saveCurrentView"
        :disabled="!newViewName.trim()"
      ) {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { FolderOpened, ArrowDown, Plus, Delete } from '@element-plus/icons-vue';
import type { SmartTableSavedView as SavedView } from '~/composables/useSmartTable';

const props = defineProps({
  views: {
    type: Array as PropType<SavedView[]>,
    default: () => []
  }
});

const emit = defineEmits<{
  'load-view': [viewId: string];
  'save-view': [name: string];
  'delete-view': [viewId: string];
}>();

const showSaveDialog = ref(false);
const newViewName = ref('');

const handleCommand = (viewId: string) => {
  emit('load-view', viewId);
};

const saveCurrentView = () => {
  const name = newViewName.value.trim();
  if (!name) return;
  emit('save-view', name);
  newViewName.value = '';
  showSaveDialog.value = false;
};

const deleteView = (viewId: string) => {
  emit('delete-view', viewId);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};
</script>

<style lang="scss" scoped>
.saved-views {
  display: inline-flex;
}

.saved-views-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 4px;
}

.saved-views-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.saved-view-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 220px;
}

.saved-view-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.saved-view-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-view-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.saved-view-date {
  font-size: 11px;
  color: var(--text-muted);
}

.saved-view-delete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;

  .saved-view-item:hover & {
    opacity: 1;
  }
}
</style>
