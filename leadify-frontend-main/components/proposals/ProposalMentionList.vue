<template>
  <div
    class="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[180px] p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5"
  >
    <template v-if="items.length">
      <button
        v-for="(item, index) in items"
        :key="index"
        :class="[
          'w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
          index === selectedIndex ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
        ]"
        @click="selectItem(index)"
      >
        <div :class="['w-1.5 h-1.5 rounded-full', index === selectedIndex ? 'bg-white' : 'bg-violet-400 opacity-50']"></div>
        {{ item }}
      </button>
    </template>
    <div v-else class="px-3 py-2 text-sm text-slate-400 italic">No results found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  items: string[];
  command: (payload: { id: string }) => void;
}

const props = defineProps<Props>();

const selectedIndex = ref(0);

// Reset index when items change
watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
  }
);

const selectItem = (index: number) => {
  const item = props.items[index];
  if (item) {
    props.command({ id: item });
  }
};

const upHandler = () => {
  selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length;
};

const downHandler = () => {
  selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
};

const enterHandler = () => {
  selectItem(selectedIndex.value);
};

// Expose onKeyDown for TipTap's suggestion plugin
defineExpose({
  onKeyDown: ({ event }: { event: KeyboardEvent }) => {
    if (event.key === 'ArrowUp') {
      upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      enterHandler();
      return true;
    }

    return false;
  }
});
</script>
