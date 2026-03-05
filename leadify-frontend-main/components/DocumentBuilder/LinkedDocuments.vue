<template lang="pug">
.linked-documents
  h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") Linked Documents

  //- Parent document
  .mb-4(v-if="parentDocument")
    p.text-xs.font-bold.uppercase.tracking-widest.mb-2(style="color: var(--text-muted)") Converted From
    NuxtLink(:to="getDocUrl(parentDocument)" class="block")
      .glass-card.p-3.rounded-xl.flex.items-center.gap-3.hover_shadow-md.transition-all.cursor-pointer
        .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(59,130,246,0.1); color: #3b82f6;")
          Icon(:name="getTypeIcon(parentDocument.type)" size="16")
        .flex-1
          span.font-bold.text-sm(style="color: var(--text-primary)") {{ parentDocument.title }}
          .flex.items-center.gap-2(class="mt-0.5")
            span.font-mono.text-xs(style="color: var(--text-muted)") {{ parentDocument.reference }}
            el-tag(size="small" round effect="plain") {{ formatType(parentDocument.type) }}
        Icon(name="ph:arrow-right" size="16" style="color: var(--text-muted)")

  //- Child documents
  div(v-if="childDocuments && childDocuments.length > 0")
    p.text-xs.font-bold.uppercase.tracking-widest.mb-2(style="color: var(--text-muted)") Converted To
    .space-y-2
      NuxtLink(v-for="child in childDocuments" :key="child.id" :to="getDocUrl(child)" class="block")
        .glass-card.p-3.rounded-xl.flex.items-center.gap-3.hover_shadow-md.transition-all.cursor-pointer
          .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(16,185,129,0.1); color: #10b981;")
            Icon(:name="getTypeIcon(child.type)" size="16")
          .flex-1
            span.font-bold.text-sm(style="color: var(--text-primary)") {{ child.title }}
            .flex.items-center.gap-2(class="mt-0.5")
              span.font-mono.text-xs(style="color: var(--text-muted)") {{ child.reference }}
              el-tag(size="small" :type="statusTagType(child.status)" round effect="dark") {{ formatStatus(child.status) }}
          Icon(name="ph:arrow-right" size="16" style="color: var(--text-muted)")

  .text-center.py-6(v-if="!parentDocument && (!childDocuments || childDocuments.length === 0)")
    Icon(name="ph:link-break" size="36" class="text-gray-300 mb-2")
    p.text-sm(style="color: var(--text-muted)") No linked documents
</template>

<script setup lang="ts">
defineProps<{
  parentDocument?: { id: string; type: string; reference: string; title: string } | null;
  childDocuments?: { id: string; type: string; reference: string; title: string; status: string }[];
}>();

const typeIcons: Record<string, string> = {
  quote: 'ph:quotes-bold',
  invoice: 'ph:receipt-bold',
  proforma_invoice: 'ph:file-text-bold',
  purchase_order: 'ph:shopping-cart-bold',
  credit_note: 'ph:note-bold',
  contract: 'ph:handshake-bold',
  rfq: 'ph:clipboard-text-bold',
  sales_order: 'ph:package-bold',
  delivery_note: 'ph:truck-bold',
  sla: 'ph:shield-check-bold'
};

const typeRoutes: Record<string, string> = {
  quote: '/sales/quotes',
  invoice: '/sales/invoices',
  proforma_invoice: '/sales/proforma-invoices',
  purchase_order: '/sales/purchase-orders',
  credit_note: '/sales/credit-notes',
  contract: '/sales/contracts',
  rfq: '/sales/rfqs',
  sales_order: '/sales/sales-orders',
  delivery_note: '/sales/delivery-notes',
  sla: '/sales/slas'
};

function getTypeIcon(type: string) {
  return typeIcons[type] || 'ph:file-text-bold';
}
function getDocUrl(doc: { id: string; type: string }) {
  return `${typeRoutes[doc.type] || '/sales/documents'}/${doc.id}`;
}
function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function statusTagType(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    SENT: '',
    PAID: 'success'
  };
  return map[status] || '';
}
</script>
