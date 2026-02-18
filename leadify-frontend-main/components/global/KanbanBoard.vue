<template lang="pug">
.kanban-board
  .kanban-scroll-container
    .kanban-columns
      //- Each column
      .kanban-column(
        v-for="col in columnsData"
        :key="col.key"
        @dragover.prevent="onDragOver($event, col.key)"
        @dragleave="onDragLeave($event, col.key)"
        @drop.prevent="onDrop($event, col.key)"
        :class="{ 'drop-target': dragOverColumn === col.key }"
      )
        //- Column header
        .kanban-column-header
          .flex.items-center.gap-2
            .column-color-bar(:style="{ background: col.color || '#7849ff' }")
            span.font-semibold.text-sm(style="color: var(--text-primary)") {{ col.label }}
            .column-count {{ getColumnItems(col.key).length }}
          .text-xs.font-medium(v-if="cardValue" style="color: var(--text-muted)")
            | {{ formatColumnTotal(col.key) }}

        //- Cards container
        .kanban-cards
          //- Individual card
          .kanban-card.glass-card(
            v-for="item in getColumnItems(col.key)"
            :key="getItemId(item)"
            draggable="true"
            @dragstart="onDragStart($event, item, col.key)"
            @dragend="onDragEnd"
            @click="$emit('click', item)"
            :class="{ dragging: draggedItemId === getItemId(item) }"
          )
            //- Card title
            .font-medium.text-sm.mb-2(style="color: var(--text-primary)") {{ getNestedValue(item, cardTitle) }}

            //- Card subtitle
            p.text-xs.mb-2(v-if="cardSubtitle" style="color: var(--text-muted)") {{ getNestedValue(item, cardSubtitle) }}

            //- Card meta row
            .flex.items-center.justify-between.flex-wrap.gap-2
              .flex.items-center.gap-2
                //- Assignee avatar
                template(v-if="getAssignee(item)")
                  el-tooltip(:content="getAssignee(item).name" placement="top")
                    img.w-5.h-5.rounded-full.object-cover(
                      :src="getAssignee(item).profilePicture || '/images/avatar.png'"
                      :alt="getAssignee(item).name"
                    )

                //- Priority badge
                el-tag(
                  v-if="item.priority"
                  :type="priorityType(item.priority)"
                  size="small"
                  effect="plain"
                  round
                ) {{ item.priority }}

              .flex.items-center.gap-2
                //- Value/amount
                .text-xs.font-semibold(v-if="cardValue && getNestedValue(item, cardValue)" style="color: var(--accent-color, #7849ff)")
                  | {{ formatCurrency(getNestedValue(item, cardValue)) }}

                //- Days in stage
                .flex.items-center.gap-1(v-if="item.stageEnteredAt || item.updatedAt")
                  Icon(name="ph:clock-bold" size="11" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ daysInStage(item) }}d

          //- Empty column state
          .kanban-empty(v-if="getColumnItems(col.key).length === 0")
            Icon(name="ph:cards" size="24" style="color: var(--text-muted)")
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('common.noItems') || 'No items' }}
</template>

<script setup lang="ts">
interface KanbanColumn {
  key: string;
  label: string;
  color?: string;
}

const props = defineProps<{
  columns: KanbanColumn[];
  items: any[];
  groupBy: string;
  cardTitle: string;
  cardSubtitle?: string;
  cardValue?: string;
}>();

const emit = defineEmits<{
  move: [itemId: string | number, fromColumn: string, toColumn: string];
  click: [item: any];
}>();

// Drag state
const draggedItem = ref<any>(null);
const draggedItemId = ref<string | number | null>(null);
const dragSourceColumn = ref<string | null>(null);
const dragOverColumn = ref<string | null>(null);

const columnsData = computed(() => props.columns);

function getItemId(item: any): string | number {
  return item.id || item._id || item.key || JSON.stringify(item);
}

function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return '';
  return path.split('.').reduce((val, key) => val?.[key], obj) ?? '';
}

function getAssignee(item: any): any {
  return item.assignee || item.assignedTo || item.user || null;
}

function getColumnItems(columnKey: string): any[] {
  return props.items.filter(item => {
    const val = getNestedValue(item, props.groupBy);
    return String(val) === String(columnKey);
  });
}

function formatColumnTotal(columnKey: string): string {
  if (!props.cardValue) return '';
  const items = getColumnItems(columnKey);
  const total = items.reduce((sum, item) => {
    const val = Number(getNestedValue(item, props.cardValue!));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  return formatCurrency(total);
}

function formatCurrency(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

function priorityType(priority: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    LOW: 'info', MEDIUM: '', HIGH: 'warning', URGENT: 'danger',
    low: 'info', medium: '', high: 'warning', urgent: 'danger'
  };
  return map[priority] || 'info';
}

function daysInStage(item: any): number {
  const entered = item.stageEnteredAt || item.updatedAt || item.createdAt;
  if (!entered) return 0;
  const diff = Date.now() - new Date(entered).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

// ---- Drag and Drop ----

function onDragStart(event: DragEvent, item: any, fromColumn: string) {
  draggedItem.value = item;
  draggedItemId.value = getItemId(item);
  dragSourceColumn.value = fromColumn;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(getItemId(item)));
  }

  // Slight delay for visual feedback
  requestAnimationFrame(() => {
    // the :class binding handles visual state
  });
}

function onDragEnd() {
  draggedItem.value = null;
  draggedItemId.value = null;
  dragSourceColumn.value = null;
  dragOverColumn.value = null;
}

function onDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverColumn.value = columnKey;
}

function onDragLeave(event: DragEvent, columnKey: string) {
  // Only clear if we're actually leaving the column (not entering a child)
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement;
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    if (dragOverColumn.value === columnKey) {
      dragOverColumn.value = null;
    }
  }
}

function onDrop(event: DragEvent, toColumn: string) {
  event.preventDefault();
  dragOverColumn.value = null;

  if (!draggedItem.value || !dragSourceColumn.value) return;
  if (dragSourceColumn.value === toColumn) return;

  const itemId = getItemId(draggedItem.value);
  emit('move', itemId, dragSourceColumn.value, toColumn);

  draggedItem.value = null;
  draggedItemId.value = null;
  dragSourceColumn.value = null;
}
</script>

<style scoped>
.kanban-board {
  width: 100%;
  overflow: hidden;
}

.kanban-scroll-container {
  overflow-x: auto;
  padding-bottom: 12px;
}

.kanban-scroll-container::-webkit-scrollbar {
  height: 6px;
}
.kanban-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.kanban-scroll-container::-webkit-scrollbar-thumb {
  background: var(--glass-border-color, rgba(255,255,255,0.1));
  border-radius: 3px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  min-width: min-content;
}

.kanban-column {
  width: 300px;
  min-width: 300px;
  flex-shrink: 0;
  background: var(--card-bg, rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border-color, rgba(255,255,255,0.06));
  border-radius: 16px;
  padding: 12px;
  transition: all 0.25s ease;
  max-height: calc(100vh - 280px);
  display: flex;
  flex-direction: column;
}

.kanban-column.drop-target {
  border-color: var(--accent-color, #7849ff);
  background: rgba(120, 73, 255, 0.05);
  box-shadow: 0 0 0 2px rgba(120, 73, 255, 0.2);
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px;
  border-bottom: 1px solid var(--glass-border-color, rgba(255,255,255,0.06));
  margin-bottom: 12px;
  flex-shrink: 0;
}

.column-color-bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: var(--glass-border-color, rgba(255,255,255,0.08));
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
}

.kanban-cards {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 60px;
}

.kanban-cards::-webkit-scrollbar {
  width: 4px;
}
.kanban-cards::-webkit-scrollbar-thumb {
  background: var(--glass-border-color, rgba(255,255,255,0.1));
  border-radius: 2px;
}

.kanban-card {
  padding: 12px;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.kanban-card:hover {
  border-color: var(--glass-border-color, rgba(255,255,255,0.15));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.kanban-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  border: 2px dashed var(--glass-border-color, rgba(255,255,255,0.06));
  border-radius: 12px;
  min-height: 80px;
}
</style>
