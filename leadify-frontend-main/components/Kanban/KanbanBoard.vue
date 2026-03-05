<template lang="pug">
.kanban-board.flex.gap-5.overflow-x-auto.pb-4(style="min-height: 70vh")
  .kanban-column.flex-shrink-0(
    v-for="col in columns"
    :key="col.key"
    :style="{ '--col-color': col.color }"
    class="w-[300px]"
  )
    //- Column Header
    .column-header.glass-card.rounded-2xl.p-4.mb-3
      .flex.items-center.justify-between
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ background: col.color }")
          span.font-bold.text-sm.text-white {{ col.label }}
        .flex.items-center.gap-2
          span.text-xs.px-2.py-1.rounded-full.bg-white.bg-opacity-10.text-gray-300 {{ getColumnCards(col.key).length }}
      .text-xs.text-gray-400.mt-1(v-if="col.totalValue !== undefined")
        | {{ $t('kanban.totalValue') }}: {{ formatLargeNumber(col.totalValue) }}

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
        .kanban-card.glass-card.rounded-xl.p-4.cursor-grab.transition-all(@click="$emit('cardClick', element)" style="cursor: grab")
          .flex.items-center.justify-between.mb-2
            span.font-semibold.text-sm.text-white.truncate {{ element.name }}
            .w-2.h-2.rounded-full(:style="{ background: col.color }")
          .text-xs.text-gray-400.mb-3.truncate(v-if="element.companyName || element.lead?.companyName")
            | {{ element.companyName || element.lead?.companyName }}
          .flex.items-center.justify-between
            span.text-xs.font-mono.text-purple-300(v-if="element.price != null")
              | {{ formatLargeNumber(element.price) }}
            span.text-xs.font-mono.text-purple-300(v-else-if="element.estimatedValue != null")
              | {{ formatLargeNumber(element.estimatedValue) }}
            .flex.items-center.gap-1(v-if="element.priority")
              .w-2.h-2.rounded-full(:style="{ background: getPriorityColor(element.priority) }")
              span.text-xs.text-gray-400 {{ element.priority }}
          //- User avatars
          .flex.items-center.mt-3.-space-x-2(v-if="element.users?.length")
            .w-6.h-6.rounded-full.flex.items-center.justify-center.text-purple-400.text-xs.font-bold.border(
              style="background: rgba(168, 85, 247, 0.2); border-color: rgba(168, 85, 247, 0.3)"
              v-for="u in element.users.slice(0, 3)"
              :key="u.id"
              :title="u.name"
            ) {{ u.name?.charAt(0) }}
            span.text-xs.text-gray-500.ml-2(v-if="element.users.length > 3") +{{ element.users.length - 3 }}
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

const props = defineProps<{
  columns: KanbanColumn[];
  cards: Record<string, KanbanCard[]>;
}>();

const emit = defineEmits<{
  (e: 'stageChange', payload: { cardId: string; fromStage: string; toStage: string }): void;
  (e: 'cardClick', card: KanbanCard): void;
}>();

// Local mutable copy of cards for drag operations
const localCards = ref<Record<string, KanbanCard[]>>({});

watch(
  () => props.cards,
  newCards => {
    // Deep clone to avoid mutating parent
    const cloned: Record<string, KanbanCard[]> = {};
    for (const key of Object.keys(newCards)) {
      cloned[key] = [...(newCards[key] || [])];
    }
    localCards.value = cloned;
  },
  { immediate: true, deep: true }
);

const getColumnCards = (key: string): KanbanCard[] => {
  if (!localCards.value[key]) localCards.value[key] = [];
  return localCards.value[key];
};

const onDragEnd = (evt: unknown, toStage: string) => {
  if (!evt.item?._underlying_vm_) return;
  const card = evt.item._underlying_vm_ as KanbanCard;

  // Find what stage the card was originally in
  const fromStage = Object.entries(props.cards).find(([_, cards]) => cards.some(c => c.id === card.id))?.[0];

  if (fromStage && fromStage !== toStage) {
    emit('stageChange', { cardId: card.id, fromStage, toStage });
  }
};
</script>

<style scoped lang="scss">
.kanban-board {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 3px;
  }
}

.kanban-drop-zone {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.05);
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.kanban-card {
  border-left: 3px solid var(--col-color, #7849ff);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
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
</style>
