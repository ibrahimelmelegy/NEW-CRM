<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .flex.items-center.gap-6
      el-button(@click="router.back()", circle, :icon="ArrowLeft", class="premium-btn-outline !w-12 !h-12 !text-lg")
      .header-content
        .title.font-bold.text-3xl.text-gradient Purchase Order Review
        .subtitle.text-muted.text-sm Official Document # {{ po?.poNumber }}
    
    .flex.items-center.gap-x-4
      template(v-if="po?.status === 'Pending' && hasPermission('APPROVE_PROCUREMENT')")
        el-button(
            type="success", 
            :loading="loadingAction", 
            @click="handleApprove", 
            class="premium-btn !rounded-2xl px-8 glow-green"
            style="--gradient-primary: linear-gradient(135deg, #059669, #10b981)"
        ) Approve Order
      
      template(v-if="po?.status === 'Pending' && hasPermission('REJECT_PROCUREMENT')")
        el-button(
            type="danger", 
            :loading="loadingAction", 
            @click="rejectDialogVisible = true", 
            class="premium-btn-outline !rounded-2xl px-8"
        ) Reject
      
      el-button(
        type="primary", 
        :icon="Download", 
        @click="downloadPDF", 
        class="premium-btn !rounded-2xl px-6 glow-purple"
      ) Export PDF

  .grid.grid-cols-1.lg.grid-cols-4.gap-8
    //- Main Document
    .lg_col-span-3
      .glass-card.p-10.relative.overflow-hidden
        //- Status Ribbon
        .absolute.top-0.right-10.h-12.px-6.flex.items-center.justify-center.rounded-b-2xl.shadow-lg(:class="statusRibbonClass")
           span.font-black.uppercase.tracking-tighter.text-xs {{ po?.status }}

        .flex.justify-between.mb-16
            .company-info
                img(src="/images/Logo.png" class="h-10 mb-2 opacity-80")
                p.text-xs.text-muted HIGH POINT TECHNOLOGY - GLOBAL PROCUREMENT
            
            .po-header-details.text-right
                .text-xs.uppercase.tracking-widest.text-muted.mb-1 Order Date
                .text-lg.font-bold.text-purple-200 {{ formatDate(po?.createdAt) }}

        .grid.grid-cols-2.gap-12.mb-16
            .vendor-box.p-6.rounded-2xl.bg-white_03.border.border-white_05
                .text-xs.uppercase.font-black.text-purple-400.tracking-widest.mb-4 Supplier
                .text-2xl.font-bold(class="text-[var(--color-text-primary)]") {{ po?.vendor?.name }}
                .text-sm.text-muted.mt-2 C.R: {{ po?.vendor?.commercialRegistration || 'N/A' }}

            .project-box.p-6.rounded-2xl.bg-white_03.border.border-white_05
                .text-xs.uppercase.font-black.text-orange-400.tracking-widest.mb-4 Assigned Project
                .text-2xl.font-bold(class="text-[var(--color-text-primary)]") {{ po?.project?.name }}
                .text-sm.text-muted.mt-2 Manager: {{ po?.project?.manager || 'TBD' }}

        .document-items
            .flex.items-center.gap-3.mb-6
                Icon(name="ph:notebook-bold" class="text-purple-400")
                span.text-xs.uppercase.font-bold.tracking-widest.text-muted Line Items
            
            el-table(:data="po?.items", style="width: 100%", class="premium-table mb-10")
              el-table-column(prop="description", label="Item Description")
              el-table-column(prop="quantity", label="Qty", width="100", align="center")
              el-table-column(prop="unitPrice", label="Unit Price", width="150", align="right")
                template(#default="{row}")
                    span {{ row.unitPrice.toFixed(2) }}
              el-table-column(prop="tax", label="Tax", width="100", align="center")
                template(#default="{row}")
                    span {{ row.tax }}%
              el-table-column(label="Total", width="150", align="right")
                template(#default="{row}")
                  span.font-bold.text-purple-300 {{ ((row.quantity * row.unitPrice) * (1 + row.tax / 100)).toFixed(2) }}
            
            .flex.justify-end
              .w-64.space-y-4
                .flex.justify-between.text-sm
                    span.text-muted Subtotal
                    span(class="text-[var(--color-text-primary)]") {{ subtotal.toFixed(2) }}
                .flex.justify-between.text-sm
                    span.text-muted Estimated Tax
                    span(class="text-[var(--color-text-primary)]") {{ (po?.totalAmount - subtotal).toFixed(2) }}
                .pt-4.border-t.border-white_10.flex.justify-between.items-end
                    span.text-xs.font-black.uppercase.tracking-tighter Total Amount
                    span.text-3xl.font-black.text-gradient {{ po?.totalAmount }}

      //- Rejection Warning
      .glass-card.p-6.mt-8.bg-red-900_20.border-red-900_30(v-if="po?.rejectionReason")
        .flex.items-center.gap-4.mb-4
            Icon(name="ph:warning-circle-bold" class="text-red-400 text-2xl")
            span.font-bold.text-red-400 Rejection Feedback
        p.text-sm.text-red-300/80.leading-relaxed {{ po?.rejectionReason }}

    //- Metadata Sidebar
    .space-y-8
      .glass-card.p-6
        .flex.items-center.gap-3.mb-6
            Icon(name="ph:fingerprint-bold" class="text-purple-400")
            span.text-xs.uppercase.font-bold.tracking-widest.text-muted Metadata
        
        .space-y-6
          .meta-item
            .text-xs.text-muted.mb-1 Payment Terms
            .flex.items-center.gap-2
                Icon(name="ph:credit-card-bold" class="text-purple-400")
                span.font-bold {{ po?.paymentMethod }}
          
          .meta-item
            .text-xs.text-muted.mb-1 Target Delivery
            .flex.items-center.gap-2
                Icon(name="ph:calendar-blank-bold" class="text-orange-400")
                span.font-bold {{ formatDate(po?.dueDate) }}
          
          .meta-item
            .text-xs.text-muted.mb-2 Created By
            .flex.items-center.gap-3
                el-avatar(:size="32", :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${po?.creator?.name}`")
                .text-sm
                    .font-bold {{ po?.creator?.name }}
                    .text-xs.text-muted Staff Member

  //- Record Tabs
  el-tabs.mt-6(v-model="activeRecordTab")
    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      RecordTimeline(:entityType="'purchaseOrder'" :entityId="route.params.id as string")
    el-tab-pane(:label="$t('common.comments')" name="comments")
      RecordComments(:entityType="'purchaseOrder'" :entityId="route.params.id as string")
    el-tab-pane(:label="$t('common.attachments')" name="attachments")
      RecordAttachments(:entityType="'purchaseOrder'" :entityId="route.params.id as string")

  //- Rejection Dialog
  el-dialog(v-model="rejectDialogVisible", title="Review Rejection", width="450px", class="glass-dialog !rounded-3xl", append-to-body)
    .p-2
      .text-sm.text-muted.mb-4 Please specify the reason for rejecting this procurement request. This will be visible to the requester.
      el-input(
        v-model="rejectionReason", 
        type="textarea", 
        :rows="4", 
        placeholder="e.g. Price exceeds budget, missing documents...",
        class="premium-input-textarea"
      )
    template(#footer)
      .flex.justify-end.gap-4.pb-4.px-4
        el-button(@click="rejectDialogVisible = false", class="premium-btn-outline !rounded-xl px-8") {{ $t('common.cancel') }}
        el-button(type="danger", @click="handleReject", :loading="loadingAction", class="premium-btn !rounded-xl px-12 glow-red") Confirm Rejection

  //- Template Selector Dialog
  el-dialog(v-model="showTemplateSelector" title="Select PDF Template" width="500px")
    .space-y-3
      .template-item.p-3.rounded-xl.cursor-pointer.flex.items-center.justify-between(
        v-for="tpl in poTemplates"
        :key="tpl.id"
        style="background: var(--bg-input); border: 1px solid var(--border-default)"
        @click="downloadPDFWithTemplate(tpl)"
      )
        .flex.items-center.gap-3
          Icon(name="ph:file-pdf-bold" size="24" class="text-purple-400")
          div
            .font-bold(style="color: var(--text-primary)") {{ tpl.name }}
            .text-xs(style="color: var(--text-muted)") {{ tpl.layout?.elements?.length || 0 }} elements
        Icon(name="ph:arrow-right" size="18" style="color: var(--text-muted)")
    template(#footer)
      el-button(@click="showTemplateSelector = false") {{ $t('common.cancel') }}
      el-button(@click="downloadPDFClassic(); showTemplateSelector = false" type="primary" class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none") Use Classic Export

</template>

<script setup lang="ts">
import { ArrowLeft, Download } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

const route = useRoute();
const router = useRouter();
const { hasPermission } = await usePermissions();

function formatDate(date: any) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const po = ref<any>(null);
const loadingAction = ref(false);
const rejectDialogVisible = ref(false);
const rejectionReason = ref('');
const activeRecordTab = ref('timeline');

const statusRibbonClass = computed(() => {
  switch (po.value?.status) {
    case 'Approved':
      return 'bg-green-600 text-white shadow-green-900/40';
    case 'Rejected':
      return 'bg-red-600 text-white shadow-red-900/40';
    case 'Pending':
      return 'bg-orange-500 text-white shadow-orange-900/40';
    default:
      return 'bg-gray-600 text-white';
  }
});

async function fetchPO() {
  try {
    po.value = await useApiFetch(`procurement/${route.params.id}`);
  } catch (error) {
    ElNotification({ title: 'Error', message: 'Failed to load PO details', type: 'error' });
  }
}

onMounted(fetchPO);

const subtotal = computed(() => {
  if (!po.value?.items) return 0;
  return po.value.items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);
});

async function handleApprove() {
  loadingAction.value = true;
  try {
    await useApiFetch(`procurement/${po.value.id}/approve`, 'PATCH');
    ElNotification({ title: 'Approved', type: 'success', message: 'Purchase Order has been approved' });
    fetchPO();
  } catch (error) {
    ElNotification({ title: 'Error', type: 'error', message: 'Failed to approve PO' });
  } finally {
    loadingAction.value = false;
  }
}

async function handleReject() {
  if (!rejectionReason.value) return (ElNotification as any)({ title: 'Required', message: 'Please provide a rejection reason', type: 'warning' });

  loadingAction.value = true;
  try {
    await useApiFetch(`procurement/${po.value.id}/reject`, 'PATCH', { rejectionReason: rejectionReason.value });
    (ElNotification as any)({ title: 'Rejected', type: 'danger', message: 'Purchase Order has been rejected' });
    rejectDialogVisible.value = false;
    fetchPO();
  } catch (error) {
    ElNotification({ title: 'Error', type: 'error', message: 'Failed to reject PO' });
  } finally {
    loadingAction.value = false;
  }
}

const showTemplateSelector = ref(false);
const poTemplates = ref<any[]>([]);

async function downloadPDF() {
  // Try to load templates for purchase orders
  const { fetchDocumentTemplates } = await import('~/composables/useDocumentTemplates');
  const result = await fetchDocumentTemplates({ type: 'PURCHASE_ORDER', limit: '50' });
  if (result.docs.length > 0) {
    poTemplates.value = result.docs;
    showTemplateSelector.value = true;
  } else {
    downloadPDFClassic();
  }
}

async function downloadPDFWithTemplate(template: any) {
  showTemplateSelector.value = false;
  const { generatePDF } = await import('~/utils/pdfExporter');

  const taxTotal = po.value.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice * item.tax) / 100, 0) || 0;

  const data = {
    companyName: 'HIGH POINT TECHNOLOGY',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    poNumber: po.value.poNumber,
    date: formatDate(po.value.createdAt),
    deliveryDate: formatDate(po.value.dueDate),
    vendorName: po.value.vendor?.name || 'N/A',
    vendorAddress: po.value.vendor?.address || '',
    vendorPhone: po.value.vendor?.phone || '',
    vendorEmail: po.value.vendor?.email || '',
    projectName: po.value.project?.name || 'N/A',
    subtotal: `SR ${subtotal.value.toFixed(2)}`,
    tax: `SR ${taxTotal.toFixed(2)}`,
    total: `SR ${po.value.totalAmount}`,
    notes: '',
    items:
      po.value.items?.map((item: any) => ({
        item: item.description,
        qty: item.quantity,
        unit: item.unit || 'pcs',
        rate: item.unitPrice,
        unitprice: item.unitPrice,
        amount: (item.quantity * item.unitPrice * (1 + item.tax / 100)).toFixed(2),
        total: (item.quantity * item.unitPrice * (1 + item.tax / 100)).toFixed(2)
      })) || []
  };

  generatePDF(template.layout, data, `${po.value.poNumber}.pdf`);
  ElNotification({ title: 'Success', message: 'PDF downloaded successfully', type: 'success' });
}

async function downloadPDFClassic() {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable') as any;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`PO Number: ${po.value.poNumber}`, 14, 40);
  doc.text(`Date: ${formatDate(po.value.createdAt)}`, 14, 45);
  doc.text(`Status: ${po.value.status}`, 14, 50);

  doc.text('Vendor:', 14, 60);
  // @ts-ignore
  doc.setFont('helvetica', 'bold');
  doc.text(po.value.vendor?.name || 'N/A', 40, 60);

  // @ts-ignore
  doc.setFont('helvetica', 'normal');
  doc.text('Project:', 14, 65);
  doc.text(po.value.project?.name || 'N/A', 40, 65);

  const tableData = po.value.items.map((item: any) => [
    item.description,
    item.quantity,
    item.unitPrice,
    item.tax + '%',
    (item.quantity * item.unitPrice * (1 + item.tax / 100)).toFixed(2)
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [120, 73, 255] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text(`Grand Total: SR ${po.value.totalAmount}`, 196, finalY, { align: 'right' });

  doc.save(`${po.value.poNumber}.pdf`);
  ElNotification({ title: 'Success', message: 'PDF downloaded successfully', type: 'success' });
}
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-red-900_20 {
  background: var(--color-danger-alpha-20);
}
.border-red-900_30 {
  border: 1px solid var(--color-danger-alpha-20);
}

// All premium-table/btn-outline classes are now global in _utilities.scss

.premium-input-textarea {
  :deep(.el-textarea__inner) {
    background: var(--color-neutral-background-1) !important;
    border: 1px solid var(--color-border-default) !important;
    border-radius: 14px !important;
    box-shadow: none !important;
    padding: 14px 16px;
    color: var(--color-text-primary) !important;
    font-size: 14px;
    line-height: 1.6;
    transition: all 0.3s ease;
    &:focus {
      border-color: var(--color-primary) !important;
      background: var(--color-surface-selected) !important;
    }
  }
}

.glass-dialog {
  :deep(.el-dialog) {
    background: var(--color-neutral-background-1) !important;
    backdrop-filter: blur(25px);
    border: 1px solid var(--color-border-default);
  }
}

// Theme-aware utilities now in global _utilities.scss

.glow-green {
  box-shadow: var(--glow-emerald);
}
.glow-red {
  box-shadow: var(--glow-rose);
}
</style>
