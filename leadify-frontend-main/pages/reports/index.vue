<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📊 Reports Hub
      p.text-sm.mt-1(style="color: var(--text-muted);") Comprehensive analytics and reports across your CRM.

  //- Quick Stats Row
  .grid.grid-cols-6.gap-4.mb-8
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Documents
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ docStats.totalDocs }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Revenue
      p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ docStats.totalValue.toLocaleString() }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Pending
      p.text-2xl.font-black.mt-1(style="color: #f59e0b;") {{ docStats.pendingValue.toLocaleString() }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Reminders
      p.text-2xl.font-black.mt-1(style="color: #7c3aed;") {{ remStats.pending }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Overdue
      p.text-2xl.font-black.mt-1(style="color: #ef4444;") {{ remStats.overdue }}
    .relative.overflow-hidden.p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Archived
      p.text-2xl.font-black.mt-1(style="color: var(--text-muted);") {{ archiveStats.total }}

  //- Two Column: Document Breakdown + Status Breakdown
  .grid.grid-cols-2.gap-6.mb-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold 📋 Documents by Type
      .space-y-3
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(count, type) in docStats.byType"
          :key="type"
        )
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ backgroundColor: typeColors[type as string] || '#6b7280' }")
            span.text-sm.font-semibold {{ typeLabels[type as string] || type }}
          .flex.items-center.gap-3
            span.text-sm.font-mono.font-bold {{ count }}
            .h-2.w-20.rounded-full.bg-gray-100
              .h-2.rounded-full(:style="{ width: `${Math.min(100, ((count as number) / docStats.totalDocs) * 100)}%`, backgroundColor: typeColors[type as string] || '#6b7280' }")
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.byType).length === 0" style="color: var(--text-muted);") No data

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold 📈 Documents by Status
      .space-y-3
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(count, status) in docStats.byStatus"
          :key="status"
        )
          .flex.items-center.gap-3
            .w-3.h-3.rounded-full(:style="{ backgroundColor: statusColors[status as string] || '#6b7280' }")
            span.text-sm.font-semibold {{ status }}
          span.text-sm.font-mono.font-bold {{ count }}
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.byStatus).length === 0" style="color: var(--text-muted);") No data

  //- Monthly Revenue + Activity
  .grid.grid-cols-2.gap-6.mb-8
    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold 💰 Monthly Revenue
      .space-y-2
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="(revenue, month) in docStats.monthlyRevenue"
          :key="month"
        )
          span.text-sm.font-semibold.font-mono {{ month }}
          span.text-sm.font-bold(style="color: #22c55e;") {{ (revenue as number).toLocaleString() }} SAR
        .text-center.py-6.text-sm(v-if="Object.keys(docStats.monthlyRevenue).length === 0" style="color: var(--text-muted);") No revenue data

    el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
      template(#header)
        span.font-bold 🕐 Recent Activity
      .space-y-1
        .flex.items-center.gap-3.px-3.py-2(v-for="act in recentActivities.slice(0, 10)" :key="act.id")
          .w-7.h-7.rounded-lg.flex.items-center.justify-center.flex-shrink-0(:style="{ backgroundColor: (actionColors[act.action] || '#6b7280') + '15' }")
            Icon(:name="actionIcons[act.action] || 'ph:circle'" size="14" :style="{ color: actionColors[act.action] || '#6b7280' }")
          .flex-1.min-w-0
            p.text-xs.font-semibold.truncate(style="color: var(--text-primary);") {{ act.description }}
            p.text-xs.font-mono(style="color: var(--text-muted); opacity: 0.6;") {{ timeAgo(act.timestamp) }}
        .text-center.py-6.text-sm(v-if="recentActivities.length === 0" style="color: var(--text-muted);") No activity logged

  //- Report Cards
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    template(#header)
      span.font-bold 📑 Quick Navigation
    .grid.grid-cols-4.gap-4
      NuxtLink(v-for="report in quickLinks" :key="report.title" :to="report.url")
        .p-5.rounded-xl.border.text-center.transition-all.cursor-pointer(
          style="border-color: var(--border-default);"
          class="hover:shadow-md hover:border-violet-300"
        )
          .text-2xl.mb-2 {{ report.icon }}
          p.text-sm.font-bold(style="color: var(--text-primary);") {{ report.title }}
          p.text-xs.mt-1(style="color: var(--text-muted);") {{ report.desc }}
</template>

<script setup lang="ts">
import { useDocumentStore } from '~/composables/useDocumentStore';
import { useReminders } from '~/composables/useReminders';
import { useDocumentArchive } from '~/composables/useDocumentArchive';
import { useActivityLog } from '~/composables/useActivityLog';

definePageMeta({ layout: 'main', middleware: 'auth' });

const { stats: docStats } = useDocumentStore();
const { stats: remStats } = useReminders();
const { stats: archiveStats } = useDocumentArchive();
const { recent: recentActivities, actionIcons, actionColors } = useActivityLog();

const typeLabels: Record<string, string> = {
  invoice: 'Invoice', proforma_invoice: 'Proforma Invoice', purchase_order: 'Purchase Order',
  credit_note: 'Credit Note', quote: 'Quotation', rfq: 'RFQ', sales_order: 'Sales Order',
  delivery_note: 'Delivery Note', contract: 'Contract', proposal: 'Proposal', sla: 'SLA',
};
const typeColors: Record<string, string> = {
  invoice: '#7c3aed', proforma_invoice: '#6d28d9', purchase_order: '#2563eb',
  credit_note: '#dc2626', quote: '#059669', rfq: '#d97706', sales_order: '#0891b2',
  delivery_note: '#ea580c', contract: '#4f46e5', proposal: '#7c3aed', sla: '#0d9488',
};
const statusColors: Record<string, string> = {
  Draft: '#6b7280', Sent: '#3b82f6', Approved: '#22c55e', Rejected: '#ef4444', Archived: '#f59e0b',
};
const quickLinks = [
  { icon: '📊', title: 'Document Center', desc: 'All documents', url: '/documents/dashboard' },
  { icon: '📁', title: 'Archive', desc: 'Archived items', url: '/archive' },
  { icon: '⏰', title: 'Reminders', desc: 'Follow-ups', url: '/reminders' },
  { icon: '🔔', title: 'Notifications', desc: 'All alerts', url: '/notifications' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
</script>
