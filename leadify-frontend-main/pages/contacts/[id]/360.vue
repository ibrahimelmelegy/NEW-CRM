<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 👤 Customer 360°
      p.text-sm.mt-1(style="color: var(--text-muted);") Complete overview of this customer — documents, activity, reminders, and financials.

  //- Customer Info Card
  .grid.grid-cols-4.gap-6.mb-8
    .col-span-1
      el-card.rounded-2xl.h-full(shadow="never" style="border: 1px solid var(--border-default);")
        .text-center.py-4
          .w-20.h-20.rounded-full.mx-auto.flex.items-center.justify-center.text-3xl.font-black.text-white(
            style="background: linear-gradient(135deg, #7c3aed, #4f46e5);"
          ) {{ contactInitials }}
          h2.text-xl.font-black.mt-4(style="color: var(--text-primary);") {{ contact.name || 'Unknown Contact' }}
          p.text-sm(style="color: var(--text-muted);") {{ contact.company || '—' }}
          p.text-sm.mt-1(style="color: var(--text-muted);") {{ contact.email || '—' }}
          p.text-sm(style="color: var(--text-muted);") {{ contact.phone || '—' }}

    .col-span-3
      .grid.grid-cols-4.gap-4
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Documents
          p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ customerDocs.length }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Lifetime Value
          p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ lifetimeValue.toLocaleString() }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Open Reminders
          p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ customerReminders.length }}
        .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Activities
          p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ customerActivities.length }}

  //- Tabs
  .grid.grid-cols-3.gap-6
    //- Documents
    .col-span-2
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          span.font-bold 📄 Documents
        el-table(:data="customerDocs" size="small" empty-text="No documents for this customer")
          el-table-column(:label="$t('finance.reference')" width="120")
            template(#default="{ row }")
              span.font-mono.font-bold.text-xs {{ row.refNumber }}
          el-table-column(:label="$t('common.type')" width="140")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-2.h-2.rounded-full(:style="{ backgroundColor: typeColors[row.documentType] || '#6b7280' }")
                span.text-xs.font-semibold {{ row.documentType }}
          el-table-column(:label="$t('common.title')" min-width="180")
            template(#default="{ row }")
              span.text-sm.font-semibold {{ row.title }}
          el-table-column(:label="$t('common.total')" width="120" align="right")
            template(#default="{ row }")
              span.font-mono.font-bold.text-xs {{ row.total?.toLocaleString() }} {{ row.currency }}
          el-table-column(:label="$t('common.status')" width="100")
            template(#default="{ row }")
              el-tag(size="small" round effect="plain") {{ row.status }}

    //- Activity Timeline
    .col-span-1
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          span.font-bold 🕐 Activity
        ActivityTimeline(:entries="customerActivities")
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '~/composables/useDocumentStore';
import { useActivityLog } from '~/composables/useActivityLog';
import { useReminders } from '~/composables/useReminders';
import ActivityTimeline from '~/components/ActivityTimelineSimple.vue';

definePageMeta({});

const route = useRoute();
const contactId = computed(() => route.params.id as string);

const { documents } = useDocumentStore();
const { getByContact } = useActivityLog();
const { upcoming } = useReminders();

// Simulated contact data (would come from API in production)
const contact = computed(() => ({
  name: `Contact #${contactId.value}`,
  company: 'Example Corp',
  email: 'contact@example.com',
  phone: '+966 50 000 0000'
}));

const contactInitials = computed(() => {
  const name = contact.value.name || 'U';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const customerDocs = computed(() => documents.value.filter(d => d.clientName?.includes(contactId.value) || d.id === contactId.value));

const lifetimeValue = computed(() => customerDocs.value.reduce((sum, d) => sum + (d.total || 0), 0));

const customerActivities = computed(() => getByContact(contactId.value));

const customerReminders = computed(() => upcoming.value.filter(r => r.relatedTo?.id === contactId.value));

const typeColors: Record<string, string> = {
  invoice: '#7c3aed',
  proforma_invoice: '#6d28d9',
  purchase_order: '#2563eb',
  credit_note: '#dc2626',
  quote: '#059669',
  rfq: '#d97706',
  sales_order: '#0891b2',
  delivery_note: '#ea580c',
  contract: '#4f46e5',
  proposal: '#7c3aed',
  sla: '#0d9488'
};
</script>
