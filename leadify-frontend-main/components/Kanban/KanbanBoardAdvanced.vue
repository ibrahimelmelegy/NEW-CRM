<template lang="pug">
.kanban-board-advanced
  //- Flat view (no swimlanes)
  .kanban-flat.flex.gap-5.overflow-x-auto.pb-4(v-if="swimlaneMode === 'none'" style="min-height: 70vh")
    .kanban-column.flex-shrink-0(
      v-for="col in columns"
      :key="col.key"
      :style="{ '--col-color': col.color }"
      class="w-[300px]"
    )
      //- Column Header with Analytics
      .column-header.glass-card.rounded-2xl.p-4.mb-3
        .flex.items-center.justify-between
          .flex.items-center.gap-2
            .w-3.h-3.rounded-full(:style="{ background: col.color }")
            span.font-bold.text-sm.text-white {{ col.label }}
          .flex.items-center.gap-2
            span.text-xs.px-2.py-1.rounded-full.bg-white.bg-opacity-10.text-gray-300 {{ getColumnCards(col.key).length }}
        //- Column analytics row
        .column-analytics.mt-2.flex.items-center.gap-3
          .analytics-stat(v-if="columnStats[col.key]")
            span.analytics-label Total
            span.analytics-value {{ formatLargeNumber(columnStats[col.key].totalValue) }}
          .analytics-stat(v-if="columnStats[col.key]")
            span.analytics-label Avg Days
            span.analytics-value {{ columnStats[col.key].avgDays }}
          .analytics-stat(v-if="columnStats[col.key] && columnStats[col.key].conversionRate != null")
            span.analytics-label Conv.
            span.analytics-value {{ columnStats[col.key].conversionRate }}%

      //- Draggable Cards
      draggable.kanban-drop-zone.rounded-2xl.p-2.space-y-3(
        style="min-height: 200px"
        :list="getColumnCards(col.key)"
        group="kanban"
        item-key="id"
        :animation="200"
        ghost-class="kanban-ghost"
        drag-class="kanban-drag"
        @end="onDragEnd($event, col.key)"
      )
        template(#item="{ element }")
          KanbanCardEnhanced(
            :card="element"
            :stage-entered-at="element.stageEnteredAt || element.createdAt"
            @click="$emit('cardClick', element)"
          )

  //- Swimlane view
  .kanban-swimlanes(v-else)
    .swimlane(
      v-for="lane in swimlanes"
      :key="lane.key"
    )
      //- Swimlane header
      .swimlane-header.glass-card.rounded-2xl.p-3.mb-3.flex.items-center.justify-between.cursor-pointer(
        @click="toggleLane(lane.key)"
      )
        .flex.items-center.gap-3
          Icon.transition-transform.duration-200(
            name="ph:caret-right-bold"
            size="14"
            :class="{ 'rotate-90': !collapsedLanes[lane.key] }"
          )
          //- Assignee avatar or priority icon
          .swimlane-icon(v-if="swimlaneMode === 'assignee'" :style="{ background: lane.color }")
            | {{ lane.label?.charAt(0) || '?' }}
          .w-3.h-3.rounded-full(v-else :style="{ background: lane.color }")
          span.font-semibold.text-sm.text-white {{ lane.label }}
        .flex.items-center.gap-2
          span.text-xs.text-gray-400 {{ lane.cardCount }} cards
          span.text-xs.font-mono.text-purple-300(v-if="lane.totalValue")
            | SAR {{ formatLargeNumber(lane.totalValue) }}

      //- Swimlane columns (horizontal scrollable)
      Transition(name="collapse")
        .swimlane-body.flex.gap-5.overflow-x-auto.pb-4(
          v-show="!collapsedLanes[lane.key]"
        )
          .kanban-column.flex-shrink-0(
            v-for="col in columns"
            :key="col.key"
            :style="{ '--col-color': col.color }"
            class="w-[280px]"
          )
            //- Mini column header
            .mini-column-header.px-3.py-2.mb-2.flex.items-center.justify-between
              .flex.items-center.gap-2
                .w-2.h-2.rounded-full(:style="{ background: col.color }")
                span.text-xs.font-semibold.text-gray-300 {{ col.label }}
              span.text-xs.text-gray-500 {{ getSwimlaneColumnCards(lane.key, col.key).length }}

            //- Draggable cards in swimlane
            draggable.kanban-drop-zone.rounded-xl.p-2.space-y-3(
              style="min-height: 120px"
              :list="getSwimlaneColumnCards(lane.key, col.key)"
              :group="'kanban-' + lane.key"
              item-key="id"
              :animation="200"
              ghost-class="kanban-ghost"
              drag-class="kanban-drag"
              @end="onDragEnd($event, col.key)"
            )
              template(#item="{ element }")
                KanbanCardEnhanced(
                  :card="element"
                  :stage-entered-at="element.stageEnteredAt || element.createdAt"
                  @click="$emit('cardClick', element)"
                )
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { getPriorityColor } from '@/composables/useKanban';
import type { KanbanCard } from '@/composables/useKanban';
import { formatLargeNumber } from '@/composables/format';

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  totalValue?: number;
}

interface ColumnStats {
  totalValue: number;
  avgDays: number;
  conversionRate: number | null;
}

interface Swimlane {
  key: string;
  label: string;
  color: string;
  cardCount: number;
  totalValue: number;
}

interface Props {
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard[]>;
  swimlaneMode?: 'none' | 'assignee' | 'priority' | 'value';
}

const props = withDefaults(defineProps<Props>(), {
  swimlaneMode: 'none',
});

const emit = defineEmits<{
  (e: 'stageChange', payload: { cardId: string; fromStage: string; toStage: string }): void;
  (e: 'cardClick', card: KanbanCard): void;
}>();

// ---- Local mutable copy for drag operations ----
const localCards = ref<Record<string, KanbanCard[]>>({});

watch(() => props.cards, (newCards) => {
  const cloned: Record<string, KanbanCard[]> = {};
  for (const key of Object.keys(newCards)) {
    cloned[key] = [...(newCards[key] ?? [])];
  }
  localCards.value = cloned;
}, { immediate: true, deep: true });

const getColumnCards = (key: string): KanbanCard[] => {
  if (!localCards.value[key]) localCards.value[key] = [];
  return localCards.value[key]!;
};

// ---- Column analytics ----
const columnStats = computed<Record<string, ColumnStats>>(() => {
  const stats: Record<string, ColumnStats> = {};
  const colKeys = props.columns.map(c => c.key);
  const now = new Date();

  for (const col of props.columns) {
    const cards = localCards.value[col.key] ?? [];
    const totalValue = cards.reduce((sum: number, c: KanbanCard) => sum + (c.price || c.estimatedValue || 0), 0);

    // Average days in stage
    let totalDays = 0;
    for (const card of cards) {
      const dateStr = card.stageEnteredAt || card.createdAt;
      if (dateStr) {
        const diff = (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
        totalDays += Math.max(0, Math.floor(diff));
      }
    }
    const avgDays = cards.length > 0 ? Math.round(totalDays / cards.length) : 0;

    // Conversion rate: percentage of cards that moved forward (later column) vs backward
    // For the first column, null; otherwise based on column order
    const colIndex = colKeys.indexOf(col.key);
    let conversionRate: number | null = null;
    if (colIndex > 0 && cards.length > 0) {
      // We approximate: cards in a later stage = moved forward
      conversionRate = Math.min(100, Math.round((cards.length / Math.max(1, getAllCards().length)) * 100));
    }

    stats[col.key] = { totalValue, avgDays, conversionRate };
  }
  return stats;
});

function getAllCards(): KanbanCard[] {
  const all: KanbanCard[] = [];
  for (const key of Object.keys(localCards.value)) {
    const cards = localCards.value[key];
    if (cards) all.push(...cards);
  }
  return all;
}

// ---- Drag handling ----
const onDragEnd = (evt: any, toStage: string) => {
  if (!evt.item?._underlying_vm_) return;
  const card = evt.item._underlying_vm_ as KanbanCard;

  const fromStage = Object.entries(props.cards).find(([_key, cards]) =>
    cards.some((c: KanbanCard) => c.id === card.id)
  )?.[0];

  if (fromStage && fromStage !== toStage) {
    emit('stageChange', { cardId: card.id, fromStage, toStage });
  }
};

// ---- Swimlane logic ----
const collapsedLanes = ref<Record<string, boolean>>({});

function toggleLane(key: string) {
  collapsedLanes.value[key] = !collapsedLanes.value[key];
}

function toggleAllLanes() {
  const allCollapsed = Object.values(collapsedLanes.value).every(v => v);
  const newState = !allCollapsed;
  for (const lane of swimlanes.value) {
    collapsedLanes.value[lane.key] = newState;
  }
}

// Expose toggleAllLanes so parent can call it
defineExpose({ toggleAllLanes });

const swimlanes = computed<Swimlane[]>(() => {
  const allCards = getAllCards();
  if (props.swimlaneMode === 'assignee') {
    return buildAssigneeSwimlanes(allCards);
  }
  if (props.swimlaneMode === 'priority') {
    return buildPrioritySwimlanes(allCards);
  }
  if (props.swimlaneMode === 'value') {
    return buildValueSwimlanes(allCards);
  }
  return [];
});

// Cards grouped by swimlane and column
const swimlaneCards = computed<Record<string, Record<string, KanbanCard[]>>>(() => {
  const result: Record<string, Record<string, KanbanCard[]>> = {};
  const allEntries = Object.entries(localCards.value);

  for (const lane of swimlanes.value) {
    result[lane.key] = {};
    for (const col of props.columns) {
      result[lane.key]![col.key] = [];
    }
  }

  for (const [colKey, cards] of allEntries) {
    if (!cards) continue;
    for (const card of cards) {
      const laneKey = getCardSwimlaneKey(card);
      if (result[laneKey]?.[colKey]) {
        result[laneKey]![colKey]!.push(card);
      }
    }
  }

  return result;
});

function getSwimlaneColumnCards(laneKey: string, colKey: string): KanbanCard[] {
  return swimlaneCards.value[laneKey]?.[colKey] || [];
}

function getCardSwimlaneKey(card: KanbanCard): string {
  if (props.swimlaneMode === 'assignee') {
    const user = card.users?.[0];
    return user ? `user-${user.id}` : 'unassigned';
  }
  if (props.swimlaneMode === 'priority') {
    return card.priority || 'NONE';
  }
  if (props.swimlaneMode === 'value') {
    const val = card.price ?? card.estimatedValue ?? 0;
    if (val > 10000) return 'high';
    if (val >= 1000) return 'medium';
    return 'low';
  }
  return 'default';
}

function buildAssigneeSwimlanes(allCards: KanbanCard[]): Swimlane[] {
  const userMap = new Map<string, { label: string; color: string; cards: KanbanCard[] }>();

  for (const card of allCards) {
    const user = card.users?.[0];
    const key = user ? `user-${user.id}` : 'unassigned';
    if (!userMap.has(key)) {
      userMap.set(key, {
        label: user?.name || 'Unassigned',
        color: user ? stringToColor(user.name || '') : '#6B7280',
        cards: [],
      });
    }
    userMap.get(key)!.cards.push(card);
  }

  return Array.from(userMap.entries()).map(([key, data]) => ({
    key,
    label: data.label,
    color: data.color,
    cardCount: data.cards.length,
    totalValue: data.cards.reduce((sum: number, c: KanbanCard) => sum + (c.price || c.estimatedValue || 0), 0),
  }));
}

function buildPrioritySwimlanes(allCards: KanbanCard[]): Swimlane[] {
  const priorityOrder = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW', 'NONE'];
  const priorityLabels: Record<string, string> = {
    VERY_HIGH: 'Very High',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    VERY_LOW: 'Very Low',
    NONE: 'No Priority',
  };
  const grouped = new Map<string, KanbanCard[]>();

  for (const card of allCards) {
    const pKey = card.priority || 'NONE';
    if (!grouped.has(pKey)) grouped.set(pKey, []);
    grouped.get(pKey)!.push(card);
  }

  return priorityOrder
    .filter(p => grouped.has(p))
    .map(p => ({
      key: p,
      label: priorityLabels[p] ?? p,
      color: getPriorityColor(p),
      cardCount: grouped.get(p)!.length,
      totalValue: grouped.get(p)!.reduce((sum: number, c: KanbanCard) => sum + (c.price || c.estimatedValue || 0), 0),
    }));
}

function buildValueSwimlanes(allCards: KanbanCard[]): Swimlane[] {
  const groups: Record<string, KanbanCard[]> = { high: [], medium: [], low: [] };

  for (const card of allCards) {
    const val = card.price ?? card.estimatedValue ?? 0;
    if (val > 10000) groups.high!.push(card);
    else if (val >= 1000) groups.medium!.push(card);
    else groups.low!.push(card);
  }

  const config: { key: string; label: string; color: string }[] = [
    { key: 'high', label: 'High Value (>10K)', color: '#10B981' },
    { key: 'medium', label: 'Medium Value (1K-10K)', color: '#3B82F6' },
    { key: 'low', label: 'Low Value (<1K)', color: '#6B7280' },
  ];

  return config
    .filter(c => groups[c.key]!.length > 0)
    .map(c => ({
      ...c,
      cardCount: groups[c.key]!.length,
      totalValue: groups[c.key]!.reduce((sum: number, card: KanbanCard) => sum + (card.price || card.estimatedValue || 0), 0),
    }));
}

// Deterministic color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
</script>

<style scoped lang="scss">
.kanban-board-advanced {
  // Flat view scrollbar
  .kanban-flat {
    scrollbar-width: thin;
    scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb {
      background: rgba(120, 73, 255, 0.3);
      border-radius: 3px;
    }
  }
}

// Column analytics
.column-analytics {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 8px;
}

.analytics-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.analytics-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
  font-weight: 600;
}

.analytics-value {
  font-size: 12px;
  color: #D1D5DB;
  font-weight: 600;
  font-family: monospace;
}

// Drop zone
.kanban-drop-zone {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.05);
  transition: background 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.03); }
}

.kanban-ghost {
  opacity: 0.4;
  border: 2px dashed rgba(120, 73, 255, 0.5);
}

.kanban-drag {
  opacity: 0.8;
  transform: rotate(2deg);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
}

// Swimlanes
.swimlane {
  margin-bottom: 16px;
}

.swimlane-header {
  background: rgba(18, 18, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s;

  &:hover {
    background: rgba(18, 18, 30, 0.7);
  }
}

.swimlane-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.swimlane-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 3px;
  }
}

.mini-column-header {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

// Collapse/expand transition
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}

// Caret rotation
.rotate-90 {
  transform: rotate(90deg);
}
</style>
