import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: 'page' | 'action' | 'search' | 'command' | 'recent';
  path?: string;
  action?: () => void;
  keywords?: string[];
  // Permissions required to see this item (any of these permissions allows access)
  permissions?: string[];
  // Optional shortcut hint displayed alongside the item (e.g. "G then D")
  shortcutHint?: string;
}

// State
const isOpen = ref(false);
const searchQuery = ref('');
const selectedIndex = ref(0);
const userPermissions = ref<string[]>([]);
const isAdmin = ref(false);
const searchResults = ref<SpotlightItem[]>([]);
const searchLoading = ref(false);
const recentItems = ref<SpotlightItem[]>([]);
let searchDebounceTimer: ReturnType<typeof setTimeout>;

// Load recent items from localStorage on init (client-side only)
if (typeof window !== 'undefined') {
  try {
    const savedRecent = localStorage.getItem('crm_spotlight_recent');
    if (savedRecent) recentItems.value = JSON.parse(savedRecent);
  } catch { /* ignore parse errors */ }
}

function trackRecent(item: SpotlightItem) {
  // Only track items with a path (navigable items)
  if (!item.path) return;
  // Remove if already in recent
  recentItems.value = recentItems.value.filter(r => r.path !== item.path);
  // Create a copy with 'recent' category for display purposes
  const recentCopy: SpotlightItem = { ...item, category: 'recent' };
  // Add to front
  recentItems.value.unshift(recentCopy);
  // Keep only 5
  recentItems.value = recentItems.value.slice(0, 5);
  // Persist
  try {
    localStorage.setItem('crm_spotlight_recent', JSON.stringify(recentItems.value));
  } catch { /* ignore storage errors */ }
}

// All available items with permissions
const spotlightItems: SpotlightItem[] = [
  // ========== PAGES ==========

  // Dashboard - everyone can see
  { id: 'dashboard', title: 'Dashboard', icon: 'ph:house-bold', category: 'page', path: '/', keywords: ['home', 'main'], shortcutHint: 'G then D' },

  // Sales Pages
  {
    id: 'leads',
    title: 'Leads',
    icon: 'ph:users-bold',
    category: 'page',
    path: '/sales/leads',
    keywords: ['sales', 'prospects'],
    permissions: ['VIEW_OWN_LEADS', 'VIEW_GLOBAL_LEADS'],
    shortcutHint: 'G then L'
  },
  {
    id: 'clients',
    title: 'Clients',
    icon: 'ph:user-circle-bold',
    category: 'page',
    path: '/sales/clients',
    keywords: ['customers'],
    permissions: ['VIEW_OWN_CLIENTS', 'VIEW_GLOBAL_CLIENTS']
  },
  {
    id: 'opportunities',
    title: 'Opportunities',
    icon: 'ph:target-bold',
    category: 'page',
    path: '/sales/opportunity',
    keywords: ['chance', 'deal'],
    permissions: ['VIEW_OWN_OPPORTUNITIES', 'VIEW_GLOBAL_OPPORTUNITIES']
  },
  {
    id: 'deals',
    title: 'Deals',
    icon: 'ph:handshake-bold',
    category: 'page',
    path: '/sales/deals',
    keywords: ['contracts'],
    permissions: ['VIEW_OWN_DEALS', 'VIEW_GLOBAL_DEALS'],
    shortcutHint: 'G then E'
  },
  {
    id: 'proposals',
    title: 'Proposals',
    icon: 'ph:file-text-bold',
    category: 'page',
    path: '/sales/proposals',
    keywords: ['quotes'],
    permissions: ['VIEW_OWN_PROPOSALS', 'VIEW_GLOBAL_PROPOSALS']
  },

  // Operations Pages
  {
    id: 'projects',
    title: 'Projects',
    icon: 'ph:folder-bold',
    category: 'page',
    path: '/operations/projects',
    keywords: ['project'],
    permissions: ['VIEW_OWN_PROJECTS', 'VIEW_GLOBAL_PROJECTS'],
    shortcutHint: 'G then P'
  },
  {
    id: 'daily-tasks',
    title: 'Daily Tasks',
    icon: 'ph:check-square-bold',
    category: 'page',
    path: '/operations/daily-task',
    keywords: ['tasks', 'todo'],
    permissions: ['VIEW_OWN_PROJECTS', 'VIEW_GLOBAL_PROJECTS'],
    shortcutHint: 'G then T'
  },
  {
    id: 'manpower',
    title: 'Manpower',
    icon: 'ph:users-three-bold',
    category: 'page',
    path: '/operations/manpower',
    keywords: ['employees', 'workers'],
    permissions: ['VIEW_MANPOWER']
  },
  {
    id: 'vehicles',
    title: 'Vehicles',
    icon: 'ph:car-bold',
    category: 'page',
    path: '/operations/vehicle',
    keywords: ['cars', 'trucks'],
    permissions: ['VIEW_VEHICLES']
  },
  {
    id: 'assets',
    title: 'Assets',
    icon: 'ph:cube-bold',
    category: 'page',
    path: '/operations/assets',
    keywords: ['equipment'],
    permissions: ['VIEW_ASSETS']
  },
  {
    id: 'services',
    title: 'Services',
    icon: 'ph:wrench-bold',
    category: 'page',
    path: '/operations/services',
    keywords: ['service'],
    permissions: ['VIEW_SERVICES']
  },
  {
    id: 'additional-material',
    title: 'Additional Materials',
    icon: 'ph:package-bold',
    category: 'page',
    path: '/operations/additional-material',
    keywords: ['materials'],
    permissions: ['VIEW_ADDITIONAL_MATERIAL']
  },

  // Staff & Roles
  {
    id: 'staff',
    title: 'Staff',
    icon: 'ph:identification-badge-bold',
    category: 'page',
    path: '/staff',
    keywords: ['employees', 'team'],
    permissions: ['VIEW_OWN_STAFF', 'VIEW_GLOBAL_STAFF']
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    icon: 'ph:shield-check-bold',
    category: 'page',
    path: '/roles',
    keywords: ['permissions'],
    permissions: ['VIEW_ROLES']
  },

  // Reports
  {
    id: 'reports',
    title: 'Reports',
    icon: 'ph:chart-bar-bold',
    category: 'page',
    path: '/reports',
    keywords: ['analytics', 'statistics'],
    permissions: ['EXPORT_OWN_REPORTS', 'EXPORT_GLOBAL_REPORTS', 'EXPORT_SALES_REPORTS', 'EXPORT_PROJECT_REPORTS']
  },

  // Notifications - everyone can see
  { id: 'notifications', title: 'Notifications', icon: 'ph:bell-bold', category: 'page', path: '/notification', keywords: ['alerts'] },

  // ========== QUICK ACTIONS ==========

  // Sales Actions
  {
    id: 'add-lead',
    title: 'Create New Lead',
    icon: 'ph:user-plus-bold',
    category: 'action',
    path: '/sales/leads/add-lead',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_LEADS']
  },
  {
    id: 'add-client',
    title: 'Create New Client',
    icon: 'ph:user-circle-plus-bold',
    category: 'action',
    path: '/sales/clients/add-client',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_CLIENTS']
  },
  {
    id: 'add-opportunity',
    title: 'Create New Opportunity',
    icon: 'ph:plus-circle-bold',
    category: 'action',
    path: '/sales/opportunity/add-opportunity',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_OPPORTUNITIES']
  },
  {
    id: 'add-deal',
    title: 'Create New Deal',
    icon: 'ph:handshake-bold',
    category: 'action',
    path: '/sales/deals/add-deal',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_DEALS']
  },
  {
    id: 'add-proposal',
    title: 'Create New Proposal',
    icon: 'ph:file-plus-bold',
    category: 'action',
    path: '/sales/proposals/add-proposal',
    keywords: ['create', 'new', 'add', 'quote'],
    permissions: ['CREATE_PROPOSALS']
  },

  // Operations Actions
  {
    id: 'add-project',
    title: 'Create New Project',
    icon: 'ph:folder-plus-bold',
    category: 'action',
    path: '/operations/projects/add-project',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_PROJECTS']
  },
  {
    id: 'add-task',
    title: 'Create New Task',
    icon: 'ph:check-square-bold',
    category: 'action',
    path: '/operations/daily-task/add-daily-task',
    keywords: ['create', 'new', 'add', 'todo'],
    permissions: ['CREATE_PROJECTS']
  },
  {
    id: 'add-manpower',
    title: 'Create New Manpower',
    icon: 'ph:user-plus-bold',
    category: 'action',
    path: '/operations/manpower/add-manpower',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_MANPOWER']
  },
  {
    id: 'add-vehicle',
    title: 'Create New Vehicle',
    icon: 'ph:car-bold',
    category: 'action',
    path: '/operations/vehicle/add-vehicle',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_VEHICLES']
  },
  {
    id: 'add-asset',
    title: 'Create New Asset',
    icon: 'ph:cube-bold',
    category: 'action',
    path: '/operations/assets/add-asset',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_ASSETS']
  },
  {
    id: 'add-service',
    title: 'Create New Service',
    icon: 'ph:wrench-bold',
    category: 'action',
    path: '/operations/services/add-service',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_SERVICES']
  },
  {
    id: 'add-material',
    title: 'Create New Material',
    icon: 'ph:package-bold',
    category: 'action',
    path: '/operations/additional-material/add-additional-material',
    keywords: ['create', 'new', 'add'],
    permissions: ['CREATE_ADDITIONAL_MATERIAL']
  },

  // Staff & Roles Actions
  {
    id: 'add-staff',
    title: 'Create New Staff Member',
    icon: 'ph:user-plus-bold',
    category: 'action',
    path: '/staff/add-staff',
    keywords: ['create', 'new', 'add', 'employee'],
    permissions: ['CREATE_STAFF']
  },
  {
    id: 'add-role',
    title: 'Create New Role',
    icon: 'ph:shield-plus-bold',
    category: 'action',
    path: '/roles/add-role',
    keywords: ['create', 'new', 'add', 'permission'],
    permissions: ['CREATE_ROLES']
  }
];

// Command items - inline actions that don't navigate
// The actual actions are injected inside useSpotlight() where stores are available
const commandItems = ref<SpotlightItem[]>([
  { id: 'cmd-dark-mode', title: 'Toggle Dark Mode', icon: 'ph:moon-bold', category: 'command', keywords: ['theme', 'light', 'dark', 'mode'], shortcutHint: 'Ctrl+Shift+D' },
  { id: 'cmd-language', title: 'Switch Language', icon: 'ph:translate-bold', category: 'command', keywords: ['locale', 'arabic', 'english', 'lang', 'rtl'] },
  { id: 'cmd-sidebar', title: 'Toggle Sidebar', icon: 'ph:sidebar-bold', category: 'command', keywords: ['menu', 'nav', 'collapse', 'expand'] },
  { id: 'cmd-fullscreen', title: 'Fullscreen', icon: 'ph:arrows-out-bold', category: 'command', keywords: ['fullscreen', 'maximize', 'screen'] },
  { id: 'cmd-shortcuts', title: 'Keyboard Shortcuts', icon: 'ph:keyboard-bold', category: 'command', keywords: ['keys', 'hotkeys', 'help'], shortcutHint: '?' },
]);

// Check if user has permission for an item
function hasPermissionForItem(item: SpotlightItem): boolean {
  // Admins can see everything
  if (isAdmin.value) return true;

  // No permissions required = everyone can see
  if (!item.permissions || item.permissions.length === 0) return true;

  // Check if user has any of the required permissions
  return item.permissions.some(perm => userPermissions.value.includes(perm));
}

// Items filtered by permissions
const permittedItems = computed(() => {
  return spotlightItems.filter(item => hasPermissionForItem(item));
});

// All searchable items (pages + actions + commands)
const allSearchableItems = computed(() => {
  return [...permittedItems.value, ...commandItems.value];
});

// Filtered items based on search
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return allSearchableItems.value;
  }

  const query = searchQuery.value.toLowerCase();
  return allSearchableItems.value.filter(item => {
    const matchTitle = item.title.toLowerCase().includes(query);
    const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(query));
    const matchSubtitle = item.subtitle?.toLowerCase().includes(query);
    return matchTitle || matchKeywords || matchSubtitle;
  });
});

// Grouped items by category
const groupedItems = computed(() => {
  const hasQuery = searchQuery.value.trim().length > 0;
  const recent = hasQuery ? [] : recentItems.value;
  const pages = filteredItems.value.filter(i => i.category === 'page');
  const actions = filteredItems.value.filter(i => i.category === 'action');
  const commands = filteredItems.value.filter(i => i.category === 'command');
  const searches = searchResults.value;

  return { recent, pages, actions, commands, searches };
});

// Flat list for navigation
const flatItems = computed(() => {
  return [
    ...groupedItems.value.recent,
    ...groupedItems.value.pages,
    ...groupedItems.value.actions,
    ...groupedItems.value.commands,
    ...groupedItems.value.searches,
  ];
});

export function useSpotlight() {
  const router = useRouter();

  // Inject actual actions into command items (requires access to stores/composables)
  function initCommandActions() {
    const themeStore = useThemeStore();
    const mainStore = useMain();
    const { cheatSheetVisible } = useKeyboardShortcuts();

    const actionMap: Record<string, () => void> = {
      'cmd-dark-mode': () => { themeStore.toggleTheme(); },
      'cmd-language': () => {
        const { locale, setLocale } = useI18n();
        const nextLocale = locale.value === 'en' ? 'ar' : 'en';
        setLocale(nextLocale);
        if (typeof document !== 'undefined') {
          document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = nextLocale;
        }
      },
      'cmd-sidebar': () => { mainStore.fullNav = !mainStore.fullNav; },
      'cmd-fullscreen': () => {
        if (typeof document !== 'undefined') {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }
      },
      'cmd-shortcuts': () => { cheatSheetVisible.value = true; },
    };

    commandItems.value = commandItems.value.map(item => ({
      ...item,
      action: actionMap[item.id] || item.action,
    }));
  }

  // Load user permissions on init
  async function loadPermissions() {
    try {
      const { hasPermission, hasAnyPermission } = await usePermissions();

      // Get role info to check if admin
      const userResponse = await useApiFetch('auth/me');
      const user = userResponse?.body;

      if (user?.roleId) {
        const roleResponse = await useApiFetch(`role/${user.roleId}`);
        if (roleResponse?.body) {
          userPermissions.value = roleResponse.body.permissions || [];
          // Check if this is a Super Admin (has all permissions or role name is SUPER_ADMIN)
          isAdmin.value = roleResponse.body.name === 'SUPER_ADMIN' || userPermissions.value.length > 50;
        }
      }
    } catch (error) {
      console.warn('Failed to load Spotlight permissions:', error);
    }
  }

  function open() {
    isOpen.value = true;
    searchQuery.value = '';
    selectedIndex.value = 0;
  }

  function close() {
    isOpen.value = false;
    searchQuery.value = '';
    selectedIndex.value = 0;
  }

  function toggle() {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }

  function selectItem(item: SpotlightItem) {
    // Track recent items before navigating
    trackRecent(item);
    if (item.path) {
      router.push(item.path);
    }
    if (item.action) {
      item.action();
    }
    close();
  }

  function selectCurrent() {
    const item = flatItems.value[selectedIndex.value];
    if (item) {
      selectItem(item);
    }
  }

  function moveUp() {
    if (selectedIndex.value > 0) {
      selectedIndex.value--;
    } else {
      selectedIndex.value = flatItems.value.length - 1;
    }
  }

  function moveDown() {
    if (selectedIndex.value < flatItems.value.length - 1) {
      selectedIndex.value++;
    } else {
      selectedIndex.value = 0;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Open with Alt+K, Ctrl+K (Cmd+K on Mac), or / key (when not in input)
    if (
      (event.altKey && event.key.toLowerCase() === 'k') ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') ||
      (event.key === '/' && !isOpen.value && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
    ) {
      event.preventDefault();
      toggle();
      return;
    }

    if (!isOpen.value) return;

    // Handle Escape - always close
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveDown();
        break;
      case 'Enter':
        event.preventDefault();
        selectCurrent();
        break;
    }
  }

  // Entity type icon mapping for search results
  const entityIconMap: Record<string, string> = {
    lead: 'ph:users-bold',
    client: 'ph:user-circle-bold',
    deal: 'ph:handshake-bold',
    opportunity: 'ph:target-bold',
    project: 'ph:folder-bold',
    contact: 'ph:address-book-bold',
    invoice: 'ph:receipt-bold',
    proposal: 'ph:file-text-bold',
    task: 'ph:list-checks-bold',
    staff: 'ph:identification-badge-bold'
  };

  const entityPathMap: Record<string, string> = {
    lead: '/sales/leads/',
    client: '/sales/clients/',
    deal: '/sales/deals/',
    opportunity: '/sales/opportunity/',
    project: '/operations/projects/',
    invoice: '/sales/invoices/',
    proposal: '/sales/proposals/',
    task: '/tasks/',
    staff: '/staff/'
  };

  // API search function
  async function performApiSearch(query: string) {
    if (query.length < 3) {
      searchResults.value = [];
      return;
    }
    searchLoading.value = true;
    try {
      const response = await useApiFetch(`search?q=${encodeURIComponent(query)}&limit=5`);
      if (response?.success && response?.body) {
        const results = (response.body as any).docs || response.body || [];
        searchResults.value = (Array.isArray(results) ? results : []).slice(0, 5).map((item: any, idx: number) => ({
          id: `search-${idx}`,
          title: item.name || item.title || item.email || `${item.entityType} #${item.id}`,
          subtitle: item.entityType ? item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1) : '',
          icon: entityIconMap[item.entityType?.toLowerCase()] || 'ph:magnifying-glass-bold',
          category: 'search' as const,
          path: item.entityType && item.id ? (entityPathMap[item.entityType.toLowerCase()] || '/') + item.id : undefined,
          keywords: []
        }));
      } else {
        searchResults.value = [];
      }
    } catch {
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }

  // Watch for search query changes to reset selection and debounce API search
  watch(searchQuery, (query) => {
    selectedIndex.value = 0;
    clearTimeout(searchDebounceTimer);
    if (query.trim().length >= 3) {
      searchDebounceTimer = setTimeout(() => performApiSearch(query.trim()), 300);
    } else {
      searchResults.value = [];
    }
  });

  // Setup keyboard listeners
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown, true); // Use capture phase
    loadPermissions();
    initCommandActions();
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown, true);
  });

  return {
    isOpen,
    searchQuery,
    selectedIndex,
    filteredItems,
    groupedItems,
    flatItems,
    recentItems,
    isAdmin,
    searchLoading,
    open,
    close,
    toggle,
    selectItem,
    selectCurrent,
    moveUp,
    moveDown,
    loadPermissions
  };
}
