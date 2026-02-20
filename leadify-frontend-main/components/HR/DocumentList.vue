<template lang="pug">
.document-list
  el-table(:data="documents" stripe style="width: 100%" empty-text="No documents found")
    el-table-column(label="Type" width="120")
      template(#default="{ row }")
        .flex.items-center.gap-2
          Icon(:name="getTypeIcon(row.type)" size="18" :style="{ color: getTypeColor(row.type) }")
          span.text-sm {{ getDocumentTypeLabel(row.type) }}

    el-table-column(prop="name" label="Document Name" min-width="180")
      template(#default="{ row }")
        span.font-medium(style="color: var(--text-primary)") {{ row.name }}

    el-table-column(label="Expiry Date" width="160")
      template(#default="{ row }")
        template(v-if="row.expiryDate")
          .flex.items-center.gap-2
            Icon(
              :name="isExpired(row.expiryDate) ? 'ph:warning-circle-bold' : isExpiringSoon(row.expiryDate) ? 'ph:clock-bold' : 'ph:calendar-check-bold'"
              size="16"
              :style="{ color: getExpiryColor(row.expiryDate) }"
            )
            span.text-sm(:style="{ color: getExpiryColor(row.expiryDate) }") {{ formatDate(row.expiryDate) }}
        template(v-else)
          span.text-sm(style="color: var(--text-muted)") N/A

    el-table-column(label="Notes" min-width="150")
      template(#default="{ row }")
        span.text-sm(style="color: var(--text-muted)") {{ row.notes || '---' }}

    el-table-column(label="Actions" width="100" align="center")
      template(#default="{ row }")
        el-button(
          type="primary"
          size="small"
          circle
          @click="handleDownload(row)"
        )
          Icon(name="ph:download-bold" size="14")
</template>

<script setup lang="ts">
import { getDocumentTypeLabel } from '~/composables/useEmployees';
import type { EmployeeDocumentItem } from '~/composables/useEmployees';

defineProps<{
  documents: EmployeeDocumentItem[];
}>();

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    CONTRACT: 'ph:file-text-bold',
    ID: 'ph:identification-card-bold',
    CERTIFICATION: 'ph:certificate-bold',
    VISA: 'ph:airplane-bold',
    MEDICAL: 'ph:first-aid-kit-bold'
  };
  return icons[type] || 'ph:file-bold';
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    CONTRACT: '#7849ff',
    ID: '#3b82f6',
    CERTIFICATION: '#22c55e',
    VISA: '#f59e0b',
    MEDICAL: '#ef4444'
  };
  return colors[type] || '#6b7280';
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string): boolean {
  const expiryDate = new Date(dateStr);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
}

function getExpiryColor(dateStr: string): string {
  if (isExpired(dateStr)) return '#ef4444';
  if (isExpiringSoon(dateStr)) return '#f59e0b';
  return '#22c55e';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function handleDownload(doc: EmployeeDocumentItem) {
  if (doc.fileUrl) {
    window.open(doc.fileUrl, '_blank');
  }
}
</script>
