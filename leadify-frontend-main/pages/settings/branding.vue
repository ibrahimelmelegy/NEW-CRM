<template lang="pug">
.p-6.animate-entrance.w-full.mx-auto(class="max-w-[1200px]")
  //- Header
  .flex.items-center.justify-between.mb-8
    .flex.items-center.gap-4
      el-button(circle plain @click="router.push('/settings')" class="!w-11 !h-11")
        Icon(name="ph:arrow-left-bold" size="18")
      div
        h2.text-3xl.font-black(style="color: var(--text-primary)") {{ $t('branding.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('branding.subtitle') }}
    el-button(
      type="primary"
      size="large"
      :loading="saving"
      @click="handleSave"
      class="!rounded-xl !px-8"
    )
      Icon.mr-2(name="ph:floppy-disk-bold" size="16")
      | {{ $t('common.save') }}

  //- Loading state
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Main content
  template(v-else)
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
      //- Left column: form cards
      .space-y-6(class="lg:col-span-2")

        //- Company Identity Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:buildings-bold" size="20" style="color: #7849ff")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.companyIdentity') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.companyIdentityDesc') }}

          .grid.gap-5(class="grid-cols-1 md:grid-cols-2")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyName') }}
              el-input(v-model="form.name" :placeholder="$t('branding.companyNamePlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:identification-badge-bold" size="16")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyEmail') }}
              el-input(v-model="form.email" :placeholder="$t('branding.companyEmailPlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:envelope-bold" size="16")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyPhone') }}
              el-input(v-model="form.companyPhone" :placeholder="$t('branding.companyPhonePlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:phone-bold" size="16")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyTaxId') }}
              el-input(v-model="form.companyTaxId" :placeholder="$t('branding.companyTaxIdPlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:hash-bold" size="16")
          .mt-5
            label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyAddress') }}
            el-input(
              v-model="form.companyAddress"
              type="textarea"
              :rows="2"
              :placeholder="$t('branding.companyAddressPlaceholder')"
            )

        //- Visual Identity Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
              Icon(name="ph:paint-brush-bold" size="20" style="color: #22c55e")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.visualIdentity') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.visualIdentityDesc') }}

          //- Logo Upload
          .mb-6
            label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.logo') }}
            .logo-upload-area.rounded-xl.p-6.text-center.cursor-pointer.transition-all(
              @click="triggerLogoUpload"
            )
              .mb-2(v-if="logoPreview")
                img.mx-auto.object-contain(:src="logoPreview" alt="Logo preview" style="max-height: 64px")
              div(v-else)
                Icon.mx-auto.mb-2(name="ph:image-bold" size="40" style="color: var(--text-muted)")
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.logoHint') }}
            input.hidden(ref="logoInputRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="handleLogoUpload")

          //- Colors
          .grid.gap-5(class="grid-cols-1 md:grid-cols-2")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.primaryColor') }}
              .flex.items-center.gap-3
                el-color-picker(v-model="form.primaryColor" size="large")
                span.text-xs.font-mono(style="color: var(--text-muted)") {{ form.primaryColor }}
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.accentColor') }}
              .flex.items-center.gap-3
                el-color-picker(v-model="form.accentColor" size="large")
                span.text-xs.font-mono(style="color: var(--text-muted)") {{ form.accentColor }}

          //- Font Family
          .mt-5
            label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.fontFamily') }}
            el-select(v-model="form.fontFamily" size="large" style="width: 100%")
              el-option(
                v-for="font in fontOptions"
                :key="font.value"
                :label="font.label"
                :value="font.value"
              )
                span(:style="{ fontFamily: font.value }") {{ font.label }}

        //- Document Footer Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.1)")
              Icon(name="ph:article-bold" size="20" style="color: #f59e0b")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.documentFooter') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.documentFooterDesc') }}

          label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.footerText') }}
          el-input(
            v-model="form.brandFooterText"
            type="textarea"
            :rows="4"
            :placeholder="$t('branding.footerTextPlaceholder')"
          )

      //- Right column: Live Preview
      .col-span-1
        .glass-card.rounded-2xl.p-6.sticky(style="top: 24px")
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(6, 182, 212, 0.1)")
              Icon(name="ph:eye-bold" size="20" style="color: #06b6d4")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.livePreview') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.livePreviewDesc') }}

          //- Document Preview
          .preview-document.rounded-xl.overflow-hidden
            //- Document Header
            .preview-header.p-4.flex.items-center.gap-3(
              :style="{ borderBottom: '3px solid ' + (form.primaryColor || '#7849ff') }"
            )
              .preview-logo-area.flex.items-center.justify-center.rounded-lg(
                :style="{ background: (form.primaryColor || '#7849ff') + '15', width: '40px', height: '40px' }"
              )
                img.object-contain(v-if="logoPreview" :src="logoPreview" style="max-width: 32px; max-height: 32px")
                Icon(v-else name="ph:buildings-bold" size="20" :style="{ color: form.primaryColor || '#7849ff' }")
              div
                .text-sm.font-bold(:style="{ fontFamily: form.fontFamily || 'Inter', color: '#1f2937' }") {{ form.name || 'Company Name' }}
                .text-xs(style="color: #6b7280") {{ form.email || 'email@company.com' }}

            //- Document Body Mock
            .preview-body.p-4
              .text-xs.font-semibold.mb-2(:style="{ fontFamily: form.fontFamily || 'Inter', color: '#1f2937' }") {{ $t('branding.previewInvoiceTitle') }}
              .flex.items-center.justify-between.mb-3
                .text-xs(style="color: #6b7280") {{ $t('branding.previewDate') }}: 27/02/2026
                .text-xs.font-medium(:style="{ color: form.accentColor || '#7849ff' }") #INV-001
              .space-y-1
                .flex.justify-between.text-xs(style="color: #6b7280")
                  span {{ $t('branding.previewItem') }}
                  span $1,200.00
                .flex.justify-between.text-xs(style="color: #6b7280")
                  span {{ $t('branding.previewItem') }}
                  span $800.00
              .border-t.mt-2.pt-2(style="border-color: #e5e7eb")
                .flex.justify-between.text-xs.font-bold(:style="{ fontFamily: form.fontFamily || 'Inter', color: '#1f2937' }")
                  span {{ $t('branding.previewTotal') }}
                  span $2,000.00

            //- Document Footer
            .preview-footer.p-3.text-center(
              :style="{ borderTop: '2px solid ' + (form.accentColor || '#7849ff') + '40', background: (form.primaryColor || '#7849ff') + '08' }"
            )
              .text-xs(style="color: #6b7280; line-height: 1.5" :style="{ fontFamily: form.fontFamily || 'Inter' }") {{ form.brandFooterText || $t('branding.previewFooterFallback') }}
              .text-xs.mt-1(v-if="form.companyPhone || form.companyAddress" style="color: #9ca3af")
                span(v-if="form.companyPhone") {{ form.companyPhone }}
                span(v-if="form.companyPhone && form.companyAddress")  &middot;
                span(v-if="form.companyAddress") {{ form.companyAddress }}

          //- Font preview
          .mt-4.p-3.rounded-lg(style="background: var(--glass-bg, rgba(255, 255, 255, 0.04))")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('branding.fontPreview') }}
            .text-lg.font-semibold(:style="{ fontFamily: form.fontFamily || 'Inter', color: 'var(--text-primary)' }") {{ form.name || 'Company Name' }}
            .text-sm(:style="{ fontFamily: form.fontFamily || 'Inter', color: 'var(--text-muted)' }") The quick brown fox jumps over the lazy dog

          //- Color swatches
          .mt-4.flex.items-center.gap-3
            .flex.items-center.gap-2.flex-1
              .w-8.h-8.rounded-lg(:style="{ background: form.primaryColor || '#7849ff' }")
              .text-xs
                .font-medium(style="color: var(--text-primary)") {{ $t('branding.primary') }}
                .font-mono(style="color: var(--text-muted)") {{ form.primaryColor }}
            .flex.items-center.gap-2.flex-1
              .w-8.h-8.rounded-lg(:style="{ background: form.accentColor || '#7849ff' }")
              .text-xs
                .font-medium(style="color: var(--text-primary)") {{ $t('branding.accent') }}
                .font-mono(style="color: var(--text-muted)") {{ form.accentColor }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const settingsId = ref<string | number>('');
const logoInputRef = ref<HTMLInputElement | null>(null);
const logoPreview = ref('');

const fontOptions = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'IBM Plex Sans', value: "'IBM Plex Sans', sans-serif" },
  { label: 'Cairo (Arabic)', value: 'Cairo, sans-serif' },
  { label: 'System Default', value: "system-ui, -apple-system, sans-serif" },
];

const form = reactive({
  name: '',
  email: '',
  logo: '',
  primaryColor: '#7849ff',
  accentColor: '#22c55e',
  fontFamily: 'Inter, sans-serif',
  companyAddress: '',
  companyPhone: '',
  companyTaxId: '',
  brandFooterText: '',
});

// Load settings
async function loadSettings() {
  loading.value = true;
  try {
    const res = await useApiFetch('settings', 'GET');
    if (res.success && res.body) {
      const data = Array.isArray(res.body) ? res.body[0] : res.body;
      if (data) {
        settingsId.value = data.id;
        form.name = data.name || '';
        form.email = data.email || '';
        form.logo = data.logo || '';
        form.primaryColor = data.primaryColor || '#7849ff';
        form.accentColor = data.accentColor || '#22c55e';
        form.fontFamily = data.fontFamily || 'Inter, sans-serif';
        form.companyAddress = data.companyAddress || '';
        form.companyPhone = data.companyPhone || '';
        form.companyTaxId = data.companyTaxId || '';
        form.brandFooterText = data.brandFooterText || '';

        if (data.logo) {
          logoPreview.value = data.logo;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load brand settings', e);
  } finally {
    loading.value = false;
  }
}

await loadSettings().catch(() => {
  loading.value = false;
});

// Logo upload
function triggerLogoUpload() {
  logoInputRef.value?.click();
}

function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('branding.logoSizeError') });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    logoPreview.value = result;
    form.logo = result;
  };
  reader.readAsDataURL(file);
}

// Save settings
async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }

  saving.value = true;
  try {
    const payload = { ...form };
    const res = await useApiFetch(`settings/${settingsId.value}`, 'PUT', payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message || t('common.error') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.animate-entrance {
  animation: entrance 0.4s ease-out;
}

@keyframes entrance {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-upload-area {
  border: 2px dashed var(--glass-border, rgba(255, 255, 255, 0.12));
  transition: border-color 0.2s ease;
}

.logo-upload-area:hover {
  border-color: var(--accent-color, #7849ff);
}

.preview-document {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.preview-header {
  background: #fafafa;
}

.preview-body {
  background: #ffffff;
}

.preview-footer {
  min-height: 40px;
}
</style>
