<template>
  <div class="login-page reset-complete relative w-full h-screen overflow-hidden flex items-center justify-center bg-obsidian">
    <!-- Immersive Background Elements -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-end/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute inset-0 opacity-[0.05]" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 40px 40px;"></div>
    </div>

    <!-- Glassmorphism Container -->
    <div class="relative z-10 w-full max-w-[1200px] px-4 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
      
      <!-- Brand Section -->
      <div class="hidden md:flex flex-1 flex-col items-start space-y-8 animate-fade-in-left text-white">
        <img src="/images/light-logo.png" alt="High Point CRM" class="h-16 w-auto drop-shadow-2xl" />
        <div class="space-y-4">
          <h2 class="text-4xl lg:text-5xl font-bold leading-tight">
            Account <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gradient-end">Restored</span>
          </h2>
          <p class="text-text-secondary text-lg max-w-md leading-relaxed">
            Your security is our priority. Your password has been successfully updated.
          </p>
        </div>
      </div>

      <!-- Success Card -->
      <div class="w-full max-w-[480px] animate-fade-in-right">
        <div class="glass-card p-8 md:p-12 rounded-[32px] border border-white/10 .glass-card/[0.03] backdrop-blur-[20px] shadow-2xl relative overflow-hidden text-center">
          <div class="relative z-10">
            <div class="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-success/10 border border-success/30 animate-bounce-subtle">
              <Icon name="ph:seal-check-bold" class="text-success text-5xl" />
            </div>
            
            <h1 class="text-3xl font-bold text-white mb-4">Password Changed!</h1>
            <p class="text-text-muted mb-10 leading-relaxed text-lg">
              You've successfully completed your password reset. You can now sign in with your new credentials.
            </p>

            <el-button 
              size="large" 
              type="primary"
              @click="router.push('/login')"
              class="w-full !h-[56px] !rounded-2xl !bg-primary hover:!bg-primary-hover !border-none !text-lg !font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign In to Your Account
            </el-button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
  const router = useRouter();

  definePageMeta({
    title: "Admin | Reset Password Complete",
    layout: "empty",
  });
</script>

<style lang="scss">
.reset-complete {
  .animate-bounce-subtle {
    animation: bounce-subtle 3s infinite ease-in-out;
  }

  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
}
</style>
