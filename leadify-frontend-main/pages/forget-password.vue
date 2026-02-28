<template>
  <div
    class="login-page forgot-password relative w-full h-screen overflow-hidden flex items-center justify-center"
    :style="{ backgroundColor: 'var(--bg-primary)' }"
  >
    <!-- Immersive Background Elements -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-end/10 rounded-full blur-[120px] animate-pulse"
        style="animation-delay: 2s"
      ></div>
      <div
        class="absolute inset-0 opacity-[0.05]"
        style="background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0); background-size: 40px 40px"
      ></div>
    </div>

    <!-- Glassmorphism Container -->
    <div class="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
      <!-- Brand & Visual Section -->
      <div class="hidden md:flex flex-1 flex-col items-start space-y-8 animate-fade-in-left">
        <img
          :src="themeStore.isLight ? '/images/Logo.png' : '/images/light-logo.png'"
          alt="High Point Technology CRM"
          class="h-16 w-auto drop-shadow-2xl"
        />
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight line-clamp-2" :style="{ color: 'var(--text-primary)' }">
            Stay Connected to your
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gradient-end">Success</span>
          </h2>
          <p class="text-lg max-w-md leading-relaxed" :style="{ color: 'var(--text-secondary)' }">
            {{ $t('auth.forgetSubtitle') }}
          </p>
        </div>
      </div>

      <!-- Forgot Password Form Card -->
      <div class="w-full max-w-[480px] animate-fade-in-right">
        <div class="glass-card p-8 md:p-12 rounded-[32px] shadow-2xl relative overflow-hidden group">
          <!-- Subtle glow effect -->
          <div
            class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-700"
          ></div>

          <div class="relative z-10">
            <!-- State 1: Request Form -->
            <div v-if="!isSubmitted">
              <div class="mb-10">
                <h1 class="text-3xl font-bold mb-2" :style="{ color: 'var(--text-primary)' }">{{ $t('auth.resetTitle') }}</h1>
                <p :style="{ color: 'var(--text-muted)' }" class="leading-relaxed">{{ $t('auth.forgetSubtitle') }}</p>
              </div>

              <el-form
                ref="myForm"
                autocomplete="off"
                label-position="top"
                :validation-schema="formSchema"
                class="modern-form"
                @submit.prevent="onSubmit"
              >
                <div class="space-y-6">
                  <div class="form-group flex flex-col gap-2">
                    <InputText :label="$t('auth.email')" placeholder="name@company.com" name="email" class="modern-input" />
                  </div>
                </div>

                <div class="mt-8 flex flex-col gap-4">
                  <el-button
                    size="large"
                    :loading="loading"
                    native-type="submit"
                    type="primary"
                    class="w-full !h-[56px] !rounded-2xl !border-none !text-lg !font-bold shadow-lg shadow-primary/20 transition-all"
                  >
                    {{ $t('auth.sendResetLink') }}
                  </el-button>

                  <el-button size="large" class="w-full !h-[56px] !rounded-2xl transition-all" @click="router.push('/login')">
                    {{ $t('auth.backToLogin') }}
                  </el-button>
                </div>
              </el-form>
            </div>

            <!-- State 2: Success Message -->
            <div v-else class="text-center py-6 animate-fade-in">
              <div
                class="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-success/10 border border-success/30"
              >
                <Icon name="ph:check-circle-bold" class="text-success text-4xl" />
              </div>

              <h1 class="text-3xl font-bold mb-4" :style="{ color: 'var(--text-primary)' }">{{ $t('auth.checkInbox') }}</h1>
              <p :style="{ color: 'var(--text-muted)' }" class="mb-10 leading-relaxed">
                {{ $t('auth.resetLinkSent') }}
                <br />
                <span :style="{ color: 'var(--text-primary)' }" class="font-medium">{{ submittedEmail }}</span>
              </p>

              <el-button
                size="large"
                type="primary"
                class="w-full !h-[56px] !rounded-2xl !border-none !text-lg !font-bold shadow-lg shadow-primary/20 transition-all"
                @click="router.push('/login')"
              >
                {{ $t('auth.backToLogin') }}
              </el-button>

              <button class="mt-6 text-sm transition-colors" :style="{ color: 'var(--text-muted)' }" @click="isSubmitted = false">
                {{ $t('auth.didntReceive') }}
                <span class="text-primary font-medium">{{ $t('auth.tryAgain') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import isEmailValidator from 'validator/lib/isEmail';
import { ElNotification } from 'element-plus';
import { useAuthStore } from '~/stores/auth';
import { useMain } from '~/stores/common';
import { useThemeStore } from '~/stores/theme';

const auth = useAuthStore();
const mainStore = useMain();
const themeStore = useThemeStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);

// State for success message
const isSubmitted = ref(false);
const submittedEmail = ref('');

definePageMeta({
  title: 'Admin | Forget Password',
  layout: 'empty'
});

const noArabicRegx = /^[^\u0600-\u06FF]+$/;
const formSchema = yup.object({
  email: yup
    .string()
    .email('Valid email required')
    .max(70)
    .required('Email is required')
    .matches(noArabicRegx, 'validEmail')
    .test('is-valid', 'Invalid Email format', (value: any) => (value ? isEmailValidator(value) : false))
    .label('email')
});

const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit(async (values: any) => {
  loading.value = true;
  try {
    const response: any = await useApiFetch('auth/forgot-password', 'POST', {
      email: values.email
    });

    if (response.success) {
      submittedEmail.value = values.email;
      isSubmitted.value = true;
      resetForm();
      ElNotification({
        title: 'Success',
        type: 'success',
        message: response.message
      });
    } else {
      ElNotification({
        title: 'Error',
        type: 'error',
        message: response?.message || 'Something went wrong'
      });
    }
  } catch (error: any) {
    ElNotification({
      title: 'Error',
      type: 'error',
      message: error.message || 'Failed to send reset link'
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss">
.forgot-password {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
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
}
</style>
