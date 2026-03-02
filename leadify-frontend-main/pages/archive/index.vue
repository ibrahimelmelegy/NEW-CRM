<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📁 Document Archive
      p.text-sm.mt-1(style="color: var(--text-muted);") All archived documents across the CRM — search, filter, restore or permanently delete.
    .flex.items-center.gap-3
      el-button(
        type="danger"
        plain
        size="default"
        :disabled="selectedIds.length === 0"
        @click="handleBulkDelete"
        style="border-radius: 12px;"
      )
        Icon(name="ph:trash" size="16" style="margin-right: 4px;")
        | Delete ({{ selectedIds.length }})
      el-button(
        type="primary"
        size="default"
        :disabled="selectedIds.length === 0"
        @click="handleBulkRestore"
        style="background: var(--bg-obsidian); border: none; border-radius: 12px;"
      )
        Icon(name="ph:arrow-counter-clockwise" size="16" style="margin-right: 4px;")
        | Restore ({{ selectedIds.length }})

  //- Stats Row
  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Archived
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Document Types
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ Object.keys(stats.byType).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Value
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.totalValue.toLocaleString() }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") This Month
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ thisMonthCount }}

  //- Filters
  .flex.items-center.gap-4.mb-6
    el-input(
      v-model="searchQuery"
      placeholder="Search by title, ref, or client..."
      prefix-icon="Search"
      size="large"
      clearable
      style="max-width: 360px;"
      class="!rounded-xl"
    )
    el-select(
      v-model="typeFilter"
      placeholder="All Document Types"
      size="large"
      clearable
      class="w-56 !rounded-xl"
    )
      el-option(label="All Types" value="all")
      el-option(
        v-for="(info, key) in documentTypeLabels"
        :key="key"
        :label="info.label"
        :value="key"
      )

  //- Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(
      :data="filteredDocuments"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      empty-text="No archived documents found."
      row-class-name="hover:bg-gray-50/50 transition-colors"
    )
      el-table-column(type="selection" width="50")
      el-table-column(label="Ref #" prop="refNumber" width="160")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.refNumber }}
      el-table-column(label="Type" width="180")
        template(#default="{ row }")
          .flex.items-center.gap-2
            .w-2.h-2.rounded-full(:style="{ backgroundColor: documentTypeLabels[row.documentType]?.color || '#6b7280' }")
            span.text-sm.font-semibold {{ documentTypeLabels[row.documentType]?.label || row.documentType }}
      el-table-column(label="Title" prop="title" min-width="220")
        template(#default="{ row }")
          p.text-sm.font-bold.text-gray-900.truncate {{ row.title }}
          p.text-xs.text-gray-500 {{ row.clientName }}
      el-table-column(label="Total" width="140" align="right")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm {{ row.total?.toLocaleString() }} {{ row.currency }}
      el-table-column(label="Status" width="120")
        template(#default="{ row }")
          el-tag(
            :type="statusTagType(row.status)"
            size="small"
            round
            effect="plain"
          ) {{ row.status }}
      el-table-column(label="Archived" width="160")
        template(#default="{ row }")
          span.text-xs.text-gray-500 {{ formatDate(row.archivedAt) }}
      el-table-column(label="Actions" width="130" fixed="right")
        template(#default="{ row }")
          .flex.items-center.gap-1
            el-tooltip(content="Restore" placement="top")
              el-button(
                type="primary"
                size="small"
                circle
                plain
                @click="handleRestore(row)"
              )
                Icon(name="ph:arrow-counter-clockwise" size="14")
            el-tooltip(content="Delete Permanently" placement="top")
              el-button(
                type="danger"
                size="small"
                circle
                plain
                @click="handleDelete(row)"
              )
                Icon(name="ph:trash" size="14")
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDocumentArchive, documentTypeLabels } from '~/composables/useDocumentArchive';
import type { ArchivedDocument } from '~/composables/useDocumentArchive';

definePageMeta({});

const { filteredDocuments, stats, typeFilter, searchQuery, restoreDocument, permanentlyDelete, bulkRestore, bulkDelete, archivedDocuments } =
  useDocumentArchive();

const selectedRows = ref<ArchivedDocument[]>([]);
const selectedIds = computed(() => selectedRows.value.map(r => ({ id: r.id, documentType: r.documentType })));

const thisMonthCount = computed(() => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return archivedDocuments.value.filter(d => d.archivedAt >= start).length;
});

function handleSelectionChange(rows: ArchivedDocument[]) {
  selectedRows.value = rows;
}

function handleRestore(row: ArchivedDocument) {
  ElMessageBox.confirm(`Restore "${row.title}" (${row.refNumber})?`, 'Restore Document', {
    confirmButtonText: 'Restore',
    cancelButtonText: 'Cancel',
    type: 'info'
  })
    .then(() => {
      restoreDocument(row.id, row.documentType);
      ElMessage.success(`"${row.refNumber}" restored successfully.`);
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function handleDelete(row: ArchivedDocument) {
  ElMessageBox.confirm(`Permanently delete "${row.title}" (${row.refNumber})? This action cannot be undone.`, 'Delete Permanently', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
    .then(() => {
      permanentlyDelete(row.id, row.documentType);
      ElMessage.success(`"${row.refNumber}" permanently deleted.`);
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function handleBulkRestore() {
  ElMessageBox.confirm(`Restore ${selectedIds.value.length} document(s)?`, 'Bulk Restore', {
    confirmButtonText: 'Restore All',
    cancelButtonText: 'Cancel',
    type: 'info'
  })
    .then(() => {
      const count = bulkRestore(selectedIds.value);
      ElMessage.success(`${count} document(s) restored.`);
      selectedRows.value = [];
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function handleBulkDelete() {
  ElMessageBox.confirm(`Permanently delete ${selectedIds.value.length} document(s)? This cannot be undone.`, 'Bulk Delete', {
    confirmButtonText: 'Delete All',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
    .then(() => {
      const count = bulkDelete(selectedIds.value);
      ElMessage.success(`${count} document(s) permanently deleted.`);
      selectedRows.value = [];
    })
    .catch((error: unknown) => {
      console.error('Operation failed:', error);
    });
}

function statusTagType(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    Draft: 'info',
    Sent: '',
    Approved: 'success',
    Rejected: 'danger',
    Archived: 'warning'
  };
  return map[status] || 'info';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>
