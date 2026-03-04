<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    :title="$t('accounting.creditNotes.title')"
    :subtitle="$t('accounting.creditNotes.subtitle')"
  )
    template(#actions)
      NuxtLink(to="/finance/accounting/credit-notes/create")
        el-button(
          size="large"
          type="primary"
          :icon="Plus"
          class="!rounded-2xl"
        ) {{ $t('accounting.creditNotes.create') }}

  .glass-card.p-8.mt-6.flex.flex-col.items-center.justify-center.text-center.min-h-96
    Icon(name="ph:file-dashed-bold" size="64" class="text-purple-300 mb-4 opacity-50")
    h3.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('accounting.creditNotes.noneYet') }}
    p.text-muted.mt-2.max-w-md {{ $t('accounting.creditNotes.noneYetDesc') }}
    NuxtLink(to="/finance/accounting/credit-notes/create").mt-6
      el-button(type="primary" size="large" class="!rounded-xl") {{ $t('accounting.creditNotes.createFirst') }}
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
definePageMeta({ middleware: 'permissions' });
</script>
