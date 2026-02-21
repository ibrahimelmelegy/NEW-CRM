<template lang="pug">
.goals-page.p-6
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h2.text-2xl.font-bold(style="color: var(--text-primary)") Goals & Quotas
      p.text-sm(style="color: var(--text-muted)") Set targets and track performance for your sales team
    .flex.items-center.gap-3
      el-select(v-model="selectedPeriod" @change="loadGoals" class="w-40")
        el-option(value="monthly" label="Monthly")
        el-option(value="quarterly" label="Quarterly")
        el-option(value="yearly" label="Yearly")
      el-button(type="primary" @click="showCreateGoal = true" class="!bg-[#7849ff] !border-none")
        Icon(name="ph:plus" size="16")
        span.ml-1 New Goal

  //- Overall Progress
  .glass-card.p-6.rounded-2xl.mb-6
    .flex.items-center.justify-between.mb-4
      h3.text-sm.font-bold(style="color: var(--text-primary)")
        Icon(name="ph:target" size="16" class="mr-2" style="color: #7849ff")
        | Team Overview — {{ periodLabel }}
      .flex.items-center.gap-2
        span.text-xs(style="color: var(--text-muted)") Overall Progress
        span.text-lg.font-bold(:style="{ color: overallProgress >= 100 ? '#10b981' : overallProgress >= 70 ? '#f59e0b' : '#ef4444' }") {{ overallProgress }}%

    .grid.gap-6(class="md:grid-cols-3")
      .p-4.rounded-xl(v-for="summary in summaryCards" :key="summary.label" style="background: var(--bg-input); border: 1px solid var(--glass-border)")
        .flex.items-center.justify-between.mb-3
          .flex.items-center.gap-2
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: summary.color + '20' }")
              Icon(:name="summary.icon" size="16" :style="{ color: summary.color }")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ summary.label }}
          span.text-sm.font-bold(:style="{ color: summary.color }") {{ summary.percentage }}%
        .w-full.rounded-full.overflow-hidden(style="height: 8px; background: var(--glass-border)")
          .h-full.rounded-full.transition-all.duration-700(:style="{ width: Math.min(summary.percentage, 100) + '%', background: summary.color }")
        .flex.justify-between.mt-2
          span.text-xs(style="color: var(--text-muted)") {{ summary.current }}
          span.text-xs(style="color: var(--text-muted)") Target: {{ summary.target }}

  //- Tabs: Team vs Individual
  el-tabs(v-model="viewTab")
    el-tab-pane(label="Team Goals" name="team")
    el-tab-pane(label="Individual Goals" name="individual")

  //- Goals Grid
  .grid.gap-4.mt-4(class="md:grid-cols-2 xl:grid-cols-3")
    .glass-card.p-5.rounded-2xl(v-for="goal in filteredGoals" :key="goal.id")
      .flex.items-start.justify-between.mb-3
        .flex.items-center.gap-3
          .w-12.h-12.rounded-xl.flex.items-center.justify-center(:style="{ background: getGoalColor(goal) + '20' }")
            Icon(:name="getGoalIcon(goal.type)" size="22" :style="{ color: getGoalColor(goal) }")
          div
            h4.text-sm.font-bold(style="color: var(--text-primary)") {{ goal.name }}
            p.text-xs(style="color: var(--text-muted)") {{ goal.assignee || 'Team' }}
        el-dropdown(trigger="click")
          el-button(text size="small")
            Icon(name="ph:dots-three-vertical" size="16")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(@click="editGoal(goal)") Edit
              el-dropdown-item(divided @click="deleteGoal(goal)")
                span(style="color: #ef4444") Delete

      //- Progress Ring/Bar
      .mb-3
        .flex.justify-between.mb-1
          span.text-xs(style="color: var(--text-muted)") Progress
          span.text-sm.font-bold(:style="{ color: getGoalColor(goal) }") {{ goal.percentage }}%
        .w-full.rounded-full.overflow-hidden(style="height: 10px; background: var(--glass-border)")
          .h-full.rounded-full.transition-all.duration-700(:style="{ width: Math.min(goal.percentage, 100) + '%', background: getGoalColor(goal) }")

      //- Details
      .flex.items-center.justify-between.pt-3(style="border-top: 1px solid var(--glass-border)")
        div
          p.text-lg.font-bold(style="color: var(--text-primary)") {{ goal.current }}
          p.text-xs(style="color: var(--text-muted)") Achieved
        div.text-right
          p.text-lg.font-bold(style="color: var(--text-muted)") {{ goal.target }}
          p.text-xs(style="color: var(--text-muted)") Target
        div.text-right
          p.text-lg.font-bold(:style="{ color: goal.remaining > 0 ? '#f59e0b' : '#10b981' }") {{ goal.remaining > 0 ? goal.remaining : '0' }}
          p.text-xs(style="color: var(--text-muted)") Remaining

  //- Empty state
  .text-center.py-16(v-if="!filteredGoals.length")
    Icon(name="ph:target" size="48" style="color: var(--text-muted)")
    p.mt-3.font-medium(style="color: var(--text-primary)") No goals set
    p.mt-1(style="color: var(--text-muted)") Create goals to track your team's performance
    el-button.mt-4(type="primary" @click="showCreateGoal = true" class="!bg-[#7849ff] !border-none") Create First Goal

  //- Create Goal Dialog
  el-dialog(v-model="showCreateGoal" title="Create Goal" width="550px")
    el-form(label-position="top")
      el-form-item(label="Goal Name")
        el-input(v-model="newGoal.name" placeholder="e.g., Monthly Revenue Target")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="Goal Type")
          el-select(v-model="newGoal.type" style="width: 100%")
            el-option(value="revenue" label="Revenue")
            el-option(value="deals" label="Deals Closed")
            el-option(value="leads" label="New Leads")
            el-option(value="calls" label="Calls Made")
            el-option(value="meetings" label="Meetings Held")
            el-option(value="clients" label="New Clients")
        el-form-item(label="Period")
          el-select(v-model="newGoal.period" style="width: 100%")
            el-option(value="monthly" label="Monthly")
            el-option(value="quarterly" label="Quarterly")
            el-option(value="yearly" label="Yearly")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(label="Target Value")
          el-input-number(v-model="newGoal.target" :min="1" :controls="false" style="width: 100%" placeholder="Enter target")
        el-form-item(label="Assign To")
          el-select(v-model="newGoal.assignee" clearable placeholder="Team (default)" style="width: 100%")
            el-option(value="" label="Entire Team")
            el-option(v-for="user in teamMembers" :key="user.id" :value="user.name" :label="user.name")
      el-form-item(label="Description")
        el-input(v-model="newGoal.description" type="textarea" :rows="2" placeholder="Goal description...")
    template(#footer)
      .flex.justify-end.gap-2
        el-button(@click="showCreateGoal = false") Cancel
        el-button(type="primary" @click="createGoal" :disabled="!newGoal.name || !newGoal.target" class="!bg-[#7849ff] !border-none") Create Goal
</template>

<script setup lang="ts">
import { ElNotification, ElMessageBox } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const selectedPeriod = ref('monthly');
const viewTab = ref('team');
const showCreateGoal = ref(false);
const teamMembers = ref<any[]>([]);

interface Goal {
  id: string;
  name: string;
  type: string;
  period: string;
  target: string;
  current: string;
  percentage: number;
  remaining: number;
  assignee?: string;
  isTeam: boolean;
}

const goals = ref<Goal[]>([]);

const newGoal = ref({
  name: '',
  type: 'revenue',
  period: 'monthly',
  target: 0,
  assignee: '',
  description: ''
});

const periodLabel = computed(() => {
  const now = new Date();
  if (selectedPeriod.value === 'monthly') return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (selectedPeriod.value === 'quarterly') return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
  return String(now.getFullYear());
});

const overallProgress = computed(() => {
  if (!goals.value.length) return 0;
  return Math.round(goals.value.reduce((sum, g) => sum + g.percentage, 0) / goals.value.length);
});

const summaryCards = computed(() => [
  {
    label: 'Revenue',
    current:
      '$' +
      goals.value
        .filter(g => g.type === 'revenue')
        .reduce((s, g) => s + parseNum(g.current), 0)
        .toLocaleString(),
    target:
      '$' +
      goals.value
        .filter(g => g.type === 'revenue')
        .reduce((s, g) => s + parseNum(g.target), 0)
        .toLocaleString(),
    percentage: getTypePercentage('revenue'),
    icon: 'ph:currency-dollar-bold',
    color: '#10b981'
  },
  {
    label: 'Deals',
    current: String(goals.value.filter(g => g.type === 'deals').reduce((s, g) => s + parseNum(g.current), 0)),
    target: String(goals.value.filter(g => g.type === 'deals').reduce((s, g) => s + parseNum(g.target), 0)),
    percentage: getTypePercentage('deals'),
    icon: 'ph:handshake-bold',
    color: '#7849ff'
  },
  {
    label: 'Leads',
    current: String(goals.value.filter(g => g.type === 'leads').reduce((s, g) => s + parseNum(g.current), 0)),
    target: String(goals.value.filter(g => g.type === 'leads').reduce((s, g) => s + parseNum(g.target), 0)),
    percentage: getTypePercentage('leads'),
    icon: 'ph:user-plus-bold',
    color: '#3b82f6'
  }
]);

const filteredGoals = computed(() => {
  if (viewTab.value === 'team') return goals.value.filter(g => g.isTeam);
  return goals.value.filter(g => !g.isTeam);
});

function parseNum(val: string): number {
  return Number(String(val).replace(/[^0-9.-]/g, '')) || 0;
}

function getTypePercentage(type: string): number {
  const typeGoals = goals.value.filter(g => g.type === type);
  if (!typeGoals.length) return 0;
  return Math.round(typeGoals.reduce((s, g) => s + g.percentage, 0) / typeGoals.length);
}

function getGoalColor(goal: Goal): string {
  if (goal.percentage >= 100) return '#10b981';
  if (goal.percentage >= 70) return '#f59e0b';
  if (goal.percentage >= 40) return '#7849ff';
  return '#ef4444';
}

function getGoalIcon(type: string): string {
  return (
    {
      revenue: 'ph:currency-dollar',
      deals: 'ph:handshake',
      leads: 'ph:user-plus',
      calls: 'ph:phone',
      meetings: 'ph:video-camera',
      clients: 'ph:buildings'
    }[type] || 'ph:target'
  );
}

function editGoal(goal: Goal) {
  newGoal.value = {
    name: goal.name,
    type: goal.type,
    period: goal.period,
    target: parseNum(goal.target),
    assignee: goal.assignee || '',
    description: ''
  };
  showCreateGoal.value = true;
}

async function deleteGoal(goal: Goal) {
  try {
    await ElMessageBox.confirm(`Delete goal "${goal.name}"?`, 'Delete', { type: 'warning' });
    goals.value = goals.value.filter(g => g.id !== goal.id);
    ElNotification({ type: 'success', title: 'Deleted', message: 'Goal removed' });
  } catch {
    /* cancelled */
  }
}

function createGoal() {
  if (!newGoal.value.name || !newGoal.value.target) return;

  goals.value.push({
    id: String(Date.now()),
    name: newGoal.value.name,
    type: newGoal.value.type,
    period: newGoal.value.period,
    target: newGoal.value.type === 'revenue' ? '$' + newGoal.value.target.toLocaleString() : String(newGoal.value.target),
    current: newGoal.value.type === 'revenue' ? '$0' : '0',
    percentage: 0,
    remaining: newGoal.value.target,
    assignee: newGoal.value.assignee || undefined,
    isTeam: !newGoal.value.assignee
  });

  showCreateGoal.value = false;
  newGoal.value = { name: '', type: 'revenue', period: 'monthly', target: 0, assignee: '', description: '' };
  ElNotification({ type: 'success', title: 'Created', message: 'Goal created successfully' });
}

async function loadGoals() {
  try {
    // Load real data from deals for revenue goals
    const { body, success } = await useApiFetch('deal?status=WON&limit=500');
    const wonDeals = success && body ? (body as any).docs || [] : [];
    const totalRevenue = wonDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);

    // Load leads
    const { body: leadBody, success: leadOk } = await useApiFetch('lead?limit=1');
    const leadCount = leadOk && leadBody ? (leadBody as any).pagination?.totalItems || 0 : 0;

    // Build goals with real data
    goals.value = [
      {
        id: '1',
        name: 'Revenue Target',
        type: 'revenue',
        period: selectedPeriod.value,
        target: '$100,000',
        current: '$' + totalRevenue.toLocaleString(),
        percentage: Math.min(Math.round((totalRevenue / 100000) * 100), 150),
        remaining: Math.max(100000 - totalRevenue, 0),
        isTeam: true
      },
      {
        id: '2',
        name: 'Deals Closed',
        type: 'deals',
        period: selectedPeriod.value,
        target: '15',
        current: String(wonDeals.length),
        percentage: Math.min(Math.round((wonDeals.length / 15) * 100), 150),
        remaining: Math.max(15 - wonDeals.length, 0),
        isTeam: true
      },
      {
        id: '3',
        name: 'New Leads',
        type: 'leads',
        period: selectedPeriod.value,
        target: '50',
        current: String(leadCount),
        percentage: Math.min(Math.round((leadCount / 50) * 100), 150),
        remaining: Math.max(50 - leadCount, 0),
        isTeam: true
      }
    ];

    // Load team members
    const { body: usersBody, success: usersOk } = await useApiFetch('users?limit=20');
    if (usersOk && usersBody) {
      const users = (usersBody as any).docs || usersBody || [];
      teamMembers.value = users.map((u: any) => ({ id: u.id, name: u.name }));
    }
  } catch {
    /* silent */
  }
}

onMounted(() => {
  loadGoals();
});
</script>

<style scoped>
.goals-page {
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
