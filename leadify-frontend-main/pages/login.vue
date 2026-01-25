<template>
  <div class="login-page relative w-full h-screen overflow-hidden flex items-center justify-center bg-obsidian">
    <!-- Immersive Background Elements -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-end/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute inset-0 opacity-[0.05]" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <!-- Glassmorphism Container -->
    <div class="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
      
      <!-- Brand & Visual Section -->
      <div class="hidden md:flex flex-1 flex-col items-start space-y-8 animate-fade-in-left">
        <img src="/images/light-logo.png" alt="High Point CRM" class="h-16 w-auto drop-shadow-2xl" />
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight text-white">
            Transform Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gradient-end">Workflow</span>
          </h2>
          <p class="text-text-secondary text-lg max-w-md leading-relaxed">
            Manage your leads, proposals, and projects with High Point's intelligent CRM system.
          </p>
        </div>
        `cds`
        <!-- Feature Highlights -->
        <div class="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="p-2 rounded-xl bg-primary/20"><Icon name="ph:lightning-bold" class="text-primary text-xl" /></div>
            <span class="text-sm font-medium text-white">Fast Workflow</span>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="p-2 rounded-xl bg-gradient-end/20"><Icon name="ph:chart-line-up-bold" class="text-gradient-end text-xl" /></div>
            <span class="text-sm font-medium text-white">Smart Analytics</span>
          </div>
        </div>
      </div>

      <!-- Login Form Card -->
      <div class="w-full max-w-[480px] animate-fade-in-right">
        <div class="glass-card p-8 md:p-12 rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-[20px] shadow-2xl relative overflow-hidden group">
          <!-- Subtle glow effect -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-700"></div>
          
          <div class="relative z-10">
            <div class="mb-10">
              <h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p class="text-text-muted">Enter your credentials to access your dashboard</p>
            </div>

            <el-form 
              autocomplete="off" 
              @submit.prevent="onSubmit" 
              ref="myForm" 
              label-position="top" 
              :validationSchema="formSchema"
              class="modern-form"
            >
              <div class="space-y-6">
                <div class="form-group flex flex-col gap-2">
                  <InputText 
                    label="Email Address"
                    placeholder="name@company.com" 
                    name="email" 
                    class="modern-input"
                  />
                </div>

                <div class="form-group relative flex flex-col gap-2">
                  <InputText 
                    label="Password"
                    placeholder="••••••••" 
                    name="password" 
                    type="password" 
                    class="modern-input"
                  />
                  <nuxt-link to="/forget-password" class="absolute top-0 right-1 text-xs text-primary hover:text-primary-hover transition-colors z-20">
                    Forgot Password?
                  </nuxt-link>
                </div>
              </div>

              <div class="flex items-center mt-6">
                <el-checkbox label="Keep me logged in" class="!text-text-secondary font-normal" />
              </div>

              <el-form-item class="mt-8 mb-0">
                <el-button 
                  size="large" 
                  :loading="loading" 
                  native-type="submit" 
                  type="primary" 
                  class="w-full !h-[56px] !rounded-2xl !bg-primary hover:!bg-primary-hover !border-none !text-lg !font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                  Sign In
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        
        <p class="text-center mt-8 text-text-muted text-sm">
          Don't have an account? <span class="text-white font-medium cursor-help hover:text-primary transition-colors">Contact Administrator</span>
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
      
      // RADICAL FIX: Hardcoded URL to bypass config issues
      // Using $fetch directly to avoid wrapper logic overhead
      const response: any = await $fetch('http://localhost:5000/api/auth/login', {
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
  background-color: #0b0a12; // Obsidian base
  
  .glass-card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modern-input {
    .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: none !important;
      border-radius: 14px !important;
      padding: 4px 12px !important;
      transition: all 0.3s ease !important;

      &.is-focus, &:hover {
        border-color: #7849ff !important;
        background-color: rgba(120, 73, 255, 0.05) !important;
        transform: translateY(-1px);
      }
    }
    
    .el-input__inner {
      color: white !important;
      font-size: 15px !important;
      height: 48px !important;
      &::placeholder {
        color: rgba(255, 255, 255, 0.3) !important;
      }
    }
  }

  // Animation Utilities
  .animate-fade-in-left {
    animation: fadeInLeft 0.8s ease-out forwards;
  }
  
  .animate-fade-in-right {
    animation: fadeInRight 0.8s ease-out forwards;
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  // Element UI Overrides
  .el-checkbox__label {
    padding-left: 10px;
    font-size: 13px;
  }
  
  .el-checkbox__inner {
    background-color: transparent !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    border-radius: 6px;
  }
  
  .el-checkbox.is-checked .el-checkbox__inner {
    background-color: #7849ff !important;
    border-color: #7849ff !important;
  }
}
</style>