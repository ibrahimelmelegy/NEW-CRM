<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(
    title="Delivery Notes"
    subtitle="Manage and track outgoing shipments and deliveries"
  )
    template(#actions)
      NuxtLink(to="/sales/delivery-notes/create")
        el-button(
          size="large"
          type="primary"
          :icon="Plus"
          class="!rounded-2xl"
        ) Create Delivery Note

  //- Filters
  .glass-card.p-4.mt-6.rounded-2xl
    .flex.items-center.gap-4
      el-input(
        v-model="search"
        placeholder="Search delivery notes..."
        size="large"
        class="!rounded-xl max-w-xs"
        clearable
      )
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="18")
      el-select(
        v-model="statusFilter"
        placeholder="All Statuses"
        size="large"
        class="w-44"
        clearable
      )
        el-option(label="All" value="")
        el-option(label="Draft" value="Draft")
        el-option(label="Sent" value="Sent")
        el-option(label="Approved" value="Approved")
        el-option(label="Archived" value="Archived")

  //- Table or Empty State
  .glass-card.mt-4.rounded-2xl.overflow-hidden(v-if="filteredDocs.length > 0")
    el-table(:data="filteredDocs" stripe style="width: 100%;")
      el-table-column(prop="refNumber" label="Reference" width="160")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.refNumber }}
      el-table-column(prop="title" label="Title" min-width="200")
        template(#default="{ row }")
          span.font-bold {{ row.title }}
      el-table-column(prop="clientName" label="Client" min-width="160")
      el-table-column(prop="total" label="Total" width="140")
        template(#default="{ row }")
          span.font-bold {{ row.total?.toLocaleString() }} {{ row.currency }}
      el-table-column(prop="status" label="Status" width="120")
        template(#default="{ row }")
          el-tag(size="small" :type="statusTag(row.status)" round effect="dark") {{ row.status }}
      el-table-column(prop="archivedAt" label="Date" width="130")
        template(#default="{ row }")
          span.text-sm {{ formatDate(row.archivedAt || row.createdAt) }}
      el-table-column(label="Actions" width="120" fixed="right")
        template(#default="{ row }")
          .flex.gap-1
            el-tooltip(content="Delete" placement="top")
              el-button(size="small" circle type="danger" plain @click="handleDelete(row)")
                Icon(name="ph:trash" size="14")

  .glass-card.p-8.mt-6.flex.flex-col.items-center.justify-center.text-center.min-h-96(v-else)
    Icon(name="ph:truck-bold" size="64" class="text-purple-300 mb-4 opacity-50")
    h3.text-2xl.font-bold(style="color: var(--text-primary)") No Delivery Notes
    p.text-muted.mt-2.max-w-md Generate professional delivery notes and packing slips using the Universal Document Engine.
    NuxtLink(to="/sales/delivery-notes/create").mt-6
      el-button(type="primary" size="large" class="!rounded-xl") Create Your First Delivery Note
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useDocumentArchive } from '~/composables/useDocumentArchive';

definePageMeta({ middleware: 'permissions' });

const { filteredDocuments, permanentlyDelete, typeFilter: archiveTypeFilter } = useDocumentArchive();

archiveTypeFilter.value = 'delivery_note';

const search = ref('');
const statusFilter = ref('');

const filteredDocs = computed(() => {
  let docs = filteredDocuments.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.refNumber.toLowerCase().includes(q) || d.clientName?.toLowerCase().includes(q));
  }
  if (statusFilter.value) {
    docs = docs.filter(d => d.status === statusFilter.value);
  }
  return docs;
});

function statusTag(status: string) {
  const map: Record<string, string> = { Draft: 'info', Sent: '', Approved: 'success', Archived: 'info' };
  return map[status] || '';
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`Delete delivery note "${row.title}"?`, 'Delete', { type: 'warning' });
    permanentlyDelete(row.id, 'delivery_note');
    ElMessage.success('Delivery note removed');
  } catch { /* cancelled */ }
}
</script>
