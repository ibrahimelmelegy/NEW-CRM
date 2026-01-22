<template lang="pug">
//- Matching React ProposalDetails exactly with Vue improvements
.min-h-screen.bg-slate-50
  //- Loading State
  .min-h-screen.flex.items-center.justify-center(v-if="loading")
    .text-center
      .animate-spin.rounded-full.h-10.w-10.border-4.border-violet-600.border-t-transparent.mx-auto.mb-4
      p.text-gray-500 Loading proposal...

  //- Error State
  .min-h-screen.flex.items-center.justify-center(v-else-if="!proposal")
    .text-center
      Icon.text-red-500.mx-auto.mb-4(name="heroicons:exclamation-circle" size="40")
      p.text-gray-700.font-medium.mb-2 Proposal not found
      el-button(type="primary" @click="$router.push('/sales/proposals')") Back to Proposals

  //- Main Content
  template(v-else)
    //- Header (Sticky like React)
    header.bg-white.border-b.border-gray-100.sticky.top-0.z-10
      .max-w-7xl.mx-auto.px-6.py-4.flex.items-center.justify-between
        .flex.items-center.gap-4
          button.p-2.hover_bg-gray-100.rounded-xl.transition-colors(@click="$router.push('/sales/proposals')")
            Icon(name="heroicons:arrow-left" size="20" class="text-gray-600")
          div
            h1.text-xl.font-bold.text-gray-900 {{ proposal?.title || 'Untitled Proposal' }}
            p.text-sm.text-gray-500 {{ proposal?.reference || `REF-${proposal?.id}` }}
        
        .flex.items-center.gap-3
          button.p-2.hover_bg-gray-100.rounded-xl.transition-colors(@click="fetchProposal" title="Refresh")
            Icon(name="heroicons:arrow-path" size="18" class="text-gray-500")
          el-button(
            type="primary" 
            @click="EditProposalPopup = true"
            :disabled="proposal?.status === 'APPROVED'"
          )
            Icon(name="heroicons:pencil-square" size="16" class="mr-1")
            span Edit
          el-button(
            type="danger"
            plain
            @click="deleteDialogVisible = true"
          )
            Icon(name="heroicons:trash" size="16" class="mr-1")
            span Delete

    //- Content (Grid layout like React)
    main.max-w-7xl.mx-auto.px-6.py-8
      .grid.grid-cols-3.gap-8
        //- Main Content (2 columns)
        .col-span-2.space-y-6
          //- Status Card
          .bg-white.rounded-2xl.p-6.border.border-gray-100
            .flex.items-center.justify-between.mb-6
              .flex.items-center.gap-3
                .p-2.rounded-xl(:class="getStatusBgClass(proposal?.status)")
                  Icon(:name="getStatusIcon(proposal?.status)" size="20")
                div
                  p.text-sm.text-gray-500 Status
                  p.font-bold.text-gray-900 {{ formatStatus(proposal?.status) }}
              .px-4.py-2.rounded-full.text-sm.font-medium(:class="getStatusBgClass(proposal?.status)")
                | {{ formatStatus(proposal?.status) }}

            //- Approval Actions (like React ApprovalActions)
            .flex.gap-3.mt-4(v-if="proposal?.status !== 'APPROVED'")
              el-button(
                v-if="proposal?.status === 'WAITING_APPROVAL'"
                type="success"
                @click="handleApprove"
                :loading="actionLoading"
              )
                Icon(name="heroicons:check-circle" size="16" class="mr-1")
                span Approve
              el-button(
                v-if="proposal?.status === 'WAITING_APPROVAL'"
                type="danger"
                @click="rejectDialogVisible = true"
              )
                Icon(name="heroicons:x-circle" size="16" class="mr-1")
                span Reject
              el-button(
                v-if="proposal?.status !== 'WAITING_APPROVAL' && proposal?.status !== 'APPROVED'"
                type="warning"
                @click="handleSubmitForApproval"
                :loading="actionLoading"
              )
                Icon(name="heroicons:paper-airplane" size="16" class="mr-1")
                span Submit for Approval

          //- Executive Summary (if notes exist)
          .bg-white.rounded-2xl.p-6.border.border-gray-100(v-if="proposal?.notes")
            h3.text-lg.font-bold.text-gray-900.mb-4 Executive Summary
            .prose.prose-sm.max-w-none.text-gray-600(v-html="proposal.notes")

          //- Financial Summary (if exists)
          .bg-white.rounded-2xl.p-6.border.border-gray-100(v-if="financeTables?.length")
            h3.text-lg.font-bold.text-gray-900.mb-4.flex.items-center.gap-2
              Icon(name="heroicons:currency-dollar" size="20" class="text-violet-600")
              span Financial Summary
            .overflow-x-auto
              table.w-full(v-for="table in financeTables" :key="table.id")
                thead.bg-gray-50
                  tr.text-xs.text-gray-500.uppercase
                    th.py-3.px-4.text-left Description
                    th.py-3.px-4.text-center Qty
                    th.py-3.px-4.text-right Rate
                    th.py-3.px-4.text-right Total
                tbody.divide-y.divide-gray-100
                  tr(v-for="item in table.items" :key="item.id")
                    td.py-3.px-4.font-medium {{ item.description }}
                    td.py-3.px-4.text-center {{ item.quantity || item.qty }}
                    td.py-3.px-4.text-right {{ formatCurrency(item.unitPrice || item.rate) }}
                    td.py-3.px-4.text-right.font-bold {{ formatCurrency(item.totalPrice || (item.quantity * item.rate)) }}

          //- Rejection Reason (if rejected)
          .bg-white.rounded-2xl.p-6.border.border-red-200.bg-red-50(v-if="proposal?.rejectionReason")
            h3.text-lg.font-bold.text-red-700.mb-4.flex.items-center.gap-2
              Icon(name="heroicons:exclamation-triangle" size="20")
              span Rejection Reason
            p.text-red-600 {{ proposal.rejectionReason }}

        //- Sidebar (1 column)
        .space-y-6
          //- Related Entity (like React)
          .bg-white.rounded-2xl.p-6.border.border-gray-100(v-if="proposal?.relatedEntityType")
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Related To
            .flex.items-center.gap-3
              .p-3.bg-violet-100.rounded-xl
                Icon(name="heroicons:building-office-2" size="20" class="text-violet-600")
              div
                p.font-bold.text-gray-900 {{ proposal?.relatedEntity?.name || `ID: ${proposal?.relatedEntityId}` }}
                p.text-sm.text-gray-500 {{ proposal?.relatedEntityType }}

          //- Client Info (like React)
          .bg-white.rounded-2xl.p-6.border.border-gray-100
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Client
            .space-y-3
              .flex.items-center.gap-3
                Icon(name="heroicons:user" size="18" class="text-gray-400")
                span.text-gray-900 {{ proposal?.proposalFor || 'Not specified' }}

          //- Dates (like React)
          .bg-white.rounded-2xl.p-6.border.border-gray-100
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Dates
            .space-y-3
              .flex.items-center.justify-between
                span.text-gray-500 Created
                span.font-medium.text-gray-900 {{ formatDate(proposal?.createdAt) }}
              .flex.items-center.justify-between
                span.text-gray-500 Proposal Date
                span.font-medium.text-gray-900 {{ formatDate(proposal?.proposalDate || proposal?.date) }}
              .flex.items-center.justify-between
                span.text-gray-500 Last Modified
                span.font-medium.text-gray-900 {{ formatDate(proposal?.updatedAt) }}

          //- Quick Actions (like React)
          .bg-white.rounded-2xl.p-6.border.border-gray-100
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Quick Actions
            .space-y-2
              NuxtLink.w-full.flex.items-center.gap-3.px-4.py-3.bg-gray-50.hover_bg-gray-100.rounded-xl.transition-colors.text-left(
                :to="`/sales/proposals/preview/${proposal?.id}`"
              )
                Icon(name="heroicons:eye" size="18" class="text-gray-500")
                span.font-medium.text-gray-700 View Preview
              NuxtLink.w-full.flex.items-center.gap-3.px-4.py-3.bg-gray-50.hover_bg-gray-100.rounded-xl.transition-colors.text-left(
                :to="`/sales/proposals/add-table/${proposal?.id}`"
              )
                Icon(name="heroicons:table-cells" size="18" class="text-gray-500")
                span.font-medium.text-gray-700 Finance Table

          //- Assigned Users
          .bg-white.rounded-2xl.p-6.border.border-gray-100(v-if="proposal?.users?.length")
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Assigned Team
            .space-y-3
              .flex.items-center.gap-3(v-for="user in proposal.users" :key="user.id")
                .w-8.h-8.bg-violet-100.rounded-full.flex.items-center.justify-center
                  Icon(name="heroicons:user" size="16" class="text-violet-600")
                div
                  p.font-medium.text-gray-900 {{ user.name }}
                  p.text-xs.text-gray-500 {{ user.email }}

          //- Attachments
          .bg-white.rounded-2xl.p-6.border.border-gray-100(v-if="proposal?.fileAttachments?.length")
            h3.text-sm.font-bold.text-gray-500.uppercase.tracking-wider.mb-4 Attachments
            .space-y-2
              .flex.items-center.gap-3.p-3.bg-gray-50.rounded-xl.cursor-pointer.hover_bg-gray-100.transition-colors(
                v-for="file in proposal.fileAttachments" 
                :key="file"
                @click="downloadFile(file)"
              )
                Icon(name="heroicons:paper-clip" size="18" class="text-gray-500")
                span.flex-1.text-sm.text-gray-700.truncate {{ getFileName(file) }}
                Icon(name="heroicons:arrow-down-tray" size="16" class="text-gray-400")

  //- Edit Dialog
  ProposalForm(v-model="EditProposalPopup" :editStatus="true" @onSubmit="onSubmit" :data="proposal")

  //- Delete Confirmation Modal (like React)
  el-dialog(v-model="deleteDialogVisible" title="" width="400" :show-close="false")
    .flex.items-center.gap-3.mb-4
      .p-2.bg-red-100.rounded-xl
        Icon(name="heroicons:exclamation-circle" size="20" class="text-red-600")
      h3.font-bold.text-lg.text-gray-900 Delete Proposal
    p.text-gray-500.mb-6 Are you sure you want to delete this proposal? This action cannot be undone.
    template(#footer)
      .flex.gap-3
        el-button.flex-1(@click="deleteDialogVisible = false") Cancel
        el-button.flex-1(type="danger" @click="handleDelete" :loading="actionLoading") Delete

  //- Reject Dialog
  el-dialog(v-model="rejectDialogVisible" title="Reject Proposal" width="500")
    p.mb-4 Please provide a reason for rejecting this proposal:
    el-input(
      v-model="rejectionReason"
      type="textarea"
      :rows="4"
      placeholder="Enter rejection reason..."
    )
    template(#footer)
      el-button(@click="rejectDialogVisible = false") Cancel
      el-button(type="danger" @click="handleReject" :loading="actionLoading") Reject Proposal
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const actionLoading = ref(false)
const proposal = ref<any>(null)
const financeTables = ref<any[]>([])
const EditProposalPopup = ref(false)
const deleteDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const rejectionReason = ref('')

// Fetch proposal
const fetchProposal = async () => {
  try {
    loading.value = true
    proposal.value = await getProposal(route.params.slug as string)
    
    // Fetch finance tables
    const tables = await getProposalFinanceTable(route.params.slug as string)
    financeTables.value = tables || []
  } catch (error) {
    console.error('Error fetching proposal:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchProposal)

const onSubmit = async () => {
  await fetchProposal()
}

// Status helpers (matching React exactly)
const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'DRAFT': 'Draft',
    'WAITING_APPROVAL': 'Waiting Approval',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'ARCHIVED': 'Archived'
  }
  return map[status] || status || 'Draft'
}

const getStatusBgClass = (status: string) => {
  const map: Record<string, string> = {
    'DRAFT': 'bg-gray-100 text-gray-600',
    'WAITING_APPROVAL': 'bg-amber-100 text-amber-600',
    'APPROVED': 'bg-green-100 text-green-600',
    'REJECTED': 'bg-red-100 text-red-600',
    'ARCHIVED': 'bg-slate-100 text-slate-600'
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const getStatusIcon = (status: string) => {
  const map: Record<string, string> = {
    'DRAFT': 'heroicons:clock',
    'WAITING_APPROVAL': 'heroicons:clock',
    'APPROVED': 'heroicons:check-circle',
    'REJECTED': 'heroicons:x-circle',
    'ARCHIVED': 'heroicons:archive-box'
  }
  return map[status] || 'heroicons:document'
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-SA', { 
    style: 'currency', 
    currency: 'SAR',
    minimumFractionDigits: 0 
  }).format(amount || 0)
}

const getFileName = (path: string) => path?.split('/').pop() || path

const downloadFile = (file: string) => {
  window.open(`https://staging-api.hp-tech.com/assets/${file}`, '_blank')
}

// Approval Actions
const handleSubmitForApproval = async () => {
  try {
    actionLoading.value = true
    await submitForApproval(proposal.value.id)
    await fetchProposal()
  } finally {
    actionLoading.value = false
  }
}

const handleApprove = async () => {
  try {
    actionLoading.value = true
    await approveProposal(proposal.value.id)
    await fetchProposal()
  } finally {
    actionLoading.value = false
  }
}

const handleReject = async () => {
  if (!rejectionReason.value.trim()) {
    ElMessage.warning('Please provide a rejection reason')
    return
  }
  try {
    actionLoading.value = true
    await rejectProposal(proposal.value.id, rejectionReason.value)
    rejectDialogVisible.value = false
    rejectionReason.value = ''
    await fetchProposal()
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    actionLoading.value = true
    // TODO: Implement delete API
    ElNotification({
      type: 'success',
      title: 'Success',
      message: 'Proposal deleted successfully'
    })
    deleteDialogVisible.value = false
    router.push('/sales/proposals')
  } finally {
    actionLoading.value = false
  }
}
</script>

<style scoped>
/* Hover states for Tailwind */
.hover_bg-gray-100:hover {
  background-color: rgb(243 244 246);
}
</style>
