import { ref, watch } from 'vue';

export interface TerminalLine {
  type: 'command' | 'result' | 'error' | 'info' | 'table';
  content: string;
  timestamp: Date;
  data?: any[];
}

const HISTORY_KEY = 'crm_terminal_history';
const MAX_HISTORY = 50;

// Navigation route map
const ROUTE_MAP: Record<string, string> = {
  dashboard: '/',
  home: '/',
  leads: '/sales/leads',
  clients: '/sales/clients',
  deals: '/sales/deals',
  opportunities: '/sales/opportunity',
  opportunity: '/sales/opportunity',
  proposals: '/sales/proposals',
  projects: '/operations/projects',
  tasks: '/operations/daily-task',
  'daily-tasks': '/operations/daily-task',
  manpower: '/operations/manpower',
  vehicles: '/operations/vehicle',
  assets: '/operations/assets',
  services: '/operations/services',
  materials: '/operations/additional-material',
  staff: '/staff',
  roles: '/roles',
  reports: '/reports',
  notifications: '/notification',
  settings: '/settings',
  analytics: '/analytics'
};

// Create route map
const CREATE_ROUTE_MAP: Record<string, string> = {
  lead: '/sales/leads/add-lead',
  client: '/sales/clients/add-client',
  deal: '/sales/deals/add-deal',
  opportunity: '/sales/opportunity/add-opportunity',
  proposal: '/sales/proposals/add-proposal',
  project: '/operations/projects/add-project',
  task: '/operations/daily-task/add-daily-task',
  manpower: '/operations/manpower/add-manpower',
  vehicle: '/operations/vehicle/add-vehicle',
  asset: '/operations/assets/add-asset',
  service: '/operations/services/add-service',
  material: '/operations/additional-material/add-additional-material',
  staff: '/staff/add-staff',
  role: '/roles/add-role'
};

// API endpoint map for list commands
const LIST_ENDPOINT_MAP: Record<string, string> = {
  leads: 'lead',
  lead: 'lead',
  deals: 'deal',
  deal: 'deal',
  clients: 'client',
  client: 'client',
  opportunities: 'opportunity',
  opportunity: 'opportunity',
  proposals: 'proposal',
  proposal: 'proposal',
  projects: 'project',
  project: 'project',
  tasks: 'daily-task',
  task: 'daily-task',
  staff: 'staff'
};

// All available commands for autocomplete
const ALL_COMMANDS = ['goto', 'list', 'search', 'find', 'create', 'help', 'clear', 'history', 'theme'];

const GOTO_TARGETS = Object.keys(ROUTE_MAP);
const CREATE_TARGETS = Object.keys(CREATE_ROUTE_MAP);
const LIST_TARGETS = [...new Set(Object.keys(LIST_ENDPOINT_MAP))];
const THEME_OPTIONS = ['dark', 'light'];

// Global state shared across composable usages
const isOpen = ref(false);
const input = ref('');
const output = ref<TerminalLine[]>([]);
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const suggestions = ref<string[]>([]);

// Load history from localStorage
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) history.value = JSON.parse(saved);
  } catch {
    /* ignore */
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

function addLine(type: TerminalLine['type'], content: string, data?: any[]) {
  output.value.push({ type, content, timestamp: new Date(), data });
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match?.[1] && match[2]) {
      flags[match[1]] = match[2];
    }
  }
  return flags;
}

function parseQuotedString(parts: string[]): string {
  const joined = parts.join(' ');
  const match = joined.match(/"([^"]+)"/);
  if (match?.[1]) return match[1];
  // Also try without quotes
  return parts.filter(p => !p.startsWith('--')).join(' ');
}

export function useCommandTerminal() {
  const router = useRouter();

  function toggle() {
    isOpen.value = !isOpen.value;
    if (isOpen.value && output.value.length === 0) {
      addLine('info', "Welcome to CRM Terminal. Type 'help' for available commands.");
    }
  }

  async function execute(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history
    if (history.value[0] !== trimmed) {
      history.value.unshift(trimmed);
      if (history.value.length > MAX_HISTORY) {
        history.value = history.value.slice(0, MAX_HISTORY);
      }
      saveHistory();
    }
    historyIndex.value = -1;

    // Show the command in output
    addLine('command', `> ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const command = (parts[0] ?? '').toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'goto':
      case 'go':
      case 'nav':
      case 'navigate':
        handleGoto(args);
        break;

      case 'list':
      case 'ls':
        await handleList(args);
        break;

      case 'search':
      case 'find':
        await handleSearch(args);
        break;

      case 'create':
      case 'new':
      case 'add':
        handleCreate(args);
        break;

      case 'help':
        handleHelp();
        break;

      case 'clear':
      case 'cls':
        clear();
        break;

      case 'history':
        handleHistory();
        break;

      case 'theme':
        handleTheme(args);
        break;

      default:
        addLine('error', `Unknown command: '${command}'. Type 'help' for available commands.`);
    }

    input.value = '';
  }

  function handleGoto(args: string[]) {
    if (args.length === 0) {
      addLine('error', 'Usage: goto <page>  (e.g. goto leads, goto dashboard)');
      addLine('info', `Available pages: ${GOTO_TARGETS.join(', ')}`);
      return;
    }

    const target = (args[0] ?? '').toLowerCase();
    const route = ROUTE_MAP[target];

    if (route) {
      addLine('result', `Navigating to ${target}...`);
      router.push(route);
      // Close terminal after navigation
      setTimeout(() => {
        isOpen.value = false;
      }, 300);
    } else {
      addLine('error', `Unknown page: '${target}'`);
      addLine('info', `Available pages: ${GOTO_TARGETS.join(', ')}`);
    }
  }

  async function handleList(args: string[]) {
    if (args.length === 0) {
      addLine('error', 'Usage: list <entity> [--stage=value] [--status=value]');
      addLine('info', `Available entities: ${LIST_TARGETS.join(', ')}`);
      return;
    }

    const entity = (args[0] ?? '').toLowerCase();
    const endpoint = LIST_ENDPOINT_MAP[entity];

    if (!endpoint) {
      addLine('error', `Unknown entity: '${entity}'`);
      addLine('info', `Available entities: ${LIST_TARGETS.join(', ')}`);
      return;
    }

    const flags = parseFlags(args.slice(1));
    let queryParams = '';
    if (Object.keys(flags).length > 0) {
      const params = new URLSearchParams(flags);
      queryParams = `?${params.toString()}`;
    }

    addLine('info', `Fetching ${entity}...`);

    try {
      const response = await useApiFetch(`${endpoint}${queryParams}` as any);
      if (response?.success && response.body) {
        const body = response.body as any;
        const items: any[] = Array.isArray(body) ? body : body?.docs || body?.rows || [];

        if (items.length === 0) {
          addLine('result', 'No results found.');
          return;
        }

        // Show as table
        const displayItems = items.slice(0, 10).map((item: any) => ({
          ID: item.id || '-',
          Name: item.name || item.title || item.companyName || '-',
          Status: item.status || item.stage || '-',
          Created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
        }));

        addLine('table', `Found ${items.length} ${entity}:`, displayItems);
      } else {
        addLine('error', response?.message || `Failed to fetch ${entity}.`);
      }
    } catch (err: any) {
      addLine('error', `Error fetching ${entity}: ${err.message || 'Unknown error'}`);
    }
  }

  async function handleSearch(args: string[]) {
    if (args.length === 0) {
      addLine('error', 'Usage: search <query> or find <entity> --field=value');
      return;
    }

    const query = parseQuotedString(args);

    if (!query) {
      addLine('error', 'Please provide a search query.');
      return;
    }

    addLine('info', `Searching for "${query}"...`);

    try {
      const response = await useApiFetch(`search?q=${encodeURIComponent(query)}&limit=10` as any);
      if (response?.success && response.body) {
        const body = response.body as any;
        const results = body?.docs || body || [];
        const items: any[] = Array.isArray(results) ? results : [];

        if (items.length === 0) {
          addLine('result', 'No results found.');
          return;
        }

        const displayItems = items.slice(0, 10).map((item: any) => ({
          Type: item.entityType || '-',
          Name: item.name || item.title || item.email || '-',
          ID: item.id || '-'
        }));

        addLine('table', `Found ${items.length} result(s):`, displayItems);
      } else {
        addLine('result', 'No results found.');
      }
    } catch {
      addLine('error', 'Search failed. The search endpoint may not be available.');
    }
  }

  function handleCreate(args: string[]) {
    if (args.length === 0) {
      addLine('error', 'Usage: create <entity> (e.g. create lead, create deal)');
      addLine('info', `Available entities: ${CREATE_TARGETS.join(', ')}`);
      return;
    }

    const entity = (args[0] ?? '').toLowerCase();
    const route = CREATE_ROUTE_MAP[entity];

    if (route) {
      addLine('result', `Opening create ${entity} form...`);
      router.push(route);
      setTimeout(() => {
        isOpen.value = false;
      }, 300);
    } else {
      addLine('error', `Cannot create '${entity}'.`);
      addLine('info', `Available entities: ${CREATE_TARGETS.join(', ')}`);
    }
  }

  function handleHelp() {
    addLine('info', '=== Available Commands ===');
    addLine('info', '');
    addLine('info', '  goto <page>          Navigate to a page (e.g. goto leads)');
    addLine('info', '  list <entity>        List records (e.g. list deals --stage=negotiation)');
    addLine('info', '  search "<query>"     Search across records (e.g. search "Acme Corp")');
    addLine('info', '  find <entity>        Find records with filters (e.g. find deal --value>10000)');
    addLine('info', '  create <entity>      Open create form (e.g. create lead)');
    addLine('info', '  theme dark|light     Switch theme');
    addLine('info', '  history              Show command history');
    addLine('info', '  clear                Clear terminal output');
    addLine('info', '  help                 Show this help message');
    addLine('info', '');
    addLine('info', '  Pages: ' + GOTO_TARGETS.join(', '));
    addLine('info', '  Entities: ' + CREATE_TARGETS.join(', '));
    addLine('info', '');
    addLine('info', '  Shortcuts: Ctrl+` to toggle | Esc to close | Up/Down for history | Tab for autocomplete');
  }

  function handleHistory() {
    if (history.value.length === 0) {
      addLine('result', 'No command history yet.');
      return;
    }
    addLine('info', '=== Command History ===');
    history.value.slice(0, 20).forEach((cmd, i) => {
      addLine('result', `  ${i + 1}. ${cmd}`);
    });
  }

  function handleTheme(args: string[]) {
    if (args.length === 0) {
      addLine('error', 'Usage: theme dark|light');
      return;
    }

    const mode = (args[0] ?? '').toLowerCase();
    if (mode !== 'dark' && mode !== 'light') {
      addLine('error', `Invalid theme: '${mode}'. Use 'dark' or 'light'.`);
      return;
    }

    try {
      const themeStore = useThemeStore();
      const isCurrentlyLight = themeStore.isLight;
      const wantsLight = mode === 'light';

      if (isCurrentlyLight !== wantsLight) {
        themeStore.toggleTheme();
        addLine('result', `Theme switched to ${mode} mode.`);
      } else {
        addLine('result', `Already in ${mode} mode.`);
      }
    } catch {
      addLine('error', 'Failed to switch theme.');
    }
  }

  function navigateHistory(direction: 'up' | 'down') {
    if (history.value.length === 0) return;

    if (direction === 'up') {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value++;
        input.value = history.value[historyIndex.value] ?? '';
      }
    } else if (historyIndex.value > 0) {
      historyIndex.value--;
      input.value = history.value[historyIndex.value] ?? '';
    } else if (historyIndex.value === 0) {
      historyIndex.value = -1;
      input.value = '';
    }
  }

  function autocomplete() {
    const trimmed = input.value.trim();
    if (!trimmed) {
      suggestions.value = ALL_COMMANDS;
      return;
    }

    const parts = trimmed.split(/\s+/);

    if (parts.length === 1) {
      // Autocomplete command name
      const partial = (parts[0] ?? '').toLowerCase();
      const matches = ALL_COMMANDS.filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        input.value = (matches[0] ?? '') + ' ';
        suggestions.value = [];
      } else {
        suggestions.value = matches;
      }
    } else if (parts.length === 2) {
      const command = (parts[0] ?? '').toLowerCase();
      const partial = (parts[1] ?? '').toLowerCase();

      let targets: string[] = [];
      if (command === 'goto' || command === 'go' || command === 'nav' || command === 'navigate') {
        targets = GOTO_TARGETS;
      } else if (command === 'create' || command === 'new' || command === 'add') {
        targets = CREATE_TARGETS;
      } else if (command === 'list' || command === 'ls') {
        targets = LIST_TARGETS;
      } else if (command === 'theme') {
        targets = THEME_OPTIONS;
      }

      const matches = targets.filter(t => t.startsWith(partial));
      if (matches.length === 1) {
        input.value = `${parts[0] ?? ''} ${matches[0] ?? ''} `;
        suggestions.value = [];
      } else {
        suggestions.value = matches;
      }
    } else {
      suggestions.value = [];
    }
  }

  function clear() {
    output.value = [];
  }

  // Clear suggestions when input changes
  watch(input, () => {
    if (!input.value.trim()) {
      suggestions.value = [];
    }
  });

  return {
    isOpen,
    input,
    output,
    history,
    historyIndex,
    suggestions,
    toggle,
    execute,
    navigateHistory,
    autocomplete,
    clear
  };
}
