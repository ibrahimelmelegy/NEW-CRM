<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    title="Service Level Agreements"
    subtitle="Manage SLA documents for service commitments"
  )
    template(#actions)
      NuxtLink(to="/operations/sla/create")
        el-button(
          type="primary"
          size="large"
          style="background: var(--bg-obsidian); border: none; border-radius: 12px;"
        )
          Icon(name="ph:plus" size="18" style="margin-right: 6px;")
          | New SLA

  .mt-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      el-empty(description="No SLAs yet. Click 'New SLA' to create one.")
</template>

<script setup lang="ts">
definePageMeta({ layout: 'main', middleware: 'auth' });
</script>
