<template lang="pug">
.dashboard-builder
  //- Toolbar
  .builder-toolbar.glass-card.rounded-2xl.p-4.mb-6.flex.items-center.justify-between
    .flex.items-center.gap-3
      Icon.text-purple-400(name="ph:squares-four-bold" size="24")
      .builder-title
        h2.text-lg.font-bold(style="color: var(--text-primary)") Custom Dashboard
        p.text-xs(style="color: var(--text-muted)") Drag widgets to build your perfect view
    .flex.items-center.gap-3
      //- Layout presets
      el-dropdown(@command="handlePreset")
        el-button(size="small")
          Icon.mr-1(name="ph:layout-bold" size="14")
          span Presets
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(command="executive")
              Icon.mr-2(name="ph:briefcase-bold" size="14")
              span Executive Overview
            el-dropdown-item(command="sales")
              Icon.mr-2(name="ph:chart-line-up-bold" size="14")
              span Sales Focus
            el-dropdown-item(command="activity")
              Icon.mr-2(name="ph:lightning-bold" size="14")
              span Activity Monitor
      el-button(size="small" type="primary" @click="saveDashboard" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
        Icon.mr-1(name="ph:floppy-disk-bold" size="14")
        span Save Layout
      el-button(size="small" @click="toggleEditMode")
        Icon.mr-1(:name="editMode ? 'ph:eye-bold' : 'ph:pencil-bold'" size="14")
        span {{ editMode ? 'Preview' : 'Edit' }}

  .builder-content.flex.gap-6
    //- Widget Palette (left sidebar, only in edit mode)
    Transition(name="slide-right")
      .widget-palette.glass-card.rounded-2xl.p-4(v-if="editMode")
        h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)") Widgets
        .widget-search.mb-3
          el-input(
            v-model="searchQuery"
            size="small"
            placeholder="Search widgets..."
            clearable
            :prefix-icon="SearchIcon"
          )
        .widget-list.space-y-2
          .widget-option(
            v-for="widget in filteredWidgets"
            :key="widget.type"
            draggable="true"
            @dragstart="onWidgetDragStart($event, widget)"
            @click="addWidget(widget.type)"
          )
            .widget-option-inner.flex.items-center.gap-3.p-3.rounded-xl.cursor-grab
              .widget-icon.w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(:style="{ background: widget.color + '20' }")
                Icon(:name="widget.icon" size="16" :style="{ color: widget.color }")
              .widget-info.min-w-0
                span.text-sm.font-medium.block.truncate(style="color: var(--text-primary)") {{ widget.label }}
                span.text-xs.block.truncate(style="color: var(--text-muted)") {{ widget.description }}

    //- Dashboard Grid
    .dashboard-grid.flex-1(
      @dragover.prevent="onGridDragOver"
      @drop="onGridDrop"
      @dragleave="isDragOver = false"
    )
      //- Empty state
      .empty-grid.glass-card.rounded-2xl.p-16.text-center(v-if="!dashboardWidgets.length")
        Icon(name="ph:layout-bold" size="64" style="color: var(--text-muted)")
        h3.text-xl.font-bold.mt-4(style="color: var(--text-primary)") Start Building
        p.text-sm.mt-2(style="color: var(--text-muted)") Drag widgets from the palette or click to add them
        el-button.mt-6(size="default" type="primary" @click="loadPreset('executive')" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
          Icon.mr-1(name="ph:magic-wand-bold" size="14")
          span Load Executive Preset

      //- Grid with widgets
      .grid-container(
        v-else
        :class="{ 'edit-mode': editMode, 'drag-over': isDragOver }"
      )
        TransitionGroup(name="widget-anim" tag="div" class="grid-inner")
          .grid-widget(
            v-for="(widget, index) in dashboardWidgets"
            :key="widget.id"
            :style="getWidgetStyle(widget)"
            :class="{ 'is-editing': editMode }"
          )
            //- Widget controls (edit mode)
            .widget-controls(v-if="editMode")
              .flex.items-center.gap-1
                button.control-btn(@click="resizeWidget(index, 'shrink')" title="Shrink" :disabled="widget.colSpan <= 1")
                  Icon(name="ph:arrows-in-bold" size="12")
                button.control-btn(@click="resizeWidget(index, 'grow')" title="Grow" :disabled="widget.colSpan >= 4")
                  Icon(name="ph:arrows-out-bold" size="12")
                button.control-btn.remove-btn(@click="removeWidget(index)" title="Remove")
                  Icon(name="ph:x-bold" size="12")

            //- Widget content
            DashboardBuilderDashboardWidget(:type="widget.type" :config="widget.config")
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';

definePageMeta({ middleware: 'permissions' });

const SearchIcon = markRaw(Search);

const {
  editMode,
  dashboardWidgets,
  availableWidgets,
  addWidget,
  removeWidget,
  resizeWidget,
  loadPreset,
  saveDashboard,
  loadDashboard,
  toggleEditMode,
  getWidgetStyle
} = useDashboardBuilder();

const searchQuery = ref('');
const isDragOver = ref(false);
const dragWidgetType = ref<string | null>(null);

const filteredWidgets = computed(() => {
  if (!searchQuery.value) return availableWidgets;
  const q = searchQuery.value.toLowerCase();
  return availableWidgets.filter(
    w => w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.type.toLowerCase().includes(q)
  );
});

function handlePreset(presetName: string) {
  loadPreset(presetName);
}

function onWidgetDragStart(event: DragEvent, widget: { type: string }) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('widget-type', widget.type);
  }
  dragWidgetType.value = widget.type;
}

function onGridDragOver(event: DragEvent) {
  isDragOver.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
}

function onGridDrop(event: DragEvent) {
  isDragOver.value = false;
  const type = event.dataTransfer?.getData('widget-type');
  if (type) {
    addWidget(type);
  }
  dragWidgetType.value = null;
}

// Load saved layout on mount
onMounted(() => {
  loadDashboard();
});
</script>

<style lang="scss" scoped>
.dashboard-builder {
  min-height: calc(100vh - 120px);
}

.builder-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
}

// Widget Palette
.widget-palette {
  width: 270px;
  flex-shrink: 0;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  position: sticky;
  top: 90px;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.2);
    border-radius: 2px;
  }
}

.widget-option-inner {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.08);
    border-color: rgba(120, 73, 255, 0.2);
    transform: translateX(4px);
  }

  &:active {
    transform: scale(0.97);
  }
}

// Dashboard Grid
.dashboard-grid {
  min-height: 400px;
}

.grid-container {
  width: 100%;
}

.grid-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.grid-widget {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  min-height: 120px;

  &.is-editing {
    border: 1px dashed rgba(120, 73, 255, 0.2);

    &:hover {
      border-color: rgba(120, 73, 255, 0.5);
      box-shadow: 0 0 20px rgba(120, 73, 255, 0.1);
    }
  }
}

// Widget Controls
.widget-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.grid-widget:hover .widget-controls {
  opacity: 1;
}

.control-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    &:hover {
      transform: none;
    }
  }

  &.remove-btn {
    color: #f87171;

    &:hover {
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.5);
    }
  }
}

// Drag over state
.grid-container.drag-over {
  .grid-inner {
    outline: 2px dashed rgba(120, 73, 255, 0.4);
    outline-offset: 8px;
    border-radius: 16px;
  }
}

// Transitions
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden;
}

// Widget animation
.widget-anim-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.widget-anim-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.widget-anim-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.widget-anim-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}

.widget-anim-move {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

// Empty state
.empty-grid {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

// Responsive
@media (max-width: 1024px) {
  .grid-inner {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .widget-palette {
    width: 220px !important;
  }
}

@media (max-width: 768px) {
  .builder-content {
    flex-direction: column;
  }

  .widget-palette {
    width: 100% !important;
    max-height: 250px !important;
    position: static !important;
  }

  .grid-inner {
    grid-template-columns: 1fr !important;
  }

  .grid-widget {
    grid-column: span 1 !important;
  }
}
</style>
