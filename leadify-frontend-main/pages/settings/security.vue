<template lang="pug">
.security-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('security.title') }}
    p(style="color: var(--text-muted)") {{ $t('security.subtitle') }}

  .max-w-2xl
    //- 2FA Section
    .glass-card.p-6.mb-6
      .flex.items-center.justify-between.mb-6
        .flex.items-center.gap-4
          .icon-box(style="background: rgba(120, 73, 255, 0.1)")
            Icon(name="ph:shield-check-bold" size="28" class="text-[#7849ff]" aria-hidden="true")
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.twoFactorAuth') }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('security.twoFactorSubtitle') }}
        el-tag(:type="is2FAEnabled ? 'success' : 'info'" effect="dark" size="large") {{ is2FAEnabled ? $t('security.enabled') : $t('security.disabled') }}

      //- 2FA is enabled — show status and disable option
      template(v-if="is2FAEnabled")
        .flex.items-center.gap-3.p-4.rounded-xl.mb-4(style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.2)")
          Icon(name="ph:check-circle-bold" size="20" class="text-green-500" aria-hidden="true")
          span.text-sm(style="color: var(--text-primary)") {{ $t('security.twoFactorActive') }}

        template(v-if="showDisable")
          SettingsTwoFactorDisable(@disabled="onDisabled" @cancel="showDisable = false")
        template(v-else)
          el-button(type="danger" plain @click="showDisable = true" class="!rounded-xl") {{ $t('security.disableTwoFactor') }}

      //- 2FA is not enabled — show setup
      template(v-else)
        SettingsTwoFactorSetup(@enabled="onEnabled")

    //- Password Section
    .glass-card.p-6
      .flex.items-center.gap-4.mb-6
        .icon-box(style="background: rgba(255, 123, 0, 0.1)")
          Icon(name="ph:key-bold" size="28" class="text-[#ff7b00]" aria-hidden="true")
        div
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.passwordSettings') }}
          p.text-xs(style="color: var(--text-muted)") {{ $t('security.passwordSubtitle') }}

      NuxtLink(to="/change-password")
        el-button(type="primary" plain class="!rounded-xl") {{ $t('security.changePassword') }}
</template>

<script setup lang="ts">
import { user as currentUser } from '~/composables/useUser';

definePageMeta({
  title: 'Security Settings',
  middleware: 'auth'
});

const showDisable = ref(false);

const is2FAEnabled = computed(() => !!currentUser.value?.twoFactorEnabled);

async function onEnabled() {
  // Refresh user data to reflect 2FA status
  await useUser();
}

async function onDisabled() {
  showDisable.value = false;
  await useUser();
}
</script>

<style lang="scss" scoped>
.security-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
