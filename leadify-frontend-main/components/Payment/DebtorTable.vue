<template lang="pug">
.p-0
  el-table(:data="debtors" v-loading="loading" style="width: 100%" :show-header="true")
    el-table-column(prop="clientName" label="Client" min-width="180")
      template(#default="{ row }")
        .flex.items-center.gap-3
          .w-9.h-9.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
            :style="{ background: getAvatarColor(row.clientName) + '20', color: getAvatarColor(row.clientName) }"
          ) {{ getInitials(row.clientName) }}
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.clientName }}
            p.text-xs(style="color: var(--text-muted)") {{ row.email || '-' }}
    el-table-column(prop="totalOwed" label="Total Owed" width="150" align="right")
      template(#default="{ row }")
        span.font-bold(style="color: #ef4444") {{ formatCurrency(row.totalOwed) }}
    el-table-column(prop="daysOverdue" label="Days Overdue" width="130" align="center")
      template(#default="{ row }")
        el-tag(
          size="small"
          :type="getDaysOverdueType(row.daysOverdue)"
          effect="light"
        ) {{ row.daysOverdue || 0 }} days
    el-table-column(prop="lastPayment" label="Last Payment" width="140")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ row.lastPayment ? formatDate(row.lastPayment) : 'Never' }}

  .p-4.text-center(v-if="!loading && (!debtors || debtors.length === 0)")
    .py-8
      Icon(name="ph:check-circle-bold" size="48" style="color: #22c55e; opacity: 0.5")
      p.text-sm.mt-3(style="color: var(--text-muted)") No outstanding debtors
</template>

<script setup lang="ts">
interface Debtor {
  id: string;
  clientName: string;
  email?: string;
  totalOwed: number;
  daysOverdue?: number;
  lastPayment?: string;
}

defineProps<{
  debtors: Debtor[];
  loading?: boolean;
}>();

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getDaysOverdueType(days: number | undefined): string {
  if (!days || days <= 30) return 'warning';
  if (days <= 60) return '';
  return 'danger';
}
</script>
