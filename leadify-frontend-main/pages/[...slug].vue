<template>
  <div class="not-found-page flex items-center justify-center min-h-screen" :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="text-center max-w-md px-6">
      <div class="mb-8">
        <span class="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-gradient-end">404</span>
      </div>
      <h1 class="text-3xl font-bold mb-4" :style="{ color: 'var(--text-primary)' }">
        {{ $t('errors.pageNotFound') }}
      </h1>
      <p class="mb-10 text-lg leading-relaxed" :style="{ color: 'var(--text-muted)' }">
        {{ $t('errors.pageNotFoundDesc') }}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <el-button type="primary" size="large" class="!rounded-2xl !px-8" @click="router.push('/')">
          <Icon name="ph:house-bold" class="mr-2" />
          {{ $t('errors.goHome') }}
        </el-button>
        <el-button size="large" class="!rounded-2xl !px-8" @click="router.back()">
          <Icon name="ph:arrow-left-bold" class="mr-2" />
          {{ $t('errors.goBack') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'empty',
});

const router = useRouter();
</script>

<style scoped lang="scss">
.not-found-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
