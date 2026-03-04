<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">{{ $t('whiteLabel.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('whiteLabel.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Branding Section -->
    <div class="glass-panel p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Icon name="ph:paint-brush-bold" class="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-200">{{ $t('whiteLabel.branding') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.brandingDesc') }}</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingBranding" @click="saveBranding">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.save') }}
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.companyName') }}</label>
          <el-input v-model="branding.companyName" :placeholder="$t('whiteLabel.companyNamePlaceholder')" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.tagline') }}</label>
          <el-input v-model="branding.tagline" :placeholder="$t('whiteLabel.taglinePlaceholder')" size="large" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Logo Upload -->
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.logo') }}</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerLogoUpload"
          >
            <div v-if="branding.logoPreview" class="mb-2">
              <img :src="branding.logoPreview" :alt="$t('whiteLabel.logoPreviewAlt')" class="h-12 mx-auto object-contain" />
            </div>
            <div v-else>
              <Icon name="ph:image-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
            </div>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.logoHint') }}</p>
          </div>
          <input ref="logoInputRef" type="file" accept="image/png,image/svg+xml" class="hidden" @change="handleLogoUpload" />
        </div>

        <!-- Favicon Upload -->
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.favicon') }}</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerFaviconUpload"
          >
            <div v-if="branding.faviconPreview" class="mb-2">
              <img :src="branding.faviconPreview" :alt="$t('whiteLabel.faviconPreviewAlt')" class="h-8 mx-auto object-contain" />
            </div>
            <div v-else>
              <Icon name="ph:app-window-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
            </div>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.faviconHint') }}</p>
          </div>
          <input ref="faviconInputRef" type="file" accept="image/x-icon,image/png" class="hidden" @change="handleFaviconUpload" />
        </div>
      </div>

      <!-- Color Pickers -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.primaryColor') }}</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="branding.primaryColor" />
            <span class="text-xs font-mono text-slate-400">{{ branding.primaryColor }}</span>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.secondaryColor') }}</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="branding.secondaryColor" />
            <span class="text-xs font-mono text-slate-400">{{ branding.secondaryColor }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Domain Section -->
    <div class="glass-panel p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Icon name="ph:globe-bold" class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-200">{{ $t('whiteLabel.domain') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.domainDesc') }}</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingDomain" @click="saveDomain">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.save') }}
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.domain') }}</label>
          <el-input v-model="domain.hostname" :placeholder="$t('whiteLabel.domainPlaceholder')" size="large">
            <template #prefix>
              <Icon name="ph:link-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.sslStatus') }}</label>
          <div class="flex items-center gap-2 h-10">
            <div class="w-3 h-3 rounded-full" :class="domain.sslActive ? 'bg-emerald-400' : 'bg-red-400'"></div>
            <span class="text-sm" :class="domain.sslActive ? 'text-emerald-400' : 'text-red-400'">
              {{ domain.sslActive ? $t('whiteLabel.sslActive') : $t('whiteLabel.sslNotConfigured') }}
            </span>
          </div>
        </div>
      </div>

      <!-- DNS Instructions -->
      <div class="mt-4 p-4 rounded-xl" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05)">
        <h4 class="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Icon name="ph:info-bold" class="w-4 h-4" />
          {{ $t('whiteLabel.dnsInstructions') }}
        </h4>
        <div class="space-y-2 text-xs text-slate-500">
          <p>
            {{ $t('whiteLabel.dnsStep1') }}
            <span class="font-mono text-slate-400">app.hp-tech.com</span>
          </p>
          <p>{{ $t('whiteLabel.dnsStep2') }}</p>
          <p>{{ $t('whiteLabel.dnsStep3') }}</p>
        </div>
        <div class="mt-3 p-3 rounded-lg font-mono text-xs text-slate-400" style="background: rgba(0, 0, 0, 0.2)">
          Type: CNAME | Host: crm | Value: app.hp-tech.com | TTL: 3600
        </div>
      </div>
    </div>

    <!-- Email Branding Section -->
    <div class="glass-panel p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Icon name="ph:envelope-bold" class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-200">{{ $t('whiteLabel.emailBranding') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.emailBrandingDesc') }}</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingEmail" @click="saveEmail">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.save') }}
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.fromName') }}</label>
          <el-input v-model="email.fromName" :placeholder="$t('whiteLabel.fromNamePlaceholder')" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.fromEmail') }}</label>
          <el-input v-model="email.fromEmail" :placeholder="$t('whiteLabel.fromEmailPlaceholder')" size="large">
            <template #prefix>
              <Icon name="ph:at-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
      </div>
      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.emailSignature') }}</label>
        <el-input v-model="email.signature" type="textarea" :rows="4" :placeholder="$t('whiteLabel.signaturePlaceholder')" />
      </div>
      <div class="mt-4">
        <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.emailFooter') }}</label>
        <el-input v-model="email.footer" type="textarea" :rows="2" :placeholder="$t('whiteLabel.footerPlaceholder')" />
      </div>
    </div>

    <!-- Login Page Section -->
    <div class="glass-panel p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Icon name="ph:sign-in-bold" class="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-200">{{ $t('whiteLabel.loginPage') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.loginPageDesc') }}</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingLoginPage" @click="saveLoginPage">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.save') }}
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.welcomeText') }}</label>
          <el-input v-model="loginPage.welcomeText" :placeholder="$t('whiteLabel.welcomeTextPlaceholder')" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.termsUrl') }}</label>
          <el-input v-model="loginPage.termsUrl" :placeholder="$t('whiteLabel.termsUrlPlaceholder')" size="large">
            <template #prefix>
              <Icon name="ph:link-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
      </div>

      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.customBackground') }}</label>
        <div
          class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
          @click="triggerBgUpload"
        >
          <div v-if="loginPage.bgPreview" class="mb-2">
            <img :src="loginPage.bgPreview" :alt="$t('whiteLabel.bgPreviewAlt')" class="h-20 mx-auto object-cover rounded-lg" />
          </div>
          <div v-else>
            <Icon name="ph:image-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
          </div>
          <p class="text-xs text-slate-500">{{ $t('whiteLabel.bgHint') }}</p>
        </div>
        <input ref="bgInputRef" type="file" accept="image/jpeg,image/png" class="hidden" @change="handleBgUpload" />
      </div>
    </div>

    <!-- Portal Branding Section -->
    <div class="glass-panel p-6 rounded-xl">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Icon name="ph:browsers-bold" class="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-200">{{ $t('whiteLabel.portalBranding') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('whiteLabel.portalBrandingDesc') }}</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingPortal" @click="savePortal">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          {{ $t('common.save') }}
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.portalName') }}</label>
          <el-input v-model="portal.name" :placeholder="$t('whiteLabel.portalNamePlaceholder')" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.portalLogo') }}</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerPortalLogoUpload"
          >
            <div v-if="portal.logoPreview" class="flex items-center justify-center gap-2">
              <img :src="portal.logoPreview" :alt="$t('whiteLabel.portalLogoAlt')" class="h-8 object-contain" />
              <el-button text type="danger" size="small" @click.stop="portal.logoPreview = ''">
                <Icon name="ph:x-bold" class="w-3 h-3" />
              </el-button>
            </div>
            <div v-else class="flex items-center justify-center gap-2">
              <Icon name="ph:upload-bold" class="w-4 h-4 text-slate-500" />
              <span class="text-xs text-slate-500">{{ $t('whiteLabel.uploadPortalLogo') }}</span>
            </div>
          </div>
          <input ref="portalLogoInputRef" type="file" accept="image/png,image/svg+xml" class="hidden" @change="handlePortalLogoUpload" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.portalPrimaryColor') }}</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="portal.primaryColor" />
            <span class="text-xs font-mono text-slate-400">{{ portal.primaryColor }}</span>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.portalAccentColor') }}</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="portal.accentColor" />
            <span class="text-xs font-mono text-slate-400">{{ portal.accentColor }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">{{ $t('whiteLabel.customCss') }}</label>
        <el-input
          v-model="portal.customCss"
          type="textarea"
          :rows="6"
          placeholder="/* Custom CSS overrides */
.portal-header {
  background: #1a1a2e;
}
.portal-sidebar {
  border-right: 1px solid rgba(255,255,255,0.05);
}"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({ layout: 'default', middleware: 'permissions' });

const savingBranding = ref(false);
const savingDomain = ref(false);
const savingEmail = ref(false);
const savingLoginPage = ref(false);
const savingPortal = ref(false);

const logoInputRef = ref<HTMLInputElement | null>(null);
const faviconInputRef = ref<HTMLInputElement | null>(null);
const bgInputRef = ref<HTMLInputElement | null>(null);
const portalLogoInputRef = ref<HTMLInputElement | null>(null);

// Branding
const branding = ref({
  companyName: 'High Point Technology CRM',
  tagline: 'Your Business, Simplified',
  primaryColor: '#7849FF',
  secondaryColor: '#A78BFA',
  logoPreview: '',
  faviconPreview: ''
});

// Domain
const domain = ref({
  hostname: '',
  sslActive: false
});

// Email
const email = ref({
  fromName: 'High Point Technology CRM',
  fromEmail: 'noreply@hp-tech.com',
  signature: '<p>Best regards,<br/>The High Point Technology Team</p>',
  footer: '123 Business District, Riyadh, Saudi Arabia | Unsubscribe'
});

// Login Page
const loginPage = ref({
  welcomeText: 'Welcome back!',
  termsUrl: '',
  bgPreview: ''
});

// Portal
const portal = ref({
  name: 'Client Portal',
  primaryColor: '#7849FF',
  accentColor: '#10B981',
  logoPreview: '',
  customCss: ''
});

// File upload handlers
function triggerLogoUpload() {
  logoInputRef.value?.click();
}
function triggerFaviconUpload() {
  faviconInputRef.value?.click();
}
function triggerBgUpload() {
  bgInputRef.value?.click();
}
function triggerPortalLogoUpload() {
  portalLogoInputRef.value?.click();
}

function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    branding.value.logoPreview = URL.createObjectURL(file);
    ElMessage.success(t('common.saved'));
  }
}

function handleFaviconUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    branding.value.faviconPreview = URL.createObjectURL(file);
    ElMessage.success(t('common.saved'));
  }
}

function handleBgUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    loginPage.value.bgPreview = URL.createObjectURL(file);
    ElMessage.success(t('common.saved'));
  }
}

function handlePortalLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    portal.value.logoPreview = URL.createObjectURL(file);
    ElMessage.success(t('common.saved'));
  }
}

// Save handlers
async function saveBranding() {
  savingBranding.value = true;
  setTimeout(() => {
    savingBranding.value = false;
    ElMessage.success(t('common.saved'));
  }, 800);
}

async function saveDomain() {
  savingDomain.value = true;
  setTimeout(() => {
    savingDomain.value = false;
    if (domain.value.hostname) {
      domain.value.sslActive = true;
      ElMessage.success(t('common.saved'));
    } else {
      ElMessage.warning(t('common.fillRequired'));
    }
  }, 800);
}

async function saveEmail() {
  savingEmail.value = true;
  setTimeout(() => {
    savingEmail.value = false;
    ElMessage.success(t('common.saved'));
  }, 800);
}

async function saveLoginPage() {
  savingLoginPage.value = true;
  setTimeout(() => {
    savingLoginPage.value = false;
    ElMessage.success(t('common.saved'));
  }, 800);
}

async function savePortal() {
  savingPortal.value = true;
  setTimeout(() => {
    savingPortal.value = false;
    ElMessage.success(t('common.saved'));
  }, 800);
}
</script>
