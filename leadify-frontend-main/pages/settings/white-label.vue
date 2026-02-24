<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">White-Label Settings</h1>
          <p class="text-slate-400 text-sm mt-1">Customize branding, domain, emails, and portal appearance for your organization.</p>
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
            <h3 class="text-sm font-medium text-slate-200">Branding</h3>
            <p class="text-xs text-slate-500">Company identity and visual assets</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingBranding" @click="saveBranding">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Company Name</label>
          <el-input v-model="branding.companyName" placeholder="Your Company Name" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Tagline</label>
          <el-input v-model="branding.tagline" placeholder="Optional tagline" size="large" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Logo Upload -->
        <div>
          <label class="block text-xs text-slate-500 mb-2">Logo</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerLogoUpload"
          >
            <div v-if="branding.logoPreview" class="mb-2">
              <img :src="branding.logoPreview" alt="Logo preview" class="h-12 mx-auto object-contain" />
            </div>
            <div v-else>
              <Icon name="ph:image-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
            </div>
            <p class="text-xs text-slate-500">Click to upload logo (PNG, SVG, max 2MB)</p>
          </div>
          <input ref="logoInputRef" type="file" accept="image/png,image/svg+xml" class="hidden" @change="handleLogoUpload" />
        </div>

        <!-- Favicon Upload -->
        <div>
          <label class="block text-xs text-slate-500 mb-2">Favicon</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerFaviconUpload"
          >
            <div v-if="branding.faviconPreview" class="mb-2">
              <img :src="branding.faviconPreview" alt="Favicon preview" class="h-8 mx-auto object-contain" />
            </div>
            <div v-else>
              <Icon name="ph:app-window-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
            </div>
            <p class="text-xs text-slate-500">Click to upload favicon (ICO, PNG, 32x32)</p>
          </div>
          <input ref="faviconInputRef" type="file" accept="image/x-icon,image/png" class="hidden" @change="handleFaviconUpload" />
        </div>
      </div>

      <!-- Color Pickers -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Primary Color</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="branding.primaryColor" />
            <span class="text-xs font-mono text-slate-400">{{ branding.primaryColor }}</span>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Secondary Color</label>
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
            <h3 class="text-sm font-medium text-slate-200">Custom Domain</h3>
            <p class="text-xs text-slate-500">Use your own domain for the CRM</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingDomain" @click="saveDomain">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Domain</label>
          <el-input v-model="domain.hostname" placeholder="crm.yourcompany.com" size="large">
            <template #prefix>
              <Icon name="ph:link-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">SSL Status</label>
          <div class="flex items-center gap-2 h-10">
            <div class="w-3 h-3 rounded-full" :class="domain.sslActive ? 'bg-emerald-400' : 'bg-red-400'"></div>
            <span class="text-sm" :class="domain.sslActive ? 'text-emerald-400' : 'text-red-400'">
              {{ domain.sslActive ? 'SSL Active' : 'SSL Not Configured' }}
            </span>
          </div>
        </div>
      </div>

      <!-- DNS Instructions -->
      <div class="mt-4 p-4 rounded-xl" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05)">
        <h4 class="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Icon name="ph:info-bold" class="w-4 h-4" />
          DNS Configuration Instructions
        </h4>
        <div class="space-y-2 text-xs text-slate-500">
          <p>
            1. Add a CNAME record pointing your domain to
            <span class="font-mono text-slate-400">app.hp-tech.com</span>
          </p>
          <p>2. Wait for DNS propagation (up to 48 hours)</p>
          <p>3. SSL certificate will be automatically provisioned once DNS is verified</p>
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
            <h3 class="text-sm font-medium text-slate-200">Email Branding</h3>
            <p class="text-xs text-slate-500">Customize outgoing email appearance</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingEmail" @click="saveEmail">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">From Name</label>
          <el-input v-model="email.fromName" placeholder="Your Company" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">From Email</label>
          <el-input v-model="email.fromEmail" placeholder="noreply@yourcompany.com" size="large">
            <template #prefix>
              <Icon name="ph:at-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
      </div>
      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">Email Signature (HTML)</label>
        <el-input v-model="email.signature" type="textarea" :rows="4" placeholder="<p>Best regards,<br/>Your Company Team</p>" />
      </div>
      <div class="mt-4">
        <label class="block text-xs text-slate-500 mb-2">Email Footer</label>
        <el-input v-model="email.footer" type="textarea" :rows="2" placeholder="Company Address | Unsubscribe Link" />
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
            <h3 class="text-sm font-medium text-slate-200">Login Page</h3>
            <p class="text-xs text-slate-500">Customize the login page appearance</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingLoginPage" @click="saveLoginPage">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Welcome Text</label>
          <el-input v-model="loginPage.welcomeText" placeholder="Welcome to your CRM" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Terms & Conditions URL</label>
          <el-input v-model="loginPage.termsUrl" placeholder="https://yourcompany.com/terms" size="large">
            <template #prefix>
              <Icon name="ph:link-bold" class="w-4 h-4" />
            </template>
          </el-input>
        </div>
      </div>

      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">Custom Background</label>
        <div
          class="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all cursor-pointer"
          @click="triggerBgUpload"
        >
          <div v-if="loginPage.bgPreview" class="mb-2">
            <img :src="loginPage.bgPreview" alt="Background preview" class="h-20 mx-auto object-cover rounded-lg" />
          </div>
          <div v-else>
            <Icon name="ph:image-bold" class="w-10 h-10 text-slate-500 mx-auto mb-2" />
          </div>
          <p class="text-xs text-slate-500">Click to upload background image (JPG, PNG, max 5MB)</p>
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
            <h3 class="text-sm font-medium text-slate-200">Portal Branding</h3>
            <p class="text-xs text-slate-500">Customize the client-facing portal</p>
          </div>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="savingPortal" @click="savePortal">
          <Icon name="ph:floppy-disk-bold" class="w-4 h-4 mr-2" />
          Save
        </el-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Portal Name</label>
          <el-input v-model="portal.name" placeholder="Client Portal" size="large" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Portal Logo</label>
          <div
            class="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-slate-600 transition-all cursor-pointer"
            @click="triggerPortalLogoUpload"
          >
            <div v-if="portal.logoPreview" class="flex items-center justify-center gap-2">
              <img :src="portal.logoPreview" alt="Portal logo" class="h-8 object-contain" />
              <el-button text type="danger" size="small" @click.stop="portal.logoPreview = ''">
                <Icon name="ph:x-bold" class="w-3 h-3" />
              </el-button>
            </div>
            <div v-else class="flex items-center justify-center gap-2">
              <Icon name="ph:upload-bold" class="w-4 h-4 text-slate-500" />
              <span class="text-xs text-slate-500">Upload portal logo</span>
            </div>
          </div>
          <input ref="portalLogoInputRef" type="file" accept="image/png,image/svg+xml" class="hidden" @change="handlePortalLogoUpload" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Portal Primary Color</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="portal.primaryColor" />
            <span class="text-xs font-mono text-slate-400">{{ portal.primaryColor }}</span>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Portal Accent Color</label>
          <div class="flex items-center gap-2">
            <el-color-picker v-model="portal.accentColor" />
            <span class="text-xs font-mono text-slate-400">{{ portal.accentColor }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <label class="block text-xs text-slate-500 mb-2">Custom CSS</label>
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

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
    ElMessage.success('Logo uploaded');
  }
}

function handleFaviconUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    branding.value.faviconPreview = URL.createObjectURL(file);
    ElMessage.success('Favicon uploaded');
  }
}

function handleBgUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    loginPage.value.bgPreview = URL.createObjectURL(file);
    ElMessage.success('Background uploaded');
  }
}

function handlePortalLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    portal.value.logoPreview = URL.createObjectURL(file);
    ElMessage.success('Portal logo uploaded');
  }
}

// Save handlers
async function saveBranding() {
  savingBranding.value = true;
  setTimeout(() => {
    savingBranding.value = false;
    ElMessage.success('Branding settings saved');
  }, 800);
}

async function saveDomain() {
  savingDomain.value = true;
  setTimeout(() => {
    savingDomain.value = false;
    if (domain.value.hostname) {
      domain.value.sslActive = true;
      ElMessage.success('Domain settings saved');
    } else {
      ElMessage.warning('Please enter a domain');
    }
  }, 800);
}

async function saveEmail() {
  savingEmail.value = true;
  setTimeout(() => {
    savingEmail.value = false;
    ElMessage.success('Email branding saved');
  }, 800);
}

async function saveLoginPage() {
  savingLoginPage.value = true;
  setTimeout(() => {
    savingLoginPage.value = false;
    ElMessage.success('Login page settings saved');
  }, 800);
}

async function savePortal() {
  savingPortal.value = true;
  setTimeout(() => {
    savingPortal.value = false;
    ElMessage.success('Portal branding saved');
  }, 800);
}
</script>
