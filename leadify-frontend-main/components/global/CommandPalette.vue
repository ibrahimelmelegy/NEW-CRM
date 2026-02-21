<template lang="pug">
Teleport(to="body")
  Transition(name="palette-fade")
    .command-palette-overlay(v-if="isOpen" @click.self="close")
      .command-palette.glass-card.rounded-2xl.overflow-hidden
        //- Search Input
        .flex.items-center.gap-3.px-5.py-4(style="border-bottom: 1px solid var(--glass-border)")
          Icon(name="ph:magnifying-glass" size="20" style="color: #7849ff")
          input.flex-1.bg-transparent.outline-none.text-base(
            ref="searchInput"
            v-model="query"
            placeholder="Search anything... (leads, deals, invoices, contacts)"
            style="color: var(--text-primary)"
            @keydown.escape="close"
            @keydown.down.prevent="moveDown"
            @keydown.up.prevent="moveUp"
            @keydown.enter.prevent="selectItem"
          )
          .flex.items-center.gap-1
            kbd.px-2.py-1.text-xs.rounded(style="background: var(--glass-border); color: var(--text-muted)") ESC

        //- Results
        .max-h-96.overflow-y-auto.py-2(ref="resultsContainer")
          //- Quick Actions (shown when no query)
          template(v-if="!query.trim()")
            .px-4.py-2
              p.text-xs.font-bold.uppercase.tracking-wide(style="color: var(--text-muted)") Quick Actions
            .quick-actions
              .palette-item.flex.items-center.gap-3.px-5.py-3.cursor-pointer(
                v-for="(action, i) in quickActions"
                :key="action.label"
                :class="{ 'active': selectedIndex === i }"
                @click="executeAction(action)"
                @mouseenter="selectedIndex = i"
              )
                .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: action.color + '20' }")
                  Icon(:name="action.icon" size="16" :style="{ color: action.color }")
                .flex-1
                  p.text-sm.font-medium(style="color: var(--text-primary)") {{ action.label }}
                  p.text-xs(style="color: var(--text-muted)") {{ action.hint }}
                kbd.px-2.py-1.text-xs.rounded(v-if="action.shortcut" style="background: var(--glass-border); color: var(--text-muted)") {{ action.shortcut }}

          //- Search Results
          template(v-else)
            //- Loading
            .px-5.py-8.text-center(v-if="searching")
              el-icon.is-loading(:size="24" style="color: #7849ff")
              p.text-sm.mt-2(style="color: var(--text-muted)") Searching...

            //- Results by category
            template(v-else-if="results.length")
              template(v-for="(group, groupName) in groupedResults" :key="groupName")
                .px-4.py-2
                  p.text-xs.font-bold.uppercase.tracking-wide(style="color: var(--text-muted)") {{ groupName }}
                .palette-item.flex.items-center.gap-3.px-5.py-3.cursor-pointer(
                  v-for="(item, i) in group"
                  :key="item.id"
                  :class="{ 'active': selectedIndex === getGlobalIndex(groupName, i) }"
                  @click="navigateTo(item)"
                  @mouseenter="selectedIndex = getGlobalIndex(groupName, i)"
                )
                  .w-8.h-8.rounded-lg.flex.items-center.justify-center(:style="{ background: getEntityColor(item.type) + '20' }")
                    Icon(:name="getEntityIcon(item.type)" size="16" :style="{ color: getEntityColor(item.type) }")
                  .flex-1.min-w-0
                    p.text-sm.font-medium.truncate(style="color: var(--text-primary)") {{ item.name }}
                    p.text-xs.truncate(style="color: var(--text-muted)") {{ item.subtitle }}
                  el-tag(v-if="item.status" :type="getStatusType(item.status)" size="small" round effect="plain") {{ item.status }}

            //- No Results
            .px-5.py-8.text-center(v-else)
              Icon(name="ph:magnifying-glass" size="32" style="color: var(--text-muted)")
              p.text-sm.mt-2(style="color: var(--text-muted)") No results for "{{ query }}"

        //- Footer
        .flex.items-center.justify-between.px-5.py-3(style="border-top: 1px solid var(--glass-border)")
          .flex.items-center.gap-4
            .flex.items-center.gap-1
              kbd.px-1.text-xs.rounded(class="py-0.5" style="background: var(--glass-border); color: var(--text-muted)") ↑↓
              span.text-xs(style="color: var(--text-muted)") Navigate
            .flex.items-center.gap-1
              kbd.px-1.text-xs.rounded(class="py-0.5" style="background: var(--glass-border); color: var(--text-muted)") ↵
              span.text-xs(style="color: var(--text-muted)") Select
          .flex.items-center.gap-1
            Icon(name="ph:magnifying-glass" size="12" style="color: var(--text-muted)")
            span.text-xs(style="color: var(--text-muted)") {{ results.length }} results
</template>

<script setup lang="ts">
interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  type: 'lead' | 'deal' | 'client' | 'invoice' | 'task' | 'ticket';
  status?: string;
  link: string;
}

const router = useRouter();
const isOpen = ref(false);
const query = ref('');
const searching = ref(false);
const selectedIndex = ref(0);
const results = ref<SearchResult[]>([]);
const searchInput = ref<HTMLInputElement | null>(null);
const resultsContainer = ref<HTMLElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout>;

const quickActions = [
  { label: 'Create New Lead', hint: 'Add a new lead to your pipeline', icon: 'ph:user-plus', color: '#7849ff', shortcut: '', link: '/sales/leads/create' },
  { label: 'Create New Deal', hint: 'Start a new sales deal', icon: 'ph:handshake', color: '#10b981', shortcut: '', link: '/sales/deals/create' },
  { label: 'Create Invoice', hint: 'Generate a new invoice', icon: 'ph:receipt', color: '#3b82f6', shortcut: '', link: '/documents/editor' },
  { label: 'Create Task', hint: 'Add a task for your team', icon: 'ph:check-square', color: '#f59e0b', shortcut: '', link: '/tasks/create' },
  { label: 'View Dashboard', hint: 'Open executive dashboard', icon: 'ph:chart-line-up', color: '#a855f7', shortcut: '', link: '/dashboards/executive' },
  { label: 'Customer 360', hint: 'View complete customer profile', icon: 'ph:address-book', color: '#06b6d4', shortcut: '', link: '/crm/customer-360' }
];

const groupedResults = computed(() => {
  const groups: Record<string, SearchResult[]> = {};
  results.value.forEach(r => {
    const typeName = {
      lead: 'Leads', deal: 'Deals', client: 'Clients',
      invoice: 'Invoices', task: 'Tasks', ticket: 'Tickets'
    }[r.type] || 'Other';
    if (!groups[typeName]) groups[typeName] = [];
    groups[typeName].push(r);
  });
  return groups;
});

function getGlobalIndex(groupName: string, localIndex: number): number {
  let offset = quickActions.length; // actions take first indices when no query
  if (query.value.trim()) {
    offset = 0;
    for (const [name, group] of Object.entries(groupedResults.value)) {
      if (name === groupName) break;
      offset += group.length;
    }
  }
  return offset + localIndex;
}

function getEntityIcon(type: string): string {
  return { lead: 'ph:user', deal: 'ph:handshake', client: 'ph:buildings', invoice: 'ph:receipt', task: 'ph:check-square', ticket: 'ph:ticket' }[type] || 'ph:circle';
}

function getEntityColor(type: string): string {
  return { lead: '#7849ff', deal: '#10b981', client: '#3b82f6', invoice: '#f59e0b', task: '#a855f7', ticket: '#06b6d4' }[type] || '#7849ff';
}

function getStatusType(status: string): string {
  if (['WON', 'PAID', 'DONE', 'RESOLVED', 'CLOSED'].includes(status)) return 'success';
  if (['LOST', 'OVERDUE', 'CANCELLED'].includes(status)) return 'danger';
  return 'info';
}

function open() {
  isOpen.value = true;
  query.value = '';
  results.value = [];
  selectedIndex.value = 0;
  nextTick(() => searchInput.value?.focus());
}

function close() {
  isOpen.value = false;
  query.value = '';
}

function moveDown() {
  const total = query.value.trim() ? results.value.length : quickActions.length;
  selectedIndex.value = (selectedIndex.value + 1) % total;
}

function moveUp() {
  const total = query.value.trim() ? results.value.length : quickActions.length;
  selectedIndex.value = (selectedIndex.value - 1 + total) % total;
}

function selectItem() {
  if (!query.value.trim()) {
    const action = quickActions[selectedIndex.value];
    if (action) executeAction(action);
  } else {
    const item = results.value[selectedIndex.value];
    if (item) navigateTo(item);
  }
}

function executeAction(action: any) {
  close();
  router.push(action.link);
}

function navigateTo(item: SearchResult) {
  close();
  router.push(item.link);
}

watch(query, (val) => {
  clearTimeout(debounceTimer);
  if (!val.trim()) {
    results.value = [];
    selectedIndex.value = 0;
    return;
  }
  debounceTimer = setTimeout(() => search(val), 300);
});

async function search(q: string) {
  searching.value = true;
  selectedIndex.value = 0;
  const allResults: SearchResult[] = [];

  try {
    const searches = [
      { endpoint: `lead?search=${encodeURIComponent(q)}&limit=5`, type: 'lead' as const, nameKey: 'name', subtitleKey: 'email', linkPrefix: '/sales/leads/' },
      { endpoint: `deal?search=${encodeURIComponent(q)}&limit=5`, type: 'deal' as const, nameKey: 'name', subtitleKey: 'stage', linkPrefix: '/sales/deals/' },
      { endpoint: `client?search=${encodeURIComponent(q)}&limit=5`, type: 'client' as const, nameKey: 'clientName', subtitleKey: 'email', linkPrefix: '/sales/clients/' },
      { endpoint: `tasks?search=${encodeURIComponent(q)}&limit=5`, type: 'task' as const, nameKey: 'title', subtitleKey: 'status', linkPrefix: '/tasks/' }
    ];

    const responses = await Promise.allSettled(
      searches.map(s => useApiFetch(s.endpoint))
    );

    responses.forEach((res, i) => {
      if (res.status !== 'fulfilled') return;
      const { body, success } = res.value;
      if (!success || !body) return;
      const data = body as any;
      const docs = data.docs || data || [];
      const config = searches[i];

      docs.forEach((doc: any) => {
        allResults.push({
          id: doc.id,
          name: doc[config.nameKey] || doc.name || 'Untitled',
          subtitle: doc[config.subtitleKey] || '',
          type: config.type,
          status: doc.status,
          link: config.linkPrefix + doc.id
        });
      });
    });
  } catch { /* silent */ }

  results.value = allResults;
  searching.value = false;
}

// Keyboard shortcut: Ctrl+K
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (isOpen.value) close();
    else open();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Expose for parent
defineExpose({ open, close, isOpen });
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
}

.command-palette {
  width: 640px;
  max-width: 90vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg, rgba(30,30,40,0.95));
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
  box-shadow: 0 25px 60px rgba(0,0,0,0.4);
}

.palette-item {
  transition: background 0.15s;
}
.palette-item:hover,
.palette-item.active {
  background: rgba(120,73,255,0.1);
}

kbd {
  font-family: inherit;
  font-size: 10px;
}

.palette-fade-enter-active { transition: all 0.15s ease-out; }
.palette-fade-leave-active { transition: all 0.1s ease-in; }
.palette-fade-enter-from { opacity: 0; }
.palette-fade-enter-from .command-palette { transform: scale(0.95) translateY(-10px); }
.palette-fade-leave-to { opacity: 0; }
</style>
