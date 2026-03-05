<template lang="pug">
teleport(to="body")
  //- Install prompt banner
  transition(name="pwa-slide")
    .pwa-install-prompt(v-if="showInstall")
      .pwa-prompt-card
        .pwa-prompt-content
          .pwa-app-icon
            img(src="/images/logo-shape.png" alt="Leadify CRM" width="40" height="40")
          .pwa-prompt-text
            h4.pwa-title {{ $t('pwa.installTitle') }}
            p.pwa-desc {{ $t('pwa.installDescription') }}
        .pwa-prompt-actions
          button.pwa-btn-dismiss(@click="dismissInstall") {{ $t('pwa.notNow') }}
          button.pwa-btn-install(@click="handleInstall") {{ $t('pwa.installApp') }}

  //- Update available banner
  transition(name="pwa-slide")
    .pwa-install-prompt.pwa-update-prompt(v-if="showUpdate")
      .pwa-prompt-card.pwa-update-card
        .pwa-prompt-content
          .pwa-app-icon.pwa-update-icon
            Icon(name="ph:arrow-circle-up-bold" size="28")
          .pwa-prompt-text
            h4.pwa-title {{ $t('pwa.updateAvailable') }}
            p.pwa-desc {{ $t('pwa.updateDescription') }}
        .pwa-prompt-actions
          button.pwa-btn-dismiss(@click="dismissUpdate") {{ $t('pwa.notNow') }}
          button.pwa-btn-install(@click="handleUpdate") {{ $t('pwa.updateNow') }}
</template>

<script setup lang="ts">
const { t } = useI18n();
const { $pwa } = useNuxtApp();

// --- Install prompt state ---
const showInstall = computed(() => {
  if (!$pwa) return false;
  return $pwa.showInstallPrompt && !isDismissed();
});

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

async function handleInstall() {
  if (!$pwa) return;
  await $pwa.install();
}

function dismissInstall() {
  if (!$pwa) return;
  $pwa.cancelInstall();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}

// --- Update prompt state ---
const showUpdate = computed(() => {
  if (!$pwa) return false;
  return $pwa.needRefresh;
});

async function handleUpdate() {
  if (!$pwa) return;
  await $pwa.updateServiceWorker(true);
}

async function dismissUpdate() {
  if (!$pwa) return;
  await $pwa.cancelPrompt();
}
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

.pwa-update-prompt {
  // Stack above install prompt if both visible
  bottom: 80px;

  @media (min-width: 768px) {
    bottom: 20px;
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

.pwa-update-card {
  border-color: rgba(99, 102, 241, 0.3);
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

.pwa-update-icon {
  color: #ffffff;
  padding: 0;
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
