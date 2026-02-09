<template lang="pug">
.skeleton-stats-wrapper
  //- Stats Cards Row
  .skeleton-stats-cards.grid.gap-4(class="grid-cols-2 lg:grid-cols-4")
    .skeleton-stat-card.glass-card.p-6(v-for="i in 4" :key="i")
      .flex.items-center.justify-between
        .space-y-3
          Skeleton(variant="text" width="80px" height="14px")
          Skeleton(variant="title" width="100px" height="32px")
          Skeleton(variant="text" width="60px" height="12px")
        Skeleton(variant="avatar" width="56px" height="56px" rounded="16px")
  
  //- Charts Row
  .skeleton-charts.grid.gap-6.mt-8(class="grid-cols-1 lg:grid-cols-2")
    .skeleton-chart.glass-card.p-6(v-for="i in 2" :key="i")
      .flex.items-center.justify-between.mb-6
        Skeleton(variant="title" width="140px")
        Skeleton(variant="button" width="100px" height="36px")
      Skeleton(variant="thumbnail" height="280px")
  
  //- Table Section
  .skeleton-table-section.mt-8
    .flex.items-center.justify-between.mb-6
      Skeleton(variant="title" width="180px")
      .flex.gap-3
        Skeleton(variant="button" width="120px" height="40px")
        Skeleton(variant="button" width="120px" height="40px")
    SkeletonTable
</template>

<script setup lang="ts">
// Uses global Skeleton and SkeletonTable components
</script>

<style lang="scss" scoped>
.skeleton-stats-wrapper {
  animation: fadeIn 0.3s ease;
}

.skeleton-stat-card {
  min-height: 140px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
