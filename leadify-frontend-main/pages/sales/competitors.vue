<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-400">Competitor Intelligence</h1>
          <p class="text-slate-400 text-sm mt-1">Track competitors, analyze win/loss patterns, and benchmark your strengths.</p>
        </div>
        <div class="flex gap-2">
          <el-button class="!rounded-xl" @click="showComparisonMatrix = !showComparisonMatrix">
            <Icon name="ph:table-bold" class="w-4 h-4 mr-2" />
            Comparison Matrix
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showAddCompetitorDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            Track Competitor
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ competitors.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Tracked Competitors</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ winRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">Win Rate vs Competitors</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ lossCount }}</div>
        <div class="text-xs text-slate-500 mt-1">Deal Losses (QTD)</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ formatCurrency(lostRevenue) }}</div>
        <div class="text-xs text-slate-500 mt-1">Revenue Lost</div>
      </div>
    </div>

    <!-- Competitor Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="comp in competitors"
        :key="comp.id"
        class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer"
        :class="selectedCompetitorId === comp.id ? 'border border-red-500/30' : ''"
        @click="selectCompetitor(comp.id)"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold bg-slate-700/50 text-slate-300">
              {{ comp.name.charAt(0) }}
            </div>
            <div>
              <h4 class="text-sm font-medium text-slate-200">{{ comp.name }}</h4>
              <p class="text-xs text-slate-500">{{ comp.industry }}</p>
            </div>
          </div>
          <el-tag :type="getThreatType(comp.threatLevel)" effect="dark" size="small">
            {{ comp.threatLevel }}
          </el-tag>
        </div>

        <div class="flex items-center justify-between mb-3">
          <div class="text-center">
            <div class="text-sm font-bold text-slate-200">{{ comp.marketShare }}%</div>
            <div class="text-[10px] text-slate-500">Market Share</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-slate-200">{{ comp.dealsWon }}</div>
            <div class="text-[10px] text-slate-500">Deals Won</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-slate-200">{{ comp.dealsLost }}</div>
            <div class="text-[10px] text-slate-500">Deals Lost</div>
          </div>
        </div>

        <!-- Strengths -->
        <div class="mb-2">
          <span class="text-[10px] font-medium text-emerald-400">STRENGTHS</span>
          <div class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="s in comp.strengths"
              :key="s"
              class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              {{ s }}
            </span>
          </div>
        </div>

        <!-- Weaknesses -->
        <div>
          <span class="text-[10px] font-medium text-red-400">WEAKNESSES</span>
          <div class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="w in comp.weaknesses"
              :key="w"
              class="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
            >
              {{ w }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- SWOT Analysis Panel -->
    <div v-if="selectedCompetitor" class="glass-panel p-6 rounded-xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-slate-200">SWOT Analysis - {{ selectedCompetitor.name }}</h3>
        <el-button text type="danger" size="small" @click="selectedCompetitorId = null">
          <Icon name="ph:x-bold" class="w-4 h-4" />
        </el-button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Strengths -->
        <div class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="ph:arrow-up-right-bold" class="w-5 h-5 text-emerald-400" />
            <h4 class="text-sm font-bold text-emerald-400">Strengths</h4>
          </div>
          <ul class="space-y-2">
            <li v-for="s in selectedCompetitor.swot.strengths" :key="s" class="text-sm text-slate-300 flex items-start gap-2">
              <Icon name="ph:check-circle-bold" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              {{ s }}
            </li>
          </ul>
        </div>
        <!-- Weaknesses -->
        <div class="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="ph:arrow-down-right-bold" class="w-5 h-5 text-red-400" />
            <h4 class="text-sm font-bold text-red-400">Weaknesses</h4>
          </div>
          <ul class="space-y-2">
            <li v-for="w in selectedCompetitor.swot.weaknesses" :key="w" class="text-sm text-slate-300 flex items-start gap-2">
              <Icon name="ph:x-circle-bold" class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              {{ w }}
            </li>
          </ul>
        </div>
        <!-- Opportunities -->
        <div class="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="ph:lightbulb-bold" class="w-5 h-5 text-blue-400" />
            <h4 class="text-sm font-bold text-blue-400">Opportunities</h4>
          </div>
          <ul class="space-y-2">
            <li v-for="o in selectedCompetitor.swot.opportunities" :key="o" class="text-sm text-slate-300 flex items-start gap-2">
              <Icon name="ph:star-bold" class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              {{ o }}
            </li>
          </ul>
        </div>
        <!-- Threats -->
        <div class="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="ph:warning-bold" class="w-5 h-5 text-amber-400" />
            <h4 class="text-sm font-bold text-amber-400">Threats</h4>
          </div>
          <ul class="space-y-2">
            <li v-for="t in selectedCompetitor.swot.threats" :key="t" class="text-sm text-slate-300 flex items-start gap-2">
              <Icon name="ph:shield-warning-bold" class="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              {{ t }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Win/Loss Analysis -->
    <div class="glass-panel p-6 rounded-xl">
      <h3 class="text-lg font-medium text-slate-200 mb-4">Win/Loss Analysis</h3>
      <el-table :data="winLossRecords" class="glass-table" stripe>
        <el-table-column label="Deal Name" min-width="200">
          <template #default="{ row }">
            <div class="text-sm font-medium text-slate-200">{{ row.dealName }}</div>
            <div class="text-xs text-slate-500">{{ formatCurrency(row.dealValue) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Competitor" width="160">
          <template #default="{ row }">
            <span class="text-sm text-slate-300">{{ row.competitor }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Outcome" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.outcome === 'WON' ? 'success' : 'danger'" effect="dark" size="small">
              {{ row.outcome }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Reason" min-width="200">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ row.reason }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Date" width="120">
          <template #default="{ row }">
            <span class="text-sm text-slate-500">{{ row.date }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Comparison Matrix -->
    <div v-if="showComparisonMatrix" class="glass-panel p-6 rounded-xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-slate-200">Feature Comparison Matrix</h3>
        <el-button text type="danger" size="small" @click="showComparisonMatrix = false">
          <Icon name="ph:x-bold" class="w-4 h-4" />
        </el-button>
      </div>
      <el-table :data="comparisonFeatures" class="glass-table" stripe>
        <el-table-column label="Feature" min-width="180" fixed>
          <template #default="{ row }">
            <span class="text-sm font-medium text-slate-200">{{ row.feature }}</span>
          </template>
        </el-table-column>
        <el-table-column label="HPT (Us)" width="130" align="center">
          <template #default="{ row }">
            <Icon v-if="row.ours" name="ph:check-circle-fill" class="w-5 h-5 text-emerald-400" />
            <Icon v-else name="ph:x-circle-fill" class="w-5 h-5 text-slate-600" />
          </template>
        </el-table-column>
        <el-table-column v-for="comp in competitors" :key="comp.id" :label="comp.name" width="130" align="center">
          <template #default="{ row }">
            <Icon v-if="row.competitors[comp.id]" name="ph:check-circle-fill" class="w-5 h-5 text-red-400" />
            <Icon v-else name="ph:x-circle-fill" class="w-5 h-5 text-slate-600" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add Competitor Dialog -->
    <el-dialog v-model="showAddCompetitorDialog" title="Track New Competitor" width="500px">
      <el-form label-position="top">
        <el-form-item label="Company Name">
          <el-input v-model="newCompetitor.name" placeholder="e.g., SalesForce Arabia" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Industry">
            <el-input v-model="newCompetitor.industry" placeholder="e.g., CRM Software" />
          </el-form-item>
          <el-form-item label="Threat Level">
            <el-select v-model="newCompetitor.threatLevel" placeholder="Select level" class="w-full">
              <el-option label="HIGH" value="HIGH" />
              <el-option label="MEDIUM" value="MEDIUM" />
              <el-option label="LOW" value="LOW" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Market Share (%)">
          <el-input-number v-model="newCompetitor.marketShare" :min="0" :max="100" :step="0.5" class="!w-full" />
        </el-form-item>
        <el-form-item label="Strengths (comma-separated)">
          <el-input v-model="newCompetitor.strengthsInput" placeholder="e.g., Brand, Pricing, Support" />
        </el-form-item>
        <el-form-item label="Weaknesses (comma-separated)">
          <el-input v-model="newCompetitor.weaknessesInput" placeholder="e.g., Slow support, Limited integrations" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCompetitorDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addCompetitor">Track Competitor</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({ layout: 'default', middleware: 'permissions' });

const selectedCompetitorId = ref<number | null>(null);
const showComparisonMatrix = ref(false);
const showAddCompetitorDialog = ref(false);

const newCompetitor = ref({
  name: '',
  industry: '',
  threatLevel: 'MEDIUM',
  marketShare: 0,
  strengthsInput: '',
  weaknessesInput: ''
});

interface Competitor {
  id: number;
  name: string;
  industry: string;
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  marketShare: number;
  dealsWon: number;
  dealsLost: number;
  strengths: string[];
  weaknesses: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

const competitors = ref<Competitor[]>([
  {
    id: 1,
    name: 'CloudCRM Pro',
    industry: 'CRM Software',
    threatLevel: 'HIGH',
    marketShare: 28,
    dealsWon: 12,
    dealsLost: 8,
    strengths: ['Brand Recognition', 'AI Features', 'Integrations'],
    weaknesses: ['High Pricing', 'Complex Setup'],
    swot: {
      strengths: [
        'Strong brand awareness in MENA region',
        'Advanced AI-powered lead scoring',
        'Extensive third-party integrations marketplace',
        'Large sales team with enterprise experience'
      ],
      weaknesses: [
        'Premium pricing deters SMBs',
        'Complex onboarding process takes 3-6 months',
        'Limited Arabic language support',
        'No local data residency options'
      ],
      opportunities: [
        'They may struggle with Saudi data sovereignty requirements',
        'Their pricing creates openings in the SMB segment',
        'Their complex setup drives customers to simpler alternatives'
      ],
      threats: ['Aggressive marketing budget ($50M+)', 'Acquiring smaller competitors for features', 'Expanding MENA presence with local hires']
    }
  },
  {
    id: 2,
    name: 'SalesHub MENA',
    industry: 'Sales Automation',
    threatLevel: 'MEDIUM',
    marketShare: 15,
    dealsWon: 18,
    dealsLost: 5,
    strengths: ['Local Support', 'Arabic UI', 'Affordable'],
    weaknesses: ['Limited Features', 'Small Team'],
    swot: {
      strengths: [
        'Fully bilingual Arabic/English interface',
        'Local customer support team in Riyadh',
        'Competitive pricing for the region',
        'ZATCA compliance built-in'
      ],
      weaknesses: [
        'Limited reporting and analytics capabilities',
        'Small development team slows feature releases',
        'No mobile app available',
        'Basic automation compared to market leaders'
      ],
      opportunities: [
        'Their slow development cycle means we can outpace on features',
        'No enterprise-grade features to compete at scale',
        'Customer complaints about reliability'
      ],
      threats: [
        'Strong relationships with local government entities',
        'Backed by a regional investment fund',
        'Understands local market better than international competitors'
      ]
    }
  },
  {
    id: 3,
    name: 'PipelineForce',
    industry: 'CRM Software',
    threatLevel: 'HIGH',
    marketShare: 22,
    dealsWon: 9,
    dealsLost: 14,
    strengths: ['Market Leader', 'Enterprise Ready', 'Global Presence'],
    weaknesses: ['No Arabic', 'Poor Local Support', 'Expensive'],
    swot: {
      strengths: [
        'Global market leader with proven enterprise track record',
        'Comprehensive feature set covering all CRM needs',
        'Extensive partner and consultant ecosystem',
        'Strong security certifications and compliance'
      ],
      weaknesses: [
        'No Arabic language interface or RTL support',
        'Support response times slow for MENA region',
        'Pricing significantly above regional competitors',
        'Forced data storage outside MENA'
      ],
      opportunities: [
        'Their lack of Arabic support is a major gap we can exploit',
        'Enterprise customers frustrated with high costs',
        'No ZATCA or Saudi-specific compliance features'
      ],
      threats: [
        'Massive R&D investment ($2B+ annually)',
        'May acquire a local CRM to enter the market',
        'Strong incumbent position at multinational companies'
      ]
    }
  },
  {
    id: 4,
    name: 'QuickSales',
    industry: 'Sales Tools',
    threatLevel: 'LOW',
    marketShare: 8,
    dealsWon: 22,
    dealsLost: 3,
    strengths: ['Easy to Use', 'Free Tier'],
    weaknesses: ['Basic CRM', 'No Customization', 'Startup'],
    swot: {
      strengths: ['Very intuitive user interface with minimal learning curve', 'Generous free tier attracts startups', 'Fast onboarding under 1 day'],
      weaknesses: [
        'Very basic CRM functionality',
        'No enterprise features or customization',
        'Startup with uncertain funding runway',
        'No API or integration capabilities'
      ],
      opportunities: [
        'Customers outgrow their platform and need to migrate',
        'No enterprise credibility limits their upmarket movement',
        'Limited funding may lead to shutdown or acquisition'
      ],
      threats: [
        'Disrupting at the entry level of the market',
        'Growing user base creates network effects',
        'Could be acquired by a larger competitor'
      ]
    }
  }
]);

const winLossRecords = ref([
  {
    dealName: 'TechCorp ERP Integration',
    dealValue: 450000,
    competitor: 'CloudCRM Pro',
    outcome: 'WON',
    reason: 'Better Arabic support and local data residency',
    date: 'Feb 15, 2026'
  },
  {
    dealName: 'Gulf Retail CRM Migration',
    dealValue: 320000,
    competitor: 'PipelineForce',
    outcome: 'LOST',
    reason: 'Competitor had existing enterprise relationship',
    date: 'Feb 10, 2026'
  },
  {
    dealName: 'StartupHub Sales Platform',
    dealValue: 85000,
    competitor: 'QuickSales',
    outcome: 'WON',
    reason: 'Superior automation and reporting features',
    date: 'Feb 8, 2026'
  },
  {
    dealName: 'National Bank CRM',
    dealValue: 1200000,
    competitor: 'PipelineForce',
    outcome: 'LOST',
    reason: 'Compliance certifications required SOC2 Type II',
    date: 'Jan 28, 2026'
  },
  {
    dealName: 'Petromin Sales Automation',
    dealValue: 680000,
    competitor: 'CloudCRM Pro',
    outcome: 'WON',
    reason: 'ZATCA compliance and competitive pricing',
    date: 'Jan 22, 2026'
  },
  {
    dealName: 'Al-Marai Distribution CRM',
    dealValue: 520000,
    competitor: 'SalesHub MENA',
    outcome: 'WON',
    reason: 'Superior reporting and mobile capabilities',
    date: 'Jan 15, 2026'
  },
  {
    dealName: 'Jarir Bookstore POS + CRM',
    dealValue: 390000,
    competitor: 'CloudCRM Pro',
    outcome: 'LOST',
    reason: 'Competitor offered bundled POS integration',
    date: 'Jan 10, 2026'
  },
  {
    dealName: 'STC Telecom Sales Tools',
    dealValue: 950000,
    competitor: 'PipelineForce',
    outcome: 'LOST',
    reason: 'Global contract with competitor already in place',
    date: 'Jan 5, 2026'
  }
]);

const comparisonFeatures = ref([
  { feature: 'Arabic / RTL Support', ours: true, competitors: { 1: false, 2: true, 3: false, 4: false } },
  { feature: 'AI Lead Scoring', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'ZATCA Compliance', ours: true, competitors: { 1: false, 2: true, 3: false, 4: false } },
  { feature: 'Pipeline Management', ours: true, competitors: { 1: true, 2: true, 3: true, 4: true } },
  { feature: 'Email Campaigns', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'Custom Reports', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'Mobile App', ours: true, competitors: { 1: true, 2: false, 3: true, 4: true } },
  { feature: 'API / Webhooks', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'Local Data Residency', ours: true, competitors: { 1: false, 2: true, 3: false, 4: false } },
  { feature: 'Social CRM', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'Workflow Automation', ours: true, competitors: { 1: true, 2: false, 3: true, 4: false } },
  { feature: 'Free Tier', ours: false, competitors: { 1: false, 2: false, 3: false, 4: true } }
]);

const selectedCompetitor = computed(() => {
  if (selectedCompetitorId.value === null) return null;
  return competitors.value.find(c => c.id === selectedCompetitorId.value) || null;
});

const winRate = computed(() => {
  const total = winLossRecords.value.length;
  if (!total) return 0;
  const wins = winLossRecords.value.filter(r => r.outcome === 'WON').length;
  return Math.round((wins / total) * 100);
});

const lossCount = computed(() => winLossRecords.value.filter(r => r.outcome === 'LOST').length);

const lostRevenue = computed(() => winLossRecords.value.filter(r => r.outcome === 'LOST').reduce((s, r) => s + r.dealValue, 0));

const formatCurrency = (val: number) => {
  if (!val) return '0 SAR';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const getThreatType = (level: string): 'danger' | 'warning' | 'success' | undefined => {
  const map: Record<string, 'danger' | 'warning' | 'success' | undefined> = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'success'
  };
  return map[level];
};

const selectCompetitor = (id: number) => {
  selectedCompetitorId.value = selectedCompetitorId.value === id ? null : id;
};

const addCompetitor = () => {
  if (!newCompetitor.value.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  const strengths = newCompetitor.value.strengthsInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const weaknesses = newCompetitor.value.weaknessesInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  competitors.value.push({
    id: Date.now(),
    name: newCompetitor.value.name,
    industry: newCompetitor.value.industry,
    threatLevel: newCompetitor.value.threatLevel as 'HIGH' | 'MEDIUM' | 'LOW',
    marketShare: newCompetitor.value.marketShare,
    dealsWon: 0,
    dealsLost: 0,
    strengths,
    weaknesses,
    swot: {
      strengths: strengths.map(s => `Competitor has strength in ${s}`),
      weaknesses: weaknesses.map(w => `Competitor weakness: ${w}`),
      opportunities: ['Newly tracked - analysis pending'],
      threats: ['Newly tracked - analysis pending']
    }
  });
  ElMessage.success(`Now tracking ${newCompetitor.value.name}`);
  showAddCompetitorDialog.value = false;
  newCompetitor.value = { name: '', industry: '', threatLevel: 'MEDIUM', marketShare: 0, strengthsInput: '', weaknessesInput: '' };
};
</script>
