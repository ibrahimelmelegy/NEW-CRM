<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    title="Proforma Invoices"
    subtitle="Manage proforma invoices for pre-shipment billing"
  )
    template(#actions)
      NuxtLink(to="/sales/proforma-invoices/create")
        el-button(
          type="primary"
          size="large"
          style="background: var(--bg-obsidian); border: none; border-radius: 12px;"
        )
          Icon(name="ph:plus" size="18" style="margin-right: 6px;")
          | New Proforma Invoice

  .mt-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      el-empty(description="No proforma invoices yet. Click 'New Proforma Invoice' to create one.")
</template>

<script setup lang="ts">
definePageMeta({});
</script>
