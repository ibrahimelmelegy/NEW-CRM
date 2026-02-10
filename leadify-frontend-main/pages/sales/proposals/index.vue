<template>
  <div class="react-proposal-container">
    <!-- Header with controls -->
    <div class="header">
      <div class="header-left">
        <h1 class="title">{{ $t('proposals.management') }}</h1>
        <span class="badge">{{ $t('proposals.reactVersion') }}</span>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Refresh" circle @click="refreshFrame" />
      </div>
    </div>

    <!-- React App iframe -->
    <div class="iframe-wrapper">
      <iframe ref="reactFrame" :src="reactAppUrl" class="react-iframe" allow="clipboard-write; downloads" @load="onFrameLoad" />
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>{{ $t('proposals.loading') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Refresh, Loading } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({
  layout: 'full-width',
  // You might want to adjust permissions based on your needs
  middleware: ['permissions'],
  permission: 'VIEW_OWN_PROPOSALS'
});

const route = useRoute();
const router = useRouter();

// Point to the root of the React app
const reactAppUrl = ref('http://localhost:3001/');
const loading = ref(true);
const reactFrame = ref<HTMLIFrameElement | null>(null);

// Handle messages from React iframe (if needed for value-add integrations)
const handleMessage = (event: MessageEvent) => {
  // Validate origin in production used commonly
  if (event.origin !== 'http://localhost:3001') return;

  const { action, id } = event.data || {};

  // Example: If the React app sends a message to navigate or notify
  if (action === 'NAVIGATE_EXTERNAL') {
    // Handle external navigation if needed
  }
};

onMounted(() => {
  // Pass auth token to React app via URL query param so it can authenticate immediately
  const token = useCookie('access_token');
  if (token.value) {
    const separator = reactAppUrl.value.includes('?') ? '&' : '?';
    reactAppUrl.value += `${separator}token=${token.value}`;
  }

  window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});

const onFrameLoad = () => {
  loading.value = false;
};

const refreshFrame = () => {
  loading.value = true;
  if (reactFrame.value) {
    // Force reload the iframe
    reactFrame.value.src = reactFrame.value.src;
  }
};
</script>

<style scoped>
.react-proposal-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: var(--color-neutral-background-1);
  width: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--color-neutral-background-1);
  border-bottom: 1px solid var(--color-border-default);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.iframe-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.react-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-overlay);
  gap: 16px;
}

.loading-overlay p {
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
