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
          el-dropdown-item
            NuxtLink.flex.items-center(:to="`/sales/leads/${lead?.id}/journey`")
              Icon.text-md.mr-2(size="20" name="ph:path-bold")
              p.text-sm {{ $t('journey.title') }}

  el-tabs.demo-tabs(v-model="activeName")
    el-tab-pane(:label="$t('leads.summary')" name="summary")
      .flex.align-center.gap-6.mt-3(class="flex-col xl:flex-row")
        .flex-1.glass-card.p-10.rounded-3xl
          .flex.align-center.gap-3(class="flex-col md:flex-row")
            div
              h4.text-2xl.font-semibold.mb-2.flex.items-center.gap-x-3(style="color: var(--text-primary)") {{ lead?.name }} #[span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(lead?.status)}`") {{ formatSnakeCase(lead?.status) }}]
              p(style="color: var(--text-secondary)") {{ lead?.companyName }}
            .flex.flex-col.items-center.justify-center.ml-auto
              el-progress(type="dashboard" :percentage="lead?.score || 0" :color="scoreColors" :width="80")
                template(#default="{ percentage }")
                  span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('leads.info.score') }}
                  br
                  span.text-xl.font-bold(style="color: var(--text-primary)") {{ percentage }}
          .mt-8
            p.font-semibold.mb-6.text-lg(style="color: var(--text-primary)") {{ $t('common.info') }}
            .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
              div(v-if="lead?.email")
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconEmail" size="20" class="mr-2")
                  p {{ $t('leads.info.email') }}
                p.mb-2(style="color: var(--text-primary)") {{ lead?.email }}
                el-button(type="primary" size="small" :loading="aiLoading" @click="generateAiEmail")
                  Icon.mr-1(name="ph:magic-wand" size="16")
                  | {{ $t('leads.aiCompose') }}
              div(v-if="lead?.phone")
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconPhone" size="20" class="mr-2")
                  p {{ $t('leads.info.phone') }}
                p.mb-2(style="color: var(--text-primary)") {{ lead?.phone }}
              div(v-if="lead?.users?.length")
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconAssign" size="20" class="mr-2")
                  p {{ $t('leads.info.assign') }}
                p.mb-2(style="color: var(--text-primary)") {{ lead?.users?.map((u) => u.name).join(', ') }}
              div
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconSource" size="20" class="mr-2")
                  p {{ $t('leads.info.leadSource') }}
                p.mb-2(style="color: var(--text-primary)") {{ formatSnakeCase(lead?.leadSource) }}
              div(v-if="lead?.otherSource")
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconSource" size="20" class="mr-2")
                  p {{ $t('leads.info.otherSource') }}
                p.mb-2(style="color: var(--text-primary)") {{ lead?.otherSource }}
              div
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconCalendar" size="20" class="mr-2")
                  p {{ $t('leads.info.created') }}
                p.mb-2(style="color: var(--text-primary)") {{ formatDate(lead?.createdAt) }}
              div
                .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
                  Icon(name="IconCalendar" size="20" class="mr-2")
                  p {{ $t('leads.info.lastContact') }}
                p.mb-2(style="color: var(--text-primary)") {{ formatDate(lead?.lastContactDate) }}
        .flex-1.glass-card.p-10.rounded-3xl(v-if="lead?.notes")
          .flex.items-center.gap-2.mb-4
            .flex.items-center.justify-center.w-10.h-10.rounded-full(style="background-color: rgba(120, 73, 255, 0.1)"): Icon(name="IconNote" size="24" style="color: var(--accent-color)")
            h4.text-lg.font-semibold(style="color: var(--text-primary)") {{ $t('leads.notes') }}
            el-button.ml-auto(type="info" size="small" plain @click="showSummarizer = true")
              Icon.mr-1(name="ph:article-bold" size="16")
              | {{ $t('leads.aiSummarize') }}
          p.leading-relaxed(style="color: var(--text-primary)") {{ lead?.notes }}

    el-tab-pane(:label="$t('leads.activity')" name="activity")
      .mt-6
        ActivityTimeline(:activities="activity?.docs")
      .flex.justify-center.items-center.w-full
        el-button(v-if="activity?.docs?.length > 0" :loading="loading" class="!rounded-2xl mb-2" type='primary' size="large" :disabled="activity?.pagination?.totalPages == activity?.pagination?.page" @click="getActivityPage(Number(activity?.pagination?.page)+1)") {{ $t('common.view') }} More

    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      RecordTimeline(:entityType="'lead'" :entityId="slug")
    el-tab-pane(:label="$t('common.comments')" name="comments")
      RecordComments(:entityType="'lead'" :entityId="slug")
    el-tab-pane(:label="$t('common.attachments')" name="attachments")
      RecordAttachments(:entityType="'lead'" :entityId="slug")

  AIEmailAssist(v-model="showAiDialog" :context="leadContext")
  AISummarizer(v-model="showSummarizer" :initialText="lead?.notes")

.loading-state.flex.items-center.justify-center.h-64(v-else)
  el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")
</template>

<script lang="ts" setup>
import { ElNotification } from 'element-plus';

definePageMeta({
  middleware: 'permissions'
});

interface ActivityResponse {
  docs: Record<string, unknown>[];
  pagination: {
    page: number | string;
    totalPages: number | string;
  };
}

const { hasPermission } = await usePermissions();
const activeName = ref('summary');
const route = useRoute();
const loading = ref(false);

// Sanitizing slug
const rawSlug = route.params.slug;
const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '') as string;

// Standard Nuxt 3 Data Fetching for SSR/Hydration
const { data: lead } = await useAsyncData(`lead-${slug}`, () => getLead(slug));
if (!lead.value || !lead.value.id) {
  await navigateTo('/sales/leads');
}
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
.loading-state {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
