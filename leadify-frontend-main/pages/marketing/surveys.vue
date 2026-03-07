<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-400">{{ $t("surveys.title") }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t("surveys.subtitle") }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showCreateDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t("surveys.newSurvey") }}
        </el-button>
      </div>
    </div>

    <!-- NPS Score Overview -->
    <div class="grid grid-cols-12 gap-4">
      <!-- NPS Gauge -->
      <div class="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl text-center">
        <h3 class="text-sm font-medium text-slate-400 mb-2">{{ $t("surveys.netPromoterScore") }}</h3>
        <div class="relative inline-block">
          <svg width="160" height="100" viewBox="0 0 160 100">
            <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="#1e293b" stroke-width="12" stroke-linecap="round" />
            <path
              d="M 20 90 A 60 60 0 0 1 140 90"
              fill="none"
              :stroke="npsColor"
              stroke-width="12"
              stroke-linecap="round"
              :stroke-dasharray="`${npsScore * 1.88} 188`"
            />
          </svg>
          <div class="absolute inset-0 flex items-end justify-center pb-2">
            <span class="text-3xl font-bold" :class="npsScore >= 50 ? 'text-emerald-400' : npsScore >= 0 ? 'text-amber-400' : 'text-red-400'">
              {{ npsScore }}
            </span>
          </div>
        </div>
        <div class="flex justify-between text-[10px] text-slate-500 mt-2 px-4">
          <span>-100</span>
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <!-- NPS Breakdown -->
      <div class="col-span-12 md:col-span-4 glass-panel p-6 rounded-2xl">
        <h3 class="text-sm font-medium text-slate-400 mb-4">{{ $t("surveys.responseBreakdown") }}</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-emerald-400">{{ $t("surveys.promoters") }} (9-10)</span>
              <span class="text-slate-300">{{ npsData.promoters }}%</span>
            </div>
            <el-progress :percentage="npsData.promoters" :stroke-width="8" color="#10B981" :show-text="false" />
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-amber-400">{{ $t("surveys.passives") }} (7-8)</span>
              <span class="text-slate-300">{{ npsData.passives }}%</span>
            </div>
            <el-progress :percentage="npsData.passives" :stroke-width="8" color="#F59E0B" :show-text="false" />
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-red-400">{{ $t("surveys.detractors") }} (0-6)</span>
              <span class="text-slate-300">{{ npsData.detractors }}%</span>
            </div>
            <el-progress :percentage="npsData.detractors" :stroke-width="8" color="#EF4444" :show-text="false" />
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-500 text-center">{{ npsData.totalResponses }} {{ $t("surveys.totalResponsesLabel") }}</div>
      </div>

      <!-- Quick Stats -->
      <div class="col-span-12 md:col-span-4 grid grid-cols-2 gap-3">
        <div class="glass-panel p-4 rounded-xl text-center">
          <div class="text-2xl font-bold text-slate-200">{{ surveys.length }}</div>
          <div class="text-xs text-slate-500 mt-1">{{ $t("surveys.totalSurveys") }}</div>
        </div>
        <div class="glass-panel p-4 rounded-xl text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ surveys.filter(s => s.status === 'ACTIVE').length }}</div>
          <div class="text-xs text-slate-500 mt-1">{{ $t("surveys.active") }}</div>
        </div>
        <div class="glass-panel p-4 rounded-xl text-center">
          <div class="text-2xl font-bold text-blue-400">{{ totalResponses }}</div>
          <div class="text-xs text-slate-500 mt-1">{{ $t("surveys.totalResponses") }}</div>
        </div>
        <div class="glass-panel p-4 rounded-xl text-center">
          <div class="text-2xl font-bold text-amber-400">{{ avgResponseRate }}%</div>
          <div class="text-xs text-slate-500 mt-1">{{ $t("surveys.avgResponseRate") }}</div>
        </div>
      </div>
    </div>

    <!-- Surveys List -->
    <div class="space-y-4">
      <div v-for="survey in surveys" :key="survey.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getSurveyTypeBg(survey.type)">
              <Icon :name="getSurveyTypeIcon(survey.type)" class="w-5 h-5" :class="getSurveyTypeColor(survey.type)" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-slate-200">{{ survey.name }}</h4>
              <p class="text-xs text-slate-500">{{ survey.type }} - {{ survey.questionCount }} {{ $t("surveys.questions") }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <el-tag :type="survey.status === 'ACTIVE' ? 'success' : survey.status === 'COMPLETED' ? 'info' : 'warning'" effect="dark" size="small">
              {{ survey.status }}
            </el-tag>
          </div>
        </div>

        <!-- Response Stats -->
        <div class="grid grid-cols-4 gap-3 my-3 py-3 border-t border-b border-slate-800/60 text-center">
          <div>
            <div class="text-sm font-bold text-slate-200">{{ survey.sent }}</div>
            <div class="text-[10px] text-slate-500">{{ $t("surveys.sent") }}</div>
          </div>
          <div>
            <div class="text-sm font-bold text-blue-400">{{ survey.responses }}</div>
            <div class="text-[10px] text-slate-500">{{ $t("surveys.responses") }}</div>
          </div>
          <div>
            <div class="text-sm font-bold text-emerald-400">{{ survey.responseRate }}%</div>
            <div class="text-[10px] text-slate-500">{{ $t("surveys.responseRate") }}</div>
          </div>
          <div>
            <div
              class="text-sm font-bold"
              :class="survey.avgScore >= 4 ? 'text-emerald-400' : survey.avgScore >= 3 ? 'text-amber-400' : 'text-red-400'"
            >
              {{ survey.avgScore }}/5
            </div>
            <div class="text-[10px] text-slate-500">{{ $t("surveys.avgScore") }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <el-button size="small" text type="primary" @click="viewResults(survey)">
            <Icon name="ph:chart-bar" class="w-4 h-4 mr-1" />
            {{ $t("surveys.results") }}
          </el-button>
          <el-button size="small" text @click="editSurvey(survey)">
            <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
            {{ $t("common.edit") }}
          </el-button>
          <el-button size="small" text @click="shareSurvey(survey)">
            <Icon name="ph:share-network" class="w-4 h-4 mr-1" />
            {{ $t("surveys.share") }}
          </el-button>
          <el-button v-if="survey.status === 'ACTIVE'" size="small" text type="danger" @click="closeSurvey(survey)">
            <Icon name="ph:stop-circle" class="w-4 h-4 mr-1" />
            {{ $t("surveys.close") }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Recent Feedback -->
    <div class="glass-panel p-6 rounded-2xl">
      <h3 class="text-sm font-medium text-slate-300 mb-4">{{ $t("surveys.recentFeedback") }}</h3>
      <div class="space-y-3">
        <div v-for="fb in recentFeedback" :key="fb.id" class="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
          <el-avatar :size="32" class="bg-slate-700 flex-shrink-0">{{ fb.name.charAt(0) }}</el-avatar>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-slate-200">{{ fb.name }}</span>
              <el-rate :model-value="fb.rating" disabled :max="5" size="small" />
              <span class="text-xs text-slate-500">{{ fb.date }}</span>
            </div>
            <p class="text-sm text-slate-400">{{ fb.comment }}</p>
            <div class="flex items-center gap-2 mt-1">
              <el-tag
                :type="fb.sentiment === 'positive' ? 'success' : fb.sentiment === 'negative' ? 'danger' : 'warning'"
                effect="dark"
                size="small"
                class="!text-[10px]"
              >
                {{ fb.sentiment }}
              </el-tag>
              <span class="text-[10px] text-slate-500">via {{ fb.source }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Survey Dialog -->
    <el-dialog v-model="showCreateDialog" :title="$t('surveys.createSurveyDialog')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('surveys.surveyName')">
          <el-input v-model="newSurvey.name" placeholder="e.g., Customer Satisfaction Q1 2026" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('surveys.type')">
            <el-select v-model="newSurvey.type" class="w-full">
              <el-option :label="$t('surveys.npsSurvey')" value="NPS" />
              <el-option :label="$t('surveys.csatSurvey')" value="CSAT" />
              <el-option :label="$t('surveys.productFeedback')" value="PRODUCT" />
              <el-option :label="$t('surveys.customSurvey')" value="CUSTOM" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('surveys.audience')">
            <el-select v-model="newSurvey.audience" class="w-full">
              <el-option :label="$t('surveys.allClients')" value="ALL_CLIENTS" />
              <el-option :label="$t('surveys.activeClients')" value="ACTIVE" />
              <el-option :label="$t('surveys.churned')" value="CHURNED" />
              <el-option :label="$t('surveys.customSegment')" value="CUSTOM" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('surveys.distribution')">
          <el-checkbox-group v-model="newSurvey.channels">
            <el-checkbox value="EMAIL">Email</el-checkbox>
            <el-checkbox value="SMS">SMS</el-checkbox>
            <el-checkbox value="IN_APP">In-App</el-checkbox>
            <el-checkbox value="LINK">Public Link</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item :label="$t('surveys.schedule')">
          <el-date-picker v-model="newSurvey.startDate" type="date" :placeholder="$t('surveys.startDate')" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">{{ $t("common.cancel") }}</el-button>
        <el-button type="primary" @click="createSurvey">{{ $t("surveys.createSurveyBtn") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

const showCreateDialog = ref(false);
const newSurvey = ref({ name: '', type: 'NPS', audience: 'ALL_CLIENTS', channels: ['EMAIL'], startDate: '' });

const npsScore = ref(42);
const npsColor = computed(() => (npsScore.value >= 50 ? '#10B981' : npsScore.value >= 0 ? '#F59E0B' : '#EF4444'));
const npsData = ref({ promoters: 58, passives: 26, detractors: 16, totalResponses: 847 });

const surveys = ref([
  {
    id: 1,
    name: 'Customer Satisfaction Q1 2026',
    type: 'CSAT',
    status: 'ACTIVE',
    questionCount: 8,
    sent: 500,
    responses: 312,
    responseRate: 62.4,
    avgScore: 4.2
  },
  {
    id: 2,
    name: 'Product NPS - February',
    type: 'NPS',
    status: 'ACTIVE',
    questionCount: 3,
    sent: 1200,
    responses: 535,
    responseRate: 44.6,
    avgScore: 4.0
  },
  {
    id: 3,
    name: 'Onboarding Experience',
    type: 'CSAT',
    status: 'COMPLETED',
    questionCount: 12,
    sent: 200,
    responses: 156,
    responseRate: 78.0,
    avgScore: 4.5
  },
  {
    id: 4,
    name: 'Feature Request Priority',
    type: 'PRODUCT',
    status: 'ACTIVE',
    questionCount: 6,
    sent: 350,
    responses: 189,
    responseRate: 54.0,
    avgScore: 3.8
  },
  {
    id: 5,
    name: 'Annual NPS 2025',
    type: 'NPS',
    status: 'COMPLETED',
    questionCount: 5,
    sent: 2000,
    responses: 847,
    responseRate: 42.4,
    avgScore: 3.9
  },
  { id: 6, name: 'Support Quality Survey', type: 'CSAT', status: 'DRAFT', questionCount: 10, sent: 0, responses: 0, responseRate: 0, avgScore: 0 }
]);

const recentFeedback = ref([]);

const totalResponses = computed(() => surveys.value.reduce((s, sv) => s + sv.responses, 0));
const avgResponseRate = computed(() => {
  const active = surveys.value.filter(s => s.sent > 0);
  if (!active.length) return 0;
  return (active.reduce((s, sv) => s + sv.responseRate, 0) / active.length).toFixed(1);
});

const getSurveyTypeBg = (t: string) => {
  const m: Record<string, string> = { NPS: 'bg-purple-500/10', CSAT: 'bg-blue-500/10', PRODUCT: 'bg-amber-500/10', CUSTOM: 'bg-emerald-500/10' };
  return m[t] || 'bg-slate-500/10';
};
const getSurveyTypeIcon = (t: string) => {
  const m: Record<string, string> = {
    NPS: 'ph:chart-line-up-bold',
    CSAT: 'ph:smiley-bold',
    PRODUCT: 'ph:package-bold',
    CUSTOM: 'ph:clipboard-text-bold'
  };
  return m[t] || 'ph:question-bold';
};
const getSurveyTypeColor = (t: string) => {
  const m: Record<string, string> = { NPS: 'text-purple-400', CSAT: 'text-blue-400', PRODUCT: 'text-amber-400', CUSTOM: 'text-emerald-400' };
  return m[t] || 'text-slate-400';
};

const viewResults = (s: unknown) => ElMessage.info(`Viewing results: ${s.name}`);
const editSurvey = (s: unknown) => ElMessage.info(`Editing: ${s.name}`);
const shareSurvey = (s: unknown) => {
  navigator.clipboard?.writeText(`https://survey.example.com/${s.id}`);
  ElMessage.success(t('common.copied'));
};
const closeSurvey = (s: unknown) => {
  s.status = 'COMPLETED';
  ElMessage.success(t('surveys.surveyClosed'));
};

const createSurvey = () => {
  if (!newSurvey.value.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  ElMessage.success(t('surveys.surveyCreated'));
  showCreateDialog.value = false;
};
</script>
