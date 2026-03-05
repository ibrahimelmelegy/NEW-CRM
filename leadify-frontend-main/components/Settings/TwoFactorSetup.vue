<template lang="pug">
.two-factor-setup
  //- Step 1: Initial state — show enable button
  template(v-if="step === 'idle'")
    .text-center.py-8
      .w-20.h-20.mx-auto.mb-6.rounded-2xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
        Icon(name="ph:shield-check-bold" size="40" class="text-[#7849ff]" aria-hidden="true")
      h3.text-xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('security.twoFactorAuth') }}
      p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('security.setupDescription') }}
      el-button(type="primary" size="large" :loading="loading" @click="startSetup" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('security.enableTwoFactor') }}

  //- Step 2: QR code scan
  template(v-if="step === 'scan'")
    .text-center.py-4
      h3.text-lg.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('security.scanQRCode') }}
      p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('security.scanQRDescription') }}

      .qr-container.mx-auto.mb-6.p-4.rounded-2xl.inline-block(style="background: white")
        img(:src="qrCode" alt="2FA QR Code" width="200" height="200")

      .mb-6
        p.text-xs.mb-2(style="color: var(--text-muted)") {{ $t('security.manualEntry') }}
        .flex.items-center.justify-center.gap-2
          code.text-sm.font-mono.px-3.py-2.rounded-lg(style="background: var(--bg-input); color: var(--text-primary)") {{ secret }}
          el-button(link @click="copySecret" size="small")
            Icon(name="ph:copy" size="16" aria-label="Copy secret")

      .space-y-4
        p.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('security.enterVerificationCode') }}
        .flex.justify-center.gap-3
          el-input(
            v-for="(_, i) in 6"
            :key="i"
            :ref="el => setInputRef(el, i)"
            v-model="digits[i]"
            maxlength="1"
            class="otp-input"
            @input="onDigitInput(i)"
            @keydown.delete="onBackspace(i)"
            @paste="onPaste"
            inputmode="numeric"
          )

        p.text-red-400.text-sm.text-center(v-if="error") {{ error }}

        .flex.justify-center.gap-3.mt-4
          el-button(@click="step = 'idle'") {{ $t('common.cancel') }}
          el-button(type="primary" :loading="verifying" :disabled="code.length !== 6" @click="verifyCode" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('security.verify') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { setup2FA, verify2FA } from '~/composables/useTwoFactor';

const emit = defineEmits<{
  (e: 'enabled'): void;
}>();

const step = ref<'idle' | 'scan'>('idle');
const loading = ref(false);
const verifying = ref(false);
const qrCode = ref('');
const secret = ref('');
const error = ref('');
const digits = ref<string[]>(['', '', '', '', '', '']);
const inputRefs = ref<Record<string, unknown>[]>([]);

const code = computed(() => digits.value.join(''));

function setInputRef(el: unknown, i: number) {
  if (el) inputRefs.value[i] = el;
}

function onDigitInput(index: number) {
  const val = digits.value[index];
  if (val && !/^\d$/.test(val)) {
    digits.value[index] = '';
    return;
  }
  if (val && index < 5) {
    nextTick(() => inputRefs.value[index + 1]?.focus?.());
  }
}

function onBackspace(index: number) {
  if (!digits.value[index] && index > 0) {
    nextTick(() => inputRefs.value[index - 1]?.focus?.());
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const pasted = e.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
  if (pasted) {
    for (let i = 0; i < 6; i++) {
      digits.value[i] = pasted[i] || '';
    }
  }
}

async function startSetup() {
  loading.value = true;
  try {
    const result = await setup2FA();
    if (result) {
      qrCode.value = result.qrCode;
      secret.value = result.manualEntryKey;
      step.value = 'scan';
      nextTick(() => inputRefs.value[0]?.focus?.());
    }
  } finally {
    loading.value = false;
  }
}

async function verifyCode() {
  if (code.value.length !== 6) return;
  verifying.value = true;
  error.value = '';
  try {
    const success = await verify2FA(code.value);
    if (success) {
      emit('enabled');
    } else {
      error.value = '';
      digits.value = ['', '', '', '', '', ''];
      nextTick(() => inputRefs.value[0]?.focus?.());
    }
  } catch {
    error.value = 'Verification failed';
    digits.value = ['', '', '', '', '', ''];
  } finally {
    verifying.value = false;
  }
}

function copySecret() {
  navigator.clipboard.writeText(secret.value);
  ElNotification({ type: 'success', title: 'Copied', message: 'Secret copied to clipboard', duration: 2000 });
}
</script>

<style scoped lang="scss">
.otp-input {
  width: 48px;

  :deep(.el-input__wrapper) {
    background-color: var(--bg-input);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    padding: 0;
    text-align: center;

    &.is-focus {
      border-color: #7849ff;
      box-shadow: 0 0 0 2px rgba(120, 73, 255, 0.2);
    }
  }

  :deep(.el-input__inner) {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    height: 48px;
    color: var(--text-primary);
  }
}
</style>
