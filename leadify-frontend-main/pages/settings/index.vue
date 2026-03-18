<template lang="pug">
.settings-hub.p-6
  //- Header
  .mb-8
    h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('settings.title') }}
    p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('settings.subtitle') }}

  //- Settings Categories
  .grid.grid-cols-3.gap-6
    NuxtLink.group(v-for="item in settingsItems" :key="item.url" :to="item.url")
      .p-6.rounded-2xl.border.transition-all.cursor-pointer(
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover:shadow-lg hover:border-[#7849ff]/40"
      )
        .flex.items-center.gap-4.mb-3
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(
            :style="{ backgroundColor: item.color + '15' }"
          )
            Icon(:name="item.icon" size="24" :style="{ color: item.color }")
          h3.text-lg.font-bold(style="color: var(--text-primary);") {{ $t(item.titleKey) }}
        p.text-sm.leading-relaxed(style="color: var(--text-muted);") {{ $t(item.descKey) }}

  //- System Section
  .mt-10
    h2.text-xl.font-bold.mb-4(style="color: var(--text-primary);") {{ $t('settings.systemAndSecurity') }}
    .grid.grid-cols-3.gap-6
      NuxtLink.group(v-for="item in systemItems" :key="item.url" :to="item.url")
        .p-6.rounded-2xl.border.transition-all.cursor-pointer(
          style="border-color: var(--border-default); background: var(--bg-elevated);"
          class="hover:shadow-lg hover:border-[#7849ff]/40"
        )
          .flex.items-center.gap-4.mb-3
            .w-12.h-12.rounded-xl.flex.items-center.justify-center(
              :style="{ backgroundColor: item.color + '15' }"
            )
              Icon(:name="item.icon" size="24" :style="{ color: item.color }")
            h3.text-lg.font-bold(style="color: var(--text-primary);") {{ $t(item.titleKey) }}
          p.text-sm.leading-relaxed(style="color: var(--text-muted);") {{ $t(item.descKey) }}
</template>

<script setup lang="ts">
definePageMeta({});

const settingsItems = [
  { titleKey: 'settings.cards.pipeline.title', descKey: 'settings.cards.pipeline.desc', icon: 'ph:funnel', color: '#7c3aed', url: '/settings/pipeline' },
  { titleKey: 'settings.cards.customFields.title', descKey: 'settings.cards.customFields.desc', icon: 'ph:textbox', color: '#2563eb', url: '/settings/custom-fields' },
  { titleKey: 'settings.cards.leadScoring.title', descKey: 'settings.cards.leadScoring.desc', icon: 'ph:star', color: '#f59e0b', url: '/settings/lead-scoring' },
  { titleKey: 'settings.cards.approvals.title', descKey: 'settings.cards.approvals.desc', icon: 'ph:check-circle', color: '#22c55e', url: '/settings/approvals' },
  { titleKey: 'settings.cards.workflows.title', descKey: 'settings.cards.workflows.desc', icon: 'ph:git-branch', color: '#8b5cf6', url: '/settings/workflows' },
  { titleKey: 'settings.cards.territories.title', descKey: 'settings.cards.territories.desc', icon: 'ph:map-pin', color: '#06b6d4', url: '/settings/territories' },
  { titleKey: 'settings.cards.currencies.title', descKey: 'settings.cards.currencies.desc', icon: 'ph:currency-circle-dollar', color: '#10b981', url: '/settings/currencies' },
  { titleKey: 'settings.cards.taxRules.title', descKey: 'settings.cards.taxRules.desc', icon: 'ph:percent', color: '#ef4444', url: '/settings/tax-rules' },
  { titleKey: 'settings.cards.products.title', descKey: 'settings.cards.products.desc', icon: 'ph:package', color: '#ea580c', url: '/settings/products' },
  { titleKey: 'settings.cards.documentTemplates.title', descKey: 'settings.cards.documentTemplates.desc', icon: 'ph:file-text', color: '#6366f1', url: '/settings/document-templates' },
  { titleKey: 'settings.cards.emailTemplates.title', descKey: 'settings.cards.emailTemplates.desc', icon: 'ph:envelope-simple', color: '#ec4899', url: '/settings/email-templates' },
  { titleKey: 'settings.cards.emailAccounts.title', descKey: 'settings.cards.emailAccounts.desc', icon: 'ph:at', color: '#0891b2', url: '/settings/email-accounts' },
  { titleKey: 'settings.cards.notifications.title', descKey: 'settings.cards.notifications.desc', icon: 'ph:bell', color: '#f97316', url: '/settings/notifications' },
  { titleKey: 'settings.cards.integrations.title', descKey: 'settings.cards.integrations.desc', icon: 'ph:plug', color: '#7c3aed', url: '/settings/integrations' },
  { titleKey: 'settings.cards.webhooks.title', descKey: 'settings.cards.webhooks.desc', icon: 'ph:webhooks-logo', color: '#64748b', url: '/settings/webhooks' }
];

const systemItems = [
  { titleKey: 'settings.cards.organization.title', descKey: 'settings.cards.organization.desc', icon: 'ph:buildings', color: '#7c3aed', url: '/settings/tenant' },
  { titleKey: 'settings.cards.security.title', descKey: 'settings.cards.security.desc', icon: 'ph:shield-check', color: '#ef4444', url: '/settings/security' },
  { titleKey: 'settings.cards.auditLogs.title', descKey: 'settings.cards.auditLogs.desc', icon: 'ph:clipboard-text', color: '#6b7280', url: '/settings/audit-logs' },
  { titleKey: 'settings.cards.dataImport.title', descKey: 'settings.cards.dataImport.desc', icon: 'ph:upload-simple', color: '#2563eb', url: '/settings/data-import' },
  { titleKey: 'settings.cards.dataGovernance.title', descKey: 'settings.cards.dataGovernance.desc', icon: 'ph:database', color: '#0d9488', url: '/settings/data-governance' },
  { titleKey: 'settings.cards.duplicateDetection.title', descKey: 'settings.cards.duplicateDetection.desc', icon: 'ph:copy', color: '#d97706', url: '/settings/duplicates' },
  { titleKey: 'settings.cards.sla.title', descKey: 'settings.cards.sla.desc', icon: 'ph:timer', color: '#7c3aed', url: '/settings/sla' },
  { titleKey: 'settings.cards.assignmentRules.title', descKey: 'settings.cards.assignmentRules.desc', icon: 'ph:arrows-split', color: '#059669', url: '/settings/assignment-rules' },
  { titleKey: 'settings.cards.portalUsers.title', descKey: 'settings.cards.portalUsers.desc', icon: 'ph:users', color: '#8b5cf6', url: '/settings/portal-users' },
  { titleKey: 'settings.cards.whiteLabel.title', descKey: 'settings.cards.whiteLabel.desc', icon: 'ph:paint-brush', color: '#ec4899', url: '/settings/white-label' },
  { titleKey: 'settings.cards.themeStudio.title', descKey: 'settings.cards.themeStudio.desc', icon: 'ph:palette', color: '#7c3aed', url: '/settings/theme-studio' }
];
</script>
