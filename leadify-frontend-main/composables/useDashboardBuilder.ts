import { ElNotification } from 'element-plus';

export interface BuilderWidget {
  id: string;
  type: string;
  colSpan: number; // 1-4 (grid columns)
  rowSpan: number; // 1-2
  config?: Record<string, any>;
}

export interface BuilderLayout {
  name: string;
  widgets: BuilderWidget[];
}

export interface WidgetDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultSpan: { col: number; row: number };
}

const STORAGE_KEY = 'crm-dashboard-builder-layout';

export function useDashboardBuilder() {
  const editMode = ref(true);
  const dashboardWidgets = ref<BuilderWidget[]>([]);

  const availableWidgets: WidgetDefinition[] = [
    { type: 'kpi-revenue', label: 'Revenue KPI', description: 'Total revenue card', icon: 'ph:currency-dollar-bold', color: '#10B981', defaultSpan: { col: 1, row: 1 } },
    { type: 'kpi-deals', label: 'Deals Count', description: 'Active deals counter', icon: 'ph:handshake-bold', color: '#8B5CF6', defaultSpan: { col: 1, row: 1 } },
    { type: 'kpi-leads', label: 'Leads Count', description: 'Open leads counter', icon: 'ph:users-bold', color: '#3B82F6', defaultSpan: { col: 1, row: 1 } },
    { type: 'kpi-conversion', label: 'Conversion Rate', description: 'Lead to deal ratio', icon: 'ph:chart-line-up-bold', color: '#F59E0B', defaultSpan: { col: 1, row: 1 } },
    { type: 'chart-pipeline', label: 'Pipeline Chart', description: 'Deals by stage bar chart', icon: 'ph:chart-bar-bold', color: '#8B5CF6', defaultSpan: { col: 2, row: 1 } },
    { type: 'chart-lead-sources', label: 'Lead Sources', description: 'Sources pie chart', icon: 'ph:chart-pie-bold', color: '#3B82F6', defaultSpan: { col: 2, row: 1 } },
    { type: 'chart-win-loss', label: 'Win/Loss Ratio', description: 'Win vs loss donut', icon: 'ph:trophy-bold', color: '#10B981', defaultSpan: { col: 1, row: 1 } },
    { type: 'chart-funnel', label: 'Conversion Funnel', description: 'Sales funnel visualization', icon: 'ph:funnel-bold', color: '#F59E0B', defaultSpan: { col: 2, row: 1 } },
    { type: 'chart-revenue-trend', label: 'Revenue Trend', description: 'Monthly revenue line chart', icon: 'ph:trend-up-bold', color: '#EF4444', defaultSpan: { col: 2, row: 1 } },
    { type: 'table-recent-deals', label: 'Recent Deals', description: 'Latest deal updates', icon: 'ph:table-bold', color: '#8B5CF6', defaultSpan: { col: 2, row: 1 } },
    { type: 'table-team', label: 'Team Performance', description: 'Team metrics table', icon: 'ph:users-three-bold', color: '#3B82F6', defaultSpan: { col: 2, row: 1 } },
    { type: 'feed-activities', label: 'Activity Feed', description: 'Recent activities stream', icon: 'ph:lightning-bold', color: '#F59E0B', defaultSpan: { col: 1, row: 2 } },
    { type: 'feed-notifications', label: 'Notifications', description: 'Latest notifications', icon: 'ph:bell-bold', color: '#EF4444', defaultSpan: { col: 1, row: 1 } },
    { type: 'calendar-upcoming', label: 'Upcoming Events', description: 'Calendar events list', icon: 'ph:calendar-bold', color: '#10B981', defaultSpan: { col: 1, row: 1 } },
    { type: 'progress-targets', label: 'Sales Targets', description: 'Target vs actual progress', icon: 'ph:target-bold', color: '#8B5CF6', defaultSpan: { col: 2, row: 1 } },
  ];

  const presets: Record<string, BuilderWidget[]> = {
    executive: [
      { id: 'e1', type: 'kpi-revenue', colSpan: 1, rowSpan: 1 },
      { id: 'e2', type: 'kpi-deals', colSpan: 1, rowSpan: 1 },
      { id: 'e3', type: 'kpi-leads', colSpan: 1, rowSpan: 1 },
      { id: 'e4', type: 'kpi-conversion', colSpan: 1, rowSpan: 1 },
      { id: 'e5', type: 'chart-pipeline', colSpan: 2, rowSpan: 1 },
      { id: 'e6', type: 'chart-revenue-trend', colSpan: 2, rowSpan: 1 },
      { id: 'e7', type: 'table-team', colSpan: 2, rowSpan: 1 },
      { id: 'e8', type: 'feed-activities', colSpan: 2, rowSpan: 1 },
    ],
    sales: [
      { id: 's1', type: 'kpi-revenue', colSpan: 1, rowSpan: 1 },
      { id: 's2', type: 'kpi-deals', colSpan: 1, rowSpan: 1 },
      { id: 's3', type: 'chart-win-loss', colSpan: 1, rowSpan: 1 },
      { id: 's4', type: 'kpi-conversion', colSpan: 1, rowSpan: 1 },
      { id: 's5', type: 'chart-funnel', colSpan: 2, rowSpan: 1 },
      { id: 's6', type: 'chart-lead-sources', colSpan: 2, rowSpan: 1 },
      { id: 's7', type: 'table-recent-deals', colSpan: 4, rowSpan: 1 },
    ],
    activity: [
      { id: 'a1', type: 'kpi-leads', colSpan: 1, rowSpan: 1 },
      { id: 'a2', type: 'kpi-deals', colSpan: 1, rowSpan: 1 },
      { id: 'a3', type: 'calendar-upcoming', colSpan: 1, rowSpan: 1 },
      { id: 'a4', type: 'feed-notifications', colSpan: 1, rowSpan: 1 },
      { id: 'a5', type: 'feed-activities', colSpan: 2, rowSpan: 1 },
      { id: 'a6', type: 'progress-targets', colSpan: 2, rowSpan: 1 },
    ],
  };

  function generateId(): string {
    return `w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  function addWidget(type: string) {
    const def = availableWidgets.find(w => w.type === type);
    if (!def) return;
    dashboardWidgets.value.push({
      id: generateId(),
      type,
      colSpan: def.defaultSpan.col,
      rowSpan: def.defaultSpan.row,
    });
  }

  function removeWidget(index: number) {
    dashboardWidgets.value.splice(index, 1);
  }

  function resizeWidget(index: number, direction: 'grow' | 'shrink') {
    const widget = dashboardWidgets.value[index];
    if (!widget) return;
    if (direction === 'grow') {
      widget.colSpan = Math.min(widget.colSpan + 1, 4);
    } else {
      widget.colSpan = Math.max(widget.colSpan - 1, 1);
    }
  }

  function loadPreset(presetName: string) {
    const preset = presets[presetName];
    if (!preset) return;
    dashboardWidgets.value = preset.map(w => ({
      ...w,
      id: generateId(),
    }));
  }

  function saveDashboard() {
    try {
      const layout: BuilderLayout = {
        name: 'custom',
        widgets: JSON.parse(JSON.stringify(dashboardWidgets.value)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      ElNotification({ type: 'success', title: 'Dashboard Saved', message: 'Your layout has been saved.' });
    } catch (e) {
      console.error('Failed to save dashboard layout:', e);
      ElNotification({ type: 'error', title: 'Save Failed', message: 'Could not save dashboard layout.' });
    }
  }

  function loadDashboard() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const layout: BuilderLayout = JSON.parse(raw);
        if (layout.widgets && layout.widgets.length) {
          dashboardWidgets.value = layout.widgets;
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard layout:', e);
    }
    // Default: load executive preset on first visit
    loadPreset('executive');
  }

  function toggleEditMode() {
    editMode.value = !editMode.value;
  }

  function getWidgetStyle(widget: BuilderWidget) {
    return {
      gridColumn: `span ${widget.colSpan}`,
      gridRow: `span ${widget.rowSpan}`,
    };
  }

  return {
    editMode,
    dashboardWidgets,
    availableWidgets,
    addWidget,
    removeWidget,
    resizeWidget,
    loadPreset,
    saveDashboard,
    loadDashboard,
    toggleEditMode,
    getWidgetStyle,
  };
}
