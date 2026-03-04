<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{{ $t("training.title") }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t("training.subtitle") }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showCourseDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t("training.createCourse") }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ totalCourses }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("training.totalCourses") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ activeLearners }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("training.activeLearners") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ completionRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("training.completionRate") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ certificationsIssued }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("training.certificationsIssued") }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Course Catalog -->
      <el-tab-pane :label="$t('training.courseCatalog')" name="catalog">
        <div class="flex items-center gap-3 mb-4">
          <el-input v-model="courseSearch" :placeholder="$t('training.searchCourses')" clearable class="!w-64">
            <template #prefix>
              <Icon name="ph:magnifying-glass" class="w-4 h-4" />
            </template>
          </el-input>
          <el-select v-model="categoryFilter" :placeholder="$t('training.allCategories')" clearable class="w-44">
            <el-option :label="$t('training.allCategories')" value="" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
          <el-select v-model="difficultyFilter" :placeholder="$t('training.allLevels')" clearable class="w-40">
            <el-option :label="$t('training.allLevels')" value="" />
            <el-option label="Beginner" value="Beginner" />
            <el-option label="Intermediate" value="Intermediate" />
            <el-option label="Advanced" value="Advanced" />
          </el-select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="glass-panel rounded-xl overflow-hidden hover:border-primary-500/30 transition-all"
          >
            <!-- Thumbnail Placeholder -->
            <div class="h-36 flex items-center justify-center" :style="{ background: course.thumbnailBg }">
              <Icon :name="course.icon" class="w-12 h-12 text-white/80" />
            </div>
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <el-tag :type="getDifficultyType(course.difficulty)" effect="dark" size="small" round>
                  {{ course.difficulty }}
                </el-tag>
                <span class="text-xs text-slate-500 flex items-center gap-1">
                  <Icon name="ph:clock-bold" class="w-3 h-3" />
                  {{ course.duration }}
                </span>
              </div>
              <h4 class="text-sm font-medium text-slate-200 mb-1">{{ course.title }}</h4>
              <p class="text-xs text-slate-500 mb-3">{{ course.instructor }}</p>

              <!-- Progress -->
              <div v-if="course.progress !== undefined" class="mb-3">
                <div class="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{{ $t("training.progress") }}</span>
                  <span>{{ course.progress }}%</span>
                </div>
                <el-progress
                  :percentage="course.progress"
                  :stroke-width="4"
                  :show-text="false"
                  :color="course.progress === 100 ? '#10B981' : '#6366F1'"
                />
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <Icon name="ph:users-bold" class="w-3 h-3" />
                  {{ course.enrolled }} {{ $t("training.enrolled") }}
                </span>
                <el-button text type="primary" size="small" @click="enrollCourse(course)">
                  {{ course.progress !== undefined ? $t("training.continue") : $t("training.enroll") }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- My Learning -->
      <el-tab-pane :label="$t('training.myLearning')" name="learning">
        <div class="space-y-4">
          <div v-for="enrollment in myEnrollments" :key="enrollment.id" class="glass-panel p-5 rounded-xl">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ background: enrollment.thumbnailBg }">
                <Icon :name="enrollment.icon" class="w-7 h-7 text-white/80" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-sm font-medium text-slate-200 truncate">{{ enrollment.title }}</h4>
                  <el-tag :type="getDifficultyType(enrollment.difficulty)" effect="plain" size="small">
                    {{ enrollment.difficulty }}
                  </el-tag>
                </div>
                <p class="text-xs text-slate-500 mb-2">{{ enrollment.instructor }} &middot; {{ enrollment.duration }}</p>

                <!-- Progress Bar -->
                <div class="mb-2">
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-500">{{ enrollment.completedModules }}/{{ enrollment.totalModules }} modules</span>
                    <span class="text-indigo-400 font-medium">{{ enrollment.progress }}%</span>
                  </div>
                  <el-progress
                    :percentage="enrollment.progress"
                    :stroke-width="6"
                    :show-text="false"
                    :color="enrollment.progress === 100 ? '#10B981' : '#6366F1'"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span class="flex items-center gap-1">
                      <Icon name="ph:calendar-bold" class="w-3 h-3" />
                      Due: {{ enrollment.dueDate }}
                    </span>
                    <span v-if="enrollment.isOverdue" class="text-red-400 font-medium">{{ $t("training.overdue") }}</span>
                  </div>
                  <el-button type="primary" size="small" class="!rounded-xl" @click="resumeCourse(enrollment)">
                    <Icon name="ph:play-bold" class="w-3 h-3 mr-1" />
                    {{ $t("training.resume") }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!myEnrollments.length" class="text-center py-12">
            <Icon name="ph:graduation-cap-bold" class="w-16 h-16 text-slate-600 mx-auto" />
            <p class="text-slate-500 mt-3">{{ $t("training.noEnrollments") }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- Certifications -->
      <el-tab-pane :label="$t('training.certifications')" name="certifications">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="cert in certifications" :key="cert.id" class="glass-panel p-5 rounded-xl">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="ph:certificate-bold" class="w-7 h-7 text-amber-400" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-slate-200 mb-1">{{ cert.name }}</h4>
                <p class="text-xs text-slate-500 mb-2">{{ cert.courseName }}</p>
                <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span class="flex items-center gap-1">
                    <Icon name="ph:calendar-check-bold" class="w-3 h-3" />
                    Issued: {{ cert.issueDate }}
                  </span>
                  <span class="flex items-center gap-1" :class="{ 'text-red-400': cert.isExpired }">
                    <Icon name="ph:clock-countdown-bold" class="w-3 h-3" />
                    Expires: {{ cert.expiryDate }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <el-tag :type="cert.isExpired ? 'danger' : 'success'" effect="dark" size="small" round>
                    {{ cert.isExpired ? $t("training.expired") : $t("training.valid") }}
                  </el-tag>
                  <el-button text type="primary" size="small" @click="downloadCert(cert)">
                    <Icon name="ph:download-bold" class="w-4 h-4 mr-1" />
                    {{ $t("common.download") }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!certifications.length" class="col-span-full text-center py-12">
            <Icon name="ph:medal-bold" class="w-16 h-16 text-slate-600 mx-auto" />
            <p class="text-slate-500 mt-3">{{ $t("training.noCertifications") }}</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Course Dialog -->
    <el-dialog v-model="showCourseDialog" :title="$t('training.createCourse')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('training.courseTitle')">
          <el-input v-model="courseForm.title" placeholder="e.g., Introduction to CRM Best Practices" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" :placeholder="$t('training.courseDescPlaceholder')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('common.category')">
            <el-select v-model="courseForm.category" class="w-full" :placeholder="$t('training.selectCategory')">
              <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('training.duration')">
            <el-input v-model="courseForm.duration" placeholder="e.g., 4h 30m" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('training.difficultyLevel')">
            <el-select v-model="courseForm.difficulty" class="w-full">
              <el-option label="Beginner" value="Beginner" />
              <el-option label="Intermediate" value="Intermediate" />
              <el-option label="Advanced" value="Advanced" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('training.instructor')">
            <el-input v-model="courseForm.instructor" :placeholder="$t('training.instructorPlaceholder')" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showCourseDialog = false">{{ $t("common.cancel") }}</el-button>
        <el-button type="primary" @click="createCourse">{{ $t("common.create") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const { t } = useI18n();

const activeTab = ref('catalog');
const showCourseDialog = ref(false);
const courseSearch = ref('');
const categoryFilter = ref('');
const difficultyFilter = ref('');

const courseForm = ref({
  title: '',
  description: '',
  category: 'Sales',
  duration: '',
  difficulty: 'Beginner',
  instructor: ''
});

const totalCourses = ref(24);
const activeLearners = ref(87);
const completionRate = ref(72);
const certificationsIssued = ref(156);

const categories = ['Sales', 'Marketing', 'Technical', 'Leadership', 'Compliance', 'Onboarding'];

const courses = ref([
  {
    id: 1,
    title: 'CRM Fundamentals',
    instructor: 'Ahmed Al-Rashid',
    duration: '3h 20m',
    difficulty: 'Beginner',
    category: 'Sales',
    enrolled: 45,
    progress: 100,
    icon: 'ph:book-open-bold',
    thumbnailBg: 'linear-gradient(135deg, #3B82F6, #6366F1)'
  },
  {
    id: 2,
    title: 'Advanced Sales Pipeline',
    instructor: 'Sara Mansour',
    duration: '5h 10m',
    difficulty: 'Advanced',
    category: 'Sales',
    enrolled: 32,
    progress: 65,
    icon: 'ph:chart-line-up-bold',
    thumbnailBg: 'linear-gradient(135deg, #8B5CF6, #A855F7)'
  },
  {
    id: 3,
    title: 'Email Marketing Mastery',
    instructor: 'Tariq Nasser',
    duration: '4h 00m',
    difficulty: 'Intermediate',
    category: 'Marketing',
    enrolled: 28,
    progress: undefined,
    icon: 'ph:envelope-bold',
    thumbnailBg: 'linear-gradient(135deg, #EC4899, #F43F5E)'
  },
  {
    id: 4,
    title: 'Leadership Communication',
    instructor: 'Lina Khalid',
    duration: '2h 45m',
    difficulty: 'Intermediate',
    category: 'Leadership',
    enrolled: 19,
    progress: 30,
    icon: 'ph:megaphone-bold',
    thumbnailBg: 'linear-gradient(135deg, #F59E0B, #EF4444)'
  },
  {
    id: 5,
    title: 'Data Privacy & Compliance',
    instructor: 'Youssef Ali',
    duration: '1h 30m',
    difficulty: 'Beginner',
    category: 'Compliance',
    enrolled: 64,
    progress: undefined,
    icon: 'ph:shield-check-bold',
    thumbnailBg: 'linear-gradient(135deg, #10B981, #059669)'
  },
  {
    id: 6,
    title: 'API Integration Workshop',
    instructor: 'Omar Hassan',
    duration: '6h 00m',
    difficulty: 'Advanced',
    category: 'Technical',
    enrolled: 15,
    progress: undefined,
    icon: 'ph:code-bold',
    thumbnailBg: 'linear-gradient(135deg, #06B6D4, #3B82F6)'
  },
  {
    id: 7,
    title: 'New Employee Onboarding',
    instructor: 'Maha Ibrahim',
    duration: '2h 00m',
    difficulty: 'Beginner',
    category: 'Onboarding',
    enrolled: 52,
    progress: 80,
    icon: 'ph:user-plus-bold',
    thumbnailBg: 'linear-gradient(135deg, #14B8A6, #10B981)'
  },
  {
    id: 8,
    title: 'Customer Success Strategies',
    instructor: 'Nada Salem',
    duration: '3h 45m',
    difficulty: 'Intermediate',
    category: 'Sales',
    enrolled: 23,
    progress: undefined,
    icon: 'ph:handshake-bold',
    thumbnailBg: 'linear-gradient(135deg, #7C3AED, #4F46E5)'
  },
  {
    id: 9,
    title: 'Social Media for B2B',
    instructor: 'Faisal Mohammed',
    duration: '4h 15m',
    difficulty: 'Intermediate',
    category: 'Marketing',
    enrolled: 38,
    progress: undefined,
    icon: 'ph:share-network-bold',
    thumbnailBg: 'linear-gradient(135deg, #F472B6, #A855F7)'
  }
]);

const myEnrollments = ref([
  {
    id: 1,
    title: 'CRM Fundamentals',
    instructor: 'Ahmed Al-Rashid',
    duration: '3h 20m',
    difficulty: 'Beginner',
    progress: 100,
    completedModules: 8,
    totalModules: 8,
    dueDate: 'Feb 10, 2026',
    isOverdue: false,
    icon: 'ph:book-open-bold',
    thumbnailBg: 'linear-gradient(135deg, #3B82F6, #6366F1)'
  },
  {
    id: 2,
    title: 'Advanced Sales Pipeline',
    instructor: 'Sara Mansour',
    duration: '5h 10m',
    difficulty: 'Advanced',
    progress: 65,
    completedModules: 7,
    totalModules: 11,
    dueDate: 'Mar 15, 2026',
    isOverdue: false,
    icon: 'ph:chart-line-up-bold',
    thumbnailBg: 'linear-gradient(135deg, #8B5CF6, #A855F7)'
  },
  {
    id: 4,
    title: 'Leadership Communication',
    instructor: 'Lina Khalid',
    duration: '2h 45m',
    difficulty: 'Intermediate',
    progress: 30,
    completedModules: 2,
    totalModules: 6,
    dueDate: 'Feb 18, 2026',
    isOverdue: true,
    icon: 'ph:megaphone-bold',
    thumbnailBg: 'linear-gradient(135deg, #F59E0B, #EF4444)'
  },
  {
    id: 7,
    title: 'New Employee Onboarding',
    instructor: 'Maha Ibrahim',
    duration: '2h 00m',
    difficulty: 'Beginner',
    progress: 80,
    completedModules: 4,
    totalModules: 5,
    dueDate: 'Feb 28, 2026',
    isOverdue: false,
    icon: 'ph:user-plus-bold',
    thumbnailBg: 'linear-gradient(135deg, #14B8A6, #10B981)'
  }
]);

const certifications = ref([
  {
    id: 1,
    name: 'CRM Fundamentals Certificate',
    courseName: 'CRM Fundamentals',
    issueDate: 'Feb 10, 2026',
    expiryDate: 'Feb 10, 2028',
    isExpired: false
  },
  {
    id: 2,
    name: 'Data Privacy Compliance',
    courseName: 'Data Privacy & Compliance',
    issueDate: 'Jan 22, 2026',
    expiryDate: 'Jan 22, 2027',
    isExpired: false
  },
  {
    id: 3,
    name: 'Sales Pipeline Expert',
    courseName: 'Advanced Sales Pipeline',
    issueDate: 'Nov 15, 2024',
    expiryDate: 'Nov 15, 2025',
    isExpired: true
  }
]);

const filteredCourses = computed(() => {
  return courses.value.filter(c => {
    const matchesSearch =
      !courseSearch.value ||
      c.title.toLowerCase().includes(courseSearch.value.toLowerCase()) ||
      c.instructor.toLowerCase().includes(courseSearch.value.toLowerCase());
    const matchesCategory = !categoryFilter.value || c.category === categoryFilter.value;
    const matchesDifficulty = !difficultyFilter.value || c.difficulty === difficultyFilter.value;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
});

function getDifficultyType(difficulty: string): 'success' | 'warning' | 'danger' | undefined {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    Beginner: 'success',
    Intermediate: 'warning',
    Advanced: 'danger'
  };
  return map[difficulty] ?? undefined;
}

function enrollCourse(course: any) {
  ElMessage.success(`Enrolled in: ${course.title}`);
}

function resumeCourse(enrollment: any) {
  ElMessage.info(`Resuming: ${enrollment.title}`);
}

function downloadCert(cert: any) {
  ElMessage.success(`Downloading certificate: ${cert.name}`);
}

function createCourse() {
  if (!courseForm.value.title) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  ElMessage.success(t('training.courseCreated'));
  showCourseDialog.value = false;
  courseForm.value = { title: '', description: '', category: 'Sales', duration: '', difficulty: 'Beginner', instructor: '' };
}
</script>
