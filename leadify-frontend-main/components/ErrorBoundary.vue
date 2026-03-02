<template lang="pug">
  .error-boundary(v-if="error")
    .error-boundary__content
      .error-boundary__icon
        Icon(name="ph:warning-circle-bold" size="48")
      h2.error-boundary__title {{ $t('common.error') }}
      p.error-boundary__message {{ error.message || $t('common.generic') }}
      .error-boundary__actions
        el-button(type="primary" @click="retry") {{ $t('common.retry') }}
        el-button(@click="goHome") {{ $t('navigation.dashboard') }}
  slot(v-else)
</template>

<script setup lang="ts">
const error = ref<Error | null>(null);
const router = useRouter();

onErrorCaptured((err: Error) => {
  error.value = err;
  console.error('[ErrorBoundary]', err);
  return false; // Prevent error from propagating
});

function retry() {
  error.value = null;
}

function goHome() {
  error.value = null;
  router.push('/');
}
</script>

<style lang="scss" scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;

  &__content {
    text-align: center;
    max-width: 480px;
  }

  &__icon {
    color: var(--el-color-danger);
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  &__message {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }
}
</style>
