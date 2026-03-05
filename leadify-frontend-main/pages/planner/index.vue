<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📅 {{ $t('planner.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('planner.subtitle') }}
    .flex.items-center.gap-3
      el-button(size="default" @click="showFocusDialog = true" style="border-radius: 12px;")
        Icon(name="ph:timer" size="16" style="margin-right: 4px;")
        | {{ $t('planner.startFocus') }}
      el-button(type="primary" size="default" @click="showTaskDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
        Icon(name="ph:plus" size="16" style="margin-right: 4px;")
        | {{ $t('planner.addTask') }}

  //- Stats Row
  .grid.grid-cols-5.gap-4.mb-8
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('planner.todaysTasks') }}
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.todayTasks }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('planner.completed') }}
      p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ stats.todayCompleted }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('planner.progress') }}
      p.text-2xl.font-black.mt-1(style="color: #7c3aed;") {{ stats.todayProgress }}%
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('planner.focusToday') }}
      p.text-2xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.focusMinutes }}m
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('planner.bestStreak') }}
      p.text-2xl.font-black.mt-1(style="color: #ef4444;") 🔥 {{ stats.currentStreak }}

  //- Active Focus Session Banner
  .p-5.rounded-2xl.border-2.mb-8.flex.items-center.justify-between(
    v-if="activeFocus"
    style="border-color: #f59e0b60; background: linear-gradient(135deg, #f59e0b08, #fbbf2408);"
  )
    .flex.items-center.gap-4
      .w-14.h-14.rounded-2xl.flex.items-center.justify-center.text-2xl(style="background: #f59e0b20;") 🎯
      div
        p.text-lg.font-black(style="color: var(--text-primary);") Focus: {{ activeFocus.taskTitle }}
        p.text-sm(style="color: var(--text-muted);") {{ activeFocus.duration }}min session — {{ focusElapsed }}min elapsed
    .flex.items-center.gap-3
      .text-3xl.font-black.font-mono(style="color: #f59e0b;") {{ focusTimerDisplay }}
      el-button(type="success" @click="endCurrentFocus" style="border-radius: 12px;")
        Icon(name="ph:check" size="16" style="margin-right: 4px;")
        | {{ $t('planner.complete') }}

  .grid.grid-cols-3.gap-6
    //- Today's Schedule (Time Blocks)
    .col-span-2
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          .flex.items-center.justify-between
            span.font-bold 📋 {{ $t('planner.todayHeading') }} — {{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
            .flex.items-center.gap-2
              el-button(text size="small" @click="viewDate = prevDay(viewDate)") ←
              span.text-xs.font-mono {{ viewDate }}
              el-button(text size="small" @click="viewDate = nextDay(viewDate)") →
        .space-y-2
          .flex.items-start.gap-4.px-4.py-3.rounded-xl.transition-all(
            v-for="task in viewDateTasks"
            :key="task.id"
            :class="{ 'opacity-50': task.completed }"
            style="border: 1px solid var(--border-default);"
            class="hover:shadow-sm"
          )
            //- Time
            .flex-shrink-0.w-16.text-right
              span.text-sm.font-mono.font-bold(:style="{ color: task.completed ? 'var(--text-muted)' : categoryColor(task.category) }") {{ task.timeSlot || '—' }}
              p.text-xs(style="color: var(--text-muted);") {{ task.duration }}m
            //- Category Bar
            .w-1.h-12.rounded-full.flex-shrink-0(:style="{ backgroundColor: categoryColor(task.category) }")
            //- Content
            .flex-1.min-w-0
              .flex.items-center.gap-2
                el-checkbox(:model-value="task.completed" @change="completeTask(task.id)" size="large")
                p.text-sm.font-bold(:class="{ 'line-through': task.completed }" style="color: var(--text-primary);") {{ task.title }}
              .flex.items-center.gap-2.mt-1
                el-tag(size="small" round effect="plain" :style="{ color: categoryColor(task.category) }") {{ task.category }}
                el-tag(size="small" round :type="task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'") {{ task.priority }}
            //- Actions
            .flex.items-center.gap-1
              el-button(text circle size="small" @click="quickFocus(task)" :disabled="!!activeFocus")
                Icon(name="ph:timer" size="14" style="color: #f59e0b;")
              el-button(text circle size="small" type="danger" @click="removeTask(task.id)")
                Icon(name="ph:trash" size="14")

          .text-center.py-10(v-if="viewDateTasks.length === 0")
            Icon(name="ph:sun" size="40" style="color: var(--text-muted);")
            p.text-sm.mt-2(style="color: var(--text-muted);") {{ $t('planner.noTasksForDay') }}

    //- Right Column: Habits + Focus History
    .col-span-1.space-y-6
      //- Daily Habits
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          .flex.items-center.justify-between
            span.font-bold 🔥 {{ $t('planner.dailyHabits') }}
            el-button(text size="small" @click="showHabitDialog = true")
              Icon(name="ph:plus" size="14")
        .space-y-2
          .flex.items-center.justify-between.px-3.py-2.rounded-xl.transition-colors.cursor-pointer(
            v-for="habit in habits"
            :key="habit.id"
            @click="toggleHabit(habit.id)"
            :style="{ background: isHabitDone(habit.id) ? '#22c55e10' : 'transparent' }"
            class="hover:bg-gray-50"
          )
            .flex.items-center.gap-3
              span.text-lg {{ habit.icon }}
              span.text-sm.font-semibold(:class="{ 'line-through': isHabitDone(habit.id) }" style="color: var(--text-primary);") {{ habit.name }}
            .flex.items-center.gap-2
              span.text-xs.font-bold(:style="{ color: habit.streak > 0 ? '#ef4444' : 'var(--text-muted)' }") {{ habit.streak }}🔥
              .w-5.h-5.rounded-full.border-2.flex.items-center.justify-center.text-xs(
                :style="{ borderColor: isHabitDone(habit.id) ? '#22c55e' : 'var(--border-default)', backgroundColor: isHabitDone(habit.id) ? '#22c55e' : 'transparent', color: isHabitDone(habit.id) ? 'white' : 'transparent' }"
              ) ✓

      //- Focus History
      el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
        template(#header)
          span.font-bold ⏱️ {{ $t('planner.focusSessions') }}
        .space-y-2
          .flex.items-center.gap-3.px-3.py-2(v-for="session in focusToday" :key="session.id")
            .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: #f59e0b15;")
              Icon(name="ph:timer" size="16" style="color: #f59e0b;")
            .flex-1.min-w-0
              p.text-xs.font-semibold.truncate(style="color: var(--text-primary);") {{ session.taskTitle }}
              p.text-xs.font-mono(style="color: var(--text-muted);") {{ session.actualMinutes || session.duration }}min
            el-tag(:type="session.completed ? 'success' : 'warning'" size="small" round) {{ session.completed ? $t('planner.done') : $t('planner.active') }}
          .text-center.py-4(v-if="focusToday.length === 0")
            p.text-xs(style="color: var(--text-muted);") {{ $t('planner.noFocusToday') }}

  //- Add Task Dialog
  el-dialog(v-model="showTaskDialog" :title="$t('planner.planATask')" width="500px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('planner.taskTitle')")
        el-input(v-model="taskForm.title" :placeholder="$t('planner.taskTitlePlaceholder')")
      .grid.grid-cols-3.gap-4
        el-form-item(:label="$t('planner.date')")
          el-date-picker(v-model="taskForm.date" type="date" class="!w-full" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('planner.time')")
          el-time-picker(v-model="taskForm.timeSlot" class="!w-full" format="HH:mm" value-format="HH:mm")
        el-form-item(:label="$t('planner.durationMin')")
          el-input-number(v-model="taskForm.duration" :min="5" :step="15" class="!w-full")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('planner.category')")
          el-select(v-model="taskForm.category" class="w-full")
            el-option(:label="$t('planner.catWork')" value="work")
            el-option(:label="$t('planner.catMeeting')" value="meeting")
            el-option(:label="$t('planner.catPersonal')" value="personal")
            el-option(:label="$t('planner.catHealth')" value="health")
            el-option(:label="$t('planner.catLearning')" value="learning")
            el-option(:label="$t('planner.catAdmin')" value="admin")
        el-form-item(:label="$t('planner.priority')")
          el-select(v-model="taskForm.priority" class="w-full")
            el-option(:label="$t('planner.priorityHigh')" value="high")
            el-option(:label="$t('planner.priorityMedium')" value="medium")
            el-option(:label="$t('planner.priorityLow')" value="low")
    template(#footer)
      el-button(@click="showTaskDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveTask" style="border-radius: 12px;") {{ $t('planner.addToPlan') }}

  //- Focus Dialog
  el-dialog(v-model="showFocusDialog" :title="$t('planner.startFocusSession')" width="420px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('planner.focusingOn')")
        el-input(v-model="focusForm.taskTitle" :placeholder="$t('planner.focusingOnPlaceholder')")
      el-form-item(:label="$t('planner.durationMinutes')")
        .flex.gap-3
          el-button(v-for="d in [25, 45, 60, 90]" :key="d" :type="focusForm.duration === d ? 'primary' : 'default'" @click="focusForm.duration = d" style="border-radius: 12px;") {{ d }}m
    template(#footer)
      el-button(@click="showFocusDialog = false") {{ $t('common.cancel') }}
      el-button(type="warning" @click="beginFocus" style="border-radius: 12px;")
        Icon(name="ph:play" size="16" style="margin-right: 4px;")
        | {{ $t('planner.startFocusBtn', { duration: focusForm.duration }) }}

  //- Add Habit Dialog
  el-dialog(v-model="showHabitDialog" :title="$t('planner.addHabit')" width="380px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('planner.habitName')")
        el-input(v-model="habitForm.name" :placeholder="$t('planner.habitNamePlaceholder')")
      el-form-item(:label="$t('planner.icon')")
        el-input(v-model="habitForm.icon" placeholder="🏃")
    template(#footer)
      el-button(@click="showHabitDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveHabit" style="border-radius: 12px;") {{ $t('planner.addHabit') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePlanner } from '~/composables/planner';

definePageMeta({});

const { t } = useI18n();

const {
  todayTasks,
  focusToday,
  habits,
  stats,
  today,
  loading,
  init,
  loadTasks,
  addTask,
  completeTask,
  removeTask,
  getTasksByDate,
  startFocus,
  endFocus,
  toggleHabit,
  isHabitDone,
  addHabit
} = usePlanner();

const viewDate = ref(today.value);
const viewDateTasks = computed(() => getTasksByDate(viewDate.value));

const showTaskDialog = ref(false);
const showFocusDialog = ref(false);
const showHabitDialog = ref(false);

const taskForm = reactive({ title: '', date: today.value, timeSlot: '09:00', duration: 30, category: 'work' as const, priority: 'medium' as const });
const focusForm = reactive({ taskTitle: '', duration: 25 });
const habitForm = reactive({ name: '', icon: '✅' });

// ── Focus Timer ──
const activeFocus = computed(() => focusToday.value.find(f => !f.completed));
const focusElapsed = computed(() => {
  if (!activeFocus.value) return 0;
  return Math.floor((Date.now() - new Date(activeFocus.value.startedAt).getTime()) / 60000);
});
const focusTimerDisplay = computed(() => {
  if (!activeFocus.value) return '--:--';
  const remaining = Math.max(0, activeFocus.value.duration - focusElapsed.value);
  return `${String(Math.floor(remaining)).padStart(2, '0')}:${String(remaining % 60 === 0 ? 0 : 59 - new Date().getSeconds()).padStart(2, '0')}`;
});

let timerInterval: ReturnType<typeof setInterval> | null = null;
const timerTick = ref(0);
onMounted(async () => {
  timerInterval = setInterval(() => {
    timerTick.value++;
  }, 1000);
  await init();
});
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Fetch tasks when navigating dates
watch(viewDate, date => {
  loadTasks(date);
});

async function saveTask() {
  await addTask({ ...taskForm });
  Object.assign(taskForm, { title: '', date: today.value, timeSlot: '09:00', duration: 30, category: 'work', priority: 'medium' });
  showTaskDialog.value = false;
  ElMessage.success(t('planner.taskPlanned'));
}

async function beginFocus() {
  await startFocus(focusForm.taskTitle, focusForm.duration);
  Object.assign(focusForm, { taskTitle: '', duration: 25 });
  showFocusDialog.value = false;
  ElMessage.success(t('planner.focusStarted'));
}

async function endCurrentFocus() {
  if (activeFocus.value) {
    await endFocus(activeFocus.value.id);
    ElMessage.success(t('planner.focusCompleted'));
  }
}

async function quickFocus(task: unknown) {
  await startFocus(task.title, task.duration || 25, task.id);
  ElMessage.success(`Focus: ${task.title}`);
}

async function saveHabit() {
  await addHabit(habitForm.name, habitForm.icon);
  Object.assign(habitForm, { name: '', icon: '✅' });
  showHabitDialog.value = false;
  ElMessage.success(t('planner.habitAdded'));
}

function categoryColor(c: string): string {
  return { work: '#7c3aed', meeting: '#3b82f6', personal: '#22c55e', health: '#ef4444', learning: '#f59e0b', admin: '#6b7280' }[c] || '#6b7280';
}

function prevDay(d: string): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - 1);
  return dt.toISOString().slice(0, 10);
}
function nextDay(d: string): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + 1);
  return dt.toISOString().slice(0, 10);
}
</script>
