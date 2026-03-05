<template lang="pug">
teleport(to="body")
  transition(name="pwa-slide")
    .pwa-install-prompt(v-if="showPrompt")
      .pwa-prompt-card
        .pwa-prompt-content
          .pwa-app-icon
            img(src="/images/logo-shape.png" alt="High Point Technology" width="40" height="40")
          .pwa-prompt-text
            h4.pwa-title {{ $t('pwa.installTitle') }}
            p.pwa-desc {{ $t('pwa.installDescription') }}
        .pwa-prompt-actions
          button.pwa-btn-dismiss(@click="dismiss") {{ $t('pwa.notNow') }}
          button.pwa-btn-install(@click="install") {{ $t('pwa.installApp') }}
</template>

<script setup lang="ts">
const { t } = useI18n();

const showPrompt = ref(false);
let deferredPrompt: unknown = null;

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;

  try {
    const dismissedAt = parseInt(raw, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown).standalone === true;
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt = e;

  if (!isDismissed() && !isStandalone()) {
    showPrompt.value = true;
  }
}

async function install() {
  if (!deferredPrompt) return;

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      showPrompt.value = false;
    }
  } catch {
    // prompt failed, hide silently
    showPrompt.value = false;
  }

  deferredPrompt = null;
}

function dismiss() {
  showPrompt.value = false;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}

// Handle appinstalled event
function onAppInstalled() {
  showPrompt.value = false;
  deferredPrompt = null;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onAppInstalled);
});
</script>

<style lang="scss" scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 80px; // above MobileBottomNav
  left: 12px;
  right: 12px;
  z-index: 999;
  display: flex;
  justify-content: center;

  @media (min-width: 768px) {
    bottom: 20px;
    left: auto;
    right: 20px;
    max-width: 380px;
  }
}

.pwa-prompt-card {
  width: 100%;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color);
  box-shadow: var(--glass-shadow);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pwa-prompt-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pwa-app-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  padding: 4px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.pwa-prompt-text {
  flex: 1;
  min-width: 0;
}

.pwa-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px;
}

.pwa-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.pwa-prompt-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pwa-btn-dismiss {
  padding: 8px 16px;
  border: 1px solid var(--border-default);
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--glass-bg-active);
    transform: scale(0.97);
  }
}

.pwa-btn-install {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: var(--gradient-primary);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.9;
    transform: scale(0.97);
  }
}

// Slide transition
.pwa-slide-enter-active,
.pwa-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.pwa-slide-enter-from {
  opacity: 0;
  transform: translateY(24px);
}

.pwa-slide-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>
