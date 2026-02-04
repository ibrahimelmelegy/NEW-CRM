<template>
  <div v-if="error" class="error-boundary">
    <div class="error-container glass-card-premium p-8 md:p-12 text-center max-w-lg mx-auto">
      <!-- Error Icon -->
      <div class="error-icon mb-6">
        <Icon name="ph:warning-circle-bold" class="text-6xl text-red-400" />
      </div>
      
      <!-- Error Title -->
      <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-3">
        {{ $t('errors.generic') }}
      </h2>
      
      <!-- Error Message -->
      <p class="text-[var(--text-muted)] mb-6">
        {{ errorMessage }}
      </p>
      
      <!-- Error Details (Dev Mode Only) -->
      <details v-if="isDev && errorDetails" class="text-left mb-6 text-sm">
        <summary class="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          Technical Details
        </summary>
        <pre class="mt-2 p-3 bg-black/20 rounded-lg overflow-auto text-red-300 text-xs">{{ errorDetails }}</pre>
      </details>
      
      <!-- Actions -->
      <div class="flex gap-4 justify-center">
        <el-button 
          type="primary" 
          @click="retry"
          class="!bg-[#7849ff] !border-none"
        >
          {{ $t('common.reset') }}
        </el-button>
        <el-button @click="goHome">
          {{ $t('navigation.dashboard') }}
        </el-button>
      </div>
    </div>
  </div>
  
  <!-- Normal Content -->
  <slot v-else />
</template>

<script setup lang="ts">
interface Props {
  fallback?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'Something went wrong',
});

const error = ref<Error | null>(null);
const errorMessage = ref('');
const errorDetails = ref('');
const isDev = process.dev;

// Capture errors from child components
onErrorCaptured((err: Error, instance, info) => {
  error.value = err;
  errorMessage.value = err.message || props.fallback;
  errorDetails.value = `${err.stack}\n\nComponent: ${instance?.$options?.name || 'Unknown'}\nInfo: ${info}`;
  
  console.error('[ErrorBoundary] Caught error:', err);
  
  // Return false to prevent the error from propagating further
  return false;
});

const retry = () => {
  error.value = null;
  errorMessage.value = '';
  errorDetails.value = '';
};

const goHome = () => {
  error.value = null;
  navigateTo('/');
};
</script>

<style scoped lang="scss">
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
