<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📊 Document Center
      p.text-sm.mt-1(style="color: var(--text-muted);") Central dashboard for all documents — analytics, recent activity, and quick actions.

  //- KPI Cards
  .grid.grid-cols-5.gap-4.mb-8
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .absolute.top-0.right-0.w-16.h-16.rounded-full.blur-2xl.opacity-20(style="background: #7c3aed;")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Documents
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.totalDocs }}
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .absolute.top-0.right-0.w-16.h-16.rounded-full.blur-2xl.opacity-20(style="background: #22c55e;")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Value
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.totalValue.toLocaleString() }}
      p.text-xs(class="mt-0.5" style="color: var(--text-muted);") SAR
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .absolute.top-0.right-0.w-16.h-16.rounded-full.blur-2xl.opacity-20(style="background: #f59e0b;")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Pending
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.pendingCount }}
      p.text-xs(class="mt-0.5" style="color: var(--text-muted);") {{ stats.pendingValue.toLocaleString() }} SAR
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .absolute.top-0.right-0.w-16.h-16.rounded-full.blur-2xl.opacity-20(style="background: #22c55e;")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Approved
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.approvedCount }}
    .relative.overflow-hidden.p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .absolute.top-0.right-0.w-16.h-16.rounded-full.blur-2xl.opacity-20(style="background: #ef4444;")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Document Types
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ Object.keys(stats.byType).length }}

  //- Two Column Layout
  .grid.grid-cols-3.gap-6.mb-8
    //- Document Type Breakdown
    .col-span-1
      el-card.rounded-2xl.h-full(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          span.font-bold 📋 Document Types
        .space-y-3
          .flex.items-center.justify-between.p-3.rounded-xl.transition-colors(
            v-for="(count, type) in stats.byType"
            :key="type"
            style="cursor: default;"
          )
            .flex.items-center.gap-3
              .w-3.h-3.rounded-full(:style="{ backgroundColor: typeColors[String(type)] || '#6b7280' }")
              span.text-sm.font-semibold {{ typeLabels[String(type)] || type }}
            .flex.items-center.gap-2
              span.text-sm.font-mono.font-bold {{ count }}
              .h-2.rounded-full.bg-gray-100(style="width: 60px;")
                .h-2.rounded-full.transition-all(:style="{ width: `${Math.min(100, (Number(count) / stats.totalDocs) * 100)}%`, backgroundColor: typeColors[String(type)] || '#6b7280' }")
          .text-center.py-8.text-sm(v-if="Object.keys(stats.byType).length === 0" style="color: var(--text-muted);") No documents yet

    //- Recent Documents
    .col-span-2
      el-card.rounded-2xl.h-full(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          .flex.items-center.justify-between
            span.font-bold 🕐 Recent Documents
            el-input(
              v-model="searchQuery"
              :placeholder="$t('common.search')"
              size="small"
              clearable
              style="width: 200px;"
            )
        el-table(
          :data="filteredDocuments.slice(0, 15)"
          style="width: 100%"
          empty-text="No documents found. Save a document from the builder to see it here!"
          size="small"
        )
          el-table-column(:label="$t('finance.reference')" width="140")
            template(#default="{ row }")
              span.font-mono.font-bold.text-xs {{ row.refNumber }}
          el-table-column(:label="$t('common.type')" width="150")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-2.h-2.rounded-full(:style="{ backgroundColor: typeColors[row.documentType] || '#6b7280' }")
                span.text-xs.font-semibold {{ typeLabels[row.documentType] || row.documentType }}
          el-table-column(:label="$t('docBuilder.documentTitle')" min-width="200")
            template(#default="{ row }")
              p.text-sm.font-bold.truncate {{ row.title }}
              p.text-xs.text-gray-400 {{ row.clientName }}
          el-table-column(:label="$t('common.total')" width="130" align="right")
            template(#default="{ row }")
              span.font-mono.font-bold.text-xs {{ row.total?.toLocaleString() }} {{ row.currency }}
          el-table-column(:label="$t('common.status')" width="100")
            template(#default="{ row }")
              el-tag(:type="tagType(row.status)" size="small" round effect="plain") {{ row.status }}
          el-table-column(:label="$t('docBuilder.links')" width="60" align="center")
            template(#default="{ row }")
              el-badge(v-if="row.linkedDocuments?.length" :value="row.linkedDocuments.length" type="primary")
              span.text-gray-300(v-else) —

  //- Quick Actions
  el-card.rounded-2xl.mb-6(shadow="never" style="border: 1px solid var(--border-default);")
    template(#header)
      span.font-bold ⚡ Quick Create
    .grid.grid-cols-6.gap-3
      NuxtLink(
        v-for="action in quickActions"
        :key="action.type"
        :to="action.url"
      )
        .p-4.rounded-xl.border.text-center.cursor-pointer.transition-all(
          style="border-color: var(--border-default);"
          class="hover:shadow-md hover:border-violet-300"
        )
          .text-2xl.mb-2 {{ action.icon }}
          p.text-xs.font-bold {{ action.label }}

  //- Conversion Map Visual
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    template(#header)
      span.font-bold 🔄 Conversion Paths
    .grid.grid-cols-4.gap-4
      .p-4.rounded-xl.bg-gray-50(v-for="(targets, source) in conversionPaths" :key="source")
        .flex.items-center.gap-2.mb-3
          .w-3.h-3.rounded-full(:style="{ backgroundColor: typeColors[String(source)] || '#6b7280' }")
          span.text-sm.font-bold {{ typeLabels[String(source)] || source }}
        .space-y-1
          .flex.items-center.gap-1(v-for="target in targets" :key="target")
            span.text-gray-400 →
            span.text-xs.font-semibold {{ typeLabels[target] || target }}
          span.text-xs.text-gray-400.italic(v-if="targets.length === 0") No conversions
</template>

<script setup lang="ts">
import { useDocumentStore } from '~/composables/useDocumentStore';
import { conversionPaths } from '~/composables/useDocumentConversion';

definePageMeta({});

const { filteredDocuments, stats, searchQuery } = useDocumentStore();

const typeLabels: Record<string, string> = {
  invoice: 'Invoice',
  proforma_invoice: 'Proforma Invoice',
  purchase_order: 'Purchase Order',
  credit_note: 'Credit Note',
  quote: 'Quotation',
  rfq: 'RFQ',
  sales_order: 'Sales Order',
  delivery_note: 'Delivery Note',
  contract: 'Contract',
  proposal: 'Proposal',
  sla: 'SLA'
};

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

const quickActions = [
  { type: 'invoice', label: 'Invoice', icon: '🧾', url: '/sales/invoices/create' },
  { type: 'quote', label: 'Quotation', icon: '💬', url: '/sales/quotes/create' },
  { type: 'purchase_order', label: 'Purchase Order', icon: '🛒', url: '/procurement/purchase-orders/create' },
  { type: 'proposal', label: 'Proposal', icon: '📊', url: '/sales/proposals/create' },
  { type: 'contract', label: 'Contract', icon: '📝', url: '/sales/contracts/create' },
  { type: 'sla', label: 'SLA', icon: '🛡️', url: '/operations/sla/create' }
];

function tagType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    Draft: 'info',
    Sent: '',
    Approved: 'success',
    Rejected: 'danger',
    Archived: 'warning'
  };
  return map[status] || 'info';
}
</script>
