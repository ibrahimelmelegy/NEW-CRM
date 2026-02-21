import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';
import { user } from './useUser';

export interface Priority {
  id: string;
  type: 'task' | 'deal' | 'followup' | 'meeting';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  link: string;
}

export interface Highlight {
  icon: string;
  title: string;
  description: string;
  bgClass: string;
}

export interface ScheduleItem {
  icon: string;
  title: string;
  time: string;
}

export interface KPI {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
  color: string;
}

export interface BriefingGreeting {
  message: string;
  icon: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface BriefingData {
  greeting: BriefingGreeting;
  priorities: Priority[];
  yesterdayHighlights: Highlight[];
  todaySchedule: ScheduleItem[];
  kpis: KPI[];
  loading: boolean;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getGreetingIcon(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning':
      return 'ph:sun-horizon-bold';
    case 'afternoon':
      return 'ph:sun-bold';
    case 'evening':
      return 'ph:cloud-sun-bold';
    case 'night':
      return 'ph:moon-stars-bold';
    default:
      return 'ph:sun-bold';
  }
}

function getGreetingKey(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning':
      return 'briefing.goodMorning';
    case 'afternoon':
      return 'briefing.goodAfternoon';
    case 'evening':
      return 'briefing.goodEvening';
    case 'night':
      return 'briefing.goodNight';
    default:
      return 'briefing.goodMorning';
  }
}

function generateSparkline(baseValue: number): number[] {
  const points: number[] = [];
  let val = baseValue * 0.7;
  for (let i = 0; i < 7; i++) {
    val += (Math.random() - 0.35) * baseValue * 0.15;
    points.push(Math.max(0, Math.round(val * 100) / 100));
  }
  return points;
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const date = new Date(dateStr);
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function daysSinceUpdate(dateStr: string): number {
  if (!dateStr) return 999;
  const now = new Date().getTime();
  const updated = new Date(dateStr).getTime();
  return Math.floor((now - updated) / (1000 * 60 * 60 * 24));
}

export function useDailyBriefing() {
  const loading = ref(false);
  const priorities = ref<Priority[]>([]);
  const yesterdayHighlights = ref<Highlight[]>([]);
  const todaySchedule = ref<ScheduleItem[]>([]);
  const kpis = ref<KPI[]>([]);

  const timeOfDay = getTimeOfDay();

  const greeting = computed<BriefingGreeting>(() => ({
    message: getGreetingKey(timeOfDay),
    icon: getGreetingIcon(timeOfDay),
    timeOfDay
  }));

  async function fetchBriefing() {
    loading.value = true;

    try {
      const [insightsRes, tasksRes, activityRes, calendarRes, dealsRes, leadsRes] = await Promise.all([
        useApiFetch('insights/leads-sales', 'GET', {}, true),
        useApiFetch('daily-task?limit=100', 'GET', {}, true),
        useApiFetch('activity?page=1&limit=20', 'GET', {}, true),
        useApiFetch('calendar/events', 'GET', {}, true),
        useApiFetch('deal?limit=5&sort=DESC&sortBy=createdAt', 'GET', {}, true),
        useApiFetch('lead?limit=5&sort=DESC&sortBy=createdAt', 'GET', {}, true)
      ]);

      // --- Generate Priorities ---
      const generatedPriorities: Priority[] = [];

      // 1. Overdue tasks
      if (tasksRes.success && tasksRes.body) {
        const tasks = tasksRes.body?.docs || (Array.isArray(tasksRes.body) ? tasksRes.body : []);
        const overdueTasks = tasks.filter((t: any) => {
          const dueDate = t.endDate || t.dueDate;
          return dueDate && isOverdue(dueDate) && t.status !== 'COMPLETED';
        });
        if (overdueTasks.length > 0) {
          generatedPriorities.push({
            id: 'overdue-tasks',
            type: 'task',
            title: 'briefing.overdueTasks',
            description: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past due date`,
            urgency: 'high',
            link: '/operations/daily-task'
          });
        }

        // Follow-ups due today
        const todayTasks = tasks.filter((t: any) => {
          const dueDate = t.endDate || t.dueDate;
          return dueDate && isToday(dueDate) && t.status !== 'COMPLETED';
        });
        if (todayTasks.length > 0) {
          generatedPriorities.push({
            id: 'followups-today',
            type: 'followup',
            title: 'briefing.followUpsDue',
            description: `${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today`,
            urgency: 'medium',
            link: '/operations/daily-task'
          });
        }

        // Tasks completed today for highlights
        const completedToday = tasks.filter((t: any) => t.status === 'COMPLETED' && isToday(t.updatedAt));
        if (completedToday.length > 0) {
          yesterdayHighlights.value.push({
            icon: 'ph:check-circle-bold',
            title: `${completedToday.length} Tasks Completed`,
            description: 'Great productivity!',
            bgClass: 'bg-green-500/20 text-green-400'
          });
        }
      }

      // 2. Deals at risk (no recent activity in 7+ days)
      if (dealsRes.success && dealsRes.body) {
        const deals = dealsRes.body?.rows || dealsRes.body?.docs || (Array.isArray(dealsRes.body) ? dealsRes.body : []);
        const atRiskDeals = deals.filter((d: any) => daysSinceUpdate(d.updatedAt) >= 7);
        if (atRiskDeals.length > 0) {
          generatedPriorities.push({
            id: 'deals-at-risk',
            type: 'deal',
            title: 'briefing.dealsAtRisk',
            description: `${atRiskDeals.length} deal${atRiskDeals.length > 1 ? 's' : ''} — ${'briefing.noActivity'}`,
            urgency: 'high',
            link: '/sales/deals'
          });
        }

        // New deals for highlights
        const recentDeals = deals.filter((d: any) => {
          const created = new Date(d.createdAt);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return created >= yesterday && created <= today;
        });
        if (recentDeals.length > 0) {
          yesterdayHighlights.value.push({
            icon: 'ph:handshake-bold',
            title: `${recentDeals.length} New Deal${recentDeals.length > 1 ? 's' : ''}`,
            description: 'Recently created deals',
            bgClass: 'bg-purple-500/20 text-purple-400'
          });
        }
      }

      // 3. Calendar events today (meetings)
      if (calendarRes.success && calendarRes.body) {
        const events = Array.isArray(calendarRes.body) ? calendarRes.body : calendarRes.body?.rows || calendarRes.body?.docs || [];
        const todayEvents = events.filter((e: any) => {
          const eventDate = e.startDate || e.start || e.date;
          return eventDate && isToday(eventDate);
        });

        if (todayEvents.length > 0) {
          generatedPriorities.push({
            id: 'meetings-today',
            type: 'meeting',
            title: 'briefing.meetingsToday',
            description: `${todayEvents.length} meeting${todayEvents.length > 1 ? 's' : ''} scheduled`,
            urgency: 'medium',
            link: '/calendar'
          });
        }

        // Build today's schedule
        todaySchedule.value = todayEvents.map((e: any) => {
          const startTime = e.startDate || e.start || e.date;
          const formatted = startTime ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All day';
          return {
            icon: e.type === 'call' ? 'ph:phone-bold' : 'ph:calendar-bold',
            title: e.title || e.name || 'Event',
            time: formatted
          };
        });
      }

      // 4. Activity highlights
      if (activityRes.success && activityRes.body) {
        const activities = Array.isArray(activityRes.body) ? activityRes.body : activityRes.body?.rows || [];
        if (activities.length > 0) {
          yesterdayHighlights.value.push({
            icon: 'ph:lightning-bold',
            title: `${activities.length} Activities Logged`,
            description: 'Recent team activity',
            bgClass: 'bg-blue-500/20 text-blue-400'
          });
        }
      }

      // 5. New leads highlight
      if (leadsRes.success && leadsRes.body) {
        const leads = leadsRes.body?.rows || leadsRes.body?.docs || (Array.isArray(leadsRes.body) ? leadsRes.body : []);
        const recentLeads = leads.filter((l: any) => {
          const created = new Date(l.createdAt);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          return created >= yesterday;
        });
        if (recentLeads.length > 0) {
          yesterdayHighlights.value.push({
            icon: 'ph:user-plus-bold',
            title: `${recentLeads.length} New Lead${recentLeads.length > 1 ? 's' : ''}`,
            description: 'New leads added recently',
            bgClass: 'bg-cyan-500/20 text-cyan-400'
          });
        }
      }

      priorities.value = generatedPriorities;

      // --- Generate KPIs ---
      const insightsData = insightsRes.success ? insightsRes.body : null;
      const revenue = insightsData?.revenueFromDeals || insightsData?.totalRevenue || 0;
      const pipelineValue = insightsData?.pipelineValue || insightsData?.dealsCount * 5000 || 0;
      const conversionRate = insightsData?.leadConversionRate || insightsData?.conversionRate || 0;

      const tasksData = tasksRes.success ? tasksRes.body : null;
      const allTasks = tasksData?.docs || (Array.isArray(tasksData) ? tasksData : []);
      const completedCount = allTasks.filter((t: any) => t.status === 'COMPLETED').length;

      const revenueSparkline = generateSparkline(revenue || 10000);
      const pipelineSparkline = generateSparkline(pipelineValue || 50000);
      const conversionSparkline = generateSparkline(conversionRate || 15);
      const tasksSparkline = generateSparkline(completedCount || 5);

      const calcChange = (sparkline: number[]): number => {
        if (sparkline.length < 2) return 0;
        const last = sparkline[sparkline.length - 1];
        const prev = sparkline[sparkline.length - 2];
        if (prev === 0) return 0;
        return Math.round(((last - prev) / prev) * 100);
      };

      kpis.value = [
        {
          label: 'briefing.revenue',
          value:
            revenue >= 1000000
              ? `$${(revenue / 1000000).toFixed(1)}M`
              : revenue >= 1000
                ? `$${(revenue / 1000).toFixed(1)}K`
                : `$${revenue.toLocaleString()}`,
          change: calcChange(revenueSparkline),
          sparkline: revenueSparkline,
          color: '#22c55e'
        },
        {
          label: 'briefing.pipelineValue',
          value:
            pipelineValue >= 1000000
              ? `$${(pipelineValue / 1000000).toFixed(1)}M`
              : pipelineValue >= 1000
                ? `$${(pipelineValue / 1000).toFixed(1)}K`
                : `$${pipelineValue.toLocaleString()}`,
          change: calcChange(pipelineSparkline),
          sparkline: pipelineSparkline,
          color: '#8b5cf6'
        },
        {
          label: 'briefing.conversionRate',
          value: `${Number(conversionRate).toFixed(1)}%`,
          change: calcChange(conversionSparkline),
          sparkline: conversionSparkline,
          color: '#3b82f6'
        },
        {
          label: 'briefing.tasksCompleted',
          value: String(completedCount),
          change: calcChange(tasksSparkline),
          sparkline: tasksSparkline,
          color: '#f59e0b'
        }
      ];
    } catch (error) {
      console.error('Failed to fetch briefing data:', error);
    } finally {
      loading.value = false;
    }
  }

  return {
    greeting,
    priorities,
    yesterdayHighlights,
    todaySchedule,
    kpis,
    loading,
    fetchBriefing
  };
}
