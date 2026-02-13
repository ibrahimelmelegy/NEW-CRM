<template lang="pug">
transition(name="slide-up")
  .install-prompt.fixed.bottom-20.left-4.right-4.p-4.rounded-2xl.flex.items-center.gap-4(
    v-if="showPrompt"
    style="background: var(--glass-bg, rgba(10,10,26,0.95)); border: 1px solid var(--border-default); z-index: 99; backdrop-filter: blur(20px)"
  )
    img(src="/images/logo-shape.png" alt="Leadify" class="w-10 h-10")
    .flex-1
      p.font-bold.text-sm(style="color: var(--text-primary)") Install Leadify CRM
      p.text-xs(style="color: var(--text-muted)") Add to home screen for quick access
    .flex.gap-2
      el-button(size="small" @click="dismiss") Later
      el-button(type="primary" size="small" @click="install" class="!bg-[#7849ff] !border-none") Install
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showPrompt = ref(false);
let deferredPrompt: any = null;

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    // Only show if not dismissed before
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (!dismissed) {
      showPrompt.value = true;
    }
  });
});

async function install() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showPrompt.value = false;
  }
  deferredPrompt = null;
}

function dismiss() {
  showPrompt.value = false;
  localStorage.setItem('pwa-dismissed', 'true');
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
