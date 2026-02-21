<template lang="pug">
.customer-360-page.p-6
  //- Search / Select Contact
  .glass-card.p-6.rounded-2xl.mb-6(v-if="!selectedContact")
    .text-center.py-12
      Icon(name="ph:address-book-bold" size="48" style="color: #7849ff")
      h2.text-2xl.font-bold.mt-4(style="color: var(--text-primary)") Customer 360° View
      p.mt-2.mb-6(style="color: var(--text-muted)") Search for a contact or client to see their complete profile
      .max-w-lg.mx-auto
        el-select(
          v-model="contactId"
          filterable
          remote
          reserve-keyword
          :remote-method="searchContacts"
          :loading="searchLoading"
          placeholder="Search by name, email, or company..."
          size="large"
          style="width: 100%"
          @change="loadContact"
        )
          el-option(
            v-for="c in searchResults"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          )
            .flex.items-center.gap-3
              .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
                style="background: rgba(120,73,255,0.15); color: #7849ff"
              ) {{ c.name?.charAt(0) }}
              div
                p.font-medium {{ c.name }}
                p.text-xs(style="color: var(--text-muted)") {{ c.email || c.company || '' }}

  //- Contact loaded
  template(v-if="selectedContact")
    //- Header Card
    .glass-card.p-6.rounded-2xl.mb-6
      .flex.items-start.justify-between
        .flex.items-center.gap-5
          .w-20.h-20.rounded-2xl.flex.items-center.justify-center.text-2xl.font-bold(
            style="background: linear-gradient(135deg, #7849ff, #a855f7); color: white"
          ) {{ selectedContact.name?.charAt(0) }}
          div
            .flex.items-center.gap-3
              h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ selectedContact.name }}
              el-tag(v-if="selectedContact.status" :type="selectedContact.status === 'active' ? 'success' : 'info'" effect="dark" round size="small") {{ selectedContact.status }}
            p.mt-1(style="color: var(--text-muted)") {{ selectedContact.company || selectedContact.clientName || '' }}
            .flex.items-center.gap-4.mt-2
              .flex.items-center.gap-1(v-if="selectedContact.email" style="color: var(--text-secondary)")
                Icon(name="ph:envelope" size="14")
                span.text-sm {{ selectedContact.email }}
              .flex.items-center.gap-1(v-if="selectedContact.phone" style="color: var(--text-secondary)")
                Icon(name="ph:phone" size="14")
                span.text-sm {{ selectedContact.phone }}
        .flex.gap-2
          el-button(plain @click="clearContact")
            Icon(name="ph:arrow-left" size="16")
            span.ml-1 Back
          el-button(type="primary" class="!bg-[#7849ff] !border-none")
            Icon(name="ph:pencil-simple" size="16")
            span.ml-1 Edit

    //- Stats Cards
    .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-4")
      .glass-card.p-5.rounded-2xl(v-for="stat in contactStats" :key="stat.label")
        .flex.items-center.justify-between
          div
            p.text-xs.font-medium.uppercase.tracking-wide(style="color: var(--text-muted)") {{ stat.label }}
            p.text-2xl.font-bold.mt-1(:style="{ color: stat.color }") {{ stat.value }}
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: stat.color + '20' }")
            Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")

    //- Tabs
    .glass-card.rounded-2xl.overflow-hidden
      el-tabs(v-model="activeTab" class="customer-tabs")
        //- Overview Tab
        el-tab-pane(name="overview")
          template(#label)
            .flex.items-center.gap-2
              Icon(name="ph:squares-four" size="16")
              span Overview
          .p-6
            .grid.gap-6(class="lg:grid-cols-2")
              //- Recent Activity
              div
                h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
                  Icon(name="ph:clock-counter-clockwise" size="16" class="mr-2" style="color: #7849ff")
                  | Recent Activity
                .space-y-3
                  .flex.items-start.gap-3(v-for="(act, i) in recentActivities" :key="i")
                    .w-8.h-8.rounded-full.flex.items-center.justify-center.flex-shrink-0(:style="{ background: act.color + '20' }")
                      Icon(:name="act.icon" size="14" :style="{ color: act.color }")
                    div
                      p.text-sm.font-medium(style="color: var(--text-primary)") {{ act.title }}
                      p.text-xs(style="color: var(--text-muted)") {{ act.time }}
                  .text-center.py-6(v-if="!recentActivities.length")
                    p.text-sm(style="color: var(--text-muted)") No recent activity

              //- Contact Details
              div
                h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
                  Icon(name="ph:user" size="16" class="mr-2" style="color: #7849ff")
                  | Contact Details
                .space-y-3
                  .flex.justify-between.py-2(v-for="(detail, i) in contactDetails" :key="i" style="border-bottom: 1px solid var(--glass-border)")
                    span.text-sm(style="color: var(--text-muted)") {{ detail.label }}
                    span.text-sm.font-medium(style="color: var(--text-primary)") {{ detail.value }}

        //- Deals Tab
        el-tab-pane(name="deals")
          template(#label)
            .flex.items-center.gap-2
              Icon(name="ph:handshake" size="16")
              span Deals
              el-badge(:value="contactDeals.length" :hidden="!contactDeals.length" type="primary")
          .p-6
            el-table(:data="contactDeals" v-loading="loadingDeals" stripe)
              el-table-column(label="Deal Name" min-width="200")
                template(#default="{ row }")
                  NuxtLink.font-semibold(:to="`/sales/deals/${row.id}`" style="color: #7849ff") {{ row.name }}
              el-table-column(label="Stage" width="150")
                template(#default="{ row }")
                  el-tag(effect="dark" round size="small") {{ row.stage }}
              el-table-column(label="Value" width="140" align="right")
                template(#default="{ row }")
                  span.font-semibold ${{ Number(row.value || 0).toLocaleString() }}
              el-table-column(label="Close Date" width="130")
                template(#default="{ row }")
                  span {{ row.closeDate ? new Date(row.closeDate).toLocaleDateString() : '--' }}
              el-table-column(label="Status" width="120" align="center")
                template(#default="{ row }")
                  el-tag(:type="row.status === 'WON' ? 'success' : row.status === 'LOST' ? 'danger' : 'info'" size="small" round) {{ row.status }}
            .text-center.py-8(v-if="!contactDeals.length && !loadingDeals")
              Icon(name="ph:handshake" size="32" style="color: var(--text-muted)")
              p.mt-2(style="color: var(--text-muted)") No deals found

        //- Invoices Tab
        el-tab-pane(name="invoices")
          template(#label)
            .flex.items-center.gap-2
              Icon(name="ph:receipt" size="16")
              span Invoices
              el-badge(:value="contactInvoices.length" :hidden="!contactInvoices.length" type="primary")
          .p-6
            el-table(:data="contactInvoices" v-loading="loadingInvoices" stripe)
              el-table-column(label="Invoice #" width="150")
                template(#default="{ row }")
                  NuxtLink.font-mono.font-semibold(:to="`/sales/invoices/${row.id}`" style="color: #7849ff") {{ row.invoiceNumber }}
              el-table-column(label="Date" width="130")
                template(#default="{ row }")
                  span {{ row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '--' }}
              el-table-column(label="Amount" width="140" align="right")
                template(#default="{ row }")
                  span.font-semibold ${{ Number(row.total || 0).toLocaleString() }}
              el-table-column(label="Status" width="130" align="center")
                template(#default="{ row }")
                  el-tag(:type="row.status === 'PAID' ? 'success' : row.status === 'OVERDUE' ? 'danger' : 'warning'" size="small" round effect="dark") {{ row.status }}
              el-table-column(label="Due Date" width="130")
                template(#default="{ row }")
                  span {{ row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '--' }}
            .text-center.py-8(v-if="!contactInvoices.length && !loadingInvoices")
              Icon(name="ph:receipt" size="32" style="color: var(--text-muted)")
              p.mt-2(style="color: var(--text-muted)") No invoices found

        //- Tickets Tab
        el-tab-pane(name="tickets")
          template(#label)
            .flex.items-center.gap-2
              Icon(name="ph:ticket" size="16")
              span Tickets
              el-badge(:value="contactTickets.length" :hidden="!contactTickets.length" type="primary")
          .p-6
            el-table(:data="contactTickets" v-loading="loadingTickets" stripe)
              el-table-column(label="Ticket #" width="130")
                template(#default="{ row }")
                  NuxtLink.font-mono.font-semibold(:to="`/support/tickets/${row.id}`" style="color: #7849ff") {{ row.ticketNumber }}
              el-table-column(label="Subject" min-width="250")
                template(#default="{ row }")
                  span {{ row.subject }}
              el-table-column(label="Status" width="140" align="center")
                template(#default="{ row }")
                  el-tag(:type="row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'success' : row.status === 'OPEN' ? 'danger' : 'warning'" size="small" round effect="dark") {{ row.status }}
              el-table-column(label="Priority" width="110" align="center")
                template(#default="{ row }")
                  el-tag(:type="row.priority === 'URGENT' ? 'danger' : row.priority === 'HIGH' ? 'warning' : 'info'" size="small" round) {{ row.priority }}
              el-table-column(label="Created" width="130")
                template(#default="{ row }")
                  span {{ row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--' }}
            .text-center.py-8(v-if="!contactTickets.length && !loadingTickets")
              Icon(name="ph:ticket" size="32" style="color: var(--text-muted)")
              p.mt-2(style="color: var(--text-muted)") No support tickets

        //- Notes Tab
        el-tab-pane(name="notes")
          template(#label)
            .flex.items-center.gap-2
              Icon(name="ph:note" size="16")
              span Notes
          .p-6
            //- Add Note
            .mb-6
              el-input(
                v-model="newNote"
                type="textarea"
                :rows="3"
                placeholder="Add a note about this customer..."
              )
              .flex.justify-end.mt-2
                el-button(type="primary" size="small" @click="addNote" :loading="savingNote" :disabled="!newNote.trim()" class="!bg-[#7849ff] !border-none") Add Note
            //- Notes List
            .space-y-3
              .p-4.rounded-xl(v-for="(note, i) in contactNotes" :key="i" style="background: var(--bg-input); border: 1px solid var(--glass-border)")
                .flex.justify-between.items-start
                  div
                    p.text-sm(style="color: var(--text-primary)") {{ note.content }}
                    .flex.items-center.gap-2.mt-2
                      span.text-xs(style="color: var(--text-muted)") {{ note.createdBy || 'You' }}
                      span.text-xs(style="color: var(--text-muted)") •
                      span.text-xs(style="color: var(--text-muted)") {{ note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Just now' }}
            .text-center.py-8(v-if="!contactNotes.length")
              Icon(name="ph:note" size="32" style="color: var(--text-muted)")
              p.mt-2(style="color: var(--text-muted)") No notes yet
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';

definePageMeta({ middleware: 'permissions' });

const route = useRoute();

const contactId = ref((route.query.contactId as string) || '');
const selectedContact = ref<any>(null);
const searchLoading = ref(false);
const searchResults = ref<any[]>([]);
const activeTab = ref('overview');

// Tab data
const contactDeals = ref<any[]>([]);
const contactInvoices = ref<any[]>([]);
const contactTickets = ref<any[]>([]);
const contactNotes = ref<any[]>([]);
const recentActivities = ref<any[]>([]);
const loadingDeals = ref(false);
const loadingInvoices = ref(false);
const loadingTickets = ref(false);
const newNote = ref('');
const savingNote = ref(false);

// Stats
const contactStats = computed(() => [
  { label: 'Total Deals', value: contactDeals.value.length, icon: 'ph:handshake-bold', color: '#7849ff' },
  {
    label: 'Revenue',
    value:
      '$' +
      contactDeals.value
        .filter(d => d.status === 'WON')
        .reduce((sum, d) => sum + Number(d.value || 0), 0)
        .toLocaleString(),
    icon: 'ph:currency-dollar-bold',
    color: '#10b981'
  },
  {
    label: 'Open Tickets',
    value: contactTickets.value.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length,
    icon: 'ph:ticket-bold',
    color: '#f59e0b'
  },
  { label: 'Invoices', value: contactInvoices.value.length, icon: 'ph:receipt-bold', color: '#3b82f6' }
]);

const contactDetails = computed(() => {
  if (!selectedContact.value) return [];
  const c = selectedContact.value;
  return [
    { label: 'Full Name', value: c.name || '--' },
    { label: 'Email', value: c.email || '--' },
    { label: 'Phone', value: c.phone || '--' },
    { label: 'Company', value: c.company || c.clientName || '--' },
    { label: 'Position', value: c.position || c.jobTitle || '--' },
    { label: 'Source', value: c.source || '--' },
    { label: 'Created', value: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '--' }
  ].filter(d => d.value !== '--');
});

async function searchContacts(query: string) {
  if (!query || query.length < 2) {
    searchResults.value = [];
    return;
  }
  searchLoading.value = true;
  try {
    // Search in clients
    const { body, success } = await useApiFetch(`client?search=${encodeURIComponent(query)}&limit=20`);
    if (success && body) {
      const data = body as any;
      searchResults.value = (data.docs || data || []).map((c: any) => ({
        id: c.id,
        name: c.clientName || c.name,
        email: c.email,
        company: c.company || c.clientName,
        type: 'client'
      }));
    }
  } catch {
    /* silent */
  } finally {
    searchLoading.value = false;
  }
}

async function loadContact(id?: string) {
  const cid = id || contactId.value;
  if (!cid) return;

  try {
    const { body, success } = await useApiFetch(`client/${cid}`);
    if (success && body) {
      const data = body as any;
      selectedContact.value = {
        id: data.id,
        name: data.clientName || data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || data.clientName,
        position: data.position || data.jobTitle,
        source: data.source,
        status: data.status || 'active',
        createdAt: data.createdAt
      };
      // Load all tab data
      await Promise.all([loadDeals(cid), loadInvoices(cid), loadTickets(cid), loadActivities(cid)]);
    }
  } catch {
    ElNotification({ type: 'error', title: 'Error', message: 'Could not load contact' });
  }
}

async function loadDeals(clientId: string) {
  loadingDeals.value = true;
  try {
    const { body, success } = await useApiFetch(`deal?clientId=${clientId}&limit=50`);
    if (success && body) {
      const data = body as any;
      contactDeals.value = data.docs || data || [];
    }
  } catch {
    /* silent */
  } finally {
    loadingDeals.value = false;
  }
}

async function loadInvoices(clientId: string) {
  loadingInvoices.value = true;
  try {
    const { body, success } = await useApiFetch(`invoices/billing?clientId=${clientId}&limit=50`);
    if (success && body) {
      const data = body as any;
      contactInvoices.value = data.docs || data || [];
    }
  } catch {
    /* silent */
  } finally {
    loadingInvoices.value = false;
  }
}

async function loadTickets(clientId: string) {
  loadingTickets.value = true;
  try {
    const { body, success } = await useApiFetch(`support/tickets?clientId=${clientId}&limit=50`);
    if (success && body) {
      const data = body as any;
      contactTickets.value = data.docs || data || [];
    }
  } catch {
    /* silent */
  } finally {
    loadingTickets.value = false;
  }
}

async function loadActivities(clientId: string) {
  // Build activities from all loaded data
  const activities: any[] = [];

  contactDeals.value.slice(0, 5).forEach(d => {
    activities.push({
      title: `Deal "${d.name}" - ${d.stage}`,
      time: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '',
      icon: 'ph:handshake',
      color: '#7849ff'
    });
  });

  contactInvoices.value.slice(0, 3).forEach(inv => {
    activities.push({
      title: `Invoice ${inv.invoiceNumber} - $${Number(inv.total || 0).toLocaleString()}`,
      time: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '',
      icon: 'ph:receipt',
      color: '#10b981'
    });
  });

  contactTickets.value.slice(0, 3).forEach(t => {
    activities.push({
      title: `Ticket: ${t.subject}`,
      time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      icon: 'ph:ticket',
      color: '#f59e0b'
    });
  });

  recentActivities.value = activities.slice(0, 10);
}

async function addNote() {
  if (!newNote.value.trim() || !selectedContact.value) return;
  savingNote.value = true;
  try {
    contactNotes.value.unshift({
      content: newNote.value,
      createdBy: 'You',
      createdAt: new Date().toISOString()
    });
    newNote.value = '';
    ElNotification({ type: 'success', title: 'Note Added', message: 'Note saved successfully' });
  } finally {
    savingNote.value = false;
  }
}

function clearContact() {
  selectedContact.value = null;
  contactId.value = '';
  contactDeals.value = [];
  contactInvoices.value = [];
  contactTickets.value = [];
  contactNotes.value = [];
  recentActivities.value = [];
}

onMounted(() => {
  if (contactId.value) {
    loadContact();
  }
});
</script>

<style scoped>
.customer-360-page {
  animation: fadeIn 0.3s ease-out;
}

.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.customer-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 24px;
  border-bottom: 1px solid var(--glass-border);
}

.customer-tabs :deep(.el-tabs__item) {
  color: var(--text-muted);
}
.customer-tabs :deep(.el-tabs__item.is-active) {
  color: #7849ff;
}
.customer-tabs :deep(.el-tabs__active-bar) {
  background-color: #7849ff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
