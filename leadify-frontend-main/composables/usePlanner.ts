/**
 * Personal Planner System
 * Daily task planner with time blocking, habits, and focus sessions.
 */
import { ref, computed } from 'vue';

export interface PlannerTask {
    id: string;
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
    id: string;
    taskId?: string;
    taskTitle: string;
    startedAt: string;
    endedAt?: string;
    duration: number; // minutes planned
    actualMinutes?: number;
    completed: boolean;
}

export interface DailyHabit {
    id: string;
    name: string;
    icon: string;
    streak: number;
    completedDates: string[]; // YYYY-MM-DD[]
}

const TASKS_KEY = 'crm_planner_tasks';
const FOCUS_KEY = 'crm_focus_sessions';
const HABITS_KEY = 'crm_daily_habits';

function load<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch { return fallback; }
}
function save(key: string, data: unknown) { localStorage.setItem(key, JSON.stringify(data)); }

const tasks = ref<PlannerTask[]>(load(TASKS_KEY, []));
const focusSessions = ref<FocusSession[]>(load(FOCUS_KEY, []));
const habits = ref<DailyHabit[]>(load(HABITS_KEY, [
    { id: 'h1', name: 'Exercise', icon: '💪', streak: 0, completedDates: [] },
    { id: 'h2', name: 'Read 30min', icon: '📚', streak: 0, completedDates: [] },
    { id: 'h3', name: 'Meditate', icon: '🧘', streak: 0, completedDates: [] },
    { id: 'h4', name: 'Drink Water', icon: '💧', streak: 0, completedDates: [] },
]));

export function usePlanner() {
    const today = computed(() => new Date().toISOString().slice(0, 10));

    const todayTasks = computed(() =>
        tasks.value.filter(t => t.date === today.value)
            .sort((a, b) => (a.timeSlot || '23:59').localeCompare(b.timeSlot || '23:59'))
    );

    const todayCompleted = computed(() => todayTasks.value.filter(t => t.completed).length);
    const todayTotal = computed(() => todayTasks.value.length);
    const todayProgress = computed(() => todayTotal.value > 0 ? Math.round((todayCompleted.value / todayTotal.value) * 100) : 0);

    const weekTasks = computed(() => {
        const start = new Date(); start.setDate(start.getDate() - start.getDay());
        const end = new Date(start); end.setDate(end.getDate() + 6);
        const s = start.toISOString().slice(0, 10);
        const e = end.toISOString().slice(0, 10);
        return tasks.value.filter(t => t.date >= s && t.date <= e);
    });

    const focusToday = computed(() => {
        const t = today.value;
        return focusSessions.value.filter(f => f.startedAt.startsWith(t));
    });

    const focusTotalMinutes = computed(() =>
        focusToday.value.reduce((s, f) => s + (f.actualMinutes || 0), 0)
    );

    const stats = computed(() => ({
        todayTasks: todayTotal.value,
        todayCompleted: todayCompleted.value,
        todayProgress: todayProgress.value,
        focusSessions: focusToday.value.length,
        focusMinutes: focusTotalMinutes.value,
        weekTaskCount: weekTasks.value.length,
        weekCompleted: weekTasks.value.filter(t => t.completed).length,
        currentStreak: Math.max(...habits.value.map(h => h.streak), 0),
    }));

    // ── Tasks ──
    function addTask(data: Omit<PlannerTask, 'id' | 'completed'>): PlannerTask {
        const task: PlannerTask = { ...data, id: `pt_${Date.now()}`, completed: false };
        tasks.value.push(task);
        save(TASKS_KEY, tasks.value);
        return task;
    }

    function completeTask(id: string) {
        const t = tasks.value.find(x => x.id === id);
        if (t) { t.completed = !t.completed; t.completedAt = t.completed ? new Date().toISOString() : undefined; save(TASKS_KEY, tasks.value); }
    }

    function removeTask(id: string) { tasks.value = tasks.value.filter(t => t.id !== id); save(TASKS_KEY, tasks.value); }

    function getTasksByDate(date: string) { return tasks.value.filter(t => t.date === date).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || '')); }

    // ── Focus Sessions ──
    function startFocus(taskTitle: string, duration: number, taskId?: string): FocusSession {
        const session: FocusSession = { id: `fs_${Date.now()}`, taskId, taskTitle, startedAt: new Date().toISOString(), duration, completed: false };
        focusSessions.value.push(session);
        save(FOCUS_KEY, focusSessions.value);
        return session;
    }

    function endFocus(id: string) {
        const s = focusSessions.value.find(x => x.id === id);
        if (s) {
            s.endedAt = new Date().toISOString();
            s.actualMinutes = Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000);
            s.completed = true;
            save(FOCUS_KEY, focusSessions.value);
        }
    }

    // ── Habits ──
    function toggleHabit(id: string) {
        const h = habits.value.find(x => x.id === id);
        if (!h) return;
        const t = today.value;
        if (h.completedDates.includes(t)) {
            h.completedDates = h.completedDates.filter(d => d !== t);
            h.streak = Math.max(0, h.streak - 1);
        } else {
            h.completedDates.push(t);
            h.streak++;
        }
        save(HABITS_KEY, habits.value);
    }

    function isHabitDone(id: string): boolean {
        const h = habits.value.find(x => x.id === id);
        return h?.completedDates.includes(today.value) || false;
    }

    function addHabit(name: string, icon: string) {
        habits.value.push({ id: `hab_${Date.now()}`, name, icon, streak: 0, completedDates: [] });
        save(HABITS_KEY, habits.value);
    }

    function removeHabit(id: string) { habits.value = habits.value.filter(h => h.id !== id); save(HABITS_KEY, habits.value); }

    return {
        tasks, todayTasks, weekTasks, focusSessions, focusToday, habits, stats, today,
        addTask, completeTask, removeTask, getTasksByDate,
        startFocus, endFocus,
        toggleHabit, isHabitDone, addHabit, removeHabit,
    };
}
