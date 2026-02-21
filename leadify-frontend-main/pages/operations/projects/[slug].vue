<template lang="pug">
.flex.items-center.justify-between.mb-5.mt-5
  .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.projects.details.title') }}
  el-dropdown(trigger="click")
    span.el-dropdown-link
      button.rounded-btn(class="!px-4"): Icon(name="IconToggle", size="24")
    template(#dropdown)
      el-dropdown-menu
        el-dropdown-item(v-if="hasPermission('EDIT_PROJECTS')")
          NuxtLink.flex.items-center(
            :to="`/operations/projects/edit/${project?.id}`"
          )
            Icon.text-md.mr-2(size="20", name="IconEdit")
            p.text-sm {{ $t('operations.projects.details.edit') }}
        el-dropdown-item(@click="addShow = true")
          .flex.items-center
            Icon.text-md.mr-2(size="20", name="IconAdd")
            p.text-sm {{ $t('operations.projects.details.createFolder') }}
        //- el-dropdown-item
        //-   .flex.items-center
        //-     Icon.text-md.mr-2(size="20" name="IconRestore" )
        //-     p.text-sm Convert to
        //- el-dropdown-item
        //-   .flex.items-center
        //-     Icon.text-md.mr-2(size="20" name="IconDeal" )
        //-     p.text-sm Project
        //- el-dropdown-item
        //-   .flex.items-center
        //-     Icon.text-md.mr-2(size="20" name="IconProject" )
        //-     p.text-sm Project
        //- el-dropdown-item
        //-   .flex.items-center
        //-     Icon.text-md.mr-2(size="20" name="IconDelete" )
        //-     p.text-sm Delete
el-tabs.demo-tabs(v-model="activeName", @tab-click="handleClick")
  el-tab-pane(:label="$t('operations.projects.tabs.information')", name="information")
    .flex-1.glass-card.p-10.rounded-3xl
      .grid.gap-4.grid-cols-1(class="md:grid-cols-2 lg:grid-cols-4")
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="tabler:category-2", size="20")
            p {{ $t('operations.projects.form.projectName') }}
          p.text-neutral-800.mb-2 {{ project?.name }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="IconAssign", size="20")
            p {{ $t('operations.projects.form.client') }}
          p.text-neutral-800.mb-2 {{ project?.client?.clientName }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="solar:hashtag-outline", size="20")
            p {{ $t('operations.projects.form.projectType') }}
          p.text-neutral-800.mb-2 {{ formatSnakeCase(project?.type) }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="IconProjectStatus", size="20")
            p {{ $t('operations.projects.form.status') }}
          span.border.rounded-xl.text-xs.px-2(
            :class="`label-outline-${getStatusColor(valueMap[project?.status])}`"
          ) {{ formatSnakeCase(project?.status) }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="IconCalendar", size="20")
            p {{ $t('operations.projects.form.startDate') }}
          p.text-neutral-800.mb-2 {{ getYear(project?.startDate) }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="IconCalendar", size="20")
            p {{ $t('operations.projects.form.endDate') }}
          p.text-neutral-800.mb-2 {{ getYear(project?.endDate) }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="solar:hashtag-outline", size="20")
            p {{ $t('operations.projects.form.duration') }}
          p.text-neutral-800.mb-2 {{ project?.duration }}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon.mr-2(name="IconAssign", size="20")
            p {{ $t('operations.projects.form.assignUsers') }}
          p.text-neutral-800.mb-2 {{ project?.assignedUsers?.map((user: any) => user?.name).join(", ") }}

    .flex.align-center.gap-6.mt-3.flex-col(class="xl:flex-row")
      .flex-1.glass-card.p-10.rounded-3xl(v-if="project?.etimadProject")
        h4.text-lg.font-semibold.text-neutral-900.mb-4 {{ $t('operations.projects.form.etimadDetails') }}
        .grid.gap-4.grid-cols-1(class="md:grid-cols-2 lg:grid-cols-4")
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.abbreviation') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.abbreviation }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.organization') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.organizationName }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.rfpName') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.rfpName }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.contractType') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.contractType }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.tenderPrice') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.tenderPrice }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.businessLine') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.businessLine }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.estBudget') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.estimatedBudget }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.margin') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.companyMargin }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="solar:hashtag-outline", size="20")
              p {{ $t('operations.projects.form.remainingDays') }}
            p.text-neutral-800.mb-2 {{ project?.etimadProject?.remainingDays }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="IconProjectStatus", size="20")
              p {{ $t('operations.projects.form.appStatus') }}
            span.border.rounded-xl.text-xs.px-2(
              :class="`label-outline-${getStatusColor(project?.etimadProject?.applicationStatus)}`"
            ) {{ formatSnakeCase(project?.etimadProject?.applicationStatus) }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="IconProjectStatus", size="20")
              p {{ $t('operations.projects.form.proposalStatus') }}
            span.border.rounded-xl.text-xs.px-2(
              :class="`label-outline-${getStatusColor(project?.etimadProject?.proposalStatus)}`"
            ) {{ formatSnakeCase(project?.etimadProject?.proposalStatus) }}
          div
            .text-neutral-400.font-medium.mb-2.flex.items-center
              Icon.mr-2(name="IconCalendar", size="20")
              p {{ $t('operations.projects.form.submissionDate') }}
            p.text-neutral-800.mb-2 {{ getYear(project?.etimadProject?.submissionDate) }}
    .flex.align-center.gap-6.mt-3.flex-col(class="xl:flex-row")
      .flex-1.glass-card.p-10.rounded-3xl(v-if="project?.description")
        h4.text-lg.font-semibold.text-neutral-900.mb-4 {{ $t('operations.projects.form.description') }}
        p.text-neutral-800.leading-relaxed {{ project?.description }}
      .glass-card.p-10.rounded-3xl
        p.text-lg.font-semibold.text-neutral-900.mb-3 {{ $t('operations.projects.detailsSummary.title') }}
        .flex.justify-between.items-center.gap-60.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.detailsSummary.subtotal') }}:
          p.text-base.text-neutral-900 {{ project?.grandTotal || 0 }} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-60.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.detailsSummary.vat') }}:
          p.text-base.text-neutral-900 {{ project?.vat || 0 }} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.detailsSummary.discount') }}:
          p.text-base.text-neutral-900 {{ project.discount || 0 }} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4.border-b.pb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.detailsSummary.margin', { percentage: project.marginPercentage || 0 }) }}:
          p.text-base.text-neutral-900 {{ project?.marginAmount?.toFixed(2) }} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-60.mb-4
          p.text-base.text-neutral-900 {{ $t('operations.projects.detailsSummary.totalCost') }}:
          p.text-base.text-neutral-900 {{ project?.totalCost || 0 }} {{ $t('common.sar') }}
  el-tab-pane(:label="$t('operations.projects.tabs.vehicles')", name="vehicles")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="vehicles.columns",
        :data="vehicles.data",
        class="!py-0"
      )
  el-tab-pane(:label="$t('operations.projects.tabs.manpower')", name="project")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="manpowers.columns",
        :data="manpowers.data",
        class="!py-0"
      )
    .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('operations.projects.tabs.preview') }}
    .glass-card.rounded-3xl.mt-3.border
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="manPowerPreview.columns",
        :data="manPowerPreview.data",
        class="!py-0"
      )
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="manPowertotal.columns",
        :data="manPowertotal.data",
        class="!py-0"
      )
  el-tab-pane(:label="$t('operations.projects.tabs.materials')", name="materials")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="materials.columns",
        :data="materials.data",
        class="!py-0"
      )
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="materialsPreview.columns",
        :data="materialsPreview.data",
        class="!py-0"
      )
  el-tab-pane(:label="$t('operations.projects.tabs.assets')", name="assets")
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="assets.columns",
        :data="assets.data",
        class="!py-0"
      )
    .glass-card.p-10.rounded-3xl.mt-3
      AppTable(
        without-filters,
        without-search,
        without-action,
        without-pagination,
        :columns="assetsTotal.columns",
        :data="assetsTotal.data",
        class="!py-0"
      )
  el-tab-pane(:label="$t('operations.projects.tabs.preview')", name="preview")
    OperationsProjectsShowPreview(
      :project="project",
      :manPowerPreview="finalCost"
    )
  el-tab-pane(:label="$t('operations.projects.tabs.proposal')", name="proposal")
    .glass-card.rounded-3xl.mt-3.border.px-2
      .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('operations.projects.tabs.proposal') }}
        AppTable(
          without-filters,
          without-search,
          without-action,
          without-pagination,
          :columns="table?.columns",
          :data="table?.data",
          class="!py-0"
        )
  el-tab-pane(:label="$t('operations.projects.tabs.folders')", name="folders")
    .relative
      el-skeleton(:loading="loading" animated)
        template(#template)
          .grid.grid-cols-4.gap-4.grid-cols-1(class="md:grid-cols-2 lg:grid-cols-4")
            .rounded-3xl.m-3.p-5.glass-card(v-for="i in 4" :key="i")
              .text-neutral-600
                .flex.flex-row.justify-between
                  el-skeleton-item(variant="image" style="width: 40px; height: 40px")
                  el-skeleton-item(variant="button" style="width: 30px; height: 30px")
                el-skeleton-item(variant="text" style="width: 60%")
                el-skeleton-item(variant="text" style="width: 30%")
        template(#default)
          OperationsProjectsShowFolders(
            @onSubmit="handleSubmit",
            :project="project"
          )

  el-tab-pane(:label="$t('operations.projects.tabs.activity')", name="activity")
    .mt-6.activity
      .flex.items-start.gap-x-6.mb-7.w-full(
        v-for="item in activity?.docs",
        class="lg:w-6/12"
      )
        .flex.items-center.justify-center.w-12.h-12.rounded-full(
          class="!min-w-[48px] !min-h-[48px]",
          :class="handleTypeStyle(item.status)"
        ): Icon(
          :name="handleIconName(item.status)",
          size="24"
        )
        .mt-2
          h4.text-neutral-800.font-semibold.text-sm.mb-1 {{ item?.status == "assigned" ? $t('operations.projects.activity.assigned') : item?.status == "create" ? $t('operations.projects.activity.create') : item?.status?.toString()?.toUpperCase() }}
          p.text-neutral-500.text-xs.mb-4.font-medium {{ formatDate(item?.createdAt) }}
          .glass-card.p-5.rounded-3xl(class="w-[65vw]")
            p.text-neutral-700.text-xs {{ item?.description?.toString()?.toUpperCase() }}
            .flex.items-center.gap-3.gap-x-2.mt-4
              Avatar(
                :src="item?.user?.profilePicture ?? '/images/avatar.png'",
                small
              )
              p.text-neutral-800.text-xs.font-medium {{ item?.user?.name }}
    el-empty(
      v-if="activity?.docs?.length == 0 || !activity?.docs",
      :description="$t('operations.projects.details.noActivity')",
      image="/images/empty.png"
    )
    .flex.justify-center.items-center.w-full
      el-button.mb-2(
        v-if="activity?.docs?.length > 0",
        :loading="loading",
        class="!rounded-2xl",
        type="primary",
        size="large",
        :disabled="activity?.pagination?.totalPages == activity?.pagination?.page",
        @click="getActivityPage(Number(activity?.pagination?.page) + 1)"
      ) {{ $t('operations.projects.details.viewMore') }}
  el-tab-pane(:label="$t('common.timeline')" name="timeline")
    RecordTimeline(:entityType="'project'" :entityId="route.params.slug as string")
  el-tab-pane(:label="$t('common.comments')" name="comments")
    RecordComments(:entityType="'project'" :entityId="route.params.slug as string")
  el-tab-pane(:label="$t('common.attachments')" name="record-attachments")
    RecordAttachments(:entityType="'project'" :entityId="route.params.slug as string")
el-dialog(
  v-model="addShow",
  class="!shadow-none xl:!w-[50%] lg:!w-[70%] sm:!w-[90%] !w-full",
  align-center="",
  @close="handleDialogClose"
)
  .title.font-bold.text-xl.capitalize {{ $t('operations.projects.details.projectFolders') }}
  OperationsProjectsFolders(
    @onSubmit="handleSubmit",
    @onCancel="handleCancel",
    :project="project"
  )
</template>
<script lang="ts" setup>
const { t } = useI18n();
const activeName = ref('information');
const route = useRoute();
const loading = ref(false);
const addShow = ref(false);
const { hasPermission } = await usePermissions();
const handleSubmit = async () => {
  loading.value = true;
  addShow.value = false;
  // Refresh project data
  project = await getProject(route.params.slug?.toString() || '');
  loading.value = false;
};

const handleCancel = () => {
  addShow.value = false;
};

const handleDialogClose = () => {
  addShow.value = false;
};

const handleTypeStyle = (type: string) => {
  switch (type) {
    case 'assigned':
      return 'bg-primary-purple-50 text-primary-purple-500';
    case 'update':
      return 'bg-secondary-turquoise-50 text-secondary-turquoise-700';
    case 'restored':
      return 'bg-semantic-warning-background text-semantic-warning-foreground';
    case 'create':
      return 'bg-primary-purple-50 text-primary-purple-500';
    case 'delete':
      return 'bg-semantic-error-background text-semantic-error-foreground';
    case 'archived':
      return 'bg-neutral-100 text-neutral-500';
    case 'import':
      return 'bg-secondary-blue-100 text-secondary-blue-600';
    case 'export':
      return 'bg-secondary-turquoise-100 text-secondary-turquoise-900';
    default:
      return '';
  }
};

const handleIconName = (type: string) => {
  switch (type) {
    case 'assigned':
      return 'IconAssign';
    case 'update':
      return 'IconEdit';
    case 'restored':
      return 'IconRestore';
    case 'create':
      return 'IconNewLead';
    case 'delete':
      return 'IconDelete';
    case 'archived':
      return 'IconArchived';
    case 'import':
      return 'IconImport';
    case 'export':
      return 'IconExport';
    default:
      return '';
  }
};

const activity = ref();

// mock data for integrate till api is ready
let project = await getProject(route.params.slug?.toString() || '');

const respons = await getProjectActivity(route.params.slug + `?limit=10` + '&&page=1');
activity.value = respons;

const getActivityPage = async (page: number) => {
  try {
    loading.value = true;
    const responsPage = await getProjectActivity(route.params.slug + `?limit=10` + `&&page=${page}`);
    activity.value = {
      docs: [...activity.value.docs, ...responsPage.docs],
      pagination: responsPage.pagination
    };
  } finally {
    loading.value = false;
  }
};

const valueMap = {
  ACTIVE: 'PROJECT_ACTIVE',
  CANCELLED: 'PROJECT_CANCELLED',
  COMPLETED: 'PROJECT_COMPLETED',
  ON_HOLD: 'PROJECT_ON_HOLD'
};

// vehicles table
const vehicles = reactive({
  columns: [
    { prop: 'plate', label: t('operations.projects.vehicles.table.plateNumber'), component: 'Text', type: 'font-bold', width: 130 },
    { prop: 'manufacturer', label: t('operations.projects.vehicles.table.manufacturer'), component: 'Text', type: 'font-bold', width: 150 },
    { prop: 'rentCost', label: t('operations.projects.vehicles.table.rentCost'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'gasCost', label: t('operations.projects.vehicles.table.gasCost'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'oilCost', label: t('operations.projects.vehicles.table.oilCost'), component: 'Text', type: 'font-default', width: 150 },
    {
      prop: 'regularMaintenanceCost',
      label: t('operations.projects.vehicles.table.maintenanceCost'),
      component: 'Text',
      type: 'font-default',
      width: 250
    },
    { prop: 'totalCost', label: t('operations.projects.vehicles.table.totalCost'), component: 'Text', type: 'font-default', width: 250 }
  ],
  data: [] as any[]
});

if (project?.vehicles?.length) {
  vehicles.data =
    project?.vehicles?.map((vehicle: any) => ({
      ...vehicle,
      totalCost:
        Number(vehicle.rentCost || 0) + Number(vehicle.gasCost || 0) + Number(vehicle.oilCost || 0) + Number(vehicle.regularMaintenanceCost || 0)
    })) || [];
}

// manpower table
const manpowers = ref({
  columns: [
    { prop: 'name', label: t('operations.projects.manpower.table.manpowerName'), component: 'Text', type: 'font-bold', width: 150 },
    { prop: 'estimatedWorkDays', label: t('operations.projects.manpower.table.estimatedDays'), component: 'Text', type: 'font-bold', width: 180 },
    { prop: 'mission', label: t('operations.projects.manpower.table.mission'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'durationCost', label: t('operations.projects.manpower.table.durationCost'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'foodAllowanceCost', label: t('operations.projects.manpower.table.foodAllowance'), component: 'Text', type: 'font-default', width: 200 },
    {
      prop: 'accommodationCostPerManpower',
      label: t('operations.projects.manpower.table.accommodationPerMan'),
      component: 'Text',
      type: 'font-default',
      width: 270
    },
    { prop: 'carRentPerManpower', label: t('operations.projects.manpower.table.carRentPerMan'), component: 'Text', type: 'font-default', width: 200 },
    { prop: 'otherCosts', label: t('operations.projects.manpower.table.otherCosts'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'totalCost', label: t('operations.projects.manpower.table.totalCost'), component: 'Text', type: 'font-default', width: 150 }
  ],
  data: [] as any[]
});

const manPowertotal = ref({
  columns: [
    { prop: 'totalCost', label: t('operations.projects.manpower.totalTable.manpowerTotal'), component: 'Text', type: 'font-bold', width: 130 },
    {
      prop: 'finalManpowerTableTotalCost',
      label: t('operations.projects.manpower.totalTable.finalTotal'),
      component: 'Text',
      type: 'font-bold',
      width: 150
    }
  ],
  data: [] as any[]
});

const table = reactive({
  columns: [
    { prop: 'title', label: t('operations.projects.proposalTable.title'), component: 'Text', sortable: true, type: 'font-bold', width: 200 },
    { prop: 'version', label: t('operations.projects.proposalTable.version'), component: 'Text', sortable: true, type: 'font-default', width: 150 },
    {
      prop: 'relatedEntity',
      label: t('operations.projects.proposalTable.relatedTo'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'type',
      label: t('operations.projects.proposalTable.type'),
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
    { prop: 'proposalFor', label: t('operations.projects.proposalTable.client'), component: 'Text', sortable: true, type: 'font-bold', width: 200 },
    {
      prop: 'status',
      label: t('operations.projects.proposalTable.status'),
      component: 'Label',
      type: 'outline',
      filters: [
        { text: 'Approved', value: 'APPROVED' },
        { text: 'Waiting Approval', value: 'WAITING_APPROVAL' },
        { text: 'Rejected', value: 'REJECTED' }
      ],
      width: 150
    },
    { prop: 'reference', label: t('operations.projects.proposalTable.reference'), component: 'Text', sortable: true, type: 'font-bold', width: 200 },
    { prop: 'assign', label: t('operations.projects.proposalTable.assigned'), component: 'Text', type: 'font-default', width: 200 },
    { prop: 'createdAt', label: t('operations.projects.proposalTable.created'), component: 'Text', sortable: true, type: 'font-default', width: 200 }
  ],
  data: [] as any[]
});

// Fetch all lookup data in parallel for faster page load
const [response, _manpowersRes, _serviceRes, _addMaterialsRes, _assetsRes]: any[] = await Promise.all([
  useTableFilter(`proposal?relatedEntityId=${route.params.slug}&page=1&limit=100`),
  useTableFilter('manpower'),
  useTableFilter('service'),
  useTableFilter('additional-material'),
  useTableFilter('asset')
]);
table.data = response.formattedData?.map((el: any) => {
  return { ...el, type: el.type == 'Mixed' ? 'Tech & Financial' : el.type };
});

const manPowerPreview = ref({
  columns: [
    {
      prop: 'totalCarRent',
      label: 'Total Car Rent',
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 130
    },
    {
      prop: 'totalCarRentDuration',
      label: 'Total Car Rent/Duration',
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'resourceCount',
      label: 'Resource Count',
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 120
    }
  ],
  data: [] as any
});

const manpowersResponse: any = _manpowersRes.formattedData;

if (project?.projectManpowerResources?.length) {
  manpowers.value.data =
    project?.projectManpowerResources?.map((manpower: any) => ({
      ...manpower,
      name: manpowersResponse?.find((item: any) => item.id === manpower?.manpowerId)?.name || '-',
      mission: manpower?.mission?.join(', ')
    })) || [];
  manPowertotal.value.data = [
    {
      totalCost: project?.manpowerTotalCost,
      finalManpowerTableTotalCost: project?.finalManpowerTotalCost
    }
  ];
  manPowerPreview.value.data = [
    {
      totalCarRent: project?.totalCarRent,
      totalCarRentDuration: project?.totalCarRentPerDuration,
      resourceCount: manpowers.value.data?.length || 0
    }
  ];
}

// materials table
const materials = ref({
  columns: [
    { prop: 'description', label: t('operations.projects.materials.table.description'), component: 'Text', type: 'font-default', width: 400 },
    { prop: 'quantity', label: t('operations.projects.materials.table.quantity'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'unitPrice', label: t('operations.projects.materials.table.unitPrice'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'additionalMaterial', label: t('operations.projects.materials.table.category'), component: 'Text', type: 'font-default', width: 250 },
    {
      prop: 'additionalMaterialCost',
      label: t('operations.projects.materials.table.additionalCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'marginCommission',
      label: t('operations.projects.materials.table.marginCommission'),
      component: 'Text',
      type: 'font-default',
      width: 180
    },
    { prop: 'service', label: t('operations.projects.materials.table.service'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'servicePrice', label: t('operations.projects.materials.table.servicePrice'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'materialCost', label: t('operations.projects.materials.table.materialCost'), component: 'Text', type: 'font-default', width: 200 },
    {
      prop: 'totalMaterialCost',
      label: t('operations.projects.materials.table.totalMaterialCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    }
  ],
  data: [] as any[]
});

const materialsPreview = ref({
  columns: [
    {
      prop: 'totalMaterialCost',
      label: t('operations.projects.materials.table.totalMaterialCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    }
  ],
  data: [] as any[]
});

const serviceResponse: any = _serviceRes?.formattedData || [];

const addMaterials: any = _addMaterialsRes?.formattedData || [];

function materialMappedData() {
  if (!project?.materials?.length) return [];
  return project?.materials.map((material: any) => {
    // const additionalMaterials = project?.additionalMaterialItem[material.additionalMaterialId || 0] || [];
    const additionalMaterials =
      project?.additionalMaterialItem?.filter((item: any) => item.AdditionalMaterialItem.additionalMateria === material.additionalMaterialId) || [];

    console.log('material', material);
    const totalAdditionalMaterialCost = additionalMaterials.reduce((sum: number, item: any) => {
      return sum + item.quantity * Number(item.AdditionalMaterialItem?.price || 0);
    }, 0);

    const totalRelatedQuantity = project?.materials
      .filter((m: any) => m.additionalMaterialId === material.additionalMaterialId)
      .reduce((sum: number, item: any) => sum + item.quantity, 0);

    const additionalMaterialCost = totalRelatedQuantity > 0 ? totalAdditionalMaterialCost / totalRelatedQuantity : 0;
    const marginCommission = (material.unitPrice + additionalMaterialCost) * (project?.materialMargin.value || 1);
    const materialCost = material.unitPrice + additionalMaterialCost + marginCommission + (material.service?.price || 0);
    const totalMaterialCost = materialCost * material.quantity;

    return {
      projectId: project.id,
      materialId: material.id,
      additionalMaterialId: material.additionalMaterialId,
      additionalMaterial: material.additionalMaterialId ? addMaterials?.find((item: any) => item.id === material.additionalMaterialId)?.name : '-',
      description: material.description,
      quantity: material.quantity,
      unitPrice: material.unitPrice,
      additionalMaterialCost: +additionalMaterialCost.toFixed(2),
      marginCommission: +marginCommission.toFixed(2),
      materialCost: +materialCost.toFixed(2),
      totalMaterialCost: +totalMaterialCost.toFixed(2),
      service: material.serviceId ? serviceResponse?.find((s: any) => s.id === material.serviceId)?.type : '-',
      servicePrice: material.serviceId ? serviceResponse?.find((s: any) => s.id === material.serviceId)?.price : 0,
      id: material.id
    };
  });
}

if (project?.materials?.length) {
  materials.value.data = materialMappedData();
  materialsPreview.value.data = [
    {
      totalMaterialCost: materialMappedData()?.reduce((sum: number, item: any) => sum + item.totalMaterialCost, 0),
      totalAdditionalMaterialCost: materialMappedData()?.reduce((sum: number, item: any) => (sum += item.additionalMaterialCost), 0)
    }
  ];
}

// Assets table
const assets = reactive({
  columns: [
    { prop: 'name', label: t('operations.projects.assets.table.name'), component: 'Text', type: 'font-bold', width: 150 },
    { prop: 'rentPrice', label: t('operations.projects.assets.table.rentPrice'), component: 'Text', type: 'font-bold', width: 150 },
    { prop: 'buyPrice', label: t('operations.projects.assets.table.buyPrice'), component: 'Text', type: 'font-bold', width: 150 }
  ],
  data: [] as any[]
});

const assetsTotal = reactive({
  columns: [
    { prop: 'totalRentPrice', label: t('operations.projects.assets.totalTable.totalRent'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'totalBuyPrice', label: t('operations.projects.assets.totalTable.totalBuy'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'totalAssetsCost', label: t('operations.projects.assets.totalTable.totalCost'), component: 'Text', type: 'font-default', width: 150 }
  ],
  data: [] as any[]
});

const assetsResponse: any = _assetsRes?.formattedData || [];

if (project?.projectAssets?.length) {
  const assetsId = project?.projectAssets?.map((projectAsset: any) => projectAsset.assetId);

  assets.data = assetsResponse?.filter(({ id }: Asset) => assetsId?.includes(id)) || [];
  // Calculate the total rent price by summing the rentPrice of each asset, ensuring the value is a number
  const totalRentPrice = assets.data?.reduce((acc: number, { rentPrice }: Asset) => acc + (Number(rentPrice) || 0), 0);

  // Calculate the total buy price by summing the buyPrice of each asset, ensuring the value is a number
  const totalBuyPrice = assets.data?.reduce((acc: number, { buyPrice }: Asset) => acc + (Number(buyPrice) || 0), 0);

  // Calculate the total assets cost by adding total rent price and buy price, ensuring the values are numbers
  const totalAssetsCost = (totalRentPrice || 0) + (totalBuyPrice || 0);
  assetsTotal.data = [
    {
      totalRentPrice,
      totalBuyPrice,
      totalAssetsCost
    }
  ];
}

const finalCost = ref({
  columns: [
    { prop: 'finalManpowerTableTotalCost', label: t('operations.projects.manpower.title'), component: 'Text', type: 'font-default', width: 270 },
    { prop: 'finalMaterialsTableCost', label: t('operations.projects.materials.title'), component: 'Text', type: 'font-default', width: 250 },
    { prop: 'finalAssetsTableCost', label: t('operations.projects.assets.title'), component: 'Text', type: 'font-default', width: 250 }
  ],
  data: [] as any[]
});

finalCost.value.data = [
  {
    finalManpowerTableTotalCost: project?.finalManpowerTotalCost?.toFixed(2),
    finalMaterialsTableCost: project?.totalMaterialCost?.toFixed(2),
    finalAssetsTableCost: project?.totalAssetsCost?.toFixed(2),
    grandTotal: project?.grandTotal?.toFixed(2),
    vat: project?.vat?.toFixed(2)
  }
];
</script>
<style scoped lang="scss">
.activity {
  position: relative;
  ::before {
    content: '';
    height: 100%;
    width: 1px;
    position: absolute;
    left: 24px;
    top: 2%;
    border: 1px dashed #e7e6e9;
    z-index: -1;
  }
  > div:last-of-type {
    background: #f8f7fa !important;
  }
}
</style>
