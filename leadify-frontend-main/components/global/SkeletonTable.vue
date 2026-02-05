<template lang="pug">
.skeleton-table-wrapper
  .skeleton-header.flex.items-center.justify-between.mb-6.px-6
    .skeleton-search.skeleton-shimmer(class="w-[250px] h-[50px] !rounded-2xl")
    .skeleton-filter.skeleton-shimmer(class="w-[120px] h-[50px] !rounded-2xl")
  
  .skeleton-body.glass-card.p-0.overflow-hidden
    .skeleton-row.flex.items-center.px-6.py-4.border-b.border-white(v-for="i in 5" :key="i" class="border-opacity-5")
      .skeleton-cell.skeleton-shimmer(v-for="j in 6" :key="j" :style="{ width: cellWidths[j-1] }" class="h-4 !rounded-md mr-4")
</template>

<script setup lang="ts">
const cellWidths = ['40px', '180px', '120px', '200px', '130px', '180px'];
</script>

<style lang="scss" scoped>
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(168, 85, 247, 0.05) 25%,
    rgba(168, 85, 247, 0.1) 50%,
    rgba(168, 85, 247, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-row:last-child {
  border-bottom: none;
}
</style>
