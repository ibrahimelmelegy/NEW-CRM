<template>
  <div class="login-page relative w-full h-screen overflow-hidden flex items-center justify-center">
    <!-- Global Professional Background -->
    <ProfessionalBackground />

    <!-- Glassmorphism Container -->
    <div class="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
      
      <!-- Brand & Visual Section -->
      <div class="hidden md:flex flex-1 flex-col items-start space-y-8 animate-fade-in-left">
        <!-- ✅ FIX: Using NuxtImg for optimized WebP images -->
        <NuxtImg src="/images/light-logo.png" alt="High Point CRM" format="webp" quality="80" class="h-16 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-500 light-logo-shadow" />
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight text-[var(--text-primary)]">
            Elevate Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#7849ff] to-[#ff7b00]">Experience</span>
          </h2>
          <p class="text-[var(--text-secondary)] text-lg max-w-md leading-relaxed">
            Harness the power of intelligence with our professional CRM solutions.
          </p>
        </div>
        
        <!-- Feature Highlights -->
        <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div class="flex items-center gap-3 p-4 rounded-2xl glass-effect hover:bg-white/10 transition-all duration-300">
            <div class="p-2 rounded-xl bg-[#7849ff]/20"><Icon name="ph:lightning-bold" class="text-[#7849ff] text-xl" /></div>
            <span class="text-sm font-medium text-[var(--text-primary)] opacity-90">Fast Workflow</span>
          </div>
          <div class="flex items-center gap-3 p-4 rounded-2xl glass-effect hover:bg-white/10 transition-all duration-300">
            <div class="p-2 rounded-xl bg-[#ff7b00]/20"><Icon name="ph:chart-line-up-bold" class="text-[#ff7b00] text-xl" /></div>
            <span class="text-sm font-medium text-[var(--text-primary)] opacity-90">Smart Analytics</span>
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
              <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Welcome Back</h1>
              <p class="text-[var(--text-muted)] text-sm">Enter your credentials to access your dashboard</p>
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
                  <label for="email-input" class="text-xs font-semibold text-[var(--text-muted)] opacity-60 uppercase tracking-wider ml-1">Email Address</label>
                  <InputText 
                    placeholder="name@company.com" 
                    name="email" 
                    class="modern-input"
                    aria-label="Email address"
                    aria-required="true"
                  />
                </div>

                <div class="form-group relative flex flex-col gap-2">
                  <div class="flex justify-between items-center px-1">
                    <label for="password-input" class="text-xs font-semibold text-white/40 uppercase tracking-wider">Password</label>
                    <nuxt-link to="/forget-password" class="text-xs text-[#7849ff] hover:text-[#906dff] transition-colors" aria-label="Forgot your password? Click here to reset">
                      Forgot Password?
                    </nuxt-link>
                  </div>
                  <InputText 
                    placeholder="••••••••" 
                    name="password" 
                    type="password" 
                    class="modern-input"
                    aria-label="Password"
                    aria-required="true"
                  />
                </div>
              </div>

              <div class="flex items-center mt-6">
                <el-checkbox label="Keep me logged in" class="custom-checkbox" aria-label="Keep me logged in checkbox" />
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
                  Sign In
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        
        <p class="text-center mt-8 text-[var(--text-muted)] text-sm">
          Don't have an account? <span class="text-[var(--text-primary)] hover:text-[#7849ff] font-medium cursor-pointer transition-colors">Contact Administrator</span>
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

  const auth = useAuthStore();
  const mainStore = useMain();
  const router = useRouter();
  const loading = ref(false);

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
      console.log("Attempting login...");
      
      // ✅ FIX: Using runtimeConfig instead of hardcoded URL
      const config = useRuntimeConfig();
      const response: any = await $fetch(`${config.public.API_BASE_URL}auth/login`, {
        method: 'POST',
        body: {
          email: values.email,
          password: values.password,
        }
      });

      console.log("Login Response:", response);

      // Robust Token Extraction
      const token = response?.token || response?.data?.token || response?.accessToken;

      if (token) {
        const accessToken = useCookie("access_token");
        accessToken.value = token;
        
        ElNotification({
          title: "Success",
          type: "success",
          message: "Login Successful",
        });
        
        // Force redirect
        window.location.href = "/";
      } else {
        throw new Error("Token not found in response");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
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

  .modern-input {
    .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.04) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: none !important;
      border-radius: 16px !important;
      padding: 6px 16px !important;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;

      &.is-focus, &:hover {
        border-color: #7849ff !important;
        background-color: rgba(120, 73, 255, 0.06) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 16px -4px rgba(120, 73, 255, 0.2) !important;
      }

      :global(body.light-mode) & {
        background-color: rgba(0, 0, 0, 0.02) !important;
        border-color: rgba(0, 0, 0, 0.05) !important;
        
        &.is-focus, &:hover {
          background-color: rgba(120, 73, 255, 0.03) !important;
          border-color: #7849ff !important;
        }
      }
    }
    
    .el-input__inner {
      color: var(--text-primary) !important;
      font-size: 15px !important;
      height: 48px !important;
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
      padding-left: 10px;
    }
    
    .el-checkbox__inner {
      background-color: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      border-radius: 6px;
      width: 18px;
      height: 18px;

      :global(body.light-mode) & {
        background-color: rgba(0, 0, 0, 0.03) !important;
        border-color: rgba(0, 0, 0, 0.1) !important;
      }
      
      &::after {
        border-width: 2px !important;
      }
    }
    
    &.is-checked {
      .el-checkbox__label {
        color: var(--text-primary) !important;
      }
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