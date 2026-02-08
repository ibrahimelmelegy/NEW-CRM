<template>
  <div class="react-proposal-container">
    <!-- Header with navigation -->
    <div class="header">
      <div class="header-left">
        <h1 class="title">Proposal Editor</h1>
        <span class="badge">React</span>
      </div>
      <div class="header-right">
        <el-button type="default" :icon="ArrowLeft" @click="goBack">Back to Proposals</el-button>
        <el-button type="primary" :icon="Refresh" @click="refreshFrame">Refresh</el-button>
      </div>
    </div>

    <!-- React App iframe -->
    <div class="iframe-wrapper">
      <iframe ref="reactFrame" :src="reactAppUrl" class="react-iframe" allow="clipboard-write; downloads" @load="onFrameLoad" />
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>Loading Proposal Editor...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ArrowLeft, Refresh, Loading } from '@element-plus/icons-vue';

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'VIEW_OWN_PROPOSALS'
});

const router = useRouter();
const route = useRoute();

// React app URL - use the same port as React dev server
const reactAppUrl = ref('http://localhost:3001/create');
const loading = ref(true);
const reactFrame = ref<HTMLIFrameElement | null>(null);

// Handle messages from React iframe
const handleMessage = (event: MessageEvent) => {
  // Validate origin in production
  if (event.origin !== 'http://localhost:3001') return;

  const { action, id, mode } = event.data || {};

  if (action === 'PROPOSAL_SAVED') {
    // Navigate to the saved proposal or proposals list
    if (id) {
      router.push(`/sales/proposals/${id}`);
    } else {
      router.push('/sales/proposals');
    }
  } else if (action === 'PROPOSAL_CANCELLED') {
    // Go back to proposals list
    router.push('/sales/proposals');
  }
};

// Handle proposal ID if editing
onMounted(() => {
  const proposalId = route.query.id as string;
  if (proposalId) {
    reactAppUrl.value = `http://localhost:3001/edit/${proposalId}`;
  }

  // Pass auth token to React app via URL or postMessage
  const token = useCookie('access_token');
  if (token.value) {
    // Append token as query param (React will pick it up)
    const separator = reactAppUrl.value.includes('?') ? '&' : '?';
    reactAppUrl.value += `${separator}token=${token.value}`;
  }

  // Listen for messages from React iframe
  window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
  // Cleanup message listener
  window.removeEventListener('message', handleMessage);
});

const onFrameLoad = () => {
  loading.value = false;
};

const refreshFrame = () => {
  loading.value = true;
  if (reactFrame.value) {
    reactFrame.value.src = reactFrame.value.src;
  }
};

const goBack = () => {
  router.push('/sales/proposals');
};
</script>

<style scoped>
.react-proposal-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 8px;
}

.iframe-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.react-iframe {
  width: 100%;
  height: 100%;
  border: none;
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
  background: rgba(255, 255, 255, 0.9);
  gap: 16px;
}

.loading-overlay p {
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
  }

  .header-left,
  .header-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
