import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export interface SpotlightItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    category: 'page' | 'action' | 'search';
    path?: string;
    action?: () => void;
    keywords?: string[];
}

// State
const isOpen = ref(false);
const searchQuery = ref('');
const selectedIndex = ref(0);

// All available items
const spotlightItems: SpotlightItem[] = [
    // ========== PAGES ==========

    // Dashboard
    { id: 'dashboard', title: 'Dashboard', icon: 'ph:house-bold', category: 'page', path: '/', keywords: ['home', 'main'] },

    // Sales Pages
    { id: 'leads', title: 'Leads', icon: 'ph:users-bold', category: 'page', path: '/sales/leads', keywords: ['sales', 'prospects'] },
    { id: 'clients', title: 'Clients', icon: 'ph:user-circle-bold', category: 'page', path: '/sales/clients', keywords: ['customers'] },
    { id: 'opportunities', title: 'Opportunities', icon: 'ph:target-bold', category: 'page', path: '/sales/opportunity', keywords: ['chance', 'deal'] },
    { id: 'deals', title: 'Deals', icon: 'ph:handshake-bold', category: 'page', path: '/sales/deals', keywords: ['contracts'] },
    { id: 'proposals', title: 'Proposals', icon: 'ph:file-text-bold', category: 'page', path: '/sales/proposals', keywords: ['quotes'] },

    // Operations Pages
    { id: 'projects', title: 'Projects', icon: 'ph:folder-bold', category: 'page', path: '/operations/projects', keywords: ['project'] },
    { id: 'daily-tasks', title: 'Daily Tasks', icon: 'ph:check-square-bold', category: 'page', path: '/operations/daily-task', keywords: ['tasks', 'todo'] },
    { id: 'manpower', title: 'Manpower', icon: 'ph:users-three-bold', category: 'page', path: '/operations/manpower', keywords: ['employees', 'workers'] },
    { id: 'vehicles', title: 'Vehicles', icon: 'ph:car-bold', category: 'page', path: '/operations/vehicle', keywords: ['cars', 'trucks'] },
    { id: 'assets', title: 'Assets', icon: 'ph:cube-bold', category: 'page', path: '/operations/assets', keywords: ['equipment'] },
    { id: 'services', title: 'Services', icon: 'ph:wrench-bold', category: 'page', path: '/operations/services', keywords: ['service'] },
    { id: 'additional-material', title: 'Additional Materials', icon: 'ph:package-bold', category: 'page', path: '/operations/additional-material', keywords: ['materials'] },

    // Staff & Roles
    { id: 'staff', title: 'Staff', icon: 'ph:identification-badge-bold', category: 'page', path: '/staff', keywords: ['employees', 'team'] },
    { id: 'roles', title: 'Roles & Permissions', icon: 'ph:shield-check-bold', category: 'page', path: '/roles', keywords: ['permissions'] },

    // Reports
    { id: 'reports', title: 'Reports', icon: 'ph:chart-bar-bold', category: 'page', path: '/reports', keywords: ['analytics', 'statistics'] },

    // Notifications
    { id: 'notifications', title: 'Notifications', icon: 'ph:bell-bold', category: 'page', path: '/notification', keywords: ['alerts'] },

    // ========== QUICK ACTIONS ==========

    // Sales Actions
    { id: 'add-lead', title: 'Create New Lead', icon: 'ph:user-plus-bold', category: 'action', path: '/sales/leads/add-lead', keywords: ['create', 'new', 'add'] },
    { id: 'add-client', title: 'Create New Client', icon: 'ph:user-circle-plus-bold', category: 'action', path: '/sales/clients/add-client', keywords: ['create', 'new', 'add'] },
    { id: 'add-opportunity', title: 'Create New Opportunity', icon: 'ph:plus-circle-bold', category: 'action', path: '/sales/opportunity/add-opportunity', keywords: ['create', 'new', 'add'] },
    { id: 'add-deal', title: 'Create New Deal', icon: 'ph:handshake-bold', category: 'action', path: '/sales/deals/add-deal', keywords: ['create', 'new', 'add'] },
    { id: 'add-proposal', title: 'Create New Proposal', icon: 'ph:file-plus-bold', category: 'action', path: '/sales/proposals/add-proposal', keywords: ['create', 'new', 'add', 'quote'] },

    // Operations Actions
    { id: 'add-project', title: 'Create New Project', icon: 'ph:folder-plus-bold', category: 'action', path: '/operations/projects/add-project', keywords: ['create', 'new', 'add'] },
    { id: 'add-task', title: 'Create New Task', icon: 'ph:check-square-bold', category: 'action', path: '/operations/daily-task/add-daily-task', keywords: ['create', 'new', 'add', 'todo'] },
    { id: 'add-manpower', title: 'Create New Manpower', icon: 'ph:user-plus-bold', category: 'action', path: '/operations/manpower/add-manpower', keywords: ['create', 'new', 'add'] },
    { id: 'add-vehicle', title: 'Create New Vehicle', icon: 'ph:car-bold', category: 'action', path: '/operations/vehicle/add-vehicle', keywords: ['create', 'new', 'add'] },
    { id: 'add-asset', title: 'Create New Asset', icon: 'ph:cube-bold', category: 'action', path: '/operations/assets/add-asset', keywords: ['create', 'new', 'add'] },
    { id: 'add-service', title: 'Create New Service', icon: 'ph:wrench-bold', category: 'action', path: '/operations/services/add-service', keywords: ['create', 'new', 'add'] },
    { id: 'add-material', title: 'Create New Material', icon: 'ph:package-bold', category: 'action', path: '/operations/additional-material/add-additional-material', keywords: ['create', 'new', 'add'] },

    // Staff & Roles Actions
    { id: 'add-staff', title: 'Create New Staff Member', icon: 'ph:user-plus-bold', category: 'action', path: '/staff/add-staff', keywords: ['create', 'new', 'add', 'employee'] },
    { id: 'add-role', title: 'Create New Role', icon: 'ph:shield-plus-bold', category: 'action', path: '/roles/add-role', keywords: ['create', 'new', 'add', 'permission'] },
];

// Filtered items based on search
const filteredItems = computed(() => {
    if (!searchQuery.value.trim()) {
        return spotlightItems;
    }

    const query = searchQuery.value.toLowerCase();
    return spotlightItems.filter(item => {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(query));
        const matchSubtitle = item.subtitle?.toLowerCase().includes(query);
        return matchTitle || matchKeywords || matchSubtitle;
    });
});

// Grouped items by category
const groupedItems = computed(() => {
    const pages = filteredItems.value.filter(i => i.category === 'page');
    const actions = filteredItems.value.filter(i => i.category === 'action');
    const searches = filteredItems.value.filter(i => i.category === 'search');

    return { pages, actions, searches };
});

// Flat list for navigation
const flatItems = computed(() => {
    return [...groupedItems.value.pages, ...groupedItems.value.actions, ...groupedItems.value.searches];
});

export function useSpotlight() {
    const router = useRouter();

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
        // Open with Alt+K or / key
        if ((event.altKey && event.key === 'k') || (event.key === '/' && !isOpen.value && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
            event.preventDefault();
            toggle();
            return;
        }

        if (!isOpen.value) return;

        switch (event.key) {
            case 'Escape':
                close();
                break;
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

    // Watch for search query changes to reset selection
    watch(searchQuery, () => {
        selectedIndex.value = 0;
    });

    // Setup keyboard listeners
    onMounted(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    return {
        isOpen,
        searchQuery,
        selectedIndex,
        filteredItems,
        groupedItems,
        flatItems,
        open,
        close,
        toggle,
        selectItem,
        selectCurrent,
        moveUp,
        moveDown,
    };
}
