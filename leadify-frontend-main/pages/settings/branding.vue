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
    .flex.items-center.gap-3
      el-button(
        size="large"
        @click="handleReset"
        class="!rounded-xl !px-6"
      )
        Icon.mr-2(name="ph:arrow-counter-clockwise-bold" size="16")
        | {{ $t('branding.resetDefaults') }}
      el-button(
        type="primary"
        size="large"
        :loading="saving"
        @click="handleSave"
        class="!rounded-xl !px-8"
      )
        Icon.mr-2(name="ph:floppy-disk-bold" size="16")
        | {{ $t('branding.save') }}

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
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.companyWebsite') }}
              el-input(v-model="form.companyWebsite" :placeholder="$t('branding.companyWebsitePlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:globe-bold" size="16")
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
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
              :class="{ 'drag-active': isDragging }"
            )
              .mb-2(v-if="logoPreview")
                img.mx-auto.object-contain(:src="logoPreview" alt="Logo preview" style="max-height: 64px")
              div(v-else)
                Icon.mx-auto.mb-2(name="ph:image-bold" size="40" style="color: var(--text-muted)")
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.logoHint') }}
            input.hidden(ref="logoInputRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="handleLogoUpload")

          //- Colors
          .grid.gap-5(class="grid-cols-1 md:grid-cols-3")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.primaryColor') }}
              .flex.items-center.gap-3
                el-color-picker(v-model="form.primaryColor" size="large")
                span.text-xs.font-mono(style="color: var(--text-muted)") {{ form.primaryColor }}
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.secondaryColor') }}
              .flex.items-center.gap-3
                el-color-picker(v-model="form.secondaryColor" size="large")
                span.text-xs.font-mono(style="color: var(--text-muted)") {{ form.secondaryColor }}
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

        //- Document Settings Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.1)")
              Icon(name="ph:file-text-bold" size="20" style="color: #3b82f6")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.documentSettings') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.documentSettingsDesc') }}

          .grid.gap-5(class="grid-cols-1 md:grid-cols-2")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.invoicePrefix') }}
              el-input(v-model="form.invoicePrefix" :placeholder="$t('branding.invoicePrefixPlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:receipt-bold" size="16")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.quotePrefix') }}
              el-input(v-model="form.quotePrefix" :placeholder="$t('branding.quotePrefixPlaceholder')" size="large")
                template(#prefix)
                  Icon(name="ph:quotes-bold" size="16")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.defaultCurrency') }}
              el-select(v-model="form.defaultCurrency" size="large" style="width: 100%" filterable)
                el-option(
                  v-for="c in currencyOptions"
                  :key="c.value"
                  :label="c.label"
                  :value="c.value"
                )
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.dateFormat') }}
              el-select(v-model="form.dateFormat" size="large" style="width: 100%")
                el-option(
                  v-for="df in dateFormatOptions"
                  :key="df.value"
                  :label="df.label"
                  :value="df.value"
                )

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

        //- Regional Settings Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(168, 85, 247, 0.1)")
              Icon(name="ph:globe-hemisphere-west-bold" size="20" style="color: #a855f7")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('branding.regionalSettings') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('branding.regionalSettingsDesc') }}

          .grid.gap-5(class="grid-cols-1 md:grid-cols-2")
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.defaultLanguage') }}
              el-select(v-model="form.defaultLanguage" size="large" style="width: 100%")
                el-option(
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                )
            div
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('branding.timezone') }}
              el-select(v-model="form.timezone" size="large" style="width: 100%" filterable)
                el-option(
                  v-for="tz in timezoneOptions"
                  :key="tz.value"
                  :label="tz.label"
                  :value="tz.value"
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
              :style="previewHeaderBorderStyle"
            )
              .preview-logo-area.flex.items-center.justify-center.rounded-lg(
                :style="previewLogoBgStyle"
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
                .text-xs(style="color: #6b7280") {{ $t('branding.previewDate') }}: {{ previewDateFormatted }}
                .text-xs.font-medium(:style="{ color: form.accentColor || '#7849ff' }") {{ previewInvoiceNumber }}
              .space-y-1
                .flex.justify-between.text-xs(style="color: #6b7280")
                  span {{ $t('branding.previewItem') }}
                  span {{ formatPreviewCurrency(1200) }}
                .flex.justify-between.text-xs(style="color: #6b7280")
                  span {{ $t('branding.previewItem') }}
                  span {{ formatPreviewCurrency(800) }}
              .border-t.mt-2.pt-2(style="border-color: #e5e7eb")
                .flex.justify-between.text-xs.font-bold(:style="{ fontFamily: form.fontFamily || 'Inter', color: '#1f2937' }")
                  span {{ $t('branding.previewTotal') }}
                  span {{ formatPreviewCurrency(2000) }}

            //- Document Footer
            .preview-footer.p-3.text-center(
              :style="previewFooterStyle"
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
          .mt-4.flex.items-center.gap-2
            .flex.items-center.gap-2.flex-1
              .w-6.h-6.rounded-lg(:style="{ background: form.primaryColor || '#7849ff' }")
              .text-xs
                .font-medium(style="color: var(--text-primary)") {{ $t('branding.primary') }}
            .flex.items-center.gap-2.flex-1
              .w-6.h-6.rounded-lg(:style="{ background: form.secondaryColor || '#6366f1' }")
              .text-xs
                .font-medium(style="color: var(--text-primary)") {{ $t('branding.secondary') }}
            .flex.items-center.gap-2.flex-1
              .w-6.h-6.rounded-lg(:style="{ background: form.accentColor || '#22c55e' }")
              .text-xs
                .font-medium(style="color: var(--text-primary)") {{ $t('branding.accent') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger';

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const settingsId = ref<string | number>('');
const logoInputRef = ref<HTMLInputElement | null>(null);
const logoPreview = ref('');
const isDragging = ref(false);

// --- Option lists ---

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
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' }
];

const currencyOptions = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
  { label: 'AED - UAE Dirham', value: 'AED' },
  { label: 'QAR - Qatari Riyal', value: 'QAR' },
  { label: 'KWD - Kuwaiti Dinar', value: 'KWD' },
  { label: 'BHD - Bahraini Dinar', value: 'BHD' },
  { label: 'OMR - Omani Rial', value: 'OMR' },
  { label: 'EGP - Egyptian Pound', value: 'EGP' },
  { label: 'JOD - Jordanian Dinar', value: 'JOD' },
  { label: 'INR - Indian Rupee', value: 'INR' },
  { label: 'CNY - Chinese Yuan', value: 'CNY' },
  { label: 'JPY - Japanese Yen', value: 'JPY' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'CHF - Swiss Franc', value: 'CHF' },
  { label: 'TRY - Turkish Lira', value: 'TRY' },
  { label: 'BRL - Brazilian Real', value: 'BRL' },
  { label: 'ZAR - South African Rand', value: 'ZAR' }
];

const dateFormatOptions = [
  { label: 'DD/MM/YYYY (27/02/2026)', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY (02/27/2026)', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD (2026-02-27)', value: 'YYYY-MM-DD' },
  { label: 'DD-MM-YYYY (27-02-2026)', value: 'DD-MM-YYYY' },
  { label: 'DD.MM.YYYY (27.02.2026)', value: 'DD.MM.YYYY' }
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' }
];

const timezoneOptions = [
  { label: '(UTC-12:00) Baker Island', value: 'Etc/GMT+12' },
  { label: '(UTC-11:00) Samoa', value: 'Pacific/Samoa' },
  { label: '(UTC-10:00) Hawaii', value: 'Pacific/Honolulu' },
  { label: '(UTC-09:00) Alaska', value: 'America/Anchorage' },
  { label: '(UTC-08:00) Pacific Time (US)', value: 'America/Los_Angeles' },
  { label: '(UTC-07:00) Mountain Time (US)', value: 'America/Denver' },
  { label: '(UTC-06:00) Central Time (US)', value: 'America/Chicago' },
  { label: '(UTC-05:00) Eastern Time (US)', value: 'America/New_York' },
  { label: '(UTC-04:00) Atlantic Time', value: 'America/Halifax' },
  { label: '(UTC-03:00) Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: '(UTC-02:00) Mid-Atlantic', value: 'Atlantic/South_Georgia' },
  { label: '(UTC-01:00) Azores', value: 'Atlantic/Azores' },
  { label: '(UTC+00:00) London / UTC', value: 'Europe/London' },
  { label: '(UTC+01:00) Paris / Berlin', value: 'Europe/Paris' },
  { label: '(UTC+02:00) Cairo / Amman', value: 'Africa/Cairo' },
  { label: '(UTC+03:00) Riyadh / Kuwait', value: 'Asia/Riyadh' },
  { label: '(UTC+03:30) Tehran', value: 'Asia/Tehran' },
  { label: '(UTC+04:00) Dubai / Muscat', value: 'Asia/Dubai' },
  { label: '(UTC+04:30) Kabul', value: 'Asia/Kabul' },
  { label: '(UTC+05:00) Karachi / Tashkent', value: 'Asia/Karachi' },
  { label: '(UTC+05:30) Mumbai / New Delhi', value: 'Asia/Kolkata' },
  { label: '(UTC+06:00) Dhaka', value: 'Asia/Dhaka' },
  { label: '(UTC+07:00) Bangkok / Jakarta', value: 'Asia/Bangkok' },
  { label: '(UTC+08:00) Singapore / Hong Kong', value: 'Asia/Singapore' },
  { label: '(UTC+09:00) Tokyo / Seoul', value: 'Asia/Tokyo' },
  { label: '(UTC+10:00) Sydney', value: 'Australia/Sydney' },
  { label: '(UTC+11:00) Solomon Islands', value: 'Pacific/Guadalcanal' },
  { label: '(UTC+12:00) Auckland', value: 'Pacific/Auckland' }
];

// --- Default values ---

const DEFAULTS = {
  name: '',
  email: '',
  logo: '',
  primaryColor: '#7849ff',
  secondaryColor: '#6366f1',
  accentColor: '#22c55e',
  fontFamily: 'Inter, sans-serif',
  companyAddress: '',
  companyPhone: '',
  companyTaxId: '',
  companyWebsite: '',
  brandFooterText: '',
  invoicePrefix: 'INV-',
  quotePrefix: 'QT-',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Riyadh'
};

const form = reactive({ ...DEFAULTS });

// --- Computed preview helpers (avoid `}}` inside mustache) ---

const previewHeaderBorderStyle = computed(() => {
  const color = form.primaryColor || '#7849ff';
  return { borderBottom: '3px solid ' + color };
});

const previewLogoBgStyle = computed(() => {
  const color = form.primaryColor || '#7849ff';
  return { background: color + '15', width: '40px', height: '40px' };
});

const previewFooterStyle = computed(() => {
  const accent = form.accentColor || '#7849ff';
  const primary = form.primaryColor || '#7849ff';
  return {
    borderTop: '2px solid ' + accent + '40',
    background: primary + '08'
  };
});

const previewInvoiceNumber = computed(() => {
  return '#' + (form.invoicePrefix || 'INV-') + '001';
});

const previewDateFormatted = computed(() => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  switch (form.dateFormat) {
    case 'MM/DD/YYYY':
      return mm + '/' + dd + '/' + yyyy;
    case 'YYYY-MM-DD':
      return yyyy + '-' + mm + '-' + dd;
    case 'DD-MM-YYYY':
      return dd + '-' + mm + '-' + yyyy;
    case 'DD.MM.YYYY':
      return dd + '.' + mm + '.' + yyyy;
    default:
      return dd + '/' + mm + '/' + yyyy;
  }
});

function formatPreviewCurrency(amount: number): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    SAR: 'SAR ',
    AED: 'AED ',
    QAR: 'QAR ',
    KWD: 'KD ',
    BHD: 'BD ',
    OMR: 'OMR ',
    EGP: 'EGP ',
    JOD: 'JOD ',
    INR: '\u20B9',
    CNY: '\u00A5',
    JPY: '\u00A5',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF ',
    TRY: '\u20BA',
    BRL: 'R$',
    ZAR: 'R'
  };
  const sym = symbols[form.defaultCurrency] || form.defaultCurrency + ' ';
  return sym + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// --- Load settings ---

async function loadSettings() {
  loading.value = true;
  try {
    const res = await useApiFetch('setting', 'GET');
    if (res.success && res.body) {
      const data = Array.isArray(res.body) ? res.body[0] : res.body;
      if (data) {
        settingsId.value = data.id;
        form.name = data.name || DEFAULTS.name;
        form.email = data.email || DEFAULTS.email;
        form.logo = data.logo || DEFAULTS.logo;
        form.primaryColor = data.primaryColor || DEFAULTS.primaryColor;
        form.secondaryColor = data.secondaryColor || DEFAULTS.secondaryColor;
        form.accentColor = data.accentColor || DEFAULTS.accentColor;
        form.fontFamily = data.fontFamily || DEFAULTS.fontFamily;
        form.companyAddress = data.companyAddress || DEFAULTS.companyAddress;
        form.companyPhone = data.companyPhone || DEFAULTS.companyPhone;
        form.companyTaxId = data.companyTaxId || DEFAULTS.companyTaxId;
        form.companyWebsite = data.companyWebsite || DEFAULTS.companyWebsite;
        form.brandFooterText = data.brandFooterText || DEFAULTS.brandFooterText;
        form.invoicePrefix = data.invoicePrefix || DEFAULTS.invoicePrefix;
        form.quotePrefix = data.quotePrefix || DEFAULTS.quotePrefix;
        form.defaultCurrency = data.defaultCurrency || DEFAULTS.defaultCurrency;
        form.defaultLanguage = data.defaultLanguage || DEFAULTS.defaultLanguage;
        form.dateFormat = data.dateFormat || DEFAULTS.dateFormat;
        form.timezone = data.timezone || DEFAULTS.timezone;

        if (data.logo) {
          logoPreview.value = data.logo;
        }
      }
    }
  } catch (e) {
    logger.error('Failed to load brand settings', e);
  } finally {
    loading.value = false;
  }
}

await loadSettings().catch(() => {
  loading.value = false;
});

// --- Logo upload ---

function triggerLogoUpload() {
  logoInputRef.value?.click();
}

function processLogoFile(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('branding.logoSizeError') });
    return;
  }
  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('branding.logoSizeError') });
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const result = e.target?.result as string;
    logoPreview.value = result;
    form.logo = result;
  };
  reader.readAsDataURL(file);
}

function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  processLogoFile(file);
}

function onDragOver() {
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processLogoFile(file);
}

// --- Save settings ---

// Strip empty strings from an object so the backend @IsOptional() skips them
function stripEmptyStrings(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
}

async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }

  saving.value = true;
  try {
    const payload = stripEmptyStrings({ ...form });
    let res: unknown;
    if (settingsId.value) {
      res = await useApiFetch(`setting/${settingsId.value}`, 'PUT', payload);
    } else {
      res = await useApiFetch('setting', 'POST', payload);
    }
    if (res.success) {
      if (res.body && res.body.id) {
        settingsId.value = res.body.id;
      }
      ElNotification({ type: 'success', title: t('common.success'), message: t('branding.saved') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message || t('branding.saveFailed') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('branding.saveFailed') });
  } finally {
    saving.value = false;
  }
}

// --- Reset to defaults ---

async function handleReset() {
  try {
    await ElMessageBox.confirm(t('branding.resetConfirm'), t('branding.resetDefaults'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
  } catch {
    return; // User cancelled
  }

  Object.assign(form, DEFAULTS);
  logoPreview.value = '';

  // Persist the reset to the server
  saving.value = true;
  try {
    const payload = stripEmptyStrings({ ...form });
    let res;
    if (settingsId.value) {
      res = await useApiFetch(`setting/${settingsId.value}`, 'PUT', payload);
    } else {
      res = await useApiFetch('setting', 'POST', payload);
    }
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('branding.resetSuccess') });
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
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
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.logo-upload-area:hover,
.logo-upload-area.drag-active {
  border-color: var(--accent-color, #7849ff);
  background: rgba(120, 73, 255, 0.04);
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
