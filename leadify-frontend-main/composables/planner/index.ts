/**
 * Personal Planner Composable
 * Connects the planner page to the /api/planner backend endpoints.
 * All data is stored server-side — no localStorage is used.
 *
 * Backend routes (all under /api/planner, all require auth):
 *   GET    /tasks?date=YYYY-MM-DD   → list tasks for a date
 *   POST   /tasks                   → create a planner task
 *   PATCH  /tasks/:id               → update a task
 *   PATCH  /tasks/:id/toggle        → toggle completed
 *   DELETE /tasks/:id               → delete a task
 *   GET    /stats                   → daily/weekly stats
 *   POST   /focus                   → start a focus session
 *   PATCH  /focus/:id/end           → end a focus session
 *   GET    /focus?date=YYYY-MM-DD   → focus sessions for a date
 *   GET    /habits                  → list all habits for user
 *   POST   /habits                  → create a habit
 *   PATCH  /habits/:id/toggle       → toggle habit done today
 *   DELETE /habits/:id              → delete a habit
 */
import { ref, computed } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlannerTask {
  id: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  timeSlot?: string; // HH:mm
  duration: number; // minutes
  category: 'work' | 'meeting' | 'personal' | 'health' | 'learning' | 'admin';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
}

export interface FocusSession {
  id: number;
  taskId?: number;
  taskTitle: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // minutes planned
  actualMinutes?: number;
  completed: boolean;
}

export interface DailyHabit {
  id: number;
  name: string;
  icon: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD[]
}

export type TaskCategory = PlannerTask['category'];
export type TaskPriority = PlannerTask['priority'];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map a raw task object from the backend (which uses uppercase STATUS/PRIORITY
 * enums like "COMPLETED", "HIGH") to the frontend PlannerTask shape.
 */
function mapTask(t: any): PlannerTask {
  return {
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    // Backend stores date as DATEONLY; may come as "2026-03-04" or "2026-03-04T00:00:00.000Z"
    date: typeof t.date === 'string' ? t.date.slice(0, 10) : t.date,
    timeSlot: t.timeSlot || undefined,
    duration: t.duration ?? 60,
    // Backend category is already lowercase ('work', 'meeting', etc.)
    category: (t.category || 'work') as PlannerTask['category'],
    // Backend priority is uppercase (LOW, MEDIUM, HIGH, URGENT) — normalise
    priority: normalisePriority(t.priority),
    // Backend status is uppercase (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
    completed: t.status === 'COMPLETED',
    completedAt: t.completedAt || undefined
  };
}

function normalisePriority(p: string | undefined): PlannerTask['priority'] {
  const map: Record<string, PlannerTask['priority']> = {
    HIGH: 'high',
    URGENT: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    // already lowercase (defensive)
    high: 'high',
    medium: 'medium',
    low: 'low'
  };
  return map[p || 'MEDIUM'] ?? 'medium';
}

/** Convert frontend priority → backend enum value */
function toBackendPriority(p: TaskPriority): string {
  return p.toUpperCase();
}

// ── Module-level shared state ─────────────────────────────────────────────────
// Shared across all component instances so navigating away and back keeps data.

const tasks = ref<PlannerTask[]>([]);
const focusSessions = ref<FocusSession[]>([]);
const habits = ref<DailyHabit[]>([]);
const loading = ref(false);

// ── Composable ────────────────────────────────────────────────────────────────

export function usePlanner() {
  const today = computed<string>(() => new Date().toISOString().slice(0, 10));

  // ── Derived task lists ──────────────────────────────────────────────────────

  const todayTasks = computed(() =>
    tasks.value.filter(t => t.date === today.value).sort((a, b) => (a.timeSlot || '23:59').localeCompare(b.timeSlot || '23:59'))
  );

  const todayCompleted = computed(() => todayTasks.value.filter(t => t.completed).length);
  const todayTotal = computed(() => todayTasks.value.length);
  const todayProgress = computed(() => (todayTotal.value > 0 ? Math.round((todayCompleted.value / todayTotal.value) * 100) : 0));

  const weekTasks = computed(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    return tasks.value.filter(t => t.date >= s && t.date <= e);
  });

  // ── Derived focus lists ─────────────────────────────────────────────────────

  const focusToday = computed(() => {
    const t = today.value;
    return focusSessions.value.filter(f => f.startedAt?.startsWith(t));
  });

  const focusTotalMinutes = computed(() => focusToday.value.reduce((sum, f) => sum + (f.actualMinutes || 0), 0));

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = computed(() => ({
    todayTasks: todayTotal.value,
    todayCompleted: todayCompleted.value,
    todayProgress: todayProgress.value,
    focusSessions: focusToday.value.length,
    focusMinutes: focusTotalMinutes.value,
    weekTaskCount: weekTasks.value.length,
    weekCompleted: weekTasks.value.filter(t => t.completed).length,
    currentStreak: Math.max(...habits.value.map(h => h.streak), 0)
  }));

  // ── Data loading ────────────────────────────────────────────────────────────

  /**
   * Load planner tasks for a specific date from the API.
   * Replaces only the tasks for that date in the local cache.
   */
  async function loadTasks(date: string) {
    const { body, success } = await useApiFetch(`planner/tasks?date=${date}`);
    if (success && Array.isArray(body)) {
      const mapped = (body as any[]).map(mapTask);
      // Replace tasks for this date, keep others
      tasks.value = tasks.value.filter(t => t.date !== date).concat(mapped);
    }
  }

  /** Load all habits for the current user. */
  async function loadHabits() {
    const { body, success } = await useApiFetch('planner/habits');
    if (success && Array.isArray(body)) {
      habits.value = body as DailyHabit[];
    }
  }

  /** Load focus sessions for a specific date. */
  async function loadFocus(date: string) {
    const { body, success } = await useApiFetch(`planner/focus?date=${date}`);
    if (success && Array.isArray(body)) {
      focusSessions.value = body as FocusSession[];
    }
  }

  /**
   * Bootstrap: load today's tasks, habits, and focus sessions in parallel.
   * Call this once on page mount.
   */
  async function init() {
    loading.value = true;
    try {
      await Promise.all([loadTasks(today.value), loadHabits(), loadFocus(today.value)]);
    } finally {
      loading.value = false;
    }
  }

  // ── Task CRUD ───────────────────────────────────────────────────────────────

  /** Create a new planner task and add it to the local list. */
  async function addTask(data: Omit<PlannerTask, 'id' | 'completed'>) {
    const payload = {
      title: data.title,
      description: data.description,
      date: data.date,
      timeSlot: data.timeSlot || null,
      duration: data.duration,
      category: data.category,
      priority: toBackendPriority(data.priority)
    };
    const { body, success } = await useApiFetch('planner/tasks', 'POST', payload as any);
    if (success && body) {
      tasks.value.push(mapTask(body));
    }
    return body;
  }

  /**
   * Toggle a task's completed state.
   * Uses PATCH /planner/tasks/:id/toggle — the backend flips the status.
   */
  async function completeTask(id: number) {
    const { body, success } = await useApiFetch(`planner/tasks/${id}/toggle`, 'PATCH');
    if (success && body) {
      const idx = tasks.value.findIndex(t => t.id === id);
      if (idx >= 0) tasks.value[idx] = mapTask(body);
    }
  }

  /** Delete a task by ID. */
  async function removeTask(id: number) {
    const { success } = await useApiFetch(`planner/tasks/${id}`, 'DELETE');
    if (success) {
      tasks.value = tasks.value.filter(t => t.id !== id);
    }
  }

  /** Return tasks for a given date (sorted by time slot), used by the view-date calendar. */
  function getTasksByDate(date: string): PlannerTask[] {
    return tasks.value.filter(t => t.date === date).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }

  // ── Focus Sessions ──────────────────────────────────────────────────────────

  /**
   * Start a new focus session via POST /planner/focus.
   * Adds the returned session to the local list.
   */
  async function startFocus(taskTitle: string, duration: number, taskId?: number) {
    const payload: any = { taskTitle, duration };
    if (taskId !== undefined) payload.taskId = taskId;

    const { body, success } = await useApiFetch('planner/focus', 'POST', payload as any);
    if (success && body) {
      focusSessions.value.push(body as FocusSession);
    }
    return body;
  }

  /**
   * End an active focus session via PATCH /planner/focus/:id/end.
   * Updates the local session with actual minutes and completed flag.
   */
  async function endFocus(id: number) {
    const { body, success } = await useApiFetch(`planner/focus/${id}/end`, 'PATCH');
    if (success && body) {
      const idx = focusSessions.value.findIndex(s => s.id === id);
      if (idx >= 0) focusSessions.value[idx] = body as FocusSession;
    }
    return body;
  }

  // ── Habits ──────────────────────────────────────────────────────────────────

  /**
   * Toggle today's completion for a habit via PATCH /planner/habits/:id/toggle.
   * The backend toggles the date in completedDates and adjusts the streak.
   */
  async function toggleHabit(id: number) {
    const { body, success } = await useApiFetch(`planner/habits/${id}/toggle`, 'PATCH');
    if (success && body) {
      const idx = habits.value.findIndex(h => h.id === id);
      if (idx >= 0) habits.value[idx] = body as DailyHabit;
    }
  }

  /** Return true if the habit was completed today. */
  function isHabitDone(id: number): boolean {
    const h = habits.value.find(x => x.id === id);
    return h?.completedDates?.includes(today.value) ?? false;
  }

  /** Create a new habit via POST /planner/habits. */
  async function addHabit(name: string, icon: string) {
    const { body, success } = await useApiFetch('planner/habits', 'POST', { name, icon } as any);
    if (success && body) {
      habits.value.push(body as DailyHabit);
    }
  }

  /** Delete a habit by ID. */
  async function removeHabit(id: number) {
    const { success } = await useApiFetch(`planner/habits/${id}`, 'DELETE');
    if (success) {
      habits.value = habits.value.filter(h => h.id !== id);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {
    // State
    tasks,
    focusSessions,
    habits,
    loading,
    today,
    // Computed
    todayTasks,
    weekTasks,
    focusToday,
    stats,
    // Init
    init,
    loadTasks,
    loadHabits,
    loadFocus,
    // Tasks
    addTask,
    completeTask,
    removeTask,
    getTasksByDate,
    // Focus
    startFocus,
    endFocus,
    // Habits
    toggleHabit,
    isHabitDone,
    addHabit,
    removeHabit
  };
}
