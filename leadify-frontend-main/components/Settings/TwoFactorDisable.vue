<template lang="pug">
.two-factor-disable
  .text-center.py-4
    .w-16.h-16.mx-auto.mb-4.rounded-2xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.1)")
      Icon(name="ph:shield-warning-bold" size="32" class="text-red-500" aria-hidden="true")
    h3.text-lg.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('security.disableTwoFactor') }}
    p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('security.disableDescription') }}

    .space-y-4
      p.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('security.enterCodeToDisable') }}
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

      p.text-red-400.text-sm(v-if="error") {{ error }}

      .flex.justify-center.gap-3.mt-4
        el-button(@click="$emit('cancel')") {{ $t('common.cancel') }}
        el-button(type="danger" :loading="loading" :disabled="code.length !== 6" @click="disableCode") {{ $t('security.disable') }}
</template>

<script setup lang="ts">
import { disable2FA } from '~/composables/useTwoFactor';

const emit = defineEmits<{
  (e: 'disabled'): void;
  (e: 'cancel'): void;
}>();

const loading = ref(false);
const error = ref('');
const digits = ref<string[]>(['', '', '', '', '', '']);
const inputRefs = ref<any[]>([]);

const code = computed(() => digits.value.join(''));

function setInputRef(el: any, i: number) {
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

async function disableCode() {
  if (code.value.length !== 6) return;
  loading.value = true;
  error.value = '';
  try {
    const success = await disable2FA(code.value);
    if (success) {
      emit('disabled');
    } else {
      error.value = '';
      digits.value = ['', '', '', '', '', ''];
      nextTick(() => inputRefs.value[0]?.focus?.());
    }
  } catch {
    error.value = 'Failed to disable 2FA';
    digits.value = ['', '', '', '', '', ''];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  nextTick(() => inputRefs.value[0]?.focus?.());
});
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
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
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
