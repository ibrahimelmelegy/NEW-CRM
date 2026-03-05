<template lang="pug">
.saved-views-bar
  .flex.items-center.gap-2.overflow-x-auto.pb-1.scrollbar-hide
    //- "All" default view
    .view-chip(:class="{ active: !activeViewId }" @click="clearView")
      Icon(name="ph:list-bold" size="14")
      span {{ $t('common.all') || 'All' }}

    //- Saved view chips
    .view-chip(
      v-for="view in views"
      :key="view.id"
      :class="{ active: activeViewId === view.id }"
      :style="activeViewId === view.id && view.color ? { borderColor: view.color, background: view.color + '15' } : {}"
      @click="applyView(view)"
      @contextmenu.prevent="openContextMenu($event, view)"
    )
      .w-2.h-2.rounded-full(v-if="view.color" :style="{ background: view.color }")
      span {{ view.name }}
      Icon.view-chip-default(v-if="view.isDefault" name="ph:star-fill" size="12" style="color: #f59e0b")

    //- Save current view button
    .view-chip.save-btn(@click="openSaveDialog")
      Icon(name="ph:plus-bold" size="14")
      span {{ $t('common.saveView') || 'Save View' }}

  //- Context menu
  Teleport(to="body")
    .context-menu(
      v-if="contextMenu.visible"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      v-click-outside="closeContextMenu"
    )
      .context-menu-item(@click="renameView")
        Icon(name="ph:pencil-bold" size="14")
        span {{ $t('common.rename') || 'Rename' }}
      .context-menu-item(@click="setAsDefault")
        Icon(name="ph:star-bold" size="14")
        span {{ $t('common.setDefault') || 'Set as Default' }}
      .context-menu-item.text-red-500(@click="confirmDelete")
        Icon(name="ph:trash-bold" size="14")
        span {{ $t('common.delete') }}

  //- Save dialog
  el-dialog(
    v-model="saveDialogVisible"
    :title="isEditing ? ($t('common.renameView') || 'Rename View') : ($t('common.saveView') || 'Save Current View')"
    width="420px"
    append-to-body
    destroy-on-close
  )
    .space-y-4
      el-form-item(:label="$t('common.name') || 'Name'")
        el-input(v-model="formData.name" :placeholder="$t('common.viewNamePlaceholder') || 'e.g., Hot Leads, Closing This Month'" maxlength="50" show-word-limit)
      el-form-item(:label="$t('common.color') || 'Color'")
        .flex.gap-2.flex-wrap
          .color-swatch(
            v-for="color in presetColors"
            :key="color"
            :style="{ background: color }"
            :class="{ selected: formData.color === color }"
            @click="formData.color = color"
          )
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="saveDialogVisible = false") {{ $t('common.cancel') }}
        el-button(type="primary" :loading="saving" :disabled="!formData.name.trim()" @click="saveView" class="!rounded-xl") {{ isEditing ? $t('common.save') : ($t('common.create') || 'Create') }}
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus';
import { fetchSavedViews, createSavedView, updateSavedView, deleteSavedView, setDefaultView, type SavedView } from '~/composables/useSavedViews';

const props = defineProps<{
  entityType: string;
  currentFilters: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'apply-view': [view: SavedView];
  'view-changed': [];
}>();

const views = ref<SavedView[]>([]);
const activeViewId = ref<number | null>(null);
const saveDialogVisible = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const editingView = ref<SavedView | null>(null);

const formData = reactive({
  name: '',
  color: '#7849ff'
});

const presetColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'];

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  view: null as SavedView | null
});

// Custom directive for click outside
const vClickOutside = {
  mounted(el: HTMLElement, binding: unknown) {
    (el as unknown).__clickOutside = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) binding.value();
    };
    setTimeout(() => document.addEventListener('click', (el as unknown).__clickOutside), 0);
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as unknown).__clickOutside);
  }
};

async function loadViews() {
  views.value = await fetchSavedViews(props.entityType);
  // Auto-apply default view
  const defaultView = views.value.find(v => v.isDefault);
  if (defaultView && !activeViewId.value) {
    applyView(defaultView);
  }
}

function applyView(view: SavedView) {
  activeViewId.value = view.id;
  emit('apply-view', view);
  emit('view-changed');
}

function clearView() {
  activeViewId.value = null;
  emit('apply-view', { id: 0, name: 'All', entityType: props.entityType, filters: {}, userId: 0 });
  emit('view-changed');
}

function openSaveDialog() {
  isEditing.value = false;
  editingView.value = null;
  formData.name = '';
  formData.color = '#7849ff';
  saveDialogVisible.value = true;
}

async function saveView() {
  if (!formData.name.trim()) return;
  saving.value = true;
  try {
    if (isEditing.value && editingView.value) {
      await updateSavedView(editingView.value.id, {
        name: formData.name,
        color: formData.color
      });
    } else {
      await createSavedView({
        name: formData.name,
        entityType: props.entityType,
        filters: props.currentFilters,
        color: formData.color
      });
    }
    saveDialogVisible.value = false;
    await loadViews();
    ElNotification({ type: 'success', message: isEditing.value ? 'View renamed' : 'View saved', duration: 2000 });
  } finally {
    saving.value = false;
  }
}

function openContextMenu(event: MouseEvent, view: SavedView) {
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.view = view;
}

function closeContextMenu() {
  contextMenu.visible = false;
  contextMenu.view = null;
}

function renameView() {
  if (!contextMenu.view) return;
  isEditing.value = true;
  editingView.value = contextMenu.view;
  formData.name = contextMenu.view.name;
  formData.color = contextMenu.view.color || '#7849ff';
  saveDialogVisible.value = true;
  closeContextMenu();
}

async function setAsDefault() {
  if (!contextMenu.view) return;
  await setDefaultView(contextMenu.view.id);
  await loadViews();
  closeContextMenu();
  ElNotification({ type: 'success', message: 'Default view updated', duration: 2000 });
}

async function confirmDelete() {
  if (!contextMenu.view) return;
  const view = contextMenu.view;
  closeContextMenu();
  try {
    await ElMessageBox.confirm(`Delete view "${view.name}"?`, 'Delete View', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    });
    await deleteSavedView(view.id);
    if (activeViewId.value === view.id) {
      clearView();
    }
    await loadViews();
    ElNotification({ type: 'success', message: 'View deleted', duration: 2000 });
  } catch {
    // cancelled
  }
}

onMounted(() => loadViews());
watch(
  () => props.entityType,
  () => loadViews()
);
</script>

<style scoped>
.saved-views-bar {
  margin-bottom: 16px;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.view-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  border: 1.5px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  background: var(--card-bg, rgba(255, 255, 255, 0.03));
  color: var(--text-muted);
  transition: all 0.2s ease;
  user-select: none;
}

.view-chip:hover {
  border-color: var(--accent-color, #7849ff);
  color: var(--text-primary);
}

.view-chip.active {
  border-color: var(--accent-color, #7849ff);
  background: rgba(120, 73, 255, 0.12);
  color: var(--text-primary);
  font-weight: 600;
}

.view-chip.save-btn {
  border-style: dashed;
  opacity: 0.7;
}
.view-chip.save-btn:hover {
  opacity: 1;
}

.view-chip-default {
  margin-left: 2px;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--card-bg, #1e1e2e);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.15s;
}
.context-menu-item:hover {
  background: var(--glass-border-color, rgba(255, 255, 255, 0.06));
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.color-swatch:hover {
  transform: scale(1.15);
}
.color-swatch.selected {
  border-color: var(--text-primary, #fff);
  box-shadow: 0 0 0 2px var(--accent-color, #7849ff);
}
</style>
