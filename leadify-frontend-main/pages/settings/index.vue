<template lang="pug">
.settings-hub.p-6
  //- Header
  .mb-8
    h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") Settings
    p.text-sm.mt-1(style="color: var(--text-muted);") Manage your CRM configuration, integrations, and preferences.

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
          h3.text-lg.font-bold(style="color: var(--text-primary);") {{ item.title }}
        p.text-sm.leading-relaxed(style="color: var(--text-muted);") {{ item.desc }}

  //- System Section
  .mt-10
    h2.text-xl.font-bold.mb-4(style="color: var(--text-primary);") System & Security
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
            h3.text-lg.font-bold(style="color: var(--text-primary);") {{ item.title }}
          p.text-sm.leading-relaxed(style="color: var(--text-muted);") {{ item.desc }}
</template>

<script setup lang="ts">
definePageMeta({});

const settingsItems = [
  { title: 'Pipeline', desc: 'Configure sales pipeline stages and deal workflows.', icon: 'ph:funnel', color: '#7c3aed', url: '/settings/pipeline' },
  {
    title: 'Custom Fields',
    desc: 'Add and manage custom fields for leads, deals, and contacts.',
    icon: 'ph:textbox',
    color: '#2563eb',
    url: '/settings/custom-fields'
  },
  {
    title: 'Lead Scoring',
    desc: 'Define scoring rules to prioritize your best leads.',
    icon: 'ph:star',
    color: '#f59e0b',
    url: '/settings/lead-scoring'
  },
  {
    title: 'Approvals',
    desc: 'Set up multi-step approval chains for business processes.',
    icon: 'ph:check-circle',
    color: '#22c55e',
    url: '/settings/approvals'
  },
  {
    title: 'Workflows',
    desc: 'Automate actions with custom workflow rules and triggers.',
    icon: 'ph:git-branch',
    color: '#8b5cf6',
    url: '/settings/workflows'
  },
  {
    title: 'Territories',
    desc: 'Define and assign sales territories for your team.',
    icon: 'ph:map-pin',
    color: '#06b6d4',
    url: '/settings/territories'
  },
  {
    title: 'Currencies',
    desc: 'Manage supported currencies and exchange rates.',
    icon: 'ph:currency-circle-dollar',
    color: '#10b981',
    url: '/settings/currencies'
  },
  {
    title: 'Tax Rules',
    desc: 'Configure tax rates and rules for invoices and orders.',
    icon: 'ph:percent',
    color: '#ef4444',
    url: '/settings/tax-rules'
  },
  { title: 'Products', desc: 'Manage your product catalog and pricing.', icon: 'ph:package', color: '#ea580c', url: '/settings/products' },
  {
    title: 'Document Templates',
    desc: 'Create and manage templates for proposals, invoices, and contracts.',
    icon: 'ph:file-text',
    color: '#6366f1',
    url: '/settings/document-templates'
  },
  {
    title: 'Email Templates',
    desc: 'Design reusable email templates for outreach and notifications.',
    icon: 'ph:envelope-simple',
    color: '#ec4899',
    url: '/settings/email-templates'
  },
  {
    title: 'Email Accounts',
    desc: 'Connect and manage email accounts for sending and receiving.',
    icon: 'ph:at',
    color: '#0891b2',
    url: '/settings/email-accounts'
  },
  {
    title: 'Notifications',
    desc: 'Configure notification preferences and channels.',
    icon: 'ph:bell',
    color: '#f97316',
    url: '/settings/notifications'
  },
  {
    title: 'Integrations',
    desc: 'Connect third-party apps and services to your CRM.',
    icon: 'ph:plug',
    color: '#7c3aed',
    url: '/settings/integrations'
  },
  {
    title: 'Webhooks',
    desc: 'Set up webhooks to push real-time data to external systems.',
    icon: 'ph:webhooks-logo',
    color: '#64748b',
    url: '/settings/webhooks'
  }
];

const systemItems = [
  {
    title: 'Organization',
    desc: 'View your tenant plan, usage limits, and organization details.',
    icon: 'ph:buildings',
    color: '#7c3aed',
    url: '/settings/tenant'
  },
  {
    title: 'Security',
    desc: 'Manage roles, permissions, and access controls.',
    icon: 'ph:shield-check',
    color: '#ef4444',
    url: '/settings/security'
  },
  {
    title: 'Audit Logs',
    desc: 'Review all system activity and user actions.',
    icon: 'ph:clipboard-text',
    color: '#6b7280',
    url: '/settings/audit-logs'
  },
  {
    title: 'Data Import',
    desc: 'Import leads, contacts, and deals from CSV or Excel.',
    icon: 'ph:upload-simple',
    color: '#2563eb',
    url: '/settings/data-import'
  },
  {
    title: 'Data Governance',
    desc: 'Manage data retention, GDPR compliance, and cleanup rules.',
    icon: 'ph:database',
    color: '#0d9488',
    url: '/settings/data-governance'
  },
  {
    title: 'Duplicate Detection',
    desc: 'Configure rules to detect and merge duplicate records.',
    icon: 'ph:copy',
    color: '#d97706',
    url: '/settings/duplicates'
  },
  { title: 'SLA', desc: 'Define service level agreements and response time targets.', icon: 'ph:timer', color: '#7c3aed', url: '/settings/sla' },
  {
    title: 'Assignment Rules',
    desc: 'Automate lead and deal assignment based on criteria.',
    icon: 'ph:arrows-split',
    color: '#059669',
    url: '/settings/assignment-rules'
  },
  {
    title: 'Portal Users',
    desc: 'Manage customer portal access and permissions.',
    icon: 'ph:users',
    color: '#8b5cf6',
    url: '/settings/portal-users'
  },
  {
    title: 'White Label',
    desc: 'Customize branding, logos, and colors for your organization.',
    icon: 'ph:paint-brush',
    color: '#ec4899',
    url: '/settings/white-label'
  },
  {
    title: 'Theme Studio',
    desc: 'Customize the look and feel of your CRM interface.',
    icon: 'ph:palette',
    color: '#7c3aed',
    url: '/settings/theme-studio'
  }
];
</script>
