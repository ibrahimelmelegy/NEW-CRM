<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    title="Delivery Notes"
    subtitle="Manage and track outgoing shipments and deliveries"
  )
    template(#actions)
      NuxtLink(to="/sales/delivery-notes/create")
        el-button(
          size="large"
          type="primary"
          :icon="Plus"
          class="!rounded-2xl"
        ) Create Delivery Note

  .glass-card.p-8.mt-6.flex.flex-col.items-center.justify-center.text-center.min-h-96
    Icon(name="ph:truck-bold" size="64" class="text-purple-300 mb-4 opacity-50")
    h3.text-2xl.font-bold(style="color: var(--text-primary)") No Delivery Notes
    p.text-muted.mt-2.max-w-md Generate professional delivery notes and packing slips using the Universal Document Engine.
    NuxtLink(to="/sales/delivery-notes/create").mt-6
      el-button(type="primary" size="large" class="!rounded-xl") Create Your First Delivery Note
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
definePageMeta({ middleware: 'permissions' });
</script>
