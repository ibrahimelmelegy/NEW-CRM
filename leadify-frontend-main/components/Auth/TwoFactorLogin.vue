<template lang="pug">
.two-factor-login
  .mb-8.text-center
    .w-16.h-16.mx-auto.mb-4.rounded-2xl.bg-purple-500_20.flex.items-center.justify-center
      Icon(name="ph:shield-check-bold" class="text-3xl text-[#7849ff]")
    h2.text-2xl.font-bold.theme-text-primary.mb-2 {{ $t('security.twoFactorRequired') }}
    p.theme-text-muted.text-sm {{ $t('security.enterCode') }}

  .space-y-6
    //- 6-digit OTP input
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

    p.text-center.text-red-400.text-sm(v-if="error") {{ error }}

    el-button(
      size="large"
      type="primary"
      :loading="loading"
      :disabled="code.length !== 6"
      @click="submitCode"
      class="w-full !h-[52px] !rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !text-lg !font-bold !text-white"
    ) {{ $t('security.verify') }}

    .text-center
      el-button(link @click="$emit('back')") {{ $t('security.backToLogin') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  email: string;
  password: string;
}>();

const emit = defineEmits<{
  (e: 'verified', token: string): void;
  (e: 'back'): void;
}>();

const digits = ref<string[]>(['', '', '', '', '', '']);
const inputRefs = ref<any[]>([]);
const loading = ref(false);
const error = ref('');

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
    nextTick(() => {
      inputRefs.value[index + 1]?.focus?.();
    });
  }
  if (code.value.length === 6) {
    submitCode();
  }
}

function onBackspace(index: number) {
  if (!digits.value[index] && index > 0) {
    nextTick(() => {
      inputRefs.value[index - 1]?.focus?.();
    });
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const pasted = e.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6);
  if (pasted) {
    for (let i = 0; i < 6; i++) {
      digits.value[i] = pasted[i] || '';
    }
    if (pasted.length === 6) submitCode();
  }
}

async function submitCode() {
  if (code.value.length !== 6) return;
  loading.value = true;
  error.value = '';

  try {
    const response: any = await useApiFetch('auth/login', 'POST', {
      email: props.email,
      password: props.password,
      twoFactorCode: code.value
    });

    if (response.success && response.body?.token) {
      emit('verified', response.body.token);
    } else {
      error.value = response.message || 'Invalid 2FA code';
      digits.value = ['', '', '', '', '', ''];
      nextTick(() => inputRefs.value[0]?.focus?.());
    }
  } catch (err: any) {
    error.value = err.message || 'Verification failed';
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
  width: 52px;

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
    font-size: 24px;
    font-weight: bold;
    height: 52px;
    color: var(--text-primary);
  }
}

.bg-purple-500_20 { background: rgba(120, 73, 255, 0.15); }
</style>
