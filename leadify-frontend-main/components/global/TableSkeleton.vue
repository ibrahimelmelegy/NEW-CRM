<template>
  <div class="table-skeleton">
    <!-- Header Row -->
    <div class="skeleton-header flex gap-4 p-4 border-b border-white/10">
      <Skeleton v-for="i in columns" :key="`header-${i}`" variant="text" :width="getColumnWidth(i)" />
    </div>

    <!-- Body Rows -->
    <div v-for="row in rows" :key="`row-${row}`" class="skeleton-row flex gap-4 p-4 border-b border-white/5">
      <Skeleton v-for="col in columns" :key="`cell-${row}-${col}`" variant="text" :width="getColumnWidth(col)" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number;
  columns?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4
});

const getColumnWidth = (index: number): string => {
  // First column is usually wider (e.g., name)
  if (index === 1) return '30%';
  // Last column is usually actions (smaller)
  if (index === props.columns) return '15%';
  // Other columns
  return `${55 / (props.columns - 2)}%`;
};
</script>

<style scoped lang="scss">
.table-skeleton {
  background: var(--color-neutral-background-2);
  border-radius: 16px;
  overflow: hidden;
}

html.light-mode .table-skeleton {
  .skeleton-header {
    border-bottom-color: var(--color-border-default);
  }

  .skeleton-row {
    border-bottom-color: var(--color-border-subtle);
  }
}
</style>
