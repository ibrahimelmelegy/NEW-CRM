<template lang="pug">
.portal-login.relative.w-full.min-h-screen.flex.items-center.justify-center
  ProfessionalBackground
  .relative.z-10.w-full.max-w-md.px-4
    .glass-card.p-8(class="md:p-10")
      .text-center.mb-8
        .w-16.h-16.rounded-2xl.mx-auto.mb-4.flex.items-center.justify-center(style="background: rgba(120,73,255,0.15)")
          Icon(name="ph:buildings-bold" size="32" class="text-[#7849ff]" aria-label="Portal")
        h1.text-2xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('portal.login.title') }}
        p.text-sm(style="color: var(--text-muted)") {{ $t('portal.login.subtitle') }}

      el-form(ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin")
        el-form-item(:label="$t('portal.login.email')" prop="email")
          el-input(v-model="form.email" type="email" :placeholder="$t('portal.login.emailPlaceholder')" size="large")
            template(#prefix)
              Icon(name="ph:envelope-bold" size="16" aria-label="Email")
        el-form-item(:label="$t('portal.login.password')" prop="password")
          el-input(v-model="form.password" type="password" show-password :placeholder="$t('portal.login.passwordPlaceholder')" size="large")
            template(#prefix)
              Icon(name="ph:lock-bold" size="16" aria-label="Password")

        el-alert(v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4")

        el-button(
          type="primary"
          native-type="submit"
          :loading="loading"
          size="large"
          class="w-full !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl"
        ) {{ $t('portal.login.signIn') }}

      .text-center.mt-6
        NuxtLink.text-sm(to="/login" style="color: #7849ff") {{ $t('portal.login.backToCRM') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { login, isAuthenticated, init } = usePortalAuth();
const { t } = useI18n();

const formRef = ref();
const loading = ref(false);
const error = ref('');

const form = reactive({
  email: '',
  password: ''
});

const rules = {
  email: [{ required: true, message: () => t('portal.login.emailRequired'), trigger: 'blur' }],
  password: [{ required: true, message: () => t('portal.login.passwordRequired'), trigger: 'blur' }]
};

onMounted(() => {
  init();
  if (isAuthenticated()) {
    navigateTo('/portal');
  }
});

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  error.value = '';
  try {
    const result = await login(form.email, form.password);
    if (result.success) {
      navigateTo('/portal');
    } else {
      error.value = result.message || 'Login failed';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.portal-login {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
