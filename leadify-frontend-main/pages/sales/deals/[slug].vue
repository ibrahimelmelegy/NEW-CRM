<template lang="pug">
.flex.items-center.justify-between.mb-5.mt-5
  .title.font-bold.text-2xl.mb-1.capitalize {{ $t('deals.details') }}
  .flex.items-center.gap-x-3
    el-button(v-if="hasPermission('CREATE_PROPOSALS')" size="large" class="!rounded-2xl" @click="createQuoteFromDeal")
      Icon(name="ph:file-text-bold" size="18" class="mr-1")
      | {{ $t('deals.createQuote') }}
    el-dropdown(trigger="click")
        span.el-dropdown-link
            button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
        template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(v-if="hasPermission('EDIT_DEALS')")
                NuxtLink.flex.items-center(:to="`/sales/deals/edit/${deal?.id}`")
                  Icon.text-md.mr-2(size="20" name="IconEdit" )
                  p.text-sm {{ $t('common.edit') }}

//- Pipeline Stage Stepper
.glass-card.rounded-2xl.p-6.mb-6(v-if="pipelineStages.length")
  .flex.items-center.justify-between.mb-3
    p.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('deals.pipeline') }}
    el-tag(:type="currentStageType" size="small" effect="dark" round) {{ deal?.stage || 'N/A' }}
  .flex.items-center.gap-1
    .flex-1(v-for="(stage, idx) in pipelineStages" :key="stage.id")
      .relative
        .h-2.rounded-full.transition-all.duration-300(
          :style="{ backgroundColor: getStepColor(stage, idx) }"
        )
        .text-center.mt-2
          .text-xs.font-medium(:style="{ color: isStageActive(stage, idx) ? stage.color : 'var(--text-muted)' }") {{ stage.name }}
          .text-xs(v-if="stage.probability" style="color: var(--text-muted)") {{ stage.probability }}%

el-tabs.demo-tabs(v-model="activeName", @tab-click="handleClick")
  el-tab-pane(:label="$t('deals.tabs.summary')", name="summary")
    .flex-1.glass-card.p-10.rounded-3xl.mt-3
      .flex.align-center.gap-3(class="flex-col md:flex-row")
        //- Avatar(src="/images/avatar.png")
        div
          h4.text-2xl.font-semibold.mb-2.flex.items-center.gap-x-3(style="color: var(--text-primary)") {{deal?.name}} #[span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(deal?.stage)}`") {{formatSnakeCase(deal?.stage)}}]
          p(style="color: var(--text-secondary)") {{deal?.companyName}}
      .mt-8
        p.font-semibold.mb-6.text-lg(style="color: var(--text-primary)") {{ $t('common.info') }}
        .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
          NuxtLink(style="color: var(--text-muted)" :to="`/sales/leads/${lead?.id}`")
            .font-medium.mb-2.flex.items-center
              Icon(name="IconAssign" size="20" class="mr-2")
              p {{ $t('leads.table.leadName') }}
            p.mb-2.underline.text-primary-purple-500 {{lead?.name}}
          div(v-if="lead?.email")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconEmail" size="20" class="mr-2")
              p {{ $t('leads.info.email') }}
            p.mb-2(style="color: var(--text-primary)") {{lead?.email}}
          div(v-if="lead?.phone")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconPhone" size="20" class="mr-2")
              p {{ $t('leads.info.phone') }}
            p.mb-2(style="color: var(--text-primary)") {{lead?.phone}}
          div(v-if="deal?.users?.length")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconAssign" size="20" class="mr-2")
              p {{ $t('deals.table.assigned') }}
            p.mb-2(style="color: var(--text-primary)") {{deal?.users?.map((user) => user.name).join(', ')}}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="f7:money-dollar-circle" size="20" class="mr-2")
              p {{ $t('deals.table.price') }}
            p.mb-2.text-xl.font-bold(style="color: var(--text-primary)") {{ Number(deal?.price || 0).toLocaleString() }} SAR
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="tabler:category-2" size="20" class="mr-2")
              p {{ $t('deals.table.contractType') }}
            p.mb-2(style="color: var(--text-primary)") {{deal?.contractType}}
          div(v-if="deal?.cancelledReason && deal?.stage === 'CANCELLED'")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="material-symbols:cancel-outline-rounded" size="20" class="mr-2")
              p {{ $t('opportunities.info.reasonLoss') }}
            p.mb-2(style="color: var(--text-primary)") {{deal?.cancelledReason}}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconCalendar" size="20" class="mr-2")
              p {{ $t('deals.table.signatureDate') }}
            p.mb-2(style="color: var(--text-primary)") {{getYear(deal?.signatureDate)}}
  el-tab-pane(:label="$t('deals.tabs.invoices')", name="invoices" v-if="deal?.invoice?.length")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(without-filters without-search without-action without-pagination :columns="invoicesTable.columns" :data="invoicesTable.data" class="!py-0")
  el-tab-pane(:label="$t('deals.tabs.deliveries')", name="deliveries" v-if="deal?.deliveryDetails?.length")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(without-filters without-search without-action without-pagination :columns="deliveriesTable.columns" :data="deliveriesTable.data" class="!py-0")
  el-tab-pane(:label="$t('deals.tabs.proposal')" , name="proposal")
    .glass-card.rounded-3xl.mt-3.border.px-2
     .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('deals.tabs.proposal') }}
       AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="table?.columns",
        :data="table?.data",
        class="!py-0"
      )
    el-tab-pane(:label="$t('deals.tabs.activity')", name="activity")
      .mt-6
        ActivityTimeline(:activities="activity?.docs")
      .flex.justify-center.items-center.w-full
        el-button( v-if="activity?.docs?.length >0" :loading = "loading" class="!rounded-2xl mb-2"  type= 'primary' size="large" :disabled="activity?.pagination?.totalPages == activity?.pagination?.page" @click="getActivityPage(Number(activity?.pagination?.page)+1)") {{ $t('common.view') }} More
  el-tab-pane(:label="$t('common.timeline')" name="timeline")
    RecordTimeline(:entityType="'deal'" :entityId="route.params.slug as string")
  el-tab-pane(:label="$t('common.comments')" name="comments")
    RecordComments(:entityType="'deal'" :entityId="route.params.slug as string")
  el-tab-pane(:label="$t('common.attachments')" name="record-attachments")
    RecordAttachments(:entityType="'deal'" :entityId="route.params.slug as string")
</template>
<script lang="ts" setup>
import { fetchPipelineStages } from '@/composables/usePipelineConfig';
import type { PipelineStage } from '@/composables/usePipelineConfig';

const { hasPermission } = await usePermissions();
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const activeName = ref('summary');
const route = useRoute();
const router = useRouter();
const loading = ref(false);

const activity = ref();
const pipelineStages = ref<PipelineStage[]>([]);

// Call API to Get the deal
const deal = await getDeal(route.params.slug as string);
if (!deal || !deal.id) {
  await navigateTo('/sales/deals');
}
const activityResponse = await getOpportunityActivity((route.params.slug as string) + `?limit=10` + '&&page=1');
activity.value = activityResponse;

// Load pipeline stages for stepper
fetchPipelineStages('deal').then(stages => {
  pipelineStages.value = stages;
});

// Pipeline stepper helpers
const currentStageIndex = computed(() => {
  if (!deal?.stage || !pipelineStages.value.length) return -1;
  return pipelineStages.value.findIndex(s => s.name === deal.stage || s.name.toUpperCase() === deal.stage);
});

const currentStageType = computed(() => {
  const stage = deal?.stage;
  if (stage === 'COMPLETED' || stage === 'CLOSED' as any || stage === 'Closed Won' as any) return 'success';
  if (stage === 'CANCELLED' || stage === 'Closed Lost' as any) return 'danger';
  return 'primary';
});

function isStageActive(stage: PipelineStage, idx: number): boolean {
  return idx <= currentStageIndex.value;
}

function getStepColor(stage: PipelineStage, idx: number): string {
  if (idx <= currentStageIndex.value) return stage.color;
  return 'var(--el-border-color)';
}

function handleClick() {}

// Create quote from deal
function createQuoteFromDeal() {
  const query: Record<string, string> = {
    relatedEntityId: String(deal.id),
    relatedEntityType: 'Deal',
    proposalFor: String(deal.companyName || deal.name || '')
  };
  router.push({ path: '/sales/proposals/add-proposal', query });
}

const getActivityPage = async (page: number) => {
  try {
    loading.value = true;
    const responsPage = await getActivity((route.params.slug as string) + `?limit=10` + `&&page=${page}`);
    activity.value = { docs: [...activity.value.docs, ...responsPage.docs], pagination: responsPage.pagination };
  } finally {
    loading.value = false;
  }
};

// Call API to Get the lead
const lead = deal?.leadId ? await getLead(deal.leadId as string) : null;

//  invoices table
const invoicesTable = reactive({
  columns: [
    {
      prop: 'invoiceNumber',
      label: t('deals.table.invoiceNumber'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    },
    {
      prop: 'amount',
      label: t('deals.table.amount'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    },
    {
      prop: 'invoiceDate',
      label: t('deals.table.invoiceDate'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    },
    // {
    //   prop: "dueDate",
    //   label: "Due Date",
    //   component: "Text",
    //   // sortable: true,
    //   type: "font-default",
    // },
    {
      prop: 'collected',
      label: t('deals.table.collected'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    },
    {
      prop: 'collectedDate',
      label: t('deals.table.collectedDate'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    }
  ],
  data: [] as Invoice[]
});

invoicesTable.data =
  ((deal?.invoice as any)?.map((item: Invoice) => ({
    ...item,
    invoiceDate: getYear(item.invoiceDate),
    dueDate: getYear(item.dueDate),
    collectedDate: getYear(item.collectedDate),
    collected: item.collected ? t('common.yes') : t('common.no')
  })) || []) as any[];

//  invoices table
const deliveriesTable = reactive({
  columns: [
    {
      prop: 'deliveryDetails',
      label: t('deals.table.deliveryDetails'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    },
    {
      prop: 'deliveryDate',
      label: t('deals.table.deliveryDate'),
      component: 'Text',
      // sortable: true,
      type: 'font-default'
    }
  ],
  data: [] as Delivery[]
});
deliveriesTable.data = ((deal?.deliveryDetails as any)?.map((item: Delivery) => ({ ...item, deliveryDate: getYear(item.deliveryDate) })) || []) as any[];

const table = reactive({
  columns: [
    {
      prop: 'title',
      label: t('deals.tabs.proposal'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'version',
      label: 'Version',
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'relatedEntity',
      label: 'Related to',
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'type',
      label: 'Type',
      component: 'Text',
      sortable: true,
      type: 'font-default',
      filters: [
        { text: 'Financial', value: 'FINANCIAL' },
        { text: 'Technical', value: 'TECHNICAL' },
        { text: 'Tech & Financial', value: 'MIXED' }
      ],
      width: 150
    },
    {
      prop: 'proposalFor',
      label: 'Client Name',
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'status',
      label: 'Status',
      component: 'Label',
      type: 'outline',
      filters: [
        { text: 'Approved', value: 'APPROVED' },
        { text: 'Waiting Approval', value: 'WAITING_APPROVAL' },
        { text: 'Rejected', value: 'REJECTED' }
      ],
      width: 150
    },
    {
      prop: 'reference',
      label: 'Reference',
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'assign',
      label: t('deals.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('deals.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ],
  data: [] as Client[]
});

const checkProposalResponse = await useTableFilter(`proposal?relatedEntityId=${route.params.slug as string}&page=1&limit=100`);
table.data = checkProposalResponse.formattedData?.map((el: any) => {
  return { ...el, type: el.type == 'Mixed' ? 'Tech & Financial' : el.type };
});
</script>
