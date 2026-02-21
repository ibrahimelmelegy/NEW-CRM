<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">
            Sales Commissions
          </h1>
          <p class="text-slate-400 text-sm mt-1">Track commission plans, calculate payouts, and monitor sales incentives.</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="selectedPeriod" class="w-36">
            <el-option label="Feb 2026" value="2026-02" />
            <el-option label="Jan 2026" value="2026-01" />
            <el-option label="Q1 2026" value="Q1-2026" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="showPlanDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            New Plan
          </el-button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ formatCurrency(totalCommissions) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Commissions</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ formatCurrency(paidOut) }}</div>
        <div class="text-xs text-slate-500 mt-1">Paid Out</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ formatCurrency(pending) }}</div>
        <div class="text-xs text-slate-500 mt-1">Pending</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ activePlans }}</div>
        <div class="text-xs text-slate-500 mt-1">Active Plans</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">Avg Rate</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Commission Overview -->
      <el-tab-pane label="Overview" name="overview">
        <el-table :data="commissionEntries" class="glass-table" stripe show-summary :summary-method="getSummary">
          <el-table-column label="Sales Rep" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <el-avatar :size="32" class="bg-slate-700">{{ row.rep.charAt(0) }}</el-avatar>
                <div>
                  <div class="text-sm font-medium text-slate-200">{{ row.rep }}</div>
                  <div class="text-xs text-slate-500">{{ row.plan }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Deals Closed" width="120" align="center">
            <template #default="{ row }">
              <span class="text-sm font-medium text-slate-200">{{ row.dealsClosed }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Revenue" width="150" align="right">
            <template #default="{ row }">
              <span class="text-sm text-slate-200">{{ formatCurrency(row.revenue) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Rate" width="80" align="center">
            <template #default="{ row }">
              <span class="text-sm text-indigo-400">{{ row.rate }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="Commission" width="150" align="right">
            <template #default="{ row }">
              <span class="text-sm font-bold text-emerald-400">{{ formatCurrency(row.commission) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Bonus" width="120" align="right">
            <template #default="{ row }">
              <span class="text-sm text-amber-400">{{ row.bonus ? formatCurrency(row.bonus) : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Total" width="150" align="right">
            <template #default="{ row }">
              <span class="text-sm font-bold text-slate-100">{{ formatCurrency(row.commission + (row.bonus || 0)) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PAID' ? 'success' : row.status === 'APPROVED' ? 'warning' : 'info'" effect="dark" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Commission Plans -->
      <el-tab-pane label="Plans" name="plans">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="plan in commissionPlans" :key="plan.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ plan.name }}</h4>
                <p class="text-xs text-slate-500 mt-0.5">{{ plan.description }}</p>
              </div>
              <el-tag :type="plan.isActive ? 'success' : 'info'" effect="dark" size="small">{{ plan.isActive ? 'Active' : 'Inactive' }}</el-tag>
            </div>

            <!-- Tiers -->
            <div class="space-y-2 my-3">
              <div v-for="(tier, idx) in plan.tiers" :key="idx" class="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    :class="idx === 0 ? 'bg-blue-500/20 text-blue-400' : idx === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'">
                    T{{ idx + 1 }}
                  </div>
                  <span class="text-xs text-slate-300">{{ tier.label }}</span>
                </div>
                <span class="text-xs font-bold text-emerald-400">{{ tier.rate }}%</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
              <span>{{ plan.assignedReps }} reps assigned</span>
              <span>{{ plan.type }}</span>
            </div>

            <div class="flex gap-2 mt-3">
              <el-button size="small" text type="primary" @click="editPlan(plan)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" /> Edit
              </el-button>
              <el-button size="small" text @click="duplicatePlan(plan)">
                <Icon name="ph:copy" class="w-4 h-4 mr-1" /> Clone
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Leaderboard -->
      <el-tab-pane label="Leaderboard" name="leaderboard">
        <div class="space-y-3">
          <div v-for="(rep, idx) in leaderboard" :key="rep.name"
            class="glass-panel p-4 rounded-xl flex items-center gap-4"
            :class="idx < 3 ? 'border border-amber-500/20' : ''"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
              :class="idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-slate-400/20 text-slate-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-slate-800/40 text-slate-500'">
              {{ idx + 1 }}
            </div>
            <el-avatar :size="40" class="bg-slate-700">{{ rep.name.charAt(0) }}</el-avatar>
            <div class="flex-1">
              <div class="text-sm font-medium text-slate-200">{{ rep.name }}</div>
              <div class="text-xs text-slate-500">{{ rep.deals }} deals - {{ formatCurrency(rep.revenue) }} revenue</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-emerald-400">{{ formatCurrency(rep.totalEarnings) }}</div>
              <div class="text-[10px] text-slate-500">Total Earnings</div>
            </div>
            <div class="w-32">
              <el-progress :percentage="Math.round(rep.quotaAttainment)" :stroke-width="6"
                :color="rep.quotaAttainment >= 100 ? '#10B981' : rep.quotaAttainment >= 75 ? '#F59E0B' : '#EF4444'" />
              <div class="text-[10px] text-slate-500 text-center mt-0.5">{{ rep.quotaAttainment }}% quota</div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Payout History -->
      <el-tab-pane label="Payouts" name="payouts">
        <el-table :data="payouts" class="glass-table" stripe>
          <el-table-column prop="payoutId" label="Payout ID" width="120" />
          <el-table-column label="Period" width="140">
            <template #default="{ row }">
              <span class="text-sm text-slate-200">{{ row.period }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Reps" width="100" align="center">
            <template #default="{ row }">
              <span class="text-sm text-slate-200">{{ row.repCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Total Amount" width="150" align="right">
            <template #default="{ row }">
              <span class="text-sm font-bold text-emerald-400">{{ formatCurrency(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'COMPLETED' ? 'success' : row.status === 'PROCESSING' ? 'warning' : 'info'" effect="dark" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Date" width="120">
            <template #default="{ row }">
              <span class="text-sm text-slate-400">{{ row.date }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="100" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewPayout(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- New Plan Dialog -->
    <el-dialog v-model="showPlanDialog" title="Create Commission Plan" width="560px">
      <el-form label-position="top">
        <el-form-item label="Plan Name">
          <el-input v-model="newPlan.name" placeholder="e.g., Enterprise Sales Plan" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newPlan.description" type="textarea" :rows="2" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Plan Type">
            <el-select v-model="newPlan.type" class="w-full">
              <el-option label="Percentage of Revenue" value="REVENUE_PCT" />
              <el-option label="Fixed per Deal" value="FIXED_PER_DEAL" />
              <el-option label="Tiered" value="TIERED" />
              <el-option label="Quota-based" value="QUOTA" />
            </el-select>
          </el-form-item>
          <el-form-item label="Base Rate (%)">
            <el-input-number v-model="newPlan.baseRate" :min="0" :max="100" :step="0.5" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item label="Commission Tiers">
          <div class="space-y-2 w-full">
            <div v-for="(tier, idx) in newPlan.tiers" :key="idx" class="flex gap-2 items-center">
              <el-input v-model="tier.label" placeholder="Tier label" class="flex-1" />
              <el-input-number v-model="tier.minValue" :min="0" placeholder="Min" class="!w-32" />
              <el-input-number v-model="tier.rate" :min="0" :max="50" :step="0.5" class="!w-24" />
              <span class="text-xs text-slate-500">%</span>
              <el-button text type="danger" @click="newPlan.tiers.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newPlan.tiers.push({ label: '', minValue: 0, rate: 0 })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" /> Add Tier
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPlanDialog = false">Cancel</el-button>
        <el-button type="primary" @click="savePlan">Save Plan</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const activeTab = ref('overview');
const selectedPeriod = ref('2026-02');
const showPlanDialog = ref(false);
const newPlan = ref({ name: '', description: '', type: 'REVENUE_PCT', baseRate: 5, tiers: [{ label: 'Base', minValue: 0, rate: 5 }] });

const commissionEntries = ref([
  { rep: 'Ahmed Al-Farsi', plan: 'Enterprise Plan', dealsClosed: 8, revenue: 450000, rate: 7, commission: 31500, bonus: 5000, status: 'PAID' },
  { rep: 'Sara Mohammed', plan: 'Enterprise Plan', dealsClosed: 12, revenue: 620000, rate: 8, commission: 49600, bonus: 10000, status: 'APPROVED' },
  { rep: 'Omar Hassan', plan: 'Standard Plan', dealsClosed: 6, revenue: 180000, rate: 5, commission: 9000, bonus: 0, status: 'PENDING' },
  { rep: 'Fatima Ali', plan: 'SMB Plan', dealsClosed: 15, revenue: 95000, rate: 4, commission: 3800, bonus: 2000, status: 'PAID' },
  { rep: 'Khalid Ibrahim', plan: 'Enterprise Plan', dealsClosed: 5, revenue: 320000, rate: 7, commission: 22400, bonus: 3000, status: 'APPROVED' },
  { rep: 'Noura Salem', plan: 'Standard Plan', dealsClosed: 9, revenue: 210000, rate: 5, commission: 10500, bonus: 0, status: 'PENDING' }
]);

const commissionPlans = ref([
  { id: 1, name: 'Enterprise Sales Plan', description: 'For enterprise account executives closing deals > 100K SAR', isActive: true, type: 'Tiered', assignedReps: 3,
    tiers: [{ label: 'Base (0-200K)', rate: 5 }, { label: 'Mid (200K-500K)', rate: 7 }, { label: 'Accelerator (500K+)', rate: 10 }] },
  { id: 2, name: 'Standard Sales Plan', description: 'Standard commission for mid-market sales reps', isActive: true, type: 'Revenue %', assignedReps: 4,
    tiers: [{ label: 'All Revenue', rate: 5 }] },
  { id: 3, name: 'SMB Plan', description: 'High volume SMB sales with lower rate', isActive: true, type: 'Revenue %', assignedReps: 3,
    tiers: [{ label: 'Base', rate: 3 }, { label: 'Bonus (>20 deals)', rate: 4 }] },
  { id: 4, name: 'Partner Referral Plan', description: 'Commission for partner-sourced deals', isActive: false, type: 'Fixed per Deal', assignedReps: 0,
    tiers: [{ label: 'Per Referral', rate: 2 }] }
]);

const leaderboard = computed(() =>
  [...commissionEntries.value]
    .map(e => ({ name: e.rep, deals: e.dealsClosed, revenue: e.revenue, totalEarnings: e.commission + (e.bonus || 0), quotaAttainment: Math.round(e.revenue / 300000 * 100) }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
);

const payouts = ref([
  { payoutId: 'PAY-001', period: 'January 2026', repCount: 6, amount: 98500, status: 'COMPLETED', date: 'Feb 5, 2026' },
  { payoutId: 'PAY-002', period: 'February 2026', repCount: 6, amount: 126800, status: 'PROCESSING', date: 'Mar 5, 2026' },
  { payoutId: 'PAY-003', period: 'December 2025', repCount: 5, amount: 85200, status: 'COMPLETED', date: 'Jan 5, 2026' }
]);

const totalCommissions = computed(() => commissionEntries.value.reduce((s, e) => s + e.commission + (e.bonus || 0), 0));
const paidOut = computed(() => commissionEntries.value.filter(e => e.status === 'PAID').reduce((s, e) => s + e.commission + (e.bonus || 0), 0));
const pending = computed(() => commissionEntries.value.filter(e => e.status !== 'PAID').reduce((s, e) => s + e.commission + (e.bonus || 0), 0));
const activePlans = computed(() => commissionPlans.value.filter(p => p.isActive).length);
const avgRate = computed(() => {
  if (!commissionEntries.value.length) return 0;
  return (commissionEntries.value.reduce((s, e) => s + e.rate, 0) / commissionEntries.value.length).toFixed(1);
});

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const getSummary = ({ columns, data }: any) => {
  const sums: string[] = [];
  columns.forEach((_: any, idx: number) => {
    if (idx === 0) { sums[idx] = 'Total'; return; }
    if (idx === 2) { sums[idx] = String(data.reduce((s: number, r: any) => s + r.dealsClosed, 0)); return; }
    if (idx === 3) { sums[idx] = formatCurrency(data.reduce((s: number, r: any) => s + r.revenue, 0)); return; }
    if (idx === 5) { sums[idx] = formatCurrency(data.reduce((s: number, r: any) => s + r.commission, 0)); return; }
    if (idx === 7) { sums[idx] = formatCurrency(data.reduce((s: number, r: any) => s + r.commission + (r.bonus || 0), 0)); return; }
    sums[idx] = '';
  });
  return sums;
};

const editPlan = (p: any) => ElMessage.info(`Editing: ${p.name}`);
const duplicatePlan = (p: any) => ElMessage.info(`Cloning: ${p.name}`);
const viewPayout = (p: any) => ElMessage.info(`Viewing: ${p.payoutId}`);
const savePlan = () => {
  if (!newPlan.value.name) { ElMessage.warning('Plan name required'); return; }
  ElMessage.success('Commission plan created');
  showPlanDialog.value = false;
};
</script>
