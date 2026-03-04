<template lang="pug">
.p-8.w-full.mx-auto.space-y-8.font-sans.animate-entrance
  //- Header
  .flex.flex-col.md_flex-row.justify-between.items-start.md_items-center.gap-4
    div
      h2.text-2xl.font-extrabold.text-gray-900.tracking-tight {{ $t('proposals.title') }}
      p.text-gray-500.mt-1.font-medium.text-sm {{ $t('proposals.subtitle') }}
    NuxtLink(to="/sales/proposals/create")
      button.bg-gray-900.text-white.px-6.py-3.rounded-2xl.flex.items-center.gap-2.font-bold.transition-all.shadow-xl.shadow-gray-200(
        class="hover:bg-black hover:-translate-y-1 active:scale-95"
      )
        Plus(:size="18")
        | {{ $t('proposals.newProposal') }}

  .flex.flex-col.lg_flex-row.gap-8.items-start
    //- Main content
    .flex-1.w-full.space-y-8

      //- KPI Cards
      .grid.grid-cols-1.md_grid-cols-3.gap-6

        //- Pipeline Value Card
        .md_col-span-1.rounded-2xl.p-8.text-white.shadow-xl.shadow-violet-200.relative.overflow-hidden.group.transition-transform.duration-300(
          class="bg-gradient-to-br from-violet-600 to-indigo-700 hover:scale-[1.02]"
          style="border-radius: 2rem;"
        )
          .absolute.top-0.right-0.p-6.opacity-10.transition-opacity(class="group-hover:opacity-20")
            DollarSign(:size="80")
          .relative.z-10
            p.text-violet-100.font-bold.text-xs.uppercase.tracking-wider.mb-2 {{ $t('proposals.totalPipeline') }}
            h3.text-4xl.font-extrabold.mb-4
              | {{ stats.pipelineValue.toLocaleString() }}
              span.text-xl.opacity-70.font-medium.ml-1 SAR
            .flex.items-center.gap-2.text-xs.w-fit.px-3.py-1_5.rounded-xl.font-medium(
              class="bg-white/20 backdrop-blur-md border border-white/10"
            )
              TrendingUp(:size="14")
              span {{ $t('proposals.activeOpportunities') }}

        //- Win Rate Card
        .bg-white.p-8.border.border-gray-100.shadow-sm.relative.overflow-hidden.group.transition-shadow(
          class="hover:shadow-md"
          style="border-radius: 2rem;"
        )
          .absolute.right-0.top-0.p-6.opacity-5.transition-opacity(class="group-hover:opacity-10")
            Percent(:size="64")
          p.text-gray-400.text-xs.font-bold.uppercase.tracking-wider.mb-2 {{ $t('proposals.winRate') }}
          h3.text-4xl.font-extrabold.text-gray-900 {{ stats.winRate.toFixed(1) }}%
          .mt-6.w-full.bg-gray-100.rounded-full.h-2.overflow-hidden
            .bg-emerald-500.h-full.rounded-full.transition-all.duration-1000.ease-out(
              :style="{ width: `${stats.winRate}%` }"
            )
          p.text-xs.text-gray-400.mt-2.font-medium {{ $t('proposals.basedOnApproved') }}

        //- Action Needed Card
        .bg-white.p-8.border.border-gray-100.shadow-sm.relative.overflow-hidden.group.transition-shadow(
          class="hover:shadow-md"
          style="border-radius: 2rem;"
        )
          .absolute.right-0.top-0.p-6.opacity-5.transition-opacity(class="group-hover:opacity-10")
            Clock(:size="64")
          p.text-gray-400.text-xs.font-bold.uppercase.tracking-wider.mb-2 {{ $t('proposals.actionNeeded') }}
          h3.text-4xl.font-extrabold.text-amber-500 {{ stats.counts.pending }}
          p.text-gray-900.font-bold.mt-1 {{ $t('proposals.pendingProposals') }}
          .mt-4.flex.items-center.gap-2.text-xs.text-amber-600.bg-amber-50.w-fit.px-3.py-1_5.rounded-xl.font-bold
            AlertCircle(:size="14")
            span {{ $t('proposals.inReview') }}

      //- Table Section
      .bg-white.shadow-sm.border.border-gray-100.overflow-hidden(
        style="border-radius: 2rem; min-width: 0;"
      )
        //- Status tabs + Search
        .p-6.border-b.border-gray-100.flex.flex-col.md_flex-row.justify-between.items-center.gap-4.bg-white

          //- Status Tabs
          .flex.p-1.rounded-xl.overflow-x-auto.max-w-full.no-scrollbar(
            class="bg-gray-100/80"
          )
            button(
              v-for="(status, idx) in statusTabValues"
              :key="status"
              @click="statusFilter = status"
              :class="[\
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',\
                statusFilter === status\
                  ? 'bg-white text-gray-900 shadow-sm'\
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'\
              ]"
            ) {{ statusTabs[idx] }}

          //- Search
          .flex.gap-3.items-center.w-full(class="md:w-auto")
            .relative.flex-1(class="md:flex-initial")
              Search.absolute.left-3.top-1_x2f_2.transform.-translate-y-1_x2f_2.text-gray-400(:size="16")
              input.pl-10.pr-4.py-2_5.border.border-gray-200.rounded-xl.text-sm.w-full.transition-all.font-medium(
                type="text"
                :placeholder="$t('proposals.searchPlaceholder')"
                v-model="searchTerm"
                class="focus:outline-none focus:ring-2 focus:ring-violet-500 md:w-64 bg-gray-50/50 focus:bg-white"
              )
            button.p-2_5.text-gray-500.rounded-xl.border.border-gray-200.bg-white.transition-colors(
              class="hover:bg-gray-100"
            )
              SlidersHorizontal(:size="18")

        //- Data Table
        .overflow-x-auto
          table.w-full.text-left(v-loading="loading")
            thead.border-b.border-gray-100(class="bg-gray-50/50")
              tr
                th.px-8.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider {{ $t('proposals.proposalDetails') }}
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider {{ $t('proposals.value') }}
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider {{ $t('proposals.status') }}
                th.px-6.py-5.text-xs.font-bold.text-gray-400.uppercase.tracking-wider {{ $t('proposals.date') }}
                th.px-8.py-5.text-right.text-xs.font-bold.text-gray-400.uppercase.tracking-wider {{ $t('proposals.actions') }}
            tbody.divide-y.divide-gray-50
              tr(
                v-for="p in paginatedProposals"
                :key="p.id"
                class="hover:bg-gray-50/80 transition-colors group cursor-default"
              )
                //- Proposal Details
                td.px-8.py-5
                  .flex.items-center.gap-4
                    .w-10.h-10.rounded-2xl.bg-white.border.border-gray-100.flex.items-center.justify-center.text-violet-600.shadow-sm.flex-shrink-0.transition-transform(
                      class="group-hover:scale-110"
                    )
                      FileText(:size="18")
                    .min-w-0
                      p.font-bold.text-gray-900.text-sm.truncate {{ p.title }}
                      p.text-xs.text-gray-500.truncate.font-medium
                        | {{ p.proposalFor || p.clientCompany || '—' }} &bull;
                        span.font-mono.text-gray-400.ml-1 {{ p.reference || p.refNumber || '—' }}

                //- Value
                td.px-6.py-5
                  span.font-extrabold.text-gray-900.text-sm.whitespace-nowrap.block {{ computeTotal(p).toLocaleString() }} {{ p.currency || 'SAR' }}

                //- Status
                td.px-6.py-5
                  span.px-3.py-1_5.rounded-lg.text-xs.font-bold.border.whitespace-nowrap(
                    :class="getStatusColor(mapStatus(p.status))"
                    style="font-size: 11px;"
                  ) {{ getDisplayStatus(mapStatus(p.status)) }}

                //- Date
                td.px-6.py-5.text-xs.text-gray-500.font-medium.whitespace-nowrap {{ formatDate(p.createdAt || p.date) }}

                //- Actions
                td.px-8.py-5.text-right
                  .flex.justify-end.gap-2.opacity-0.transition-opacity(class="group-hover:opacity-100")
                    button.p-2.text-gray-400.rounded-xl.transition-all(
                      class="hover:text-blue-600 hover:bg-blue-50"
                      title="View"
                      @click="navigateTo(`/sales/proposals/${p.id}`)"
                    )
                      Eye(:size="16")

                    //- Download PDF
                    button.p-2.text-gray-400.rounded-xl.transition-all(
                      class="hover:text-purple-600 hover:bg-purple-50"
                      title="Download PDF"
                      @click="handleDownloadPdf(p)"
                    )
                      Download(:size="16")

                    //- Submit for Approval (Draft only)
                    button.p-2.text-blue-400.rounded-xl.transition-all(
                      v-if="p.status === 'DRAFT'"
                      class="hover:text-blue-600 hover:bg-blue-50"
                      title="Submit for Approval"
                      @click="handleSubmitForApproval(p)"
                    )
                      Send(:size="16")

                    //- Approve (Waiting Approval only)
                    button.p-2.text-emerald-400.rounded-xl.transition-all(
                      v-if="p.status === 'WAITING_APPROVAL'"
                      class="hover:text-emerald-600 hover:bg-emerald-50"
                      title="Approve"
                      @click="handleApprove(p)"
                    )
                      CheckCircle(:size="16")

                    //- Reject (Waiting Approval only)
                    button.p-2.text-red-400.rounded-xl.transition-all(
                      v-if="p.status === 'WAITING_APPROVAL'"
                      class="hover:text-red-600 hover:bg-red-50"
                      title="Reject"
                      @click="openRejectDialog(p)"
                    )
                      XCircle(:size="16")

                    //- Edit
                    button.p-2.text-gray-400.rounded-xl.transition-all(
                      class="hover:text-violet-600 hover:bg-violet-50"
                      title="Edit"
                      @click="navigateTo(`/sales/proposals/${p.id}`)"
                    )
                      Edit(:size="16")

                    //- Archive / Unarchive
                    button.p-2.rounded-xl.transition-all(
                      v-if="p.status !== 'ARCHIVED'"
                      class="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                      title="Archive"
                      @click="handleArchive(p)"
                    )
                      Archive(:size="16")
                    button.p-2.rounded-xl.transition-all(
                      v-else
                      class="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                      title="Unarchive"
                      @click="handleArchive(p)"
                    )
                      Archive(:size="16")

                    //- Delete
                    button.p-2.text-gray-400.rounded-xl.transition-all(
                      class="hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                      @click="handleDelete(p)"
                    )
                      Trash2(:size="16")

          //- Empty state
          .p-20.text-center.flex.flex-col.items-center(v-if="filteredProposals.length === 0 && !loading")
            .bg-gray-50.p-6.rounded-full.mb-4
              FolderSearch(:size="32" class="text-gray-300")
            h3.text-gray-900.font-bold.mb-1 {{ $t('proposals.noProposalsFound') }}
            p.text-gray-500.text-sm {{ $t('proposals.adjustFilters') }}

        //- Pagination
        .flex.justify-between.items-center.p-6.border-t.border-gray-100(v-if="filteredProposals.length > 0")
          span.text-sm.text-gray-400.font-medium
            | {{ $t('proposals.showing') }} {{ paginationStart }}–{{ paginationEnd }} {{ $t('proposals.of') }} {{ filteredProposals.length }} {{ $t('proposals.proposals') }}
          .flex.items-center.gap-2
            button.px-3.py-1_5.rounded-lg.text-xs.font-bold.border.border-gray-200.transition-colors(
              :disabled="currentPage === 1"
              :class="currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'"
              @click="currentPage = currentPage - 1"
            ) {{ $t('proposals.previous') }}
            template(v-for="page in visiblePages" :key="page")
              button.w-8.h-8.rounded-lg.text-xs.font-bold.transition-colors(
                v-if="page !== '...'"
                :class="currentPage === page ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'"
                @click="currentPage = Number(page)"
              ) {{ page }}
              span.w-8.h-8.flex.items-center.justify-center.text-gray-400.text-xs(v-else) ...
            button.px-3.py-1_5.rounded-lg.text-xs.font-bold.border.border-gray-200.transition-colors(
              :disabled="currentPage === totalPages"
              :class="currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'"
              @click="currentPage = currentPage + 1"
            ) {{ $t('proposals.next') }}

    //- Sidebar
    .w-full.lg_w-80.space-y-8.flex-shrink-0

      //- Pipeline Distribution Chart
      .bg-white.p-6.border.border-gray-100.shadow-sm.relative.overflow-hidden(
        style="border-radius: 2rem;"
      )
        .flex.justify-between.items-center.mb-6
          h3.text-sm.font-bold.text-gray-900 {{ $t('proposals.pipelineDistribution') }}
          button.text-gray-400(class="hover:text-gray-600")
            MoreHorizontal(:size="16")

        //- CSS Donut Chart
        .h-56.w-full.relative.flex.items-center.justify-center
          svg.w-44.h-44(viewBox="0 0 160 160")
            circle(
              v-for="(seg, idx) in chartSegments"
              :key="idx"
              cx="80" cy="80" r="60"
              fill="none"
              :stroke="seg.color"
              stroke-width="20"
              :stroke-dasharray="seg.dashArray"
              :stroke-dashoffset="seg.dashOffset"
              stroke-linecap="round"
              :class="['transition-all duration-700 ease-out cursor-pointer', `hover:opacity-80`]"
              @mouseenter="hoveredSegment = idx"
              @mouseleave="hoveredSegment = null"
            )
          //- Center label
          .absolute.top-1_x2f_2.left-1_x2f_2.transform.-translate-x-1_x2f_2.-translate-y-1_x2f_2.text-center
            span.block.text-3xl.font-extrabold.text-gray-900 {{ stats.total }}
            span.text-gray-400.font-bold.uppercase.tracking-wider(style="font-size: 10px;") {{ $t('common.total') }}

        //- Tooltip
        .absolute.bg-white.p-3.rounded-xl.shadow-xl.border.border-gray-100.text-xs.z-50.pointer-events-none.transition-opacity.duration-200(
          v-if="hoveredSegment !== null && stats.statusDist[hoveredSegment]"
          :style="{ top: '60px', left: '50%', transform: 'translateX(-50%)' }"
        )
          p.font-bold.text-gray-900 {{ stats.statusDist[hoveredSegment].name }}
          p.text-gray-500 {{ stats.statusDist[hoveredSegment].value }} {{ $t('proposals.proposals') }}

        //- Legend
        .space-y-3.mt-4
          .flex.justify-between.items-center.text-xs.font-medium(
            v-for="(s, idx) in stats.statusDist"
            :key="s.name"
          )
            .flex.items-center.gap-2
              .w-2_5.h-2_5.rounded-full(:style="{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }")
              span.text-gray-600 {{ s.displayName }}
            span.font-bold.text-gray-900 {{ s.value }}

      //- Archive Tree
      .bg-white.border.border-gray-100.shadow-sm.p-6.max-h-125.overflow-y-auto.custom-scrollbar(
        style="border-radius: 2rem;"
      )
        .flex.items-center.justify-between.mb-6.pb-4.border-b.border-gray-100
          .flex.items-center.gap-2.text-gray-900.font-bold.text-sm
            .p-1_5.bg-violet-50.text-violet-600.rounded-lg
              FolderOpen(:size="16")
            h3 {{ $t('proposals.archive') }}
          button.font-bold.text-violet-600.px-2.py-1.rounded.transition-colors(
            style="font-size: 10px;"
            class="hover:bg-violet-50"
            @click="resetArchiveFilter"
          ) {{ $t('proposals.reset') }}

        .space-y-1
          template(v-if="Object.keys(archiveTree).length > 0")
            .space-y-1(v-for="year in Object.keys(archiveTree)" :key="year")
              button.flex.items-center.gap-3.w-full.text-left.px-3.py-2.rounded-xl.text-sm.font-bold.transition-colors(
                :class="selectedYear === year ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'"
                @click="toggleYear(year)"
              )
                FolderOpen(v-if="selectedYear === year" :size="16")
                Folder(v-else :size="16")
                | {{ year }}

              //- Months
              .ml-4.pl-3.border-l-2.border-gray-100.space-y-1.mt-1(v-if="selectedYear === year")
                div(v-for="month in Object.keys(archiveTree[year])" :key="month")
                  button.flex.items-center.gap-2.w-full.text-left.px-3.py-1_5.rounded-lg.text-xs.font-medium.transition-colors(
                    :class="selectedMonth === month ? 'text-violet-700 bg-violet-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
                    @click="toggleMonth(month)"
                  ) {{ monthNames[parseInt(month) - 1] || month }}

                  //- Days
                  .ml-3.pl-3.border-l-2.border-gray-100.space-y-1.mt-1.mb-1(v-if="selectedMonth === month")
                    button.block.w-full.text-left.px-3.py-1.font-bold.rounded-lg.transition-colors(
                      v-for="day in archiveTree[year][month]"
                      :key="day"
                      style="font-size: 10px;"
                      :class="selectedDay === day ? 'text-white bg-violet-500 shadow-sm' : 'text-gray-400 hover:text-violet-600'"
                      @click="toggleDay(day)"
                    ) {{ day }}th

          //- Empty archive
          .text-xs.text-gray-400.text-center.py-8(v-else) {{ $t('proposals.noProposalsFound') }}

  //- Reject Dialog
  el-dialog(v-model="rejectDialogVisible" :title="$t('proposals.rejected')" width="420px")
    p.mb-4(style="color: var(--text-secondary)") {{ $t('common.confirmDelete') }}
    el-input(v-model="rejectReason" type="textarea" :rows="3" :placeholder="$t('common.comments')")
    template(#footer)
      el-button(@click="rejectDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="danger" @click="handleReject" :loading="actionLoading") {{ $t('proposals.rejected') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  submitForApproval,
  approveProposal,
  rejectProposal,
  deleteProposal,
  archiveProposal,
  downloadProposalPdf
} from '~/composables/useProposals';
import {
  FileText, Plus, Search, TrendingUp, Edit, Trash2, Eye, Percent, DollarSign,
  Folder, FolderOpen, FolderSearch, Archive, CheckCircle, XCircle, Clock,
  AlertCircle, MoreHorizontal, SlidersHorizontal, Send, Download
} from 'lucide-vue-next';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();

// ─── State ───────────────────────────────────────────────────────────
const loading = ref(false);
const actionLoading = ref(false);
const proposals = ref<any[]>([]);
const totalItems = ref(0);
const searchTerm = ref('');
const statusFilter = ref('All');
const currentPage = ref(1);
const pageSize = 10;

// Archive tree filter state
const selectedYear = ref<string | null>(null);
const selectedMonth = ref<string | null>(null);
const selectedDay = ref<string | null>(null);

// Reject dialog
const rejectDialogVisible = ref(false);
const rejectReason = ref('');
const rejectTarget = ref<any>(null);

// Chart hover
const hoveredSegment = ref<number | null>(null);

// ─── Constants ───────────────────────────────────────────────────────
const CHART_COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#64748b'];
const statusTabs = computed(() => [
  t('common.all'),
  t('proposals.statusSent'),
  t('proposals.statusPending'),
  t('proposals.statusDraft'),
  t('proposals.statusApproved'),
  t('proposals.statusCanceled'),
  t('proposals.statusArchived')
]);
const statusTabValues = ['All', 'Sent', 'Pending', 'Draft', 'Approved', 'Canceled', 'Archived'];
const monthNames = computed(() => [
  t('common.months.january'), t('common.months.february'), t('common.months.march'),
  t('common.months.april'), t('common.months.may'), t('common.months.june'),
  t('common.months.july'), t('common.months.august'), t('common.months.september'),
  t('common.months.october'), t('common.months.november'), t('common.months.december')
]);

// ─── Status Mapping ──────────────────────────────────────────────────
// API statuses → display statuses
function mapStatus(apiStatus: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    WAITING_APPROVAL: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SENT: 'Sent',
    ARCHIVED: 'Archived'
  };
  return map[apiStatus] || apiStatus;
}

function getDisplayStatus(status: string): string {
  if (status === 'In Review') return 'Pending';
  if (status === 'Rejected') return 'Canceled';
  return status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600 border-gray-200',
    'In Review': 'bg-amber-50 text-amber-600 border-amber-100',
    Sent: 'bg-blue-50 text-blue-600 border-blue-100',
    Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Rejected: 'bg-red-50 text-red-600 border-red-100',
    Archived: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
}

// ─── Financial Computations ──────────────────────────────────────────
function computeTotal(p: any): number {
  // Try to extract from content JSON (API stores financial data as JSON)
  let items: any[] = [];
  if (p.items && Array.isArray(p.items)) {
    items = p.items;
  } else if (p.content) {
    try {
      const parsed = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
      items = parsed?.items || parsed?.financialItems || [];
    } catch {
      // content is not JSON
    }
  }

  if (items.length === 0) return p.totalPrice || p.total || 0;

  const subtotal = items.reduce((sum: number, item: any) => {
    return sum + ((item.quantity || item.qty || 0) * (item.rate || item.unitPrice || item.price || 0));
  }, 0);

  const discount = p.discountType === 'percent'
    ? subtotal * ((p.discount || 0) / 100)
    : (p.discount || 0);
  const taxRate = p.taxRate || 0;
  return (subtotal - discount) * (1 + taxRate / 100);
}

// ─── Archive Tree ────────────────────────────────────────────────────
const archiveTree = computed(() => {
  const tree: Record<string, Record<string, string[]>> = {};

  proposals.value.forEach((p: any) => {
    const dateStr = p.createdAt || p.date;
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;

    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    if (!tree[year]) tree[year] = {};
    if (!tree[year][month]) tree[year][month] = [];
    if (!tree[year][month].includes(day)) tree[year][month].push(day);
  });

  // Sort descending
  const sortedTree: Record<string, Record<string, string[]>> = {};
  Object.keys(tree).sort().reverse().forEach(year => {
    sortedTree[year] = {};
    Object.keys(tree[year]!).sort().reverse().forEach(month => {
      sortedTree[year]![month] = tree[year]![month]!.sort().reverse();
    });
  });

  return sortedTree;
});

// ─── Filtered Proposals ──────────────────────────────────────────────
const filteredProposals = computed(() => {
  return proposals.value.filter((p: any) => {
    // Search
    const term = searchTerm.value.toLowerCase();
    const title = (p.title || '').toLowerCase();
    const client = (p.proposalFor || p.clientName || p.clientCompany || '').toLowerCase();
    const refNum = (p.reference || p.refNumber || '').toLowerCase();
    const matchesSearch = title.includes(term) || client.includes(term) || refNum.includes(term);
    if (!matchesSearch) return false;

    // Status filter
    const displayStatus = mapStatus(p.status);
    if (statusFilter.value === 'Archived') {
      if (displayStatus !== 'Archived') return false;
    } else if (statusFilter.value === 'All') {
      if (displayStatus === 'Archived') return false;
    } else {
      if (statusFilter.value === 'Pending' && displayStatus !== 'In Review') return false;
      if (statusFilter.value === 'Canceled' && displayStatus !== 'Rejected') return false;
      if (statusFilter.value === 'Sent' && displayStatus !== 'Sent') return false;
      if (statusFilter.value === 'Draft' && displayStatus !== 'Draft') return false;
      if (statusFilter.value === 'Approved' && displayStatus !== 'Approved') return false;
      if (displayStatus === 'Archived') return false;
    }

    // Date tree filter
    const dateStr = p.createdAt || p.date;
    if (dateStr && (selectedYear.value || selectedMonth.value || selectedDay.value)) {
      const date = new Date(dateStr);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      if (selectedYear.value && year !== selectedYear.value) return false;
      if (selectedMonth.value && month !== selectedMonth.value) return false;
      if (selectedDay.value && day !== selectedDay.value) return false;
    }

    return true;
  });
});

// ─── Stats ───────────────────────────────────────────────────────────
const stats = computed(() => {
  const all = proposals.value;
  const total = all.length;

  const pipelineValue = all.reduce((sum: number, p: any) => {
    const s = mapStatus(p.status);
    if (s === 'Sent' || s === 'Draft' || s === 'In Review') {
      return sum + computeTotal(p);
    }
    return sum;
  }, 0);

  const approvedCount = all.filter((p: any) => mapStatus(p.status) === 'Approved').length;
  const rejectedCount = all.filter((p: any) => mapStatus(p.status) === 'Rejected').length;
  const closedCount = approvedCount + rejectedCount;
  const winRate = closedCount > 0 ? (approvedCount / closedCount) * 100 : 0;

  const statusDist = [
    { name: 'Draft', displayName: 'Draft', value: all.filter((p: any) => mapStatus(p.status) === 'Draft').length },
    { name: 'Pending', displayName: 'Pending', value: all.filter((p: any) => mapStatus(p.status) === 'In Review').length },
    { name: 'Sent', displayName: 'Sent', value: all.filter((p: any) => mapStatus(p.status) === 'Sent').length },
    { name: 'Approved', displayName: 'Approved', value: approvedCount },
    { name: 'Canceled', displayName: 'Canceled', value: rejectedCount },
    { name: 'Archived', displayName: 'Archived', value: all.filter((p: any) => mapStatus(p.status) === 'Archived').length }
  ].filter(d => d.value > 0);

  return {
    total,
    pipelineValue,
    winRate,
    statusDist,
    counts: {
      draft: all.filter((p: any) => mapStatus(p.status) === 'Draft').length,
      sent: all.filter((p: any) => mapStatus(p.status) === 'Sent').length,
      pending: all.filter((p: any) => mapStatus(p.status) === 'In Review').length,
      canceled: rejectedCount
    }
  };
});

// ─── SVG Donut Chart Segments ────────────────────────────────────────
const chartSegments = computed(() => {
  const dist = stats.value.statusDist;
  const total = dist.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return [];

  const circumference = 2 * Math.PI * 60; // r = 60
  const gapAngle = 4; // degrees of gap between segments
  const gapLength = (gapAngle / 360) * circumference;
  const totalGap = dist.length * gapLength;
  const availableLength = circumference - totalGap;

  let offset = -circumference / 4; // Start from top (12 o'clock)
  return dist.map((s, idx) => {
    const segLength = (s.value / total) * availableLength;
    const dashArray = `${segLength} ${circumference - segLength}`;
    const dashOffset = -offset;
    offset += segLength + gapLength;

    return {
      color: CHART_COLORS[idx % CHART_COLORS.length],
      dashArray,
      dashOffset
    };
  });
});

// ─── Pagination ──────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProposals.value.length / pageSize)));
const paginationStart = computed(() => Math.min((currentPage.value - 1) * pageSize + 1, filteredProposals.value.length));
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, filteredProposals.value.length));

const paginatedProposals = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredProposals.value.slice(start, start + pageSize);
});

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const tp = totalPages.value;
  const cp = currentPage.value;

  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cp > 3) pages.push('...');
    const start = Math.max(2, cp - 1);
    const end = Math.min(tp - 1, cp + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cp < tp - 2) pages.push('...');
    pages.push(tp);
  }
  return pages;
});

// Reset page on filter change
watch([searchTerm, statusFilter, selectedYear, selectedMonth, selectedDay], () => {
  currentPage.value = 1;
});

// ─── Archive Tree Navigation ─────────────────────────────────────────
function toggleYear(year: string) {
  if (selectedYear.value === year) {
    selectedYear.value = null;
  } else {
    selectedYear.value = year;
  }
  selectedMonth.value = null;
  selectedDay.value = null;
}

function toggleMonth(month: string) {
  if (selectedMonth.value === month) {
    selectedMonth.value = null;
  } else {
    selectedMonth.value = month;
  }
  selectedDay.value = null;
}

function toggleDay(day: string) {
  selectedDay.value = selectedDay.value === day ? null : day;
}

function resetArchiveFilter() {
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedDay.value = null;
}

// ─── Formatting ──────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── API ─────────────────────────────────────────────────────────────
async function fetchProposals() {
  loading.value = true;
  try {
    const response = await useApiFetch('proposal/?page=1&limit=500');
    if (response?.success) {
      proposals.value = response.body?.docs || response.body?.proposals || [];
      totalItems.value = response.body?.pagination?.totalItems || response.body?.totalItems || proposals.value.length;
    }
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
  } finally {
    loading.value = false;
  }
}

// ─── Actions ─────────────────────────────────────────────────────────
async function handleSubmitForApproval(row: any) {
  try {
    await ElMessageBox.confirm(t('proposals.confirmSubmit'), t('common.confirm'), { type: 'info' });
    actionLoading.value = true;
    const ok = await submitForApproval(row.id);
    if (ok) fetchProposals();
  } catch {
    /* cancelled */
  } finally {
    actionLoading.value = false;
  }
}

async function handleApprove(row: any) {
  try {
    await ElMessageBox.confirm(t('proposals.confirmApprove'), t('common.confirm'), { type: 'success' });
    actionLoading.value = true;
    const ok = await approveProposal(row.id);
    if (ok) fetchProposals();
  } catch {
    /* cancelled */
  } finally {
    actionLoading.value = false;
  }
}

function openRejectDialog(row: any) {
  rejectTarget.value = row;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning(t('proposals.rejectionReasonRequired'));
    return;
  }
  actionLoading.value = true;
  const ok = await rejectProposal(rejectTarget.value.id, rejectReason.value);
  if (ok) {
    rejectDialogVisible.value = false;
    fetchProposals();
  }
  actionLoading.value = false;
}

async function handleArchive(row: any) {
  try {
    const action = row.status === 'ARCHIVED' ? 'unarchive' : 'archive';
    await ElMessageBox.confirm(
      action === 'archive' ? t('proposals.confirmArchive', { title: row.title }) : t('proposals.confirmUnarchive', { title: row.title }),
      t('common.confirm'),
      { type: 'warning' }
    );
    actionLoading.value = true;
    const ok = await archiveProposal(row.id);
    if (ok) fetchProposals();
  } catch {
    /* cancelled */
  } finally {
    actionLoading.value = false;
  }
}

async function handleDownloadPdf(row: any) {
  await downloadProposalPdf(row.id, row.reference);
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      t('proposals.confirmDelete', { title: row.title }),
      t('common.delete'),
      { type: 'warning' }
    );
    actionLoading.value = true;
    const ok = await deleteProposal(row.id);
    if (ok) fetchProposals();
  } catch {
    /* cancelled */
  } finally {
    actionLoading.value = false;
  }
}

// ─── Init ────────────────────────────────────────────────────────────
onMounted(() => fetchProposals());
</script>

<style scoped>
.animate-entrance {
  animation: fadeSlideUp 0.5s ease-out;
}
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hide scrollbar for status tabs */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Custom scrollbar for archive tree */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 99px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
