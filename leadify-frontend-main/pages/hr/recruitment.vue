<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">{{ $t('recruitment.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('recruitment.subtitle') }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showJobDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t('recruitment.postJob') }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ openJobs }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('recruitment.openPositions') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalApplicants }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('recruitment.totalApplicants') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ hiredThisMonth }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('recruitment.hiredThisMonth') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ avgTimeToHire }}d</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('recruitment.avgTimeToHire') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ interviewsThisWeek }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('recruitment.interviewsWeek') }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Hiring Pipeline -->
      <el-tab-pane :label="$t('recruitment.pipeline')" name="pipeline">
        <div class="flex gap-4 overflow-x-auto pb-4">
          <div v-for="stage in pipelineStages" :key="stage.key" class="flex-shrink-0 w-64">
            <div class="glass-panel p-3 rounded-xl mb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stage.color }"></div>
                  <span class="text-sm font-medium text-slate-200">{{ stage.label }}</span>
                </div>
                <span class="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{{ getCandidatesByStage(stage.key).length }}</span>
              </div>
            </div>
            <div class="space-y-3">
              <div
                v-for="candidate in getCandidatesByStage(stage.key)"
                :key="candidate.id"
                class="glass-panel p-4 rounded-xl hover:border-primary-500/30 transition-all cursor-pointer"
                @click="openCandidate(candidate)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <el-avatar :size="28" class="bg-slate-700">{{ candidate.name.charAt(0) }}</el-avatar>
                  <div>
                    <div class="text-sm font-medium text-slate-200">{{ candidate.name }}</div>
                    <div class="text-[10px] text-slate-500">{{ candidate.position }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <Icon name="ph:briefcase" class="w-3 h-3" />
                    {{ candidate.experience }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:star" class="w-3 h-3" />
                    {{ candidate.rating }}/5
                  </span>
                </div>
                <div class="flex items-center gap-1 mt-2">
                  <el-tag v-for="tag in candidate.tags" :key="tag" effect="plain" size="small" class="!text-[10px]">{{ tag }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Job Postings -->
      <el-tab-pane :label="$t('recruitment.jobPostings')" name="jobs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="job in jobs" :key="job.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ job.title }}</h4>
                <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{{ job.department }}</span>
                  <span>-</span>
                  <span>{{ job.location }}</span>
                  <span>-</span>
                  <span>{{ job.type }}</span>
                </div>
              </div>
              <el-tag :type="job.status === 'OPEN' ? 'success' : job.status === 'CLOSED' ? 'danger' : 'info'" effect="dark" size="small">
                {{ job.status }}
              </el-tag>
            </div>
            <div class="grid grid-cols-3 gap-2 my-3 py-3 border-t border-b border-slate-800/60 text-center">
              <div>
                <div class="text-sm font-bold text-slate-200">{{ job.applicants }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('recruitment.applicants') }}</div>
              </div>
              <div>
                <div class="text-sm font-bold text-blue-400">{{ job.screening }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('recruitment.screening') }}</div>
              </div>
              <div>
                <div class="text-sm font-bold text-emerald-400">{{ job.interviews }}</div>
                <div class="text-[10px] text-slate-500">{{ $t('recruitment.interviews') }}</div>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>{{ $t('recruitment.posted') }} {{ job.postedDate }}</span>
              <span>{{ job.salaryRange }}</span>
            </div>
            <div class="flex gap-2 mt-3">
              <el-button size="small" text type="primary" @click="viewApplicants(job)">
                <Icon name="ph:users" class="w-4 h-4 mr-1" />
                {{ $t('recruitment.applicants') }}
              </el-button>
              <el-button size="small" text @click="editJob(job)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" text @click="shareJob(job)">
                <Icon name="ph:share-network" class="w-4 h-4 mr-1" />
                {{ $t('recruitment.share') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Interviews Schedule -->
      <el-tab-pane :label="$t('recruitment.interviews')" name="interviews">
        <div class="space-y-3">
          <div v-for="interview in interviews" :key="interview.id" class="glass-panel p-5 rounded-xl">
            <div class="flex items-start gap-4">
              <div class="text-center flex-shrink-0 w-16">
                <div class="text-xs text-slate-500">{{ interview.dayName }}</div>
                <div class="text-2xl font-bold text-slate-200">{{ interview.day }}</div>
                <div class="text-xs text-slate-500">{{ interview.month }}</div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-slate-200">{{ interview.candidateName }}</span>
                  <span class="text-xs text-slate-500">{{ $t('recruitment.forWord') }}</span>
                  <span class="text-sm text-indigo-400">{{ interview.position }}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span class="flex items-center gap-1">
                    <Icon name="ph:clock" class="w-3 h-3" />
                    {{ interview.time }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:video-camera" class="w-3 h-3" />
                    {{ interview.mode }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:user" class="w-3 h-3" />
                    {{ interview.interviewer }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <el-tag effect="dark" size="small" class="!text-[10px]">{{ interview.round }}</el-tag>
                  <el-tag
                    :type="interview.status === 'SCHEDULED' ? 'info' : interview.status === 'COMPLETED' ? 'success' : 'warning'"
                    effect="dark"
                    size="small"
                    class="!text-[10px]"
                  >
                    {{ interview.status }}
                  </el-tag>
                </div>
              </div>
              <div class="flex gap-1">
                <el-button text type="primary" size="small" @click="joinInterview(interview)">
                  <Icon name="ph:video-camera-bold" class="w-4 h-4" />
                </el-button>
                <el-button text size="small" @click="rescheduleInterview(interview)">
                  <Icon name="ph:calendar-bold" class="w-4 h-4" />
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Talent Pool -->
      <el-tab-pane :label="$t('recruitment.talentPool')" name="talent">
        <el-table :data="talentPool" class="glass-table" stripe>
          <el-table-column :label="$t('recruitment.candidate')" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <el-avatar :size="28" class="bg-slate-700">{{ row.name.charAt(0) }}</el-avatar>
                <div>
                  <div class="text-sm text-slate-200">{{ row.name }}</div>
                  <div class="text-xs text-slate-500">{{ row.email }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="skills" :label="$t('recruitment.skills')" min-width="200">
            <template #default="{ row }">
              <div class="flex gap-1 flex-wrap">
                <el-tag v-for="s in row.skills" :key="s" effect="plain" size="small" class="!text-[10px]">{{ s }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="experience" :label="$t('recruitment.experience')" width="120" />
          <el-table-column :label="$t('recruitment.rating')" width="100" align="center">
            <template #default="{ row }">
              <el-rate :model-value="row.rating" disabled :max="5" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="source" :label="$t('recruitment.source')" width="120" />
          <el-table-column :label="$t('common.actions')" width="100" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="contactCandidate(row)">{{ $t('recruitment.contact') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Post Job Dialog -->
    <el-dialog v-model="showJobDialog" :title="$t('recruitment.postNewJob')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('recruitment.jobTitle')">
          <el-input v-model="newJob.title" placeholder="e.g., Senior Frontend Developer" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('recruitment.department')">
            <el-select v-model="newJob.department" class="w-full">
              <el-option :label="$t('recruitment.engineering')" value="Engineering" />
              <el-option :label="$t('recruitment.sales')" value="Sales" />
              <el-option :label="$t('recruitment.marketing')" value="Marketing" />
              <el-option :label="$t('recruitment.hr')" value="HR" />
              <el-option :label="$t('recruitment.operations')" value="Operations" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('recruitment.location')">
            <el-select v-model="newJob.location" class="w-full">
              <el-option :label="$t('recruitment.riyadh')" value="Riyadh" />
              <el-option :label="$t('recruitment.jeddah')" value="Jeddah" />
              <el-option :label="$t('recruitment.remote')" value="Remote" />
              <el-option :label="$t('recruitment.hybrid')" value="Hybrid" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('recruitment.employmentType')">
            <el-select v-model="newJob.type" class="w-full">
              <el-option :label="$t('recruitment.fullTime')" value="Full-time" />
              <el-option :label="$t('recruitment.partTime')" value="Part-time" />
              <el-option :label="$t('recruitment.contract')" value="Contract" />
              <el-option :label="$t('recruitment.internship')" value="Internship" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('recruitment.experienceLevel')">
            <el-select v-model="newJob.level" class="w-full">
              <el-option :label="$t('recruitment.juniorYrs')" value="JUNIOR" />
              <el-option :label="$t('recruitment.midYrs')" value="MID" />
              <el-option :label="$t('recruitment.seniorYrs')" value="SENIOR" />
              <el-option :label="$t('recruitment.leadYrs')" value="LEAD" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('recruitment.salaryRange')">
          <el-input v-model="newJob.salaryRange" placeholder="e.g., 15,000 - 25,000 SAR" />
        </el-form-item>
        <el-form-item :label="$t('recruitment.jobDescription')">
          <el-input v-model="newJob.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJobDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="postJob">{{ $t('recruitment.postJob') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const { t } = useI18n();

const activeTab = ref('pipeline');
const showJobDialog = ref(false);
const newJob = ref({ title: '', department: 'Engineering', location: 'Riyadh', type: 'Full-time', level: 'MID', salaryRange: '', description: '' });

const openJobs = ref(0);
const totalApplicants = ref(0);
const hiredThisMonth = ref(0);
const avgTimeToHire = ref(0);
const interviewsThisWeek = ref(0);

const pipelineStages = [
  { key: 'APPLIED', label: 'Applied', color: '#64748B' },
  { key: 'SCREENING', label: 'Screening', color: '#3B82F6' },
  { key: 'INTERVIEW', label: 'Interview', color: '#8B5CF6' },
  { key: 'OFFER', label: 'Offer', color: '#F59E0B' },
  { key: 'HIRED', label: 'Hired', color: '#10B981' }
];

const candidates = ref([]);

const jobs = ref([]);

const interviews = ref([]);

const talentPool = ref([]);

const getCandidatesByStage = (stage: string) => candidates.value.filter(c => c.stage === stage);

const openCandidate = (c: unknown) => ElMessage.info(`Opening: ${c.name}`);
const viewApplicants = (j: unknown) => ElMessage.info(`${j.applicants} applicants for ${j.title}`);
const editJob = (j: unknown) => ElMessage.info(`Editing: ${j.title}`);
const shareJob = (j: unknown) => ElMessage.success(t('common.copied'));
const joinInterview = (i: unknown) => ElMessage.info(`Joining interview with ${i.candidateName}`);
const rescheduleInterview = (i: unknown) => ElMessage.info(`Rescheduling ${i.candidateName}'s interview`);
const contactCandidate = (c: unknown) => ElMessage.info(`Contacting: ${c.name}`);

const postJob = () => {
  if (!newJob.value.title) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  ElMessage.success(t('recruitment.jobPosted'));
  showJobDialog.value = false;
};
</script>
