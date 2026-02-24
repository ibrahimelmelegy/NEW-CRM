interface SpeedDialAction {
  icon: string;
  label: string;
  color?: string;
  action: () => void;
}

export function useSpeedDial() {
  const route = useRoute();
  const router = useRouter();
  const isOpen = ref(false);

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  const close = () => {
    isOpen.value = false;
  };

  const actions = computed<SpeedDialAction[]>(() => {
    const path = route.path;

    // Dashboard pages
    if (path.startsWith('/dashboard') || path === '/') {
      return [
        { icon: 'ph:plus-bold', label: 'New Lead', color: '#3B82F6', action: () => router.push('/sales/leads/create') },
        { icon: 'ph:handshake-bold', label: 'New Deal', color: '#8B5CF6', action: () => router.push('/sales/deals/add-deal') },
        { icon: 'ph:chart-line-up-bold', label: 'Analytics', color: '#10B981', action: () => router.push('/analytics') },
        { icon: 'ph:target-bold', label: 'War Room', color: '#F59E0B', action: () => router.push('/dashboard/war-room') }
      ];
    }

    // Sales - Leads
    if (path.startsWith('/sales/leads')) {
      return [
        { icon: 'ph:user-plus-bold', label: 'New Lead', color: '#3B82F6', action: () => router.push('/sales/leads/create') },
        { icon: 'ph:upload-bold', label: 'Import', color: '#10B981', action: () => router.push('/sales/leads/import') },
        { icon: 'ph:funnel-bold', label: 'Lead Scoring', color: '#F59E0B', action: () => router.push('/settings/lead-scoring') }
      ];
    }

    // Sales - Deals
    if (path.startsWith('/sales/deals')) {
      return [
        { icon: 'ph:handshake-bold', label: 'New Deal', color: '#8B5CF6', action: () => router.push('/sales/deals/add-deal') },
        { icon: 'ph:columns-bold', label: 'Kanban View', color: '#3B82F6', action: () => router.push('/sales/deals/kanban') },
        { icon: 'ph:chart-pie-bold', label: 'Pipeline', color: '#10B981', action: () => router.push('/settings/pipeline') }
      ];
    }

    // Sales - Clients
    if (path.startsWith('/sales/clients')) {
      return [
        { icon: 'ph:buildings-bold', label: 'New Client', color: '#3B82F6', action: () => router.push('/sales/clients/create') },
        { icon: 'ph:export-bold', label: 'Export', color: '#10B981', action: () => {} }
      ];
    }

    // Tasks
    if (path.startsWith('/tasks')) {
      return [
        { icon: 'ph:check-circle-bold', label: 'New Task', color: '#3B82F6', action: () => router.push('/tasks/create') },
        { icon: 'ph:calendar-bold', label: 'Calendar', color: '#8B5CF6', action: () => router.push('/calendar') }
      ];
    }

    // Analytics
    if (path.startsWith('/analytics')) {
      return [
        { icon: 'ph:fire-bold', label: 'Heatmap', color: '#EF4444', action: () => router.push('/analytics/heatmap') },
        { icon: 'ph:graph-bold', label: 'Relationships', color: '#8B5CF6', action: () => router.push('/analytics/relationship-graph') },
        { icon: 'ph:chart-bar-bold', label: 'Reports', color: '#3B82F6', action: () => router.push('/reports') }
      ];
    }

    // Settings
    if (path.startsWith('/settings')) {
      return [
        { icon: 'ph:palette-bold', label: 'Theme Studio', color: '#8B5CF6', action: () => router.push('/settings/theme-studio') },
        { icon: 'ph:gear-bold', label: 'Workflows', color: '#3B82F6', action: () => router.push('/settings/workflows') },
        { icon: 'ph:shield-check-bold', label: 'Security', color: '#10B981', action: () => router.push('/settings/security') }
      ];
    }

    // Default actions for any other page
    return [
      { icon: 'ph:user-plus-bold', label: 'New Lead', color: '#3B82F6', action: () => router.push('/sales/leads/create') },
      { icon: 'ph:handshake-bold', label: 'New Deal', color: '#8B5CF6', action: () => router.push('/sales/deals/add-deal') },
      { icon: 'ph:magnifying-glass-bold', label: 'Search', color: '#F59E0B', action: () => {} }
    ];
  });

  function executeAction(action: SpeedDialAction) {
    action.action();
    close();
  }

  // Close on route change
  watch(() => route.path, close);

  // Close on outside click
  function onClickOutside(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.speed-dial-container')) {
      close();
    }
  }

  onMounted(() => document.addEventListener('click', onClickOutside));
  onUnmounted(() => document.removeEventListener('click', onClickOutside));

  return { actions, isOpen, toggle, close, executeAction };
}
