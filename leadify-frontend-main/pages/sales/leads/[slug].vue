<template lang="pug">
.lead-view(v-if="lead")
  .flex.items-center.justify-between.mb-5.mt-5
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('leads.details') }}
    el-dropdown(trigger="click")
      span.el-dropdown-link
        button.rounded-btn(class="!px-4"): Icon(name="IconToggle" size="24")
      template(#dropdown)
        el-dropdown-menu
          el-dropdown-item(v-if="hasPermission('EDIT_LEADS')")
            NuxtLink.flex.items-center(:to="`/sales/leads/edit/${lead?.id}`")
              Icon.text-md.mr-2(size="20" name="IconEdit")
              p.text-sm {{ $t('leads.edit') }}
          el-dropdown-item
            NuxtLink.flex.items-center(:to="`/sales/opportunity/add-opportunity?leadId=${lead?.id}`")
              Icon.text-md.mr-2(size="20" name="IconOpportunity")
              p.text-sm {{ $t('leads.convertToOpp') }}
          el-dropdown-item
            NuxtLink.flex.items-center(:to="`/sales/deals/add-deal?leadId=${lead?.id}`")
              Icon.text-md.mr-2(size="20" name="IconDeal")
              p.text-sm {{ $t('leads.convertToDeal') }}

  el-tabs.demo-tabs(v-model="activeName")
    el-tab-pane(:label="$t('leads.summary')" name="summary")
      .flex.align-center.gap-6.mt-3(class="flex-col xl:flex-row")
        .flex-1.glass-card.p-10.rounded-3xl
          .flex.align-center.gap-3(class="flex-col md:flex-row")
            div
              h4.text-2xl.font-semibold.mb-2.text-neutral-900.flex.items-center.gap-x-3 {{ lead?.name }} #[span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(lead?.status)}`") {{ formatSnakeCase(lead?.status) }}]
              p.text-neutral-600 {{ lead?.companyName }}
            .flex.flex-col.items-center.justify-center.ml-auto
              el-progress(type="dashboard" :percentage="lead?.score || 0" :color="scoreColors" :width="80")
                template(#default="{ percentage }")
                  span.text-xs.font-medium.text-neutral-500 {{ $t('leads.info.score') }}
                  br
                  span.text-xl.font-bold {{ percentage }}
          .mt-8
            p.text-neutral-900.font-semibold.mb-6.text-lg {{ $t('common.info') }}
            .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
              div(v-if="lead?.email")
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconEmail" size="20" class="mr-2")
                  p {{ $t('leads.info.email') }}
                p.text-neutral-800.mb-2 {{ lead?.email }}
                el-button(type="primary" size="small" :loading="aiLoading" @click="generateAiEmail") 
                  Icon.mr-1(name="ph:magic-wand" size="16")
                  | {{ $t('leads.aiCompose') }}
              div(v-if="lead?.phone")
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconPhone" size="20" class="mr-2")
                  p {{ $t('leads.info.phone') }}
                p.text-neutral-800.mb-2 {{ lead?.phone }}
              div(v-if="lead?.users?.length")
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconAssign" size="20" class="mr-2")
                  p {{ $t('leads.info.assign') }}
                p.text-neutral-800.mb-2 {{ lead?.users?.map((u: any) => u.name).join(', ') }}
              div
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconSource" size="20" class="mr-2")
                  p {{ $t('leads.info.leadSource') }}
                p.text-neutral-800.mb-2 {{ formatSnakeCase(lead?.leadSource) }}
              div(v-if="lead?.otherSource")
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconSource" size="20" class="mr-2")
                  p {{ $t('leads.info.otherSource') }}
                p.text-neutral-800.mb-2 {{ lead?.otherSource }}
              div
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconCalendar" size="20" class="mr-2")
                  p {{ $t('leads.info.created') }}
                p.text-neutral-800.mb-2 {{ formatDate(lead?.createdAt) }}
              div
                .text-neutral-400.font-medium.mb-2.flex.items-center
                  Icon(name="IconCalendar" size="20" class="mr-2")
                  p {{ $t('leads.info.lastContact') }}
                p.text-neutral-800.mb-2 {{ formatDate(lead?.lastContactDate) }}
        .flex-1.glass-card.p-10.rounded-3xl(v-if="lead?.notes")
          .flex.items-center.gap-2.mb-4
            .flex.items-center.justify-center.w-10.h-10.rounded-full.bg-secondary-turquoise-50: Icon.text-secondary-turquoise-700(name="IconNote" size="24")
            h4.text-lg.font-semibold.text-neutral-900 {{ $t('leads.notes') }}
            el-button.ml-auto(type="info" size="small" plain @click="showSummarizer = true")
              Icon.mr-1(name="ph:article-bold" size="16")
              | {{ $t('leads.aiSummarize') }}
          p.text-neutral-800.leading-relaxed {{ lead?.notes }}

    el-tab-pane(:label="$t('leads.activity')" name="activity")
      .mt-6.activity
        .flex.items-start.gap-x-6.mb-7(v-for="item in activity?.docs" :key="item.id" class="w-full lg:w-6/12")
          .flex.items-center.justify-center.w-12.h-12.rounded-full(class="!min-w-[48px] !min-h-[48px]" :class="handleTypeStyle(item.status)"): Icon(:name="handleIconName(item.status)" size="24")
          .mt-2
              //- Improved translation logic for activity types
              h4.text-neutral-800.font-semibold.text-sm.mb-1 {{ item?.status === 'assigned' ? $t('leads.info.assign') : item?.status === 'create' ? $t('leads.createTitle') : item?.status?.toString()?.toUpperCase() }}
              p.text-neutral-500.text-xs.mb-4.font-medium {{ formatDate(item?.createdAt) }}
              .glass-card.p-5.rounded-3xl(class="w-[65vw]")
                p.text-neutral-700.text-xs {{ item?.descripion?.toString()?.toUpperCase() }}
                .flex.items-center.gap-3.mt-4
                  Avatar(:src="item?.user?.profilePicture ?? '/images/avatar.png'" small)
                  p.text-neutral-800.text-xs.font-medium {{ item?.user?.name }}
      el-empty(v-if="!activity?.docs?.length" :description="$t('common.noData')" image="/images/empty.png")
      .flex.justify-center.items-center.w-full
        el-button(v-if="activity?.docs?.length > 0" :loading="loading" class="!rounded-2xl mb-2" type='primary' size="large" :disabled="activity?.pagination?.totalPages == activity?.pagination?.page" @click="getActivityPage(Number(activity?.pagination?.page)+1)") {{ $t('common.view') }} More

  AIEmailAssist(v-model="showAiDialog" :context="leadContext")
  AISummarizer(v-model="showSummarizer" :initialText="lead?.notes")

.loading-state.flex.items-center.justify-center.h-64(v-else)
  el-spinner(size="large")
</template>


<script lang="ts" setup>
import { ElNotification } from 'element-plus';

definePageMeta({
  middleware: 'permissions'
});

interface ActivityResponse {
  docs: any[];
  pagination: {
    page: number | string;
    totalPages: number | string;
  };
}

const { hasPermission } = await usePermissions();
const activeName = ref("summary");
const route = useRoute();
const loading = ref(false);

const handleTypeStyle = (type: string): string => {
  const styles: Record<string, string> = {
    assigned: "bg-primary-purple-50 text-primary-purple-500",
    update: "bg-secondary-turquoise-50 text-secondary-turquoise-700",
    restored: "bg-semantic-warning-background text-semantic-warning-foreground",
    create: "bg-primary-purple-50 text-primary-purple-500",
    delete: "bg-semantic-error-background text-semantic-error-foreground",
    archived: "bg-neutral-100 text-neutral-500",
    import: "bg-secondary-blue-100 text-secondary-blue-600",
    export: "bg-secondary-turquoise-100 text-secondary-turquoise-900",
  };
  return styles[type] || "";
};

const handleIconName = (type: string): string => {
  const icons: Record<string, string> = {
    assigned: "IconAssign",
    update: "IconEdit",
    restored: "IconRestore",
    create: "IconNewLead",
    delete: "IconDelete",
    archived: "IconArchived",
    import: "IconImport",
    export: "IconExport",
  };
  return icons[type] || "";
};

// Sanitizing slug
const rawSlug = route.params.slug;
const slug = (Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || "")) as string;

// Standard Nuxt 3 Data Fetching for SSR/Hydration
const { data: lead } = await useAsyncData(`lead-${slug}`, () => getLead(slug));
const { data: activity } = await useAsyncData(`activity-${slug}`, () => getActivity(slug + `?limit=10&page=1`));

const getActivityPage = async (page: number) => {
  try {
    loading.value = true;
    const res = await getActivity(slug + `?limit=10&page=${page}`);
    if (activity.value && res) {
      activity.value = { 
        docs: [...activity.value.docs, ...res.docs], 
        pagination: res.pagination 
      };
    }
  } finally {
    loading.value = false;
  }
};

const scoreColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
];

const aiLoading = ref(false);
const showAiDialog = ref(false);
const showSummarizer = ref(false);

const generateAiEmail = () => {
  showAiDialog.value = true;
};

const leadContext = computed(() => ({
  name: lead.value?.name,
  company: lead.value?.companyName,
  status: lead.value?.status
}));
</script>


<style scoped lang="scss">
.activity {
  position: relative;
  &::before {
    content: "";
    height: 90%;
    width: 1px;
    position: absolute;
    left: 24px;
    top: 2%;
    border: 1px dashed #e7e6e9;
    z-index: -1;
  }
}

.loading-state {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
