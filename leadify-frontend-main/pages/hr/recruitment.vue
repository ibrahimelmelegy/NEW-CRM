<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Recruitment & ATS
          </h1>
          <p class="text-slate-400 text-sm mt-1">Post jobs, track applicants, schedule interviews, and manage your hiring pipeline.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showJobDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          Post Job
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ openJobs }}</div>
        <div class="text-xs text-slate-500 mt-1">Open Positions</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ totalApplicants }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Applicants</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ hiredThisMonth }}</div>
        <div class="text-xs text-slate-500 mt-1">Hired (This Month)</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ avgTimeToHire }}d</div>
        <div class="text-xs text-slate-500 mt-1">Avg Time to Hire</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ interviewsThisWeek }}</div>
        <div class="text-xs text-slate-500 mt-1">Interviews (Week)</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Hiring Pipeline -->
      <el-tab-pane label="Pipeline" name="pipeline">
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
              <div v-for="candidate in getCandidatesByStage(stage.key)" :key="candidate.id"
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
                  <span class="flex items-center gap-1"><Icon name="ph:briefcase" class="w-3 h-3" /> {{ candidate.experience }}</span>
                  <span class="flex items-center gap-1"><Icon name="ph:star" class="w-3 h-3" /> {{ candidate.rating }}/5</span>
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
      <el-tab-pane label="Job Postings" name="jobs">
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
              <el-tag :type="job.status === 'OPEN' ? 'success' : job.status === 'CLOSED' ? 'danger' : 'info'" effect="dark" size="small">{{ job.status }}</el-tag>
            </div>
            <div class="grid grid-cols-3 gap-2 my-3 py-3 border-t border-b border-slate-800/60 text-center">
              <div>
                <div class="text-sm font-bold text-slate-200">{{ job.applicants }}</div>
                <div class="text-[10px] text-slate-500">Applicants</div>
              </div>
              <div>
                <div class="text-sm font-bold text-blue-400">{{ job.screening }}</div>
                <div class="text-[10px] text-slate-500">Screening</div>
              </div>
              <div>
                <div class="text-sm font-bold text-emerald-400">{{ job.interviews }}</div>
                <div class="text-[10px] text-slate-500">Interviews</div>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>Posted {{ job.postedDate }}</span>
              <span>{{ job.salaryRange }}</span>
            </div>
            <div class="flex gap-2 mt-3">
              <el-button size="small" text type="primary" @click="viewApplicants(job)">
                <Icon name="ph:users" class="w-4 h-4 mr-1" /> Applicants
              </el-button>
              <el-button size="small" text @click="editJob(job)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" /> Edit
              </el-button>
              <el-button size="small" text @click="shareJob(job)">
                <Icon name="ph:share-network" class="w-4 h-4 mr-1" /> Share
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Interviews Schedule -->
      <el-tab-pane label="Interviews" name="interviews">
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
                  <span class="text-xs text-slate-500">for</span>
                  <span class="text-sm text-indigo-400">{{ interview.position }}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span class="flex items-center gap-1"><Icon name="ph:clock" class="w-3 h-3" /> {{ interview.time }}</span>
                  <span class="flex items-center gap-1"><Icon name="ph:video-camera" class="w-3 h-3" /> {{ interview.mode }}</span>
                  <span class="flex items-center gap-1"><Icon name="ph:user" class="w-3 h-3" /> {{ interview.interviewer }}</span>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <el-tag effect="dark" size="small" class="!text-[10px]">{{ interview.round }}</el-tag>
                  <el-tag :type="interview.status === 'SCHEDULED' ? 'info' : interview.status === 'COMPLETED' ? 'success' : 'warning'" effect="dark" size="small" class="!text-[10px]">
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
      <el-tab-pane label="Talent Pool" name="talent">
        <el-table :data="talentPool" class="glass-table" stripe>
          <el-table-column label="Candidate" min-width="200">
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
          <el-table-column prop="skills" label="Skills" min-width="200">
            <template #default="{ row }">
              <div class="flex gap-1 flex-wrap">
                <el-tag v-for="s in row.skills" :key="s" effect="plain" size="small" class="!text-[10px]">{{ s }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="experience" label="Experience" width="120" />
          <el-table-column label="Rating" width="100" align="center">
            <template #default="{ row }">
              <el-rate :model-value="row.rating" disabled :max="5" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="source" label="Source" width="120" />
          <el-table-column label="Actions" width="100" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="contactCandidate(row)">Contact</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Post Job Dialog -->
    <el-dialog v-model="showJobDialog" title="Post New Job" width="560px">
      <el-form label-position="top">
        <el-form-item label="Job Title">
          <el-input v-model="newJob.title" placeholder="e.g., Senior Frontend Developer" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Department">
            <el-select v-model="newJob.department" class="w-full">
              <el-option label="Engineering" value="Engineering" />
              <el-option label="Sales" value="Sales" />
              <el-option label="Marketing" value="Marketing" />
              <el-option label="HR" value="HR" />
              <el-option label="Operations" value="Operations" />
            </el-select>
          </el-form-item>
          <el-form-item label="Location">
            <el-select v-model="newJob.location" class="w-full">
              <el-option label="Riyadh" value="Riyadh" />
              <el-option label="Jeddah" value="Jeddah" />
              <el-option label="Remote" value="Remote" />
              <el-option label="Hybrid" value="Hybrid" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Employment Type">
            <el-select v-model="newJob.type" class="w-full">
              <el-option label="Full-time" value="Full-time" />
              <el-option label="Part-time" value="Part-time" />
              <el-option label="Contract" value="Contract" />
              <el-option label="Internship" value="Internship" />
            </el-select>
          </el-form-item>
          <el-form-item label="Experience Level">
            <el-select v-model="newJob.level" class="w-full">
              <el-option label="Junior (0-2 yrs)" value="JUNIOR" />
              <el-option label="Mid (3-5 yrs)" value="MID" />
              <el-option label="Senior (5+ yrs)" value="SENIOR" />
              <el-option label="Lead (8+ yrs)" value="LEAD" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Salary Range">
          <el-input v-model="newJob.salaryRange" placeholder="e.g., 15,000 - 25,000 SAR" />
        </el-form-item>
        <el-form-item label="Job Description">
          <el-input v-model="newJob.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJobDialog = false">Cancel</el-button>
        <el-button type="primary" @click="postJob">Post Job</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const activeTab = ref('pipeline');
const showJobDialog = ref(false);
const newJob = ref({ title: '', department: 'Engineering', location: 'Riyadh', type: 'Full-time', level: 'MID', salaryRange: '', description: '' });

const openJobs = ref(8);
const totalApplicants = ref(156);
const hiredThisMonth = ref(3);
const avgTimeToHire = ref(21);
const interviewsThisWeek = ref(12);

const pipelineStages = [
  { key: 'APPLIED', label: 'Applied', color: '#64748B' },
  { key: 'SCREENING', label: 'Screening', color: '#3B82F6' },
  { key: 'INTERVIEW', label: 'Interview', color: '#8B5CF6' },
  { key: 'OFFER', label: 'Offer', color: '#F59E0B' },
  { key: 'HIRED', label: 'Hired', color: '#10B981' }
];

const candidates = ref([
  { id: 1, name: 'Rania Ahmad', position: 'Sr. Frontend Dev', stage: 'INTERVIEW', experience: '6 yrs', rating: 4.5, tags: ['Vue.js', 'TypeScript'] },
  { id: 2, name: 'Tariq Saud', position: 'Backend Engineer', stage: 'SCREENING', experience: '4 yrs', rating: 3.8, tags: ['Node.js', 'PostgreSQL'] },
  { id: 3, name: 'Lina Khalid', position: 'UX Designer', stage: 'OFFER', experience: '5 yrs', rating: 4.8, tags: ['Figma', 'UX Research'] },
  { id: 4, name: 'Youssef Ali', position: 'Sr. Frontend Dev', stage: 'APPLIED', experience: '3 yrs', rating: 3.5, tags: ['React', 'CSS'] },
  { id: 5, name: 'Nada Hassan', position: 'Sales Manager', stage: 'INTERVIEW', experience: '8 yrs', rating: 4.2, tags: ['B2B', 'Enterprise'] },
  { id: 6, name: 'Faisal Omar', position: 'DevOps Engineer', stage: 'SCREENING', experience: '5 yrs', rating: 4.0, tags: ['AWS', 'Docker'] },
  { id: 7, name: 'Maha Ibrahim', position: 'Product Manager', stage: 'APPLIED', experience: '7 yrs', rating: 4.3, tags: ['Agile', 'SaaS'] },
  { id: 8, name: 'Zaid Mohammed', position: 'Backend Engineer', stage: 'HIRED', experience: '4 yrs', rating: 4.6, tags: ['Python', 'Django'] },
  { id: 9, name: 'Aisha Salem', position: 'Sales Manager', stage: 'APPLIED', experience: '5 yrs', rating: 3.9, tags: ['CRM', 'Negotiation'] }
]);

const jobs = ref([
  { id: 1, title: 'Senior Frontend Developer', department: 'Engineering', location: 'Riyadh', type: 'Full-time', status: 'OPEN', applicants: 42, screening: 12, interviews: 5, postedDate: 'Feb 5, 2026', salaryRange: '18K-28K SAR' },
  { id: 2, title: 'Backend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', status: 'OPEN', applicants: 38, screening: 8, interviews: 3, postedDate: 'Feb 8, 2026', salaryRange: '16K-25K SAR' },
  { id: 3, title: 'UX Designer', department: 'Design', location: 'Riyadh', type: 'Full-time', status: 'OPEN', applicants: 25, screening: 6, interviews: 2, postedDate: 'Feb 10, 2026', salaryRange: '14K-22K SAR' },
  { id: 4, title: 'Sales Manager - Enterprise', department: 'Sales', location: 'Jeddah', type: 'Full-time', status: 'OPEN', applicants: 18, screening: 5, interviews: 2, postedDate: 'Feb 12, 2026', salaryRange: '20K-35K SAR' },
  { id: 5, title: 'DevOps Engineer', department: 'Engineering', location: 'Hybrid', type: 'Full-time', status: 'CLOSED', applicants: 33, screening: 10, interviews: 4, postedDate: 'Jan 15, 2026', salaryRange: '15K-24K SAR' },
  { id: 6, title: 'Product Manager', department: 'Product', location: 'Riyadh', type: 'Full-time', status: 'OPEN', applicants: 20, screening: 4, interviews: 1, postedDate: 'Feb 15, 2026', salaryRange: '22K-35K SAR' }
]);

const interviews = ref([
  { id: 1, candidateName: 'Rania Ahmad', position: 'Sr. Frontend Dev', dayName: 'Mon', day: '24', month: 'Feb', time: '10:00 AM', mode: 'Video Call', interviewer: 'Ahmed F.', round: 'Technical', status: 'SCHEDULED' },
  { id: 2, candidateName: 'Nada Hassan', position: 'Sales Manager', dayName: 'Mon', day: '24', month: 'Feb', time: '2:00 PM', mode: 'In-person', interviewer: 'Sara M.', round: 'Culture Fit', status: 'SCHEDULED' },
  { id: 3, candidateName: 'Faisal Omar', position: 'DevOps Engineer', dayName: 'Tue', day: '25', month: 'Feb', time: '11:00 AM', mode: 'Video Call', interviewer: 'Omar H.', round: 'Technical', status: 'SCHEDULED' },
  { id: 4, candidateName: 'Lina Khalid', position: 'UX Designer', dayName: 'Wed', day: '26', month: 'Feb', time: '3:00 PM', mode: 'In-person', interviewer: 'Fatima A.', round: 'Final', status: 'SCHEDULED' }
]);

const talentPool = ref([
  { name: 'Ahmad Nasser', email: 'ahmad@mail.com', skills: ['React', 'Node.js', 'AWS'], experience: '5 yrs', rating: 4.2, source: 'LinkedIn' },
  { name: 'Sara Khalil', email: 'sara@mail.com', skills: ['Python', 'ML', 'Data Science'], experience: '3 yrs', rating: 3.8, source: 'Referral' },
  { name: 'Mohammed Zain', email: 'mz@mail.com', skills: ['Java', 'Spring', 'Microservices'], experience: '7 yrs', rating: 4.5, source: 'Job Board' }
]);

const getCandidatesByStage = (stage: string) => candidates.value.filter(c => c.stage === stage);

const openCandidate = (c: any) => ElMessage.info(`Opening: ${c.name}`);
const viewApplicants = (j: any) => ElMessage.info(`${j.applicants} applicants for ${j.title}`);
const editJob = (j: any) => ElMessage.info(`Editing: ${j.title}`);
const shareJob = (j: any) => ElMessage.success('Job link copied!');
const joinInterview = (i: any) => ElMessage.info(`Joining interview with ${i.candidateName}`);
const rescheduleInterview = (i: any) => ElMessage.info(`Rescheduling ${i.candidateName}'s interview`);
const contactCandidate = (c: any) => ElMessage.info(`Contacting: ${c.name}`);

const postJob = () => {
  if (!newJob.value.title) { ElMessage.warning('Job title required'); return; }
  ElMessage.success('Job posted!');
  showJobDialog.value = false;
};
</script>
