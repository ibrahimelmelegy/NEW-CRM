<template>
  <div class="login-page relative w-full h-screen overflow-hidden flex items-center justify-center">
    <!-- Global Professional Background -->
    <ProfessionalBackground />

    <!-- Glassmorphism Container -->
    <div class="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
      
      <!-- Brand & Visual Section -->
      <div class="hidden md:flex flex-1 flex-col items-start space-y-8 animate-fade-in-left">
        <!-- ✅ FIX: Reliable theme-based logo switch -->
        <template v-if="themeStore.isLight">
            <NuxtImg src="/images/Logo.png" alt="Leadify CRM" format="webp" quality="80" class="h-16 w-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-500" />
        </template>
        <template v-else>
            <NuxtImg src="/images/light-logo.png" alt="Leadify CRM" format="webp" quality="80" class="h-16 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-500 light-logo-shadow" />
        </template>
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight theme-text-primary">
            {{ $t('auth.elevateExperience') }} <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#7849ff] to-[#ff7b00]">{{ $t('auth.experience') }}</span>
          </h2>
          <p class="theme-text-secondary text-lg max-w-md leading-relaxed">
            {{ $t('auth.harnessIntelligence') }}
          </p>
        </div>
        
        <!-- Feature Highlights -->
        <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div class="flex items-center gap-3 p-4 rounded-2xl glass-effect hover:bg-white/10 transition-all duration-300">
            <div class="p-2 rounded-xl bg-[#7849ff]/20"><Icon name="ph:lightning-bold" class="text-[#7849ff] text-xl" /></div>
            <span class="text-sm font-medium text-[var(--text-primary)] opacity-90">{{ $t('auth.fastWorkflow') }}</span>
          </div>
          <div class="flex items-center gap-3 p-4 rounded-2xl glass-effect hover:bg-white/10 transition-all duration-300">
            <div class="p-2 rounded-xl bg-[#ff7b00]/20"><Icon name="ph:chart-line-up-bold" class="text-[#ff7b00] text-xl" /></div>
            <span class="text-sm font-medium text-[var(--text-primary)] opacity-90">{{ $t('auth.smartAnalytics') }}</span>
          </div>
        </div>
      </div>

      <!-- Login Form Card -->
      <div class="w-full max-w-[480px] animate-fade-in-right">
        <div class="glass-card-premium p-8 md:p-12 relative overflow-hidden group">
          <!-- Subtle hover interaction glow -->
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-[#7849ff]/10 rounded-full blur-[80px] group-hover:bg-[#7849ff]/20 transition-all duration-1000"></div>
          
          <div class="relative z-10">
            <div class="mb-10 text-center md:text-left">
              <h1 class="text-3xl font-bold theme-text-primary mb-2 tracking-tight">{{ $t('auth.welcomeBack') }}</h1>
              <p class="theme-text-muted text-sm">{{ $t('auth.enterCredentials') }}</p>
            </div>

            <el-form 
              autocomplete="off" 
              @submit.prevent="onSubmit" 
              ref="myForm" 
              label-position="top" 
              :validationSchema="formSchema"
              class="modern-form"
              aria-label="Login form"
              role="form"
            >
              <div class="space-y-6">
                <div class="form-group flex flex-col gap-2">
                  <InputText 
                    placeholder="name@company.com" 
                    name="email" 
                    :label="$t('auth.email')"
                    class="modern-input"
                    aria-label="Email address"
                    aria-required="true"
                  />
                </div>

                <div class="form-group relative flex flex-col gap-2">
                  <div class="flex justify-between items-center px-1">
                    <nuxt-link to="/forget-password" class="text-xs text-[#7849ff] hover:text-[#906dff] transition-colors" aria-label="Forgot your password? Click here to reset">
                      {{ $t('auth.forgotPassword') }}
                    </nuxt-link>
                  </div>
                  <InputText 
                    placeholder="••••••••" 
                    name="password" 
                    type="password" 
                    :label="$t('auth.password')"
                    class="modern-input"
                    aria-label="Password"
                    aria-required="true"
                  />
                </div>
              </div>

              <div class="flex items-center mt-6">
                <el-checkbox :label="$t('auth.rememberMe')" class="custom-checkbox" aria-label="Keep me logged in checkbox" />
              </div>

              <el-form-item class="mt-8 mb-0">
                <el-button 
                  size="large" 
                  :loading="loading" 
                  native-type="submit" 
                  class="login-btn w-full !h-[58px] !rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !text-lg !font-bold !text-white shadow-[0_10px_20px_-5px_rgba(120,73,255,0.5)] active:scale-[0.98] transition-all"
                  aria-label="Sign in to your account"
                  :aria-busy="loading"
                >
                  {{ $t('auth.login') }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        
        <p class="text-center mt-8 theme-text-muted text-sm">
          {{ $t('auth.noAccount') }} <span class="theme-text-primary hover:text-[#7849ff] font-medium cursor-pointer transition-colors">{{ $t('auth.contactAdmin') }}</span>
        </p>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useForm } from "vee-validate";
  import * as yup from "yup";
  import isEmailValidator from "validator/lib/isEmail";
  import { useAuthStore } from "~/stores/auth";
  import { useMain } from "~/stores/common";
  import { ElNotification } from "element-plus";

  import { useThemeStore } from "~/stores/theme";
  const themeStore = useThemeStore();

  const auth = useAuthStore();
  const mainStore = useMain();
  const router = useRouter();
  const loading = ref(false);

  // Dynamic Logo Logic
  const logoSrc = computed(() => {
      return themeStore.isLight ? '/images/Logo.png' : '/images/light-logo.png';
  });

  onMounted(() => {
      themeStore.initializeTheme();
  });

  definePageMeta({
    title: "Admin | Login",
    layout: "empty",
  });

  const noArabicRegx = /^[^\u0600-\u06FF]+$/;

  const formSchema = yup.object({
    email: yup
      .string()
      .email("Valid email required")
      .max(50)
      .required("Email is required")
      .matches(noArabicRegx, "No Arabic allowed")
      .test(
        "is-valid",
        "Invalid Email format",
        (value: any) => (value ? isEmailValidator(value) : false)
      )
      .label("email"),
    password: yup.string().required("Password is required").label("password").max(50),
  });

  const { handleSubmit } = useForm({
    validationSchema: formSchema,
  });

  const onSubmit = handleSubmit(async (values: any) => {
    loading.value = true;
    try {
      const response = await useApiFetch('auth/login', 'POST', {
        email: values.email,
        password: values.password,
      });

      if (response.success && response.body?.token) {
        const accessToken = useCookie("access_token");
        accessToken.value = response.body.token;
        
        ElNotification({
          title: "Success",
          type: "success",
          message: "Login Successful",
        });
        
        await router.push("/");
      } else {
        throw new Error(response.message || "Token not found in response");
      }

    } catch (error: any) {
      ElNotification({
        title: "Error",
        type: "error",
        message: error.response?._data?.message || error.message || "Login failed",
      });
    } finally {
      loading.value = false;
    }
  });
</script>

<style lang="scss">
.login-page {
  font-family: 'Poppins', 'Tajawal', sans-serif;
  
  .mesh-gradient {
    background: 
      radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
      radial-gradient(at 50% 0%, hsla(255,100%,64%,0.15) 0, transparent 50%), 
      radial-gradient(at 100% 0%, hsla(29,100%,50%,0.1) 0, transparent 50%),
      radial-gradient(at 0% 100%, hsla(255,100%,64%,0.1) 0, transparent 50%),
      radial-gradient(at 50% 100%, hsla(253,16%,7%,1) 0, transparent 50%),
      radial-gradient(at 100% 100%, hsla(29,100%,50%,0.15) 0, transparent 50%);
    filter: blur(40px);
  }

  .noise-overlay {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .glass-card {
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.03);
    box-shadow: 
      0 4px 24px -1px rgba(0, 0, 0, 0.2), 
      inset 0 0 12px rgba(255, 255, 255, 0.02);
    transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.25);
      box-shadow: 
        0 40px 80px -10px rgba(0, 0, 0, 0.5), 
        inset 0 0 20px rgba(255, 255, 255, 0.05);
    }
  }

  // ✅ GLOBAL LIGHT THEME OVERRIDES (High specificity)
  :global(html.light-mode) & {
    .theme-text-primary, h1, h2, h3, .text-\[var\(--text-primary\)\] { color: #1a1a2e !important; }
    .theme-text-secondary, p, .text-\[var\(--text-secondary\)\] { color: #4a4a6a !important; }
    .theme-text-muted, label, span, .text-\[var\(--text-muted\)\], .text-white\/40, .text-white\/60 { color: #6a6a8a !important; opacity: 1 !important; }
    
    .glass-card-premium {
      background: rgba(255, 255, 255, 0.7) !important;
      border-color: rgba(120, 73, 255, 0.3) !important;
      box-shadow: 0 10px 40px -10px rgba(120, 73, 255, 0.2) !important;
    }

    .modern-input .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.95) !important;
      border-color: rgba(120, 73, 255, 0.4) !important;
      
      &.is-focus, &:hover {
        background-color: #ffffff !important;
        box-shadow: 0 4px 15px rgba(120, 73, 255, 0.2) !important;
      }

      .el-input__inner {
        color: #1a1a2e !important;
        &::placeholder {
           color: #8a8aa8 !important;
           opacity: 0.7 !important;
        }
      }
    }
  }

  .theme-text-primary { color: var(--text-primary) !important; }
  .theme-text-secondary { color: var(--text-secondary) !important; }
  .theme-text-muted { color: var(--text-muted) !important; }

  .glass-card-premium {
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.03);
    box-shadow: 
      0 8px 32px 0 rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    transition: all 0.5s ease;
  }

  .modern-input {
    .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: none !important;
      border-radius: 16px !important;
      padding: 6px 16px !important;
      transition: all 0.3s ease !important;

      &.is-focus, &:hover {
        border-color: #7849ff !important;
        background-color: rgba(120, 73, 255, 0.08) !important;
        box-shadow: 0 0 0 4px rgba(120, 73, 255, 0.1) !important;
      }

      :global(html.light-mode) & {
        background-color: rgba(255, 255, 255, 0.95) !important;
        border-color: rgba(120, 73, 255, 0.4) !important;
        
        &.is-focus, &:hover {
          background-color: #ffffff !important;
          border-color: #7849ff !important;
          box-shadow: 0 4px 15px rgba(120, 73, 255, 0.2) !important;
        }

        .el-input__inner {
            color: #1a1a2e !important;
            &::placeholder {
                color: #8a8aa8 !important;
                opacity: 0.7;
            }
        }
      }
    }
    
    .el-input__inner {
      color: var(--text-primary) !important;
      font-size: 15px !important;
      height: 48px !important;
      background: transparent !important; // ✅ FIX: Ensure transparent background
      box-shadow: none !important;
      border: none !important;
      &::placeholder {
        color: var(--text-muted) !important;
        opacity: 0.5;
      }
    }
  }

  .custom-checkbox {
    .el-checkbox__label {
      color: var(--text-muted) !important;
      font-size: 13px;
    }
    
    .el-checkbox__inner {
      background-color: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      border-radius: 6px;

      :global(html.light-mode) & {
        background-color: rgba(0, 0, 0, 0.05) !important;
        border-color: rgba(0, 0, 0, 0.1) !important;
      }
    }
    
    &.is-checked {
      .el-checkbox__inner {
        background-color: #7849ff !important;
        border-color: #7849ff !important;
      }
    }
  }

  // Animation Utilities
  .animate-fade-in-left {
    animation: fadeInLeft 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
  }
  
  .animate-fade-in-right {
    animation: fadeInRight 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
  }

  .animate-pulse-slow {
    animation: pulse 8s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-40px); filter: blur(10px); }
    to { opacity: 1; transform: translateX(0); filter: blur(0); }
  }

  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(40px); filter: blur(10px); }
    to { opacity: 1; transform: translateX(0); filter: blur(0); }
  }
}
</style>