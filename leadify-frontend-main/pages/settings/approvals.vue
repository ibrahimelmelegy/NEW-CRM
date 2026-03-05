<template lang="pug">
.approvals-page.p-6(v-loading="pageLoading")
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('approvals.approvalWorkflows') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('approvals.manageApprovals') }}
    el-button(type="primary" @click="showCreateRule = true" class="!bg-[#7849ff] !border-none")
      Icon(name="ph:plus" size="16")
      span.ml-1 {{ $t('approvals.createRule') }}

  //- Stats
  .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
    .glass-card.p-4.rounded-2xl(v-for="stat in statCards" :key="stat.label")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
          Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")
        div
          p.text-xl.font-bold(style="color: var(--text-primary)") {{ stat.value }}
          p.text-xs(style="color: var(--text-muted)") {{ stat.label }}

  //- Tabs
  el-tabs(v-model="activeTab")
    //- Pending Approvals
    el-tab-pane(name="pending")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:clock" size="16")
          span {{ $t('approvals.pending') }}
          el-badge(:value="pendingApprovals.length" :hidden="!pendingApprovals.length" type="warning")
      .space-y-3.mt-4
        .glass-card.p-5.rounded-xl(v-for="approval in pendingApprovals" :key="approval.id")
          .flex.items-start.justify-between
            .flex.items-start.gap-4
              .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: getTypeColor(approval.type) + '20' }")
                Icon(:name="getTypeIcon(approval.type)" size="22" :style="{ color: getTypeColor(approval.type) }")
              div
                h4.text-sm.font-bold(style="color: var(--text-primary)") {{ approval.title }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ approval.description }}
                .flex.items-center.gap-3.mt-2
                  .flex.items-center.gap-1
                    Icon(name="ph:user" size="12" style="color: var(--text-muted)")
                    span.text-xs(style="color: var(--text-muted)") Requested by {{ approval.requester }}
                  .flex.items-center.gap-1
                    Icon(name="ph:clock" size="12" style="color: var(--text-muted)")
                    span.text-xs(style="color: var(--text-muted)") {{ formatDate(approval.createdAt) }}
                  el-tag(v-if="approval.amount" size="small" effect="plain" round) ${{ Number(approval.amount).toLocaleString() }}

                //- Approval Chain
                .flex.items-center.gap-2.mt-3
                  template(v-for="(step, i) in approval.steps" :key="i")
                    .flex.items-center.gap-1
                      .w-6.h-6.rounded-full.flex.items-center.justify-center.text-xs(
                        :style="{ background: step.status === 'approved' ? '#10b98120' : step.status === 'rejected' ? '#ef444420' : step.status === 'current' ? '#7849ff20' : 'var(--glass-border)', color: step.status === 'approved' ? '#10b981' : step.status === 'rejected' ? '#ef4444' : step.status === 'current' ? '#7849ff' : 'var(--text-muted)' }"
                      )
                        Icon(v-if="step.status === 'approved'" name="ph:check" size="12")
                        Icon(v-else-if="step.status === 'rejected'" name="ph:x" size="12")
                        span(v-else) {{ i + 1 }}
                      span.text-xs(:style="{ color: step.status === 'current' ? '#7849ff' : 'var(--text-muted)' }") {{ step.approver }}
                    Icon(v-if="i < approval.steps.length - 1" name="ph:arrow-right" size="12" style="color: var(--text-muted)")

            .flex.gap-2
              el-button(type="danger" plain size="small" @click="rejectApproval(approval)")
                Icon(name="ph:x" size="14")
                span.ml-1 {{ $t('common.reject') }}
              el-button(type="success" size="small" @click="approveItem(approval)")
                Icon(name="ph:check" size="14")
                span.ml-1 {{ $t('approvals.approve') }}

        .text-center.py-12(v-if="!pendingApprovals.length")
          Icon(name="ph:check-circle" size="48" style="color: var(--text-muted)")
          p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('approvals.noPendingApprovals') }}
          p.mt-1(style="color: var(--text-muted)") {{ $t('approvals.allCaughtUp') }}

    //- Approval Rules
    el-tab-pane(name="rules")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:gear" size="16")
          span {{ $t('approvals.rules') }}
      .space-y-3.mt-4
        .glass-card.p-5.rounded-xl(v-for="rule in approvalRules" :key="rule.id")
          .flex.items-start.justify-between
            .flex.items-start.gap-4
              .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: getTypeColor(rule.entityType) + '20' }")
                Icon(:name="getTypeIcon(rule.entityType)" size="18" :style="{ color: getTypeColor(rule.entityType) }")
              div
                .flex.items-center.gap-2
                  h4.text-sm.font-bold(style="color: var(--text-primary)") {{ rule.name }}
                  el-tag(:type="rule.active ? 'success' : 'info'" size="small" round) {{ rule.active ? 'Active' : 'Inactive' }}
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ rule.description }}
                .flex.items-center.gap-3.mt-2
                  el-tag(size="small" effect="plain") {{ rule.entityType }}
                  span.text-xs(style="color: var(--text-muted)") Condition: {{ rule.condition }}
                  span.text-xs(style="color: var(--text-muted)") {{ rule.approvers.length }} approver(s)
            .flex.gap-2
              el-switch(v-model="rule.active" @change="toggleRule(rule)")
              el-button(text size="small" @click="deleteRule(rule)")
                Icon(name="ph:trash" size="16" style="color: #ef4444")

        .text-center.py-12(v-if="!approvalRules.length")
          Icon(name="ph:gear" size="48" style="color: var(--text-muted)")
          p.mt-3.font-medium(style="color: var(--text-primary)") {{ $t('approvals.noApprovalRules') }}
          p.mt-1(style="color: var(--text-muted)") {{ $t('approvals.createRulesToAutomate') }}

    //- History
    el-tab-pane(name="history")
      template(#label)
        .flex.items-center.gap-2
          Icon(name="ph:clock-counter-clockwise" size="16")
          span {{ $t('approvals.history') }}
      .mt-4
        el-table(:data="approvalHistory" stripe)
          el-table-column(:label="$t('approvals.request')" min-width="200")
            template(#default="{ row }")
              div
                p.font-medium {{ row.title }}
                p.text-xs(style="color: var(--text-muted)") {{ row.type }}
          el-table-column(:label="$t('approvals.requester')" width="150")
            template(#default="{ row }")
              span {{ row.requester }}
          el-table-column(:label="$t('approvals.decision')" width="130" align="center")
            template(#default="{ row }")
              el-tag(:type="row.decision === 'approved' ? 'success' : 'danger'" size="small" round effect="dark") {{ row.decision }}
          el-table-column(:label="$t('approvals.decidedBy')" width="150")
            template(#default="{ row }")
              span {{ row.decidedBy }}
          el-table-column(:label="$t('common.date')" width="140")
            template(#default="{ row }")
              span {{ formatDate(row.decidedAt) }}

  //- Create Rule Dialog
  el-dialog(v-model="showCreateRule" :title="$t('approvals.createApprovalRule')" width="600px")
    el-form(label-position="top")
      el-form-item(:label="$t('approvals.ruleName')")
        el-input(v-model="newRule.name" placeholder="e.g., Discount Approval > 20%")
      el-form-item(:label="$t('approvals.entityType')")
        el-select(v-model="newRule.entityType" style="width: 100%")
          el-option(value="deal" :label="$t('common.deal')")
          el-option(value="invoice" :label="$t('payments.invoice')")
          el-option(value="purchase_order" :label="$t('approvals.purchaseOrder')")
          el-option(value="expense" :label="$t('approvals.expense')")
          el-option(value="time_off" :label="$t('approvals.timeOffRequest')")
      el-form-item(:label="$t('approvals.condition')")
        el-input(v-model="newRule.condition" placeholder="e.g., discount > 20% OR amount > $10,000")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="newRule.description" type="textarea" :rows="2" :placeholder="$t('approvals.conditionPlaceholder')")
      el-form-item(:label="$t('approvals.approversInOrder')")
        .space-y-2
          .flex.items-center.gap-2(v-for="(approver, i) in newRule.approvers" :key="i")
            el-tag(effect="dark" round) Step {{ i + 1 }}
            el-input(v-model="newRule.approvers[i]" :placeholder="$t('approvals.approverPlaceholder')" class="flex-1")
            el-button(text @click="newRule.approvers.splice(i, 1)" :disabled="newRule.approvers.length <= 1")
              Icon(name="ph:x-circle" size="16" style="color: #ef4444")
          el-button(size="small" @click="newRule.approvers.push('')" style="border-style: dashed")
            Icon(name="ph:plus" size="14" class="mr-1")
            span {{ $t('approvals.addApprover') }}
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showCreateRule = false") {{ $t('common.cancel') }}
        el-button(type="primary" @click="createRule" :disabled="!newRule.name" class="!bg-[#7849ff] !border-none") {{ $t('approvals.createRule') }}
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({ middleware: 'permissions' });

const activeTab = ref('pending');
const showCreateRule = ref(false);
const pageLoading = ref(false);

// Data
const pendingApprovals = ref<Record<string, unknown>[]>([
  {
    id: '1',
    type: 'deal',
    title: 'Deal Discount: 25% off for Acme Corp',
    description: 'Sales rep requested 25% discount on annual subscription',
    requester: 'John Smith',
    amount: 15000,
    createdAt: new Date().toISOString(),
    steps: [
      { approver: 'Team Lead', status: 'approved' },
      { approver: 'Sales Manager', status: 'current' },
      { approver: 'VP Sales', status: 'pending' }
    ]
  },
  {
    id: '2',
    type: 'purchase_order',
    title: 'Server Equipment Purchase',
    description: 'New servers for production environment upgrade',
    requester: 'IT Department',
    amount: 45000,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    steps: [
      { approver: 'IT Manager', status: 'approved' },
      { approver: 'CFO', status: 'current' }
    ]
  }
]);

const approvalRules = ref<Record<string, unknown>[]>([
  {
    id: '1',
    name: 'High-Value Deal Discount',
    entityType: 'deal',
    condition: 'Discount > 15%',
    description: 'Requires approval when deal discount exceeds 15%',
    active: true,
    approvers: ['Team Lead', 'Sales Manager']
  },
  {
    id: '2',
    name: 'Large Purchase Order',
    entityType: 'purchase_order',
    condition: 'Amount > $10,000',
    description: 'POs over $10,000 require CFO approval',
    active: true,
    approvers: ['Department Head', 'CFO']
  }
]);

const approvalHistory = ref<Record<string, unknown>[]>([
  {
    id: '1',
    title: 'Q4 Marketing Budget',
    type: 'expense',
    requester: 'Marketing Team',
    decision: 'approved',
    decidedBy: 'CFO',
    decidedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: '2',
    title: '30% Discount for Beta Client',
    type: 'deal',
    requester: 'Jane Doe',
    decision: 'rejected',
    decidedBy: 'VP Sales',
    decidedAt: new Date(Date.now() - 259200000).toISOString()
  }
]);

const newRule = ref({
  name: '',
  entityType: 'deal',
  condition: '',
  description: '',
  approvers: ['']
});

const statCards = computed(() => [
  { label: 'Pending', value: pendingApprovals.value.length, icon: 'ph:clock-bold', color: '#f59e0b' },
  {
    label: 'Approved (This Month)',
    value: approvalHistory.value.filter(h => h.decision === 'approved').length,
    icon: 'ph:check-circle-bold',
    color: '#10b981'
  },
  { label: 'Rejected', value: approvalHistory.value.filter(h => h.decision === 'rejected').length, icon: 'ph:x-circle-bold', color: '#ef4444' },
  { label: 'Active Rules', value: approvalRules.value.filter(r => r.active).length, icon: 'ph:gear-bold', color: '#7849ff' }
]);

function getTypeIcon(type: string): string {
  return (
    { deal: 'ph:handshake', invoice: 'ph:receipt', purchase_order: 'ph:shopping-cart', expense: 'ph:money', time_off: 'ph:calendar' }[type] ||
    'ph:file'
  );
}

function getTypeColor(type: string): string {
  return { deal: '#7849ff', invoice: '#10b981', purchase_order: '#3b82f6', expense: '#f59e0b', time_off: '#a855f7' }[type] || '#7849ff';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function approveItem(approval: unknown) {
  pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== approval.id);
  approvalHistory.value.unshift({
    id: approval.id,
    title: approval.title,
    type: approval.type,
    requester: approval.requester,
    decision: 'approved',
    decidedBy: 'You',
    decidedAt: new Date().toISOString()
  });
  ElNotification({ type: 'success', title: 'Approved', message: `"${approval.title}" has been approved` });
}

async function rejectApproval(approval: unknown) {
  try {
    await ElMessageBox.confirm(t('approvals.confirmReject'), t('approvals.rejectApproval'), { type: 'warning' });
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== approval.id);
    approvalHistory.value.unshift({
      id: approval.id,
      title: approval.title,
      type: approval.type,
      requester: approval.requester,
      decision: 'rejected',
      decidedBy: 'You',
      decidedAt: new Date().toISOString()
    });
    ElNotification({ type: 'info', title: 'Rejected', message: `"${approval.title}" has been rejected` });
  } catch {
    /* cancelled */
  }
}

function toggleRule(rule: unknown) {
  ElNotification({ type: 'success', title: 'Updated', message: `Rule "${rule.name}" ${rule.active ? 'activated' : 'deactivated'}` });
}

async function deleteRule(rule: unknown) {
  try {
    await ElMessageBox.confirm(`Delete rule "${rule.name}"?`, 'Delete', { type: 'warning' });
    approvalRules.value = approvalRules.value.filter(r => r.id !== rule.id);
    ElNotification({ type: 'success', title: 'Deleted', message: 'Rule removed' });
  } catch {
    /* cancelled */
  }
}

function createRule() {
  if (!newRule.value.name) return;
  approvalRules.value.push({
    id: String(Date.now()),
    name: newRule.value.name,
    entityType: newRule.value.entityType,
    condition: newRule.value.condition,
    description: newRule.value.description,
    active: true,
    approvers: newRule.value.approvers.filter(a => a.trim())
  });
  showCreateRule.value = false;
  newRule.value = { name: '', entityType: 'deal', condition: '', description: '', approvers: [''] };
  ElNotification({ type: 'success', title: 'Created', message: 'Approval rule created' });
}
</script>

<style scoped>
.approvals-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
