/**
 * Personal Planner System
 * Daily task planner with time blocking, habits, and focus sessions.
 * Backed by /api/planner endpoints.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

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

function mapTask(t: any): PlannerTask {
    return {
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        date: t.date,
        timeSlot: t.timeSlot || undefined,
        duration: t.duration || 60,
        category: t.category || 'work',
        priority: t.priority || 'medium',
        completed: t.status === 'completed',
        completedAt: t.completedAt || undefined,
    };
}

const tasks = ref<PlannerTask[]>([]);
const focusSessions = ref<FocusSession[]>([]);
const habits = ref<DailyHabit[]>([]);
const loading = ref(false);

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
        return focusSessions.value.filter(f => f.startedAt?.startsWith(t));
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

    // ── Data Loading ──
    async function loadTasks(date: string) {
        const { body, success } = await useApiFetch(`planner/tasks?date=${date}`);
        if (success && Array.isArray(body)) {
            const mapped = body.map(mapTask);
            tasks.value = tasks.value.filter(t => t.date !== date).concat(mapped);
        }
    }

    async function loadHabits() {
        const { body, success } = await useApiFetch('planner/habits');
        if (success && Array.isArray(body)) habits.value = body;
    }

    async function loadFocus(date: string) {
        const { body, success } = await useApiFetch(`planner/focus?date=${date}`);
        if (success && Array.isArray(body)) focusSessions.value = body;
    }

    async function init() {
        loading.value = true;
        await Promise.all([loadTasks(today.value), loadHabits(), loadFocus(today.value)]);
        loading.value = false;
    }

    // ── Tasks ──
    async function addTask(data: Omit<PlannerTask, 'id' | 'completed'>) {
        const { body, success } = await useApiFetch('planner/tasks', 'POST', data as any);
        if (success && body) tasks.value.push(mapTask(body));
        return body;
    }

    async function completeTask(id: number) {
        const { body, success } = await useApiFetch(`planner/tasks/${id}/toggle`, 'PATCH');
        if (success && body) {
            const idx = tasks.value.findIndex(t => t.id === id);
            if (idx >= 0) tasks.value[idx] = mapTask(body);
        }
    }

    async function removeTask(id: number) {
        const { success } = await useApiFetch(`planner/tasks/${id}`, 'DELETE');
        if (success) tasks.value = tasks.value.filter(t => t.id !== id);
    }

    function getTasksByDate(date: string) {
        return tasks.value.filter(t => t.date === date)
            .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    }

    // ── Focus Sessions ──
    async function startFocus(taskTitle: string, duration: number, taskId?: number) {
        const { body, success } = await useApiFetch('planner/focus', 'POST', { taskTitle, duration, taskId } as any);
        if (success && body) focusSessions.value.push(body);
        return body;
    }

    async function endFocus(id: number) {
        const { body, success } = await useApiFetch(`planner/focus/${id}/end`, 'PATCH');
        if (success && body) {
            const idx = focusSessions.value.findIndex(s => s.id === id);
            if (idx >= 0) focusSessions.value[idx] = body;
        }
    }

    // ── Habits ──
    async function toggleHabit(id: number) {
        const { body, success } = await useApiFetch(`planner/habits/${id}/toggle`, 'PATCH');
        if (success && body) {
            const idx = habits.value.findIndex(h => h.id === id);
            if (idx >= 0) habits.value[idx] = body;
        }
    }

    function isHabitDone(id: number): boolean {
        const h = habits.value.find(x => x.id === id);
        return h?.completedDates?.includes(today.value) || false;
    }

    async function addHabit(name: string, icon: string) {
        const { body, success } = await useApiFetch('planner/habits', 'POST', { name, icon } as any);
        if (success && body) habits.value.push(body);
    }

    async function removeHabit(id: number) {
        const { success } = await useApiFetch(`planner/habits/${id}`, 'DELETE');
        if (success) habits.value = habits.value.filter(h => h.id !== id);
    }

    return {
        tasks, todayTasks, weekTasks, focusSessions, focusToday, habits, stats, today, loading,
        init, loadTasks, loadHabits, loadFocus,
        addTask, completeTask, removeTask, getTasksByDate,
        startFocus, endFocus,
        toggleHabit, isHabitDone, addHabit, removeHabit,
    };
}
