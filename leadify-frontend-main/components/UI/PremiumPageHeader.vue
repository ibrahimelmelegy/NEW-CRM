<template lang="pug">
.premium-page-header.mb-8.w-full
  .flex.flex-col.md_flex-row.items-start.md_items-center.justify-between.gap-4
    .flex.items-center.gap-4
      .icon-container.w-12.h-12.rounded-xl.flex.items-center.justify-center.shadow-sm(
        :style="{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`, border: `1px solid ${primaryColor}30`, color: primaryColor }"
      )
        Icon(:name="icon" size="24")
      .content
        h1.text-3xl.font-extrabold.tracking-tight(style="color: var(--text-primary)") {{ title }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ description }}
    
    .actions.flex.items-center.gap-3
      slot(name="actions")
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'ph:squares-four-bold' },
  primaryColor: { type: String, default: '#7849ff' }
})
</script>

<style scoped>
.premium-page-header {
  animation: slideDown 0.4s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
