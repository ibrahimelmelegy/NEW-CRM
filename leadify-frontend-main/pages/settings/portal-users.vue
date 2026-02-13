<template lang="pug">
.portal-users-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('portal.title') }}
    p(style="color: var(--text-muted)") {{ $t('portal.subtitle') }}

  //- Tabs
  el-tabs(v-model="activeTab")
    //- Portal Users Tab
    el-tab-pane(:label="$t('portal.portalUsers')" name="users")
      .glass-card.p-6
        .flex.justify-between.items-center.mb-6
          h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('portal.portalUsers') }}
          el-button(type="primary" @click="showUserForm = true" class="!rounded-xl !bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none")
            Icon(name="ph:plus-bold" size="16" aria-hidden="true")
            span.ml-2 {{ $t('portal.addUser') }}

        el-skeleton(:rows="3" animated v-if="loading")

        el-table(:data="portalUsers" v-else style="width: 100%")
          el-table-column(:label="$t('portal.name')" prop="name" min-width="150")
          el-table-column(:label="$t('portal.email')" prop="email" min-width="200")
          el-table-column(:label="$t('portal.client')" min-width="150")
            template(#default="{ row }")
              span {{ row.client?.clientName || '-' }}
          el-table-column(:label="$t('portal.status')" width="120")
            template(#default="{ row }")
              el-tag(:type="row.isActive ? 'success' : 'danger'" size="small" effect="dark") {{ row.isActive ? $t('portal.active') : $t('portal.inactive') }}
          el-table-column(:label="$t('portal.lastLogin')" width="160")
            template(#default="{ row }")
              span {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : $t('portal.never') }}
          el-table-column(:label="$t('common.actions')" width="120" align="center")
            template(#default="{ row }")
              el-switch(v-model="row.isActive" @change="handleToggle(row)" size="small")

    //- Support Tickets Tab
    el-tab-pane(:label="$t('portal.supportTickets')" name="tickets")
      .glass-card.p-6
        h3.text-lg.font-bold.mb-6(style="color: var(--text-primary)") {{ $t('portal.supportTickets') }}

        el-skeleton(:rows="3" animated v-if="ticketsLoading")

        el-table(:data="tickets" v-else style="width: 100%")
          el-table-column(:label="$t('portal.subject')" prop="subject" min-width="200")
          el-table-column(:label="$t('portal.submittedBy')" min-width="150")
            template(#default="{ row }")
              span {{ row.portalUser?.name || '-' }}
          el-table-column(:label="$t('portal.priority')" width="110")
            template(#default="{ row }")
              el-tag(:type="getPriorityType(row.priority)" size="small" effect="dark") {{ row.priority }}
          el-table-column(:label="$t('portal.ticketStatus')" width="120")
            template(#default="{ row }")
              el-tag(:type="getTicketStatusType(row.status)" size="small" effect="dark") {{ row.status }}
          el-table-column(:label="$t('portal.created')" width="140")
            template(#default="{ row }")
              span {{ formatDate(row.createdAt) }}
          el-table-column(:label="$t('common.actions')" width="100" align="center")
            template(#default="{ row }")
              el-button(link @click="openTicket(row)" size="small")
                Icon(name="ph:eye" size="16" aria-label="View")

  //- Create Portal User Dialog
  el-dialog(v-model="showUserForm" :title="$t('portal.addUser')" width="480px")
    .space-y-4
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('portal.name') }}
        el-input(v-model="userForm.name")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('portal.email') }}
        el-input(v-model="userForm.email" type="email")
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('portal.password') }}
        el-input(v-model="userForm.password" type="password" show-password)
      .form-group
        label.block.text-sm.font-medium.mb-2 {{ $t('portal.client') }}
        el-select(v-model="userForm.clientId" class="w-full" :placeholder="$t('portal.selectClient')" filterable)
          el-option(v-for="c in clients" :key="c.id" :label="c.clientName" :value="c.id")

    template(#footer)
      el-button(@click="showUserForm = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingUser" @click="saveUser" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('common.save') }}

  //- Ticket Detail Dialog
  el-dialog(v-model="showTicket" :title="selectedTicket?.subject" width="600px")
    .space-y-4(v-if="selectedTicket")
      .grid.grid-cols-3.gap-4
        div
          label.text-sm(style="color: var(--text-muted)") {{ $t('portal.ticketStatus') }}
          div: el-tag(:type="getTicketStatusType(selectedTicket.status)" size="small" effect="dark") {{ selectedTicket.status }}
        div
          label.text-sm(style="color: var(--text-muted)") {{ $t('portal.priority') }}
          div: el-tag(:type="getPriorityType(selectedTicket.priority)" size="small" effect="dark") {{ selectedTicket.priority }}
        div
          label.text-sm(style="color: var(--text-muted)") {{ $t('portal.submittedBy') }}
          p(style="color: var(--text-primary)") {{ selectedTicket.portalUser?.name }}

      .p-4.rounded-xl(style="background: var(--bg-input); border: 1px solid var(--border-default)")
        label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('portal.description') }}
        p.mt-1(style="color: var(--text-primary)") {{ selectedTicket.description }}

      .p-4.rounded-xl(v-if="selectedTicket.response" style="background: var(--bg-input); border: 1px solid var(--border-default)")
        label.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('portal.yourResponse') }}
        p.mt-1(style="color: var(--text-primary)") {{ selectedTicket.response }}

      .form-group(v-if="selectedTicket.status !== 'CLOSED'")
        label.block.text-sm.font-medium.mb-2 {{ $t('portal.respond') }}
        el-input(v-model="responseText" type="textarea" :rows="3" :placeholder="$t('portal.responsePlaceholder')")
        .flex.gap-2.mt-3
          el-select(v-model="responseStatus" class="w-40")
            el-option(label="Resolved" value="RESOLVED")
            el-option(label="In Progress" value="IN_PROGRESS")
            el-option(label="Closed" value="CLOSED")
          el-button(type="primary" :loading="responding" @click="submitResponse" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") {{ $t('portal.sendResponse') }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  fetchPortalUsers, createPortalUser, togglePortalUser,
  fetchAllTickets, respondToTicket,
  type PortalUser, type SupportTicket
} from '~/composables/usePortal';

const loading = ref(true);
const ticketsLoading = ref(true);
const savingUser = ref(false);
const responding = ref(false);
const activeTab = ref('users');
const portalUsers = ref<PortalUser[]>([]);
const tickets = ref<SupportTicket[]>([]);
const clients = ref<any[]>([]);
const showUserForm = ref(false);
const showTicket = ref(false);
const selectedTicket = ref<SupportTicket | null>(null);
const responseText = ref('');
const responseStatus = ref('RESOLVED');
const userForm = ref({ name: '', email: '', password: '', clientId: '' });

onMounted(async () => {
  const [users, ticketData, clientData] = await Promise.all([
    fetchPortalUsers(),
    fetchAllTickets(),
    useApiFetch('client?limit=1000')
  ]);
  portalUsers.value = users;
  tickets.value = ticketData;
  clients.value = clientData.body?.docs || [];
  loading.value = false;
  ticketsLoading.value = false;
});

function formatDate(d: string) { return new Date(d).toLocaleDateString(); }

function getTicketStatusType(status: string) {
  const map: Record<string, string> = { OPEN: 'danger', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'info' };
  return map[status] || 'info';
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = { LOW: 'info', MEDIUM: '', HIGH: 'warning', URGENT: 'danger' };
  return map[priority] || '';
}

async function handleToggle(user: PortalUser) {
  await togglePortalUser(user.id, user.isActive);
}

async function saveUser() {
  savingUser.value = true;
  const response = await createPortalUser(userForm.value);
  if (response.success) {
    portalUsers.value = await fetchPortalUsers();
    showUserForm.value = false;
    userForm.value = { name: '', email: '', password: '', clientId: '' };
  }
  savingUser.value = false;
}

function openTicket(ticket: SupportTicket) {
  selectedTicket.value = ticket;
  responseText.value = '';
  responseStatus.value = 'RESOLVED';
  showTicket.value = true;
}

async function submitResponse() {
  if (!selectedTicket.value || !responseText.value.trim()) return;
  responding.value = true;
  await respondToTicket(selectedTicket.value.id, responseText.value, responseStatus.value);
  tickets.value = await fetchAllTickets();
  showTicket.value = false;
  responding.value = false;
}
</script>
