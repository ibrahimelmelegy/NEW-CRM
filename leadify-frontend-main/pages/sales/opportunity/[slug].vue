<template lang="pug">
.flex.items-center.justify-between.mb-5.mt-5
  .title.font-bold.text-2xl.mb-1.capitalize {{ $t('opportunities.details') }}
  el-dropdown(trigger="click")
      span.el-dropdown-link
          button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      template(#dropdown)
          el-dropdown-menu
            el-dropdown-item( v-if="hasPermission('EDIT_OPPORTUNITIES')")
              NuxtLink.flex.items-center(:to="`/sales/opportunity/edit/${opportunity?.id}`")
                Icon.text-md.mr-2(size="20" name="IconEdit" )
                p.text-sm {{ $t('common.edit') }}
            el-dropdown-item
              NuxtLink.flex.items-center(:to="`/sales/deals/add-deal?opportunityId=${opportunity?.id}&leadId=${lead?.id}`")
                Icon.text-md.mr-2(size="20" name="IconDeal" )
                p.text-sm {{ $t('opportunities.convertDeal') }}
            //- el-dropdown-item
            //-   .flex.items-center
            //-     Icon.text-md.mr-2(size="20" name="IconRestore" )
            //-     p.text-sm Convert to
            //- el-dropdown-item
            //-   .flex.items-center
            //-     Icon.text-md.mr-2(size="20" name="IconOpportunity" )
            //-     p.text-sm Opportunity
            //- el-dropdown-item
            //-   .flex.items-center
            //-     Icon.text-md.mr-2(size="20" name="IconDeal" )
            //-     p.text-sm Deal
            //- el-dropdown-item
            //-   .flex.items-center
            //-     Icon.text-md.mr-2(size="20" name="IconProject" )
            //-     p.text-sm Project
            //- el-dropdown-item
            //-   .flex.items-center
            //-     Icon.text-md.mr-2(size="20" name="IconDelete" )
            //-     p.text-sm Delete
el-tabs.demo-tabs(v-model="activeName", @tab-click="handleClick")
  el-tab-pane(:label="$t('leads.summary')", name="summary")
    .flex.align-center.gap-6.mt-3(class="flex-col xl:flex-row")
      .flex-1.glass-card.p-10.rounded-3xl
        .flex.align-center.gap-3(class="flex-col md:flex-row")
          //- Avatar(src="/images/avatar.png")
          div
            h4.text-2xl.font-semibold.mb-2.text-neutral-900.flex.items-center.gap-x-3 {{opportunity?.name}}
            p.text-neutral-600 {{lead?.companyName}}
        .mt-8
          p.text-neutral-900.font-semibold.mb-6.text-lg {{ $t('common.info') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            NuxtLink.text-neutral-400(v-if="lead?.id" :to="`/sales/leads/${lead?.id}`")
              .font-medium.mb-2.flex.items-center
                Icon(name="IconAssign" size="20" class="mr-2")
                p {{ $t('opportunities.info.leadName') }}
              p.mb-2.underline.text-primary-purple-500 {{lead?.name}}
            div(v-if="lead?.email")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconEmail" size="20" class="mr-2")
                p {{ $t('leads.info.email') }}
              p.text-neutral-800.mb-2 {{lead?.email}}
            div(v-if="lead?.phone")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconPhone" size="20" class="mr-2")
                p {{ $t('leads.info.phone') }}
              p.text-neutral-800.mb-2 {{lead?.phone}}
            div(v-if="opportunity?.users?.length")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconAssign" size="20" class="mr-2")
                p {{ $t('opportunities.table.assigned') }}
              p.text-neutral-800.mb-2 {{opportunity?.users?.map((user) => user.name).join(', ')}}
            div(v-if="opportunity?.interestedIn")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="tabler:category-2" size="20" class="mr-2")
                p {{ $t('opportunities.info.products') }}
              p.text-neutral-800.mb-2 {{opportunity?.interestedIn}}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="lucide-lab:dollar-sign-square" size="20" class="mr-2")
                p {{ $t('opportunities.info.budget') }}
              p.text-neutral-800.mb-2 $ {{opportunity?.estimatedValue}}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconCalendar" size="20" class="mr-2")
                p {{ $t('opportunities.info.closeDate') }}
              p.text-neutral-800.mb-2 {{getYear(opportunity?.expectedCloseDate)}}
            div(v-if="opportunity?.priority")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconPriority" size="20" class="mr-2")
                p {{ $t('opportunities.info.priority') }}
              .items-center(:class="`inline-flex rounded-xl p-1 label-outline-${getStatusColor(formatSnakeCase(opportunity?.priority))}`")
                div(class="h-1.5 w-1.5 rounded-full mr-1" :class="`bg-solid-${getStatusColor(formatSnakeCase(opportunity?.priority))}`")
                span {{ formatSnakeCase(opportunity?.priority) }}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center.mb-3
                Icon(name="lets-icons:status" size="20" class="mr-2")
                p {{ $t('opportunities.info.stage') }}
              span.border.rounded-xl.px-2(:class="`label-outline-${getStatusColor(opportunity?.stage)}`") {{formatSnakeCase(opportunity?.stage)}}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center.mb-3
                Icon(name="IconSteps" size="20" class="mr-2")
                p {{ $t('opportunities.info.nextSteps') }}
              span.text-neutral-800.mb-2.bg-neutral-100.rounded-xl.py-1.px-2.mr-2(v-for="nextStep in opportunity?.nextSteps") {{nextStep}}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconCalendar" size="20" class="mr-2")
                p {{ $t('opportunities.info.created') }}
              p.text-neutral-800.mb-2 {{formatDate(opportunity?.createdAt)}}
            div
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="IconCalendar" size="20" class="mr-2")
                p {{ $t('opportunities.info.updated') }}
              p.text-neutral-800.mb-2 {{formatDate(opportunity?.updatedAt)}}
            div(v-if="opportunity?.stage  === 'LOST'")
              .text-neutral-400.font-medium.mb-2.flex.items-center
                Icon(name="mage:message-information" size="20" class="mr-2")
                p {{ $t('opportunities.info.reasonLoss') }}
              p.text-neutral-800.mb-2 {{opportunity?.reasonOfLose}}
      .flex-1.glass-card.p-10.rounded-3xl(v-if="opportunity?.notes")
        .flex.items-center.gap-2.mb-4
          .flex.items-center.justify-center.w-10.h-10.rounded-full.bg-secondary-turquoise-50: Icon.text-secondary-turquoise-700(name="IconNote" size="24")
          h4.text-lg.font-semibold.text-neutral-900 {{ $t('leads.notes') }}
        p.text-neutral-800.leading-relaxed {{opportunity?.notes}}
  el-tab-pane(:label="$t('opportunities.proposal')" , name="proposal")
    .glass-card.rounded-3xl.mt-3.border.px-2
     .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('opportunities.proposal') }}
       AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="table?.columns",
        :data="table?.data",
        class="!py-0"
      )
    el-tab-pane(:label="$t('leads.activity')", name="activity")
      .mt-6
        ActivityTimeline(:activities="activity?.docs")
      .flex.justify-center.items-center.w-full
        el-button( v-if="activity?.docs?.length >0" :loading = "loading" class="!rounded-2xl mb-2"  type= 'primary' size="large" :disabled="activity?.pagination?.totalPages == activity?.pagination?.page" @click="getActivityPage(Number(activity?.pagination?.page)+1)") {{ $t('common.view') }} More
</template>
<script lang="ts" setup>
const { hasPermission } = await usePermissions();
const { t } = useI18n();
const activeName = ref('summary');
const route = useRoute();

const loading = ref(false);

const activity = ref();

// Call API to Get the opportunity
const opportunity = await getOpportunity(route.params.slug as string);
const response = await getOpportunityActivity((route.params.slug as string) + `?limit=10` + '&&page=1');
activity.value = response;

const getActivityPage = async (page: number) => {
  try {
    loading.value = true;
    const responsPage = await getOpportunityActivity((route.params.slug as string) + `?limit=10` + `&&page=${page}`);
    activity.value = { docs: [...activity.value.docs, ...responsPage.docs], pagination: responsPage.pagination };
  } finally {
    loading.value = false;
  }
};

// Call API to Get the lead
const lead = await getLead(opportunity.leadId as any);
const table = reactive({
  columns: [
    {
      prop: 'title',
      label: t('opportunities.table.proposalTitle'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'version',
      label: t('opportunities.table.version'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'relatedEntity',
      label: t('opportunities.table.relatedTo'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'type',
      label: t('opportunities.table.type'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      filters: [
        { text: t('opportunities.proposalTypes.financial'), value: 'FINANCIAL' },
        { text: t('opportunities.proposalTypes.technical'), value: 'TECHNICAL' },
        { text: t('opportunities.proposalTypes.mixed'), value: 'MIXED' }
      ],
      width: 150
    },
    {
      prop: 'proposalFor',
      label: t('opportunities.table.clientName'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'status',
      label: t('opportunities.table.status'),
      component: 'Label',
      type: 'outline',
      filters: [
        { text: t('opportunities.proposalStatus.approved'), value: 'APPROVED' },
        { text: t('opportunities.proposalStatus.waiting'), value: 'WAITING_APPROVAL' },
        { text: t('opportunities.proposalStatus.rejected'), value: 'REJECTED' }
      ],
      width: 150
    },
    {
      prop: 'reference',
      label: t('opportunities.table.reference'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 200
    },
    {
      prop: 'assign',
      label: t('opportunities.table.assigned'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'createdAt',
      label: t('opportunities.table.created'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 200
    }
    // { prop: 'actions', label: 'Actions', sortable: false },
  ],
  data: [] as Client[]
});

const proposalResponse = await useTableFilter(`proposal?relatedEntityId=${route.params.slug as string}&page=1&limit=100`);
table.data = proposalResponse.formattedData?.map((el: any) => {
  return { ...el, type: el.type == 'Mixed' ? t('opportunities.proposalTypes.mixed') : el.type };
});
</script>
