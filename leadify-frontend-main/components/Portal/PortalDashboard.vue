<template lang="pug">
.portal-enhanced-dashboard
  //- Welcome Header
  .mb-8
    h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.enhanced.welcome', { name: clientName }) }}
    p.text-sm(style="color: var(--text-muted)") {{ $t('portal.enhanced.subtitle') }}

  //- Stats Cards Row
  .grid.grid-cols-1.gap-4.mb-8(class="sm:grid-cols-2 lg:grid-cols-4")
    //- Open Invoices
    .glass-card.p-5.cursor-pointer.stat-card(@click="$emit('navigate', 'invoices')")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.12)")
          Icon(name="ph:receipt-bold" size="24" class="text-red-500" aria-label="Invoices")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.enhanced.openInvoices') }}
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ dashboard?.openInvoices?.count || 0 }}
          p.text-xs.font-semibold(v-if="dashboard?.openInvoices?.total" style="color: #ef4444") {{ formatCurrency(dashboard.openInvoices.total) }}

    //- Active Projects
    .glass-card.p-5.cursor-pointer.stat-card(@click="$emit('navigate', 'projects')")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.12)")
          Icon(name="ph:kanban-bold" size="24" class="text-[#7849ff]" aria-label="Projects")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.enhanced.activeProjects') }}
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ dashboard?.activeProjects?.count || 0 }}

    //- Pending Signatures
    .glass-card.p-5.cursor-pointer.stat-card(@click="$emit('navigate', 'signatures')")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(249, 115, 22, 0.12)")
          Icon(name="ph:pen-nib-bold" size="24" class="text-orange-500" aria-label="Signatures")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.enhanced.pendingSignatures') }}
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ dashboard?.pendingSignatures?.count || 0 }}

    //- Shared Documents
    .glass-card.p-5.cursor-pointer.stat-card(@click="$emit('navigate', 'documents')")
      .flex.items-center.gap-3
        .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.12)")
          Icon(name="ph:folder-open-bold" size="24" class="text-green-500" aria-label="Documents")
        div
          p.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('portal.enhanced.sharedDocuments') }}
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ dashboard?.sharedDocuments?.count || 0 }}

  .grid.grid-cols-1.gap-6(class="lg:grid-cols-2")
    //- Active Projects List
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        h3.font-bold(style="color: var(--text-primary)") {{ $t('portal.enhanced.projectsOverview') }}
        el-button(text size="small" @click="$emit('navigate', 'projects')")
          span(style="color: #7849ff") {{ $t('portal.enhanced.viewAll') }}
      .space-y-3(v-if="dashboard?.activeProjects?.items?.length")
        .project-preview-item(
          v-for="project in dashboard.activeProjects.items"
          :key="project.id"
        )
          .flex.items-center.justify-between.mb-2
            p.font-medium.text-sm(style="color: var(--text-primary)") {{ project.name }}
            el-tag(:type="projectStatusType(project.status)" size="small" effect="dark") {{ project.status }}
          .progress-mini-bar
            .progress-mini-fill(:style="{ width: project.progress + '%' }")
          .flex.items-center.justify-between.mt-1
            span.text-xs(style="color: var(--text-muted)") {{ project.progress }}% {{ $t('portal.enhanced.complete') }}
            span.text-xs(style="color: var(--text-muted)") {{ formatDate(project.endDate) }}
      .text-center.py-8(v-else)
        Icon(name="ph:kanban" size="40" style="color: var(--text-muted)" aria-label="No projects")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.enhanced.noProjects') }}

    //- Pending Signatures List
    .glass-card.p-6
      .flex.items-center.justify-between.mb-4
        h3.font-bold(style="color: var(--text-primary)") {{ $t('portal.enhanced.documentsToSign') }}
        el-button(text size="small" @click="$emit('navigate', 'signatures')")
          span(style="color: #7849ff") {{ $t('portal.enhanced.viewAll') }}
      .space-y-3(v-if="dashboard?.pendingSignatures?.items?.length")
        .flex.items-center.justify-between.p-3.rounded-xl(
          v-for="doc in dashboard.pendingSignatures.items"
          :key="doc.id"
          style="background: var(--bg-input)"
        )
          .flex.items-center.gap-3
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(249, 115, 22, 0.15)")
              Icon(name="ph:file-text-bold" size="16" class="text-orange-500" aria-label="Document")
            div
              p.font-medium.text-sm(style="color: var(--text-primary)") {{ doc.title }}
              p.text-xs(v-if="doc.deal" style="color: var(--text-muted)") {{ doc.deal.name }}
          el-button(type="warning" size="small" @click="$emit('sign', doc.id)")
            Icon(name="ph:pen-nib-bold" size="14" aria-label="Sign")
            span.ml-1 {{ $t('portal.enhanced.sign') }}
      .text-center.py-8(v-else)
        Icon(name="ph:pen-nib" size="40" style="color: var(--text-muted)" aria-label="No pending signatures")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('portal.enhanced.noPendingSignatures') }}

  //- Quick Actions
  .mt-8
    h3.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('portal.enhanced.quickActions') }}
    .grid.grid-cols-1.gap-3(class="sm:grid-cols-3")
      .glass-card.p-4.cursor-pointer.action-card(@click="$emit('navigate', 'invoices')")
        .flex.items-center.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(239, 68, 68, 0.12)")
            Icon(name="ph:receipt-bold" size="20" class="text-red-500" aria-label="View Invoices")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('portal.enhanced.viewInvoices') }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('portal.enhanced.viewInvoicesDesc') }}
      .glass-card.p-4.cursor-pointer.action-card(@click="$emit('navigate', 'projects')")
        .flex.items-center.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.12)")
            Icon(name="ph:kanban-bold" size="20" class="text-[#7849ff]" aria-label="View Projects")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('portal.enhanced.viewProjects') }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('portal.enhanced.viewProjectsDesc') }}
      .glass-card.p-4.cursor-pointer.action-card(@click="$emit('navigate', 'documents')")
        .flex.items-center.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.12)")
            Icon(name="ph:folder-open-bold" size="20" class="text-green-500" aria-label="View Documents")
          div
            p.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('portal.enhanced.viewDocuments') }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('portal.enhanced.viewDocumentsDesc') }}
</template>

<script setup lang="ts">
import type { PortalDashboardData } from '~/composables/usePortal';

defineProps<{
  dashboard: PortalDashboardData | null;
  clientName: string;
  loading?: boolean;
}>();

defineEmits<{
  (e: 'navigate', section: string): void;
  (e: 'sign', documentId: string): void;
}>();

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function projectStatusType(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    COMPLETE: '',
    ON_HOLD: 'warning',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
}
</script>

<style scoped>
.stat-card {
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.action-card {
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.project-preview-item {
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-input);
}

.progress-mini-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--border-default);
  overflow: hidden;
}

.progress-mini-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #7849ff, #5b2fd4);
  transition: width 0.6s ease;
}
</style>
