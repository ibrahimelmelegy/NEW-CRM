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

      //- Tab toggle: Password login vs Magic link
      .flex.mb-6.rounded-xl.p-1(style="background: var(--bg-input)")
        button.flex-1.py-2.px-3.rounded-lg.text-sm.font-medium.transition-all(
          :class="loginMode === 'password' ? 'active-tab' : 'inactive-tab'"
          @click="loginMode = 'password'"
        ) {{ $t('portal.login.passwordLogin') }}
        button.flex-1.py-2.px-3.rounded-lg.text-sm.font-medium.transition-all(
          :class="loginMode === 'magic' ? 'active-tab' : 'inactive-tab'"
          @click="loginMode = 'magic'"
        ) {{ $t('portal.login.magicLink') }}

      //- Password Login Form
      el-form(v-if="loginMode === 'password'" ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin")
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

      //- Magic Link Form
      el-form(v-else ref="magicFormRef" :model="magicForm" :rules="magicRules" label-position="top" @submit.prevent="handleRequestAccess")
        el-form-item(:label="$t('portal.login.email')" prop="email")
          el-input(v-model="magicForm.email" type="email" :placeholder="$t('portal.login.emailPlaceholder')" size="large")
            template(#prefix)
              Icon(name="ph:envelope-bold" size="16" aria-label="Email")

        el-alert(v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4")
        el-alert(v-if="magicSuccess" :title="magicSuccess" type="success" show-icon :closable="false" class="mb-4")

        el-button(
          type="primary"
          native-type="submit"
          :loading="loading"
          size="large"
          class="w-full !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl"
        )
          Icon(name="ph:magic-wand-bold" size="16" aria-label="Magic link")
          span.ml-2 {{ $t('portal.login.sendLink') }}

      .text-center.mt-6
        NuxtLink.text-sm(to="/login" style="color: #7849ff") {{ $t('portal.login.backToCRM') }}
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const { login, requestAccess, verifyToken, isAuthenticated, init } = usePortalAuth();
const { t } = useI18n();
const route = useRoute();

const loginMode = ref<'password' | 'magic'>('password');
const formRef = ref();
const magicFormRef = ref();
const loading = ref(false);
const error = ref('');
const magicSuccess = ref('');

const form = reactive({
  email: '',
  password: ''
});

const magicForm = reactive({
  email: ''
});

const rules = {
  email: [{ required: true, message: () => t('portal.login.emailRequired'), trigger: 'blur' }],
  password: [{ required: true, message: () => t('portal.login.passwordRequired'), trigger: 'blur' }]
};

const magicRules = {
  email: [{ required: true, message: () => t('portal.login.emailRequired'), trigger: 'blur' }]
};

onMounted(async () => {
  init();

  // Check for magic link token in URL
  const token = route.query.token as string;
  if (token) {
    loading.value = true;
    error.value = '';
    const result = await verifyToken(token);
    loading.value = false;
    if (result.success) {
      navigateTo('/portal');
      return;
    } else {
      error.value = result.message || t('portal.login.invalidToken');
    }
  }

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
      error.value = result.message || t('portal.login.loginFailed');
    }
  } finally {
    loading.value = false;
  }
}

async function handleRequestAccess() {
  const valid = await magicFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  error.value = '';
  magicSuccess.value = '';
  try {
    const result = await requestAccess(magicForm.email);
    if (result.success) {
      magicSuccess.value = result.message || t('portal.login.linkSent');
    } else {
      error.value = result.message || t('portal.login.requestFailed');
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
.active-tab {
  background: var(--bg-card);
  color: #7849ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.inactive-tab {
  color: var(--text-muted);
  background: transparent;
}
</style>
