<template>
  <div class="card-skeleton glass-card-premium p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Skeleton variant="avatar" />
      <div class="flex-1 space-y-2">
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    
    <!-- Content -->
    <div class="space-y-3 mb-6">
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="75%" />
    </div>
    
    <!-- Footer / Actions -->
    <div class="flex gap-3">
      <Skeleton variant="button" width="100px" />
      <Skeleton variant="button" width="80px" />
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed - just composition of Skeleton components
</script>

<style scoped lang="scss">
.card-skeleton {
  min-height: 200px;
}
</style>
