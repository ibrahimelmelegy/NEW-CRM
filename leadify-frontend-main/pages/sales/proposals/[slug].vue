<template>
  <div class="react-proposal-container">
    <!-- Header with navigation -->
    <div class="header">
      <div class="header-left">
        <el-button @click="goBack" type="default" :icon="ArrowLeft" circle />
        <h1 class="title">Proposal Details</h1>
        <span class="badge">React</span>
      </div>
      <div class="header-right">
        <el-button @click="refreshFrame" type="primary" :icon="Refresh">
          Refresh
        </el-button>
      </div>
    </div>

    <!-- React App iframe -->
    <div class="iframe-wrapper">
      <iframe
        ref="reactFrame"
        :src="reactAppUrl"
        class="react-iframe"
        @load="onFrameLoad"
        allow="clipboard-write"
      />
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
        <p>Loading Proposal Details...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, Refresh, Loading } from '@element-plus/icons-vue'

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'VIEW_OWN_PROPOSALS'
})

const router = useRouter()
const route = useRoute()

// React app URL - view mode
const reactAppUrl = ref('http://localhost:3001/')
const loading = ref(true)
const reactFrame = ref<HTMLIFrameElement | null>(null)

// Handle proposal ID from slug
onMounted(() => {
  const proposalId = route.params.slug as string
  if (proposalId) {
    reactAppUrl.value = `http://localhost:3001/view/${proposalId}`
  }
  
  // Pass auth token
  const token = useCookie('access_token')
  if (token.value) {
    const separator = reactAppUrl.value.includes('?') ? '&' : '?'
    reactAppUrl.value += `${separator}token=${token.value}`
  }
})

const onFrameLoad = () => {
  loading.value = false
}

const refreshFrame = () => {
  loading.value = true
  if (reactFrame.value) {
    reactFrame.value.src = reactFrame.value.src
  }
}

const goBack = () => {
  router.push('/sales/proposals')
}
</script>

<style scoped>
.react-proposal-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
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
</style>
