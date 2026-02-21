<template lang="pug">
div(v-loading="loadingClient")
  //- Customer Header
  .glass-card.p-6.mb-6.animate-entrance(v-if="client")
    .flex.items-center.justify-between.flex-wrap.gap-4
      .flex.items-center.gap-4
        .w-16.h-16.rounded-2xl.flex.items-center.justify-center.text-2xl.font-bold.text-white(
          style="background: linear-gradient(135deg, #7849ff, #a78bfa)"
        ) {{ getInitials(client.name) }}
        div
          .flex.items-center.gap-3
            h2.text-2xl.font-bold(style="color: var(--text-primary)") {{ client.name }}
            el-tag(:type="getStatusType(client.status)" effect="dark" round) {{ client.status }}
          .flex.items-center.gap-4.mt-1
            .flex.items-center.gap-1(v-if="client.industry")
              Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
              span.text-sm(style="color: var(--text-muted)") {{ client.industry }}
            .flex.items-center.gap-1(v-if="client.email")
              Icon(name="ph:envelope-bold" size="14" style="color: var(--text-muted)")
              span.text-sm(style="color: var(--text-muted)") {{ client.email }}
            .flex.items-center.gap-1(v-if="client.phone")
              Icon(name="ph:phone-bold" size="14" style="color: var(--text-muted)")
              span.text-sm(style="color: var(--text-muted)") {{ client.phone }}
      .flex.items-center.gap-3
        el-button(size="large" @click="navigateTo(`/sales/clients`)" class="!rounded-2xl")
          Icon(name="ph:arrow-left-bold" size="16")
          span.ml-1 {{ $t('common.back') }}
        el-button(size="large" type="primary" @click="refreshAll" :loading="refreshing" class="!rounded-2xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
          Icon(name="ph:arrows-clockwise-bold" size="16")

  //- KPI Stats
  StatCards(:stats="clientStats" :columns="4")

  //- Tabs
  el-tabs.mt-2(v-model="activeTab" type="border-card" class="customer360-tabs")

    //- Overview Tab
    el-tab-pane(:label="$t('customer360.overview')" name="overview")
      .grid.grid-cols-1.gap-6(class="lg:grid-cols-2")
        //- Key Info
        .glass-card.p-6
          h4.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('customer360.keyInfo') }}
          .space-y-3
            .flex.justify-between.py-2.border-b(style="border-color: var(--border-default)")
              span.text-sm(style="color: var(--text-muted)") {{ $t('clients.info.clientType') }}
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ client?.clientType || '--' }}
            .flex.justify-between.py-2.border-b(style="border-color: var(--border-default)")
              span.text-sm(style="color: var(--text-muted)") {{ $t('clients.info.industry') }}
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ client?.industry || '--' }}
            .flex.justify-between.py-2.border-b(style="border-color: var(--border-default)")
              span.text-sm(style="color: var(--text-muted)") {{ $t('clients.info.address') }}
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ formatAddress(client) }}
            .flex.justify-between.py-2.border-b(style="border-color: var(--border-default)")
              span.text-sm(style="color: var(--text-muted)") {{ $t('clients.info.assign') }}
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ client?.assignedUser?.name || '--' }}
            .flex.justify-between.py-2
              span.text-sm(style="color: var(--text-muted)") {{ $t('clients.info.lastUpdated') }}
              span.text-sm.font-medium(style="color: var(--text-primary)") {{ client?.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '--' }}

        //- Recent Activities
        .glass-card.p-6
          h4.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('customer360.recentActivities') }}
          .space-y-3
            .flex.items-start.gap-3(v-for="activity in recentActivities.slice(0, 8)" :key="activity.id")
              .w-2.h-2.rounded-full.mt-2.shrink-0(:class="activity.status === 'create' ? 'bg-green-500' : activity.status === 'update' ? 'bg-blue-500' : 'bg-red-500'")
              div
                p.text-sm(style="color: var(--text-primary)") {{ activity.description }}
                span.text-xs(style="color: var(--text-muted)") {{ activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '' }}
            .text-center.py-4(v-if="!recentActivities.length")
              p.text-sm(style="color: var(--text-muted)") {{ $t('customer360.noActivities') }}

    //- Deals Tab
    el-tab-pane(:label="$t('customer360.deals')" name="deals")
      .glass-card.p-6
        el-table(:data="deals" v-loading="loadingDeals" style="width: 100%")
          el-table-column(:label="$t('deals.table.name')" prop="name" min-width="200")
            template(#default="{ row }")
              NuxtLink(:to="`/sales/deals/${row.id}`" style="color: var(--accent-color, #7849ff)" class="font-bold hover:underline") {{ row.name }}
          el-table-column(:label="$t('deals.table.stage')" prop="stage" width="130")
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.stage }}
          el-table-column(:label="$t('deals.table.price')" width="160" sortable)
            template(#default="{ row }")
              span.font-bold SAR {{ formatLargeNumber(row.price || 0) }}
          el-table-column(:label="$t('deals.table.contractType')" prop="contractType" width="150")
          el-table-column(:label="$t('deals.table.created')" width="140")
            template(#default="{ row }")
              span.text-sm {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--' }}
          template(#empty)
            el-empty(:description="$t('customer360.noDeals')")

    //- Invoices Tab
    el-tab-pane(:label="$t('customer360.invoices')" name="invoices")
      .glass-card.p-6
        //- Invoice Totals
        .grid.grid-cols-1.gap-4.mb-6(class="md:grid-cols-3")
          .p-4.rounded-xl(style="background: var(--bg-input); border: 1px solid var(--border-default)")
            p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('customer360.totalInvoiced') }}
            p.text-xl.font-bold.mt-1(style="color: var(--text-primary)") SAR {{ formatLargeNumber(invoiceTotals.total) }}
          .p-4.rounded-xl(style="background: var(--bg-input); border: 1px solid var(--border-default)")
            p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('customer360.totalCollected') }}
            p.text-xl.font-bold.mt-1(style="color: #10B981") SAR {{ formatLargeNumber(invoiceTotals.collected) }}
          .p-4.rounded-xl(style="background: var(--bg-input); border: 1px solid var(--border-default)")
            p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('customer360.outstanding') }}
            p.text-xl.font-bold.mt-1(style="color: #F97316") SAR {{ formatLargeNumber(invoiceTotals.outstanding) }}

        el-table(:data="invoices" v-loading="loadingInvoices" style="width: 100%")
          el-table-column(:label="$t('invoices.invoiceNo')" prop="invoiceNumber" width="140")
          el-table-column(:label="$t('invoices.deal')" min-width="180")
            template(#default="{ row }")
              span {{ row.deal?.name || '--' }}
          el-table-column(:label="$t('invoices.amount')" width="150" sortable)
            template(#default="{ row }")
              span.font-bold SAR {{ formatLargeNumber(row.amount || 0) }}
          el-table-column(:label="$t('invoices.status')" width="120")
            template(#default="{ row }")
              el-tag(:type="row.collected ? 'success' : 'warning'" size="small" effect="dark" round) {{ row.collected ? $t('invoices.collected') : $t('invoices.pending') }}
          el-table-column(:label="$t('invoices.date')" width="140")
            template(#default="{ row }")
              span.text-sm {{ row.date ? new Date(row.date).toLocaleDateString() : '--' }}
          template(#empty)
            el-empty(:description="$t('customer360.noInvoices')")

    //- Projects Tab
    el-tab-pane(:label="$t('customer360.projects')" name="projects")
      .glass-card.p-6
        el-table(:data="projects" v-loading="loadingProjects" style="width: 100%")
          el-table-column(:label="$t('operations.projects.table.projectName')" min-width="200")
            template(#default="{ row }")
              NuxtLink(:to="`/operations/projects/${row.slug || row.id}`" style="color: var(--accent-color, #7849ff)" class="font-bold hover:underline") {{ row.name }}
          el-table-column(:label="$t('operations.projects.table.status')" width="130")
            template(#default="{ row }")
              el-tag(size="small" effect="plain" round) {{ row.status }}
          el-table-column(:label="$t('operations.projects.table.startDate')" width="140")
            template(#default="{ row }")
              span.text-sm {{ row.startDate ? new Date(row.startDate).toLocaleDateString() : '--' }}
          el-table-column(:label="$t('operations.projects.table.endDate')" width="140")
            template(#default="{ row }")
              span.text-sm {{ row.endDate ? new Date(row.endDate).toLocaleDateString() : '--' }}
          el-table-column(:label="$t('operations.projects.table.totalCost')" width="150" sortable)
            template(#default="{ row }")
              span SAR {{ formatLargeNumber(row.totalCost || 0) }}
          template(#empty)
            el-empty(:description="$t('customer360.noProjects')")

    //- Contracts Tab
    el-tab-pane(:label="$t('customer360.contracts')" name="contracts")
      .glass-card.p-6
        el-table(:data="contracts" v-loading="loadingContracts" style="width: 100%")
          el-table-column(:label="$t('contracts.titleField')" min-width="200")
            template(#default="{ row }")
              span.font-bold(style="color: var(--text-primary)") {{ row.title }}
          el-table-column(:label="$t('contracts.status')" width="130")
            template(#default="{ row }")
              el-tag(:type="row.status === 'signed' ? 'success' : row.status === 'sent' ? 'warning' : 'info'" size="small" effect="plain" round) {{ row.status }}
          el-table-column(:label="$t('contracts.signerName')" prop="signerName" width="160")
          el-table-column(:label="$t('contracts.signedAt')" width="150")
            template(#default="{ row }")
              span.text-sm {{ row.signedAt ? new Date(row.signedAt).toLocaleDateString() : '--' }}
          template(#empty)
            el-empty(:description="$t('customer360.noContracts')")

    //- Contacts Tab
    el-tab-pane(:label="$t('customer360.contacts')" name="contacts")
      .glass-card.p-6
        el-table(:data="contacts" v-loading="loadingContacts" style="width: 100%")
          el-table-column(:label="$t('customer360.contactName')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-3
                .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: #7849ff") {{ getInitials(row.name || row.firstName) }}
                span.font-medium(style="color: var(--text-primary)") {{ row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() }}
          el-table-column(:label="$t('customer360.contactEmail')" prop="email" min-width="200")
          el-table-column(:label="$t('customer360.contactPhone')" prop="phone" width="160")
          el-table-column(:label="$t('customer360.contactRole')" prop="role" width="140")
          template(#empty)
            el-empty(:description="$t('customer360.noContacts')")

    //- Communications Tab
    el-tab-pane(:label="$t('customer360.communications')" name="communications")
      .glass-card.p-6
        .space-y-4(v-if="communications.length")
          .flex.items-start.gap-4.p-4.rounded-xl(
            v-for="comm in communications"
            :key="comm.id"
            style="background: var(--bg-input); border: 1px solid var(--border-default)"
          )
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getCommColor(comm.type) + '20' }")
              Icon(:name="getCommIcon(comm.type)" size="18" :style="{ color: getCommColor(comm.type) }")
            div.flex-1
              .flex.items-center.gap-2.mb-1
                span.font-bold.text-sm(style="color: var(--text-primary)") {{ comm.subject || comm.type }}
                el-tag(size="small" effect="plain" round) {{ comm.type }}
              p.text-sm(style="color: var(--text-muted)") {{ comm.description || comm.content || '' }}
              span.text-xs.mt-1.block(style="color: var(--text-muted)") {{ comm.createdAt ? new Date(comm.createdAt).toLocaleString() : '' }}
        .text-center.py-8(v-else)
          el-empty(:description="$t('customer360.noCommunications')")

    //- Tickets Tab
    el-tab-pane(:label="$t('customer360.tickets')" name="tickets")
      .glass-card.p-6
        el-table(:data="tickets" v-loading="loadingTickets" style="width: 100%")
          el-table-column(:label="$t('portal.subject')" min-width="200")
            template(#default="{ row }")
              span.font-bold(style="color: var(--text-primary)") {{ row.subject }}
          el-table-column(:label="$t('portal.priority')" width="110")
            template(#default="{ row }")
              el-tag(:type="row.priority === 'high' || row.priority === 'urgent' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small" effect="plain" round) {{ row.priority }}
          el-table-column(:label="$t('portal.ticketStatus')" width="120")
            template(#default="{ row }")
              el-tag(:type="row.status === 'open' ? 'warning' : row.status === 'resolved' ? 'success' : 'info'" size="small" effect="dark" round) {{ row.status }}
          el-table-column(:label="$t('portal.created')" width="150")
            template(#default="{ row }")
              span.text-sm {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--' }}
          template(#empty)
            el-empty(:description="$t('customer360.noTickets')")

    //- Documents Tab
    el-tab-pane(:label="$t('customer360.documents')" name="documents")
      .glass-card.p-6
        el-table(:data="documents" v-loading="loadingDocuments" style="width: 100%")
          el-table-column(:label="$t('documents.fileName')" min-width="200")
            template(#default="{ row }")
              .flex.items-center.gap-2
                Icon(:name="getFileIcon(row.mimeType || row.type)" size="18" style="color: var(--accent-color, #7849ff)")
                span.font-medium(style="color: var(--text-primary)") {{ row.name || row.fileName }}
          el-table-column(:label="$t('documents.fileSize')" width="120")
            template(#default="{ row }")
              span.text-sm {{ formatFileSize(row.size || 0) }}
          el-table-column(:label="$t('documents.uploadDate')" width="150")
            template(#default="{ row }")
              span.text-sm {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--' }}
          el-table-column(:label="$t('common.actions')" width="100")
            template(#default="{ row }")
              el-button(v-if="row.url" link size="small" @click="window.open(row.url, '_blank')")
                Icon(name="ph:download-bold" size="16" style="color: var(--accent-color, #7849ff)")
          template(#empty)
            el-empty(:description="$t('customer360.noDocuments')")

    //- Activity Tab
    el-tab-pane(:label="$t('customer360.activity')" name="activity")
      .glass-card.p-6
        RecordTimeline(v-if="client" entityType="client" :entityId="String(client.id)")

    //- Notes Tab
    el-tab-pane(:label="$t('customer360.notes')" name="notes")
      .glass-card.p-6
        RecordComments(v-if="client" entityType="client" :entityId="String(client.id)")
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'permissions' });

const route = useRoute();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const clientId = computed(() => route.params.id as string);
const activeTab = ref('overview');
const loadingClient = ref(false);
const refreshing = ref(false);
const loadingDeals = ref(false);
const loadingInvoices = ref(false);
const loadingProjects = ref(false);
const loadingContracts = ref(false);
const loadingContacts = ref(false);
const loadingTickets = ref(false);
const loadingDocuments = ref(false);

const client = ref<any>(null);
const deals = ref<any[]>([]);
const invoices = ref<any[]>([]);
const projects = ref<any[]>([]);
const contracts = ref<any[]>([]);
const contacts = ref<any[]>([]);
const communications = ref<any[]>([]);
const tickets = ref<any[]>([]);
const documents = ref<any[]>([]);
const recentActivities = ref<any[]>([]);

// Stats
const clientStats = computed(() => [
  {
    label: t('customer360.totalRevenue'),
    value: `SAR ${formatLargeNumber(deals.value.reduce((sum, d) => sum + (d.price || 0), 0))}`,
    icon: 'ph:currency-circle-dollar-bold',
    color: '#10B981'
  },
  {
    label: t('customer360.activeDeals'),
    value: deals.value.filter(d => !['closed', 'cancelled', 'lost'].includes(d.stage?.toLowerCase())).length,
    icon: 'ph:handshake-bold',
    color: '#7849FF'
  },
  {
    label: t('customer360.openTickets'),
    value: tickets.value.filter(t => t.status === 'open' || t.status === 'pending').length,
    icon: 'ph:ticket-bold',
    color: '#F97316'
  },
  {
    label: t('customer360.lastActivity'),
    value: recentActivities.value.length ? new Date(recentActivities.value[0].createdAt).toLocaleDateString() : '--',
    icon: 'ph:clock-bold',
    color: '#3B82F6'
  }
]);

const invoiceTotals = computed(() => {
  const total = invoices.value.reduce((s, i) => s + (i.amount || 0), 0);
  const collected = invoices.value.filter(i => i.collected).reduce((s, i) => s + (i.amount || 0), 0);
  return { total, collected, outstanding: total - collected };
});

// Data Loading
async function loadClient() {
  loadingClient.value = true;
  try {
    const { body, success } = await useApiFetch(`client/${clientId.value}`);
    if (success && body) client.value = body;
  } finally {
    loadingClient.value = false;
  }
}

async function loadDeals() {
  loadingDeals.value = true;
  try {
    const { body, success } = await useApiFetch(`deal?clientId=${clientId.value}`);
    if (success && body) deals.value = body.docs || body || [];
  } finally {
    loadingDeals.value = false;
  }
}

async function loadInvoices() {
  loadingInvoices.value = true;
  try {
    const { body, success } = await useApiFetch(`invoices?clientId=${clientId.value}`);
    if (success && body) invoices.value = body.docs || body || [];
  } finally {
    loadingInvoices.value = false;
  }
}

async function loadProjects() {
  loadingProjects.value = true;
  try {
    const { body, success } = await useApiFetch(`project?clientId=${clientId.value}`);
    if (success && body) projects.value = body.docs || body || [];
  } finally {
    loadingProjects.value = false;
  }
}

async function loadContracts() {
  loadingContracts.value = true;
  try {
    const { body, success } = await useApiFetch(`contracts?clientId=${clientId.value}`);
    if (success && body) contracts.value = body.docs || body || [];
  } finally {
    loadingContracts.value = false;
  }
}

async function loadContacts() {
  loadingContacts.value = true;
  try {
    const { body, success } = await useApiFetch(`client/${clientId.value}/contacts`);
    if (success && body) contacts.value = body.docs || body || [];
  } finally {
    loadingContacts.value = false;
  }
}

async function loadCommunications() {
  try {
    const { body, success } = await useApiFetch(`activity/client/${clientId.value}?limit=20`);
    if (success && body) communications.value = body.docs || body || [];
  } catch {}
}

async function loadTickets() {
  loadingTickets.value = true;
  try {
    const { body, success } = await useApiFetch(`support/tickets?clientId=${clientId.value}`);
    if (success && body) tickets.value = body.docs || body || [];
  } finally {
    loadingTickets.value = false;
  }
}

async function loadDocuments() {
  loadingDocuments.value = true;
  try {
    const { body, success } = await useApiFetch(`attachments?entityType=client&entityId=${clientId.value}`);
    if (success && body) documents.value = body.docs || body || [];
  } finally {
    loadingDocuments.value = false;
  }
}

async function loadActivities() {
  try {
    const { body, success } = await useApiFetch(`activity/client/${clientId.value}?limit=10`);
    if (success && body) recentActivities.value = body.docs || body || [];
  } catch {}
}

async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.all([
      loadClient(),
      loadDeals(),
      loadInvoices(),
      loadProjects(),
      loadContracts(),
      loadContacts(),
      loadCommunications(),
      loadTickets(),
      loadDocuments(),
      loadActivities()
    ]);
  } finally {
    refreshing.value = false;
  }
}

// Helpers
function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getStatusType(status: string): string {
  const map: Record<string, string> = { active: 'success', inactive: 'info', archived: 'warning' };
  return map[status?.toLowerCase()] || 'info';
}

function formatAddress(c: any): string {
  if (!c) return '--';
  const parts = [c.street, c.city, c.state, c.zipCode].filter(Boolean);
  return parts.length ? parts.join(', ') : '--';
}

function getCommIcon(type: string): string {
  const map: Record<string, string> = {
    email: 'ph:envelope-bold',
    call: 'ph:phone-bold',
    meeting: 'ph:video-camera-bold',
    note: 'ph:note-bold'
  };
  return map[type?.toLowerCase()] || 'ph:chat-circle-bold';
}

function getCommColor(type: string): string {
  const map: Record<string, string> = {
    email: '#3B82F6',
    call: '#10B981',
    meeting: '#7849FF',
    note: '#F97316'
  };
  return map[type?.toLowerCase()] || '#94A3B8';
}

function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'ph:file-bold';
  if (mimeType.includes('pdf')) return 'ph:file-pdf-bold';
  if (mimeType.includes('image')) return 'ph:image-bold';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'ph:file-xls-bold';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'ph:file-doc-bold';
  return 'ph:file-bold';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Init
onMounted(() => refreshAll());
</script>

<style lang="scss" scoped>
.customer360-tabs {
  :deep(.el-tabs__header) {
    background: transparent;
    border: none;
  }
  :deep(.el-tabs__content) {
    padding: 16px 0 0;
    background: transparent;
  }
  :deep(.el-tabs__item) {
    color: var(--text-muted);
    &.is-active {
      color: var(--accent-color, #7849ff);
    }
  }
}
</style>
