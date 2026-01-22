<template lang="pug">
//- React-style Proposals Dashboard
.p-8.w-full.space-y-8(class="font-['Inter',sans-serif]")
  //- Header
  .flex.flex-col.md_flex-row.justify-between.items-start.md_items-center.gap-4
    div
      h2.text-2xl.font-extrabold.text-gray-900.tracking-tight(class="dark:text-white") Proposals Dashboard
      p.text-gray-500.mt-1.font-medium.text-sm(class="dark:text-slate-400") Manage, track, and analyze your sales proposals.
    el-button(
      v-if="hasPermission('CREATE_PROPOSALS')"
      size="large"
      type="primary"
      @click="AddProposalPopup = true"
      class="!bg-gray-900 !border-gray-900 !rounded-2xl !px-6 !py-3 !font-bold hover:!bg-black !shadow-xl dark:!bg-violet-600 dark:!border-violet-600 dark:hover:!bg-violet-700"
    )
      Icon(name="heroicons:plus" size="18" class="mr-2")
      span New Proposal

  //- Main Content Layout (Left + Right Sidebar)
  .flex.flex-col.lg_flex-row.gap-8.items-start

    //- LEFT COLUMN: Main Dashboard Area
    .flex-1.w-full.space-y-8

      //- KPI Cards
      .grid.grid-cols-1.md_grid-cols-3.gap-6

        //- Pipeline Value Card (Gradient)
        .md_col-span-1.p-8.text-white.rounded-3xl.relative.overflow-hidden.group.transition-transform.duration-300(
          class="bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl shadow-violet-200 hover:scale-[1.02]"
        )
          .absolute.top-0.right-0.p-6.opacity-10.transition-opacity(class="group-hover:opacity-20")
            Icon(name="heroicons:currency-dollar" size="80")
          .relative.z-10
            p.font-bold.text-xs.uppercase.tracking-wider.mb-2(class="text-violet-100") Total Pipeline Value
            h3.text-4xl.font-extrabold.mb-4 
              | {{ formatCurrency(stats.pipelineValue) }}
            .flex.items-center.gap-2.text-xs.w-fit.px-3.rounded-xl.backdrop-blur-md.font-medium(
              class="py-1.5 bg-white/20 border border-white/10"
            )
              Icon(name="heroicons:arrow-trending-up" size="14")
              span Active Opportunities

        //- Win Rate Card
        .bg-white.p-8.rounded-3xl.border.border-gray-100.shadow-sm.relative.overflow-hidden.group.transition-shadow(class="hover:shadow-md dark:bg-slate-800 dark:border-slate-700")
          .absolute.right-0.top-0.p-6.opacity-5.transition-opacity(class="group-hover:opacity-10 dark:opacity-10 dark:text-white")
            Icon(name="heroicons:chart-pie" size="64")
          p.text-gray-400.text-xs.font-bold.uppercase.tracking-wider.mb-2(class="dark:text-slate-400") Win Rate
          h3.text-4xl.font-extrabold.text-gray-900(class="dark:text-white") {{ stats.winRate.toFixed(1) }}%
          .mt-6.w-full.rounded-full.h-2.overflow-hidden(class="bg-gray-100 dark:bg-slate-700")
            .h-full.rounded-full.transition-all.duration-1000.ease-out(
              class="bg-emerald-500"
              :style="{ width: `${stats.winRate}%` }"
            )
          p.text-xs.text-gray-400.mt-2.font-medium(class="dark:text-slate-500") Based on approved vs rejected

        //- Action Needed Card
        .bg-white.p-8.rounded-3xl.border.border-gray-100.shadow-sm.relative.overflow-hidden.group.transition-shadow(class="hover:shadow-md dark:bg-slate-800 dark:border-slate-700")
          .absolute.right-0.top-0.p-6.opacity-5.transition-opacity(class="group-hover:opacity-10 dark:opacity-10 dark:text-white")
            Icon(name="heroicons:clock" size="64")
          p.text-gray-400.text-xs.font-bold.uppercase.tracking-wider.mb-2(class="dark:text-slate-400") Action Needed
          h3.text-4xl.font-extrabold.text-amber-500 {{ stats.counts.pending }}
          p.text-gray-900.font-bold.mt-1(class="dark:text-white") Pending Proposals
          .mt-4.flex.items-center.gap-2.text-xs.text-amber-600.w-fit.px-3.rounded-xl.font-bold(class="py-1.5 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500")
            Icon(name="heroicons:exclamation-circle" size="14")
            span In Review

      //- Table Section
      .bg-white.rounded-3xl.shadow-sm.border.border-gray-100.overflow-hidden.min-w-0(class="dark:bg-slate-800 dark:border-slate-700")

        //- Table Header / Filters
        .p-6.border-b.border-gray-100.flex.flex-col.md_flex-row.justify-between.items-center.gap-4(class="bg-white dark:bg-slate-800 dark:border-slate-700")

          //- Status Tabs
          .flex.p-1.rounded-xl.overflow-x-auto.max-w-full(class="bg-gray-100/80 dark:bg-slate-700/50")
            button(
              v-for="status in statusTabs"
              :key="status"
              @click="statusFilter = status"
              :class="[statusFilter === status ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-600/50', 'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap']"
            ) {{ status }}

          //- Search
          .flex.gap-3.items-center.w-full.md_w-auto
            .relative.flex-1.md_flex-initial
              Icon.absolute.left-3.top-1.text-gray-400(name="heroicons:magnifying-glass" size="16" class="top-1/2 -translate-y-1/2")
              el-input(
                v-model="searchTerm"
                placeholder="Search title, client, ref..."
                class="!w-full md:!w-64"
              )

        //- Data Table
        .overflow-x-auto
          .flex.justify-center.items-center.h-40(v-if="loadingAction")
            .animate-spin.rounded-full.h-10.w-10.border-4.border-violet-600.border-t-transparent

          table.w-full.text-left(v-else)
            thead.border-b.border-gray-100(class="bg-gray-50/50 dark:bg-slate-700/50 dark:border-slate-700")
              tr
                th.px-8.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider(class="dark:text-slate-400") Proposal Details
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider(class="dark:text-slate-400") Type
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider(class="dark:text-slate-400") Status
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider(class="dark:text-slate-400") Date
                th.px-8.py-5.text-right.text-xs.font-bold.text-gray-400.uppercase.tracking-wider(class="dark:text-slate-400") Actions

            tbody.divide-y.divide-gray-50(class="dark:divide-slate-700/50")
              tr(
                v-for="p in filteredProposals"
                :key="p.id"
                class="hover:bg-gray-50/80 transition-colors group cursor-pointer dark:hover:bg-slate-700/30"
                @click="handleRowClick(p)"
              )
                td.px-8.py-5
                  .flex.items-center.gap-4
                    .w-12.h-12.rounded-2xl.bg-white.border.border-gray-100.flex.items-center.justify-center.shadow-sm.flex-shrink-0.transition-transform(class="group-hover:scale-105 dark:bg-slate-700 dark:border-slate-600")
                      Icon.text-violet-600(name="heroicons:document-text" size="24" class="dark:text-violet-400")
                    .min-w-0
                      p.font-bold.text-gray-900.text-base.truncate(class="mb-0.5 dark:text-white") {{ p.title }}
                      p.text-xs.text-gray-400.truncate.font-medium.flex.items-center.gap-1(class="dark:text-slate-500")
                        span.w-1.h-1.rounded-full.bg-gray-300(class="dark:bg-slate-600")
                        span {{ p.reference }}

                td.px-6.py-5
                  span.font-bold.text-gray-900.text-sm(class="dark:text-white") {{ formatCurrency(calculateTotal(p)) }}

                td.px-6.py-5
                  span.px-4.rounded-full.text-xs.font-bold.border.whitespace-nowrap.flex.items-center.justify-center.w-fit(
                    class="py-1.5 min-w-[80px]"
                    :class="getStatusBadgeClass(p.status)"
                  ) {{ formatStatus(p.status) }}

                td.px-6.py-5.text-xs.text-gray-400.font-medium.whitespace-nowrap(class="dark:text-slate-500")
                  | {{ formatDate(p.createdAt) }}


                td.px-8.py-5.text-right(@click.stop)
                  .flex.justify-end.items-center.gap-1.opacity-100.transition-opacity
                    //- View
                    el-tooltip(content="View" placement="top")
                      button.p-2.text-gray-400.rounded-full.transition-all(
                        class="hover:text-gray-600 hover:bg-gray-50"
                        @click="$router.push(`/sales/proposals/${p.id}`)"
                      )
                        Icon(name="heroicons:eye" size="18")
                    
                    //- Approval Actions (Only for PENDING)
                    template(v-if="p.status === 'WAITING_APPROVAL'")
                      el-tooltip(content="Approve" placement="top")
                        button.p-2.text-gray-400.rounded-full.transition-all(
                          class="hover:text-emerald-600 hover:bg-emerald-50"
                          @click="handleApprove(p)"
                        )
                          Icon(name="heroicons:check-circle" size="18")
                      el-tooltip(content="Reject" placement="top")
                        button.p-2.text-gray-400.rounded-full.transition-all(
                          class="hover:text-red-600 hover:bg-red-50"
                          @click="handleReject(p)"
                        )
                          Icon(name="heroicons:x-circle" size="18")

                    //- Archive
                    el-tooltip(content="Archive" placement="top")
                      button.p-2.text-gray-400.rounded-full.transition-all(
                        class="hover:text-slate-600 hover:bg-slate-50"
                        @click="handleArchive(p)"
                      )
                        Icon(name="heroicons:archive-box" size="18")

                    //- Edit (Highlighted)
                    el-tooltip(content="Edit" placement="top")
                      button.p-2.ml-2.mr-2.rounded-xl.transition-all(
                        class="bg-violet-50 text-violet-600 hover:bg-violet-100 hover:scale-105 shadow-sm border border-violet-100"
                        @click="AddProposalPopup = true"
                      )
                        Icon(name="heroicons:pencil-square" size="18")

                    //- Delete
                    el-tooltip(content="Delete" placement="top")
                      button.p-2.text-gray-400.rounded-full.transition-all(
                        class="hover:text-red-600 hover:bg-red-50"
                        @click="handleDelete(p)"
                      )
                        Icon(name="heroicons:trash" size="18")

          //- Empty State
          .p-20.text-center.flex.flex-col.items-center(v-if="!loadingAction && filteredProposals.length === 0")
            .p-6.rounded-full.mb-4(class="bg-gray-50 dark:bg-slate-700")
              Icon(name="heroicons:folder-open" size="32" class="text-gray-300 dark:text-slate-500")
            h3.text-gray-900.font-bold.mb-1(class="dark:text-white") No proposals found
            p.text-gray-500.text-sm(class="dark:text-slate-400") Try adjusting your filters or search terms.

    //- RIGHT COLUMN: Sidebar
    .w-full.space-y-8.flex-shrink-0(class="lg:w-80")

      //- Status Distribution Chart (Simplified - no Recharts in Vue)
      .bg-white.p-6.rounded-3xl.border.border-gray-100.shadow-sm.relative.overflow-hidden(class="dark:bg-slate-800 dark:border-slate-700")
        .flex.justify-between.items-center.mb-6
          h3.text-sm.font-bold.text-gray-900(class="dark:text-white") Pipeline Distribution
        
        //- Simple Stats instead of Pie Chart
        .text-center.py-6
          .text-5xl.font-extrabold.text-gray-900(class="dark:text-white") {{ stats.total }}
          .text-xs.text-gray-400.font-bold.uppercase.tracking-wider.mt-1(class="dark:text-slate-500") Total Proposals

        .space-y-3.mt-4
          .flex.justify-between.items-center.text-xs.font-medium(v-for="(item, idx) in stats.statusDist" :key="item.name")
            .flex.items-center.gap-2
              .w-3.h-3.rounded-full(:style="{ backgroundColor: chartColors[idx] }")
              span.text-gray-600(class="dark:text-slate-300") {{ item.name }}
            span.font-bold.text-gray-900(class="dark:text-white") {{ item.value }}

      //- Quick Stats
      .bg-white.rounded-3xl.border.border-gray-100.shadow-sm.p-6(class="dark:bg-slate-800 dark:border-slate-700")
        .flex.items-center.gap-2.text-gray-900.font-bold.text-sm.mb-4(class="dark:text-white")
          .rounded-lg(class="p-1.5 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400")
            Icon(name="heroicons:chart-bar" size="16")
          h3 Quick Stats
        .space-y-4
          .flex.justify-between.items-center
            span.text-sm.text-gray-500(class="dark:text-slate-400") Draft
            span.font-bold.text-gray-900(class="dark:text-white") {{ stats.counts.draft }}
          .flex.justify-between.items-center
            span.text-sm.text-gray-500(class="dark:text-slate-400") Waiting Approval
            span.font-bold.text-amber-500 {{ stats.counts.pending }}
          .flex.justify-between.items-center
            span.text-sm.text-gray-500(class="dark:text-slate-400") Approved
            span.font-bold.text-emerald-500 {{ stats.counts.approved }}
          .flex.justify-between.items-center
            span.text-sm.text-gray-500(class="dark:text-slate-400") Rejected
            span.font-bold.text-red-500 {{ stats.counts.rejected }}

  //- Create Proposal Dialog
  ProposalForm(v-model="AddProposalPopup" @onSubmit="onSubmit")
</template>

<script setup lang="ts">
// Removing explicit Search import to avoid issues, we can use string "Search" if globally registered or just remove it for now
import { ref, reactive, computed, onMounted } from 'vue'
// Element Plus components are typically auto-imported in Nuxt

const router = useRouter()
// Removing top-level await to fix module loading issues
const checkPermission = ref<(p: string) => boolean>(() => false)
const hasPermission = (p: string) => checkPermission.value(p)

// Permission loading state
const permissionsLoaded = ref(false)

const loadingAction = ref(true)
const AddProposalPopup = ref(false)
const searchTerm = ref('')
const statusFilter = ref('All')
const proposals = ref<any[]>([])

const statusTabs = ['All', 'Approved', 'Pending', 'Draft', 'Rejected']
const chartColors = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#ef4444']

// Fetch proposals
const fetchProposals = async () => {
  try {
    loadingAction.value = true
    const response = await useApiFetch('proposal?page=1&limit=100')
    proposals.value = response?.body?.proposals || []
  } catch (error) {
    console.error('Error fetching proposals:', error)
  } finally {
    loadingAction.value = false
  }
}

onMounted(async () => {
  try {
    // Load permissions
    const perm = await usePermissions()
    if (perm && perm.hasPermission) {
      checkPermission.value = perm.hasPermission
    }
    permissionsLoaded.value = true
    
    // Initial fetch
    await fetchProposals()
  } catch (e) {
    console.error('Error initializing page:', e)
  }
})



const onSubmit = async () => {
  await fetchProposals()
}

// Statistics
const stats = computed(() => {
  const total = proposals.value.length
  const approvedCount = proposals.value.filter(p => p.status === 'APPROVED').length
  const rejectedCount = proposals.value.filter(p => p.status === 'REJECTED').length
  const pendingCount = proposals.value.filter(p => p.status === 'WAITING_APPROVAL').length
  const draftCount = proposals.value.filter(p => !p.status || p.status === 'DRAFT').length
  
  const closedCount = approvedCount + rejectedCount
  const winRate = closedCount > 0 ? (approvedCount / closedCount) * 100 : 0
  
  // Pipeline value (simplified - count of active proposals)
  const pipelineValue = proposals.value.length * 50000 // Placeholder
  
  const statusDist = [
    { name: 'Draft', value: draftCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Approved', value: approvedCount },
    { name: 'Rejected', value: rejectedCount },
  ].filter(d => d.value > 0)
  
  return {
    total,
    pipelineValue,
    winRate,
    statusDist,
    counts: {
      draft: draftCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    }
  }
})

// Filtered proposals
const filteredProposals = computed(() => {
  return proposals.value.filter(p => {
    // Search filter
    const matchesSearch = 
      (p.title?.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
      (p.proposalFor?.toLowerCase() || '').includes(searchTerm.value.toLowerCase()) ||
      (p.reference?.toLowerCase() || '').includes(searchTerm.value.toLowerCase())
    
    if (!matchesSearch) return false
    
    // Status filter
    if (statusFilter.value !== 'All') {
      if (statusFilter.value === 'Pending' && p.status !== 'WAITING_APPROVAL') return false
      if (statusFilter.value === 'Approved' && p.status !== 'APPROVED') return false
      if (statusFilter.value === 'Rejected' && p.status !== 'REJECTED') return false
      if (statusFilter.value === 'Draft' && p.status && p.status !== 'DRAFT') return false
    }
    
    return true
  })
})

// Helpers
const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'DRAFT': 'Draft',
    'WAITING_APPROVAL': 'Pending',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'ARCHIVED': 'Archived'
  }
  return map[status] || 'Draft'
}

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    'DRAFT': 'bg-gray-100 text-gray-600 border-gray-200',
    'WAITING_APPROVAL': 'bg-amber-50 text-amber-600 border-amber-100',
    'APPROVED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'REJECTED': 'bg-red-50 text-red-600 border-red-100',
    'ARCHIVED': 'bg-slate-100 text-slate-600 border-slate-200'
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

const formatType = (type: string) => {
  const map: Record<string, string> = {
    'FINANCIAL': 'Financial',
    'TECHNICAL': 'Technical',
    'MIXED': 'Mixed'
  }
  return map[type] || type || '-'
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-SA', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount) + ' SAR'
}

const calculateTotal = (p: any) => {
  return p.items?.reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.rate || 0)), 0) || 0
}

const handleRowClick = (proposal: any) => {
  router.push(`/sales/proposals/${proposal.id}`)
}

// Action Handlers
const handleApprove = async (p: any) => {
  try {
    loadingAction.value = true
    await approveProposal(p.id)
    ElMessage.success('Proposal approved successfully')
    await fetchProposals()
  } catch (err) {
    ElMessage.error('Failed to approve proposal')
  } finally {
    loadingAction.value = false
  }
}

const handleReject = (p: any) => {
  ElMessageBox.prompt('Please enter rejection reason', 'Reject Proposal', {
    confirmButtonText: 'Reject',
    cancelButtonText: 'Cancel',
    inputPattern: /.+/,
    inputErrorMessage: 'Reason is required',
  }).then(async ({ value }) => {
    try {
      loadingAction.value = true
      await rejectProposal(p.id, value)
      ElMessage.success('Proposal rejected')
      await fetchProposals()
    } catch (err) {
      ElMessage.error('Failed to reject proposal')
    } finally {
      loadingAction.value = false
    }
  }).catch(() => {})
}

const handleArchive = async (p: any) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to archive this proposal?', 'Archive Proposal', {
      confirmButtonText: 'Archive',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
    loadingAction.value = true
    // Assuming archive endpoint exists or just changing status
    // await archiveProposal(p.id) 
    // Implementation pending
    ElMessage.info('Archive feature pending API implementation')
  } catch (err) {
  } finally {
    loadingAction.value = false
  }
}

const handleDelete = async (p: any) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this proposal?', 'Delete Proposal', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
    loadingAction.value = true
    // await deleteProposal(p.id)
    // Implementation pending
    ElMessage.info('Delete feature pending API implementation')
  } catch (err) {
  } finally {
    loadingAction.value = false
  }
}
</script>

<style scoped>
/* Custom hover classes for Tailwind */
.hover_shadow-md:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.hover_scale-110:hover { transform: scale(1.1); }
.group-hover_opacity-100:hover { opacity: 1; }
.group-hover_scale-110:hover { transform: scale(1.1); }
.group-hover_opacity-20:hover { opacity: 0.2; }

/* Tailwind responsive prefixes workaround */
@media (min-width: 768px) {
  .md_flex-row { flex-direction: row; }
  .md_items-center { align-items: center; }
  .md_col-span-1 { grid-column: span 1; }
  .md_grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md_w-auto { width: auto; }
  .md_flex-initial { flex: 0 1 auto; }
}

@media (min-width: 1024px) {
  .lg_flex-row { flex-direction: row; }
  .lg_w-80 { width: 20rem; }
}

/* Group hover effects */
.group:hover .group-hover_opacity-100 { opacity: 1; }
.group:hover .group-hover_scale-110 { transform: scale(1.1); }
.group:hover .group-hover_opacity-20 { opacity: 0.2; }
</style>
