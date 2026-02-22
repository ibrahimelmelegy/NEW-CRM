<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    title="Quotes"
    subtitle="Generate preliminary quotes for prospects"
  )
    template(#actions)
      NuxtLink(to="/sales/quotes/create")
        el-button(
          size="large"
          type="primary"
          :icon="Plus"
          class="!rounded-2xl"
        ) Create Quote

  .glass-card.p-8.mt-6.flex.flex-col.items-center.justify-center.text-center.min-h-96
    Icon(name="ph:file-dashed-bold" size="64" class="text-purple-300 mb-4 opacity-50")
    h3.text-2xl.font-bold(style="color: var(--text-primary)") No Quotes Yet
    p.text-muted.mt-2.max-w-md Build beautiful quotes to win clients using the Universal Document Engine.
    NuxtLink(to="/sales/quotes/create").mt-6
      el-button(type="primary" size="large" class="!rounded-xl") Create Your First Quote
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
definePageMeta({ middleware: 'permissions' });
</script>
