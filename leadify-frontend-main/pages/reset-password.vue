<template>
  <div class="login-page reset-password relative w-full h-screen overflow-hidden flex items-center justify-center bg-obsidian">
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
        <img src="/images/light-logo.png" alt="High Point CRM" class="h-16 w-auto drop-shadow-2xl" />
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight text-white line-clamp-2">
            Secure your
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gradient-end">Account</span>
          </h2>
          <p class="text-text-secondary text-lg max-w-md leading-relaxed">Create a strong New password to ensure your account remains protected.</p>
        </div>
      </div>

      <!-- Reset Password Form Card -->
      <div class="w-full max-w-[480px] animate-fade-in-right">
        <div
          class="glass-card p-8 md:p-12 rounded-[32px] border border-white/10 glass-card/[0.03] backdrop-blur-[20px] shadow-2xl relative overflow-hidden group"
        >
          <!-- Subtle glow effect -->
          <div
            class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-700"
          ></div>

          <div class="relative z-10">
            <!-- State 1: New Password Form -->
            <div v-if="!errMsg">
              <div class="mb-10">
                <h1 class="text-3xl font-bold text-white mb-2">{{ $t('auth.newPassword') }}</h1>
                <p class="text-text-muted leading-relaxed">Please set a strong password that you haven't used before.</p>
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
                    <InputText :label="$t('auth.newPassword')" placeholder="••••••••••••" name="password" type="password" class="modern-input" />
                  </div>
                  <div class="form-group flex flex-col gap-2">
                    <InputText
                      :label="$t('auth.confirmPassword')"
                      placeholder="••••••••••••"
                      name="confirmPassword"
                      type="password"
                      class="modern-input"
                    />
                  </div>
                </div>

                <div class="mt-8">
                  <el-button
                    size="large"
                    :loading="loading"
                    native-type="submit"
                    type="primary"
                    class="w-full !h-[56px] !rounded-2xl !bg-primary hover:!bg-primary-hover !border-none !text-lg !font-bold shadow-lg shadow-primary/20 transition-all"
                  >
                    {{ $t('auth.resetTitle') }}
                  </el-button>
                </div>
              </el-form>
            </div>

            <!-- State 2: Invalid Link / Error -->
            <div v-else class="text-center py-6 animate-fade-in">
              <div
                class="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-danger/10 border border-danger/30"
              >
                <Icon name="ph:warning-circle-bold" class="text-danger text-4xl" />
              </div>

              <h1 class="text-2xl font-bold text-white mb-4">Link Expired</h1>
              <p class="text-text-muted mb-10 leading-relaxed">
                {{ errMsg }}
                <br />
                For security reasons, reset links expire after a short period.
              </p>

              <el-button
                size="large"
                type="primary"
                class="w-full !h-[56px] !rounded-2xl !bg-primary hover:!bg-primary-hover !border-none !text-lg !font-bold shadow-lg shadow-primary/20 transition-all"
                @click="router.push('/forget-password')"
              >
                Request New Link
              </el-button>
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
import { ElNotification } from 'element-plus';
import { useAuthStore } from '~/stores/auth';
import { useMain } from '~/stores/common';

const auth = useAuthStore();
const mainStore = useMain();
const router = useRouter();
const route = useRoute();
const loading = ref(false);

definePageMeta({
  title: 'Admin | Reset Password',
  layout: 'empty'
});

const noArabicRegx = /^[^\u0600-\u06FF]+$/;
const formSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .label('password')
    .matches(/^\S*$/, 'Password cannot contain spaces')
    .matches(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .matches(/^(?=.*[~`!@#$%^&*()_\-+=[\]{}|;':",.<>?/])/, 'Password must contain at least one special character')
    .matches(/^(?=.*\d)/, 'Password must contain at least one number')
    .matches(/^[~`!@#$%^&*()_\-+=[\]\\{}|;':",.<>?/a-zA-Z0-9]+$/, 'Password should only contain valid characters')
    .min(12, 'Password must be at least 12 characters')
    .max(50, 'Password must not exceed 50 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .label('Confirm Password')
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const errMsg = ref('');

// Check token on mount
onMounted(async () => {
  try {
    const responseCheckToken: any = await useApiFetch('auth/check-reset-token', 'POST', {
      token: route.query.token
    });
    if (!responseCheckToken?.body?.userId) {
      errMsg.value = responseCheckToken?.message || 'Invalid or expired token';
      setTimeout(() => {
        if (errMsg.value) router.push('/login');
      }, 8000);
    }
  } catch (error: any) {
    errMsg.value = 'Failed to verify token';
  }
});

const onSubmit = handleSubmit(async (values: any) => {
  loading.value = true;
  try {
    const response: any = await useApiFetch('auth/reset-password', 'POST', {
      token: route.query.token,
      newPassword: values.password
    });
    if (response.success) {
      router.push('/reset-complete');
      ElNotification({
        title: 'Success',
        type: 'success',
        message: response.message
      });
    } else {
      ElNotification({
        title: 'Error',
        type: 'error',
        message: response.message || 'Failed to reset password'
      });
    }
  } catch (error: any) {
    ElNotification({
      title: 'Error',
      type: 'error',
      message: error.message || 'Something went wrong'
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss">
.reset-password {
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
