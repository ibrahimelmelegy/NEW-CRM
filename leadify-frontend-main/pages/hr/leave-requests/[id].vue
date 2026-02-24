<template lang="pug">
DetailLayout(
  :title="leaveRequest?.user?.name || $t('hr.leave.title')"
  :breadcrumbs="[{ label: $t('navigation.hr'), to: '/hr/leave-requests' }, { label: $t('hr.leave.title'), to: '/hr/leave-requests' }, { label: leaveRequest?.user?.name || '' }]"
  :hasSidebar="true"
)
  template(#dropdown-actions)
    el-dropdown-item(v-if="leaveRequest?.status === 'PENDING'" @click="handleApprove")
      .flex.items-center
        Icon.text-md.mr-2(name="ph:check-circle-bold" size="20")
        p.text-sm {{ $t('hr.leave.approve') }}
    el-dropdown-item(v-if="leaveRequest?.status === 'PENDING'" @click="rejectPopup = true")
      .flex.items-center
        Icon.text-md.mr-2(name="ph:x-circle-bold" size="20")
        p.text-sm {{ $t('hr.leave.reject') }}
    el-dropdown-item(@click="deletePopup = true")
      .flex.items-center
        Icon.text-md.mr-2(name="IconDelete" size="20")
        p.text-sm {{ $t('common.delete') }}

  el-tabs(v-model="activeTab")
    el-tab-pane(:label="$t('common.summary')" name="summary")
      .glass-card.p-8.rounded-3xl.mt-3
        .flex.items-center.gap-3.mb-6
          Avatar(:src="leaveRequest?.user?.profilePicture || '/images/avatar.png'")
          div
            h3.text-xl.font-semibold(style="color: var(--text-primary)") {{ leaveRequest?.user?.name }}
            span.border.rounded-xl.text-xs.px-2(:class="`label-outline-${getStatusColor(leaveRequest?.status)}`") {{ leaveRequest?.status }}
        .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:calendar-bold" size="20" class="mr-2")
              p {{ $t('hr.leave.type') }}
            p(style="color: var(--text-primary)") {{ leaveRequest?.leaveType }}
          div
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="IconCalendar" size="20" class="mr-2")
              p {{ $t('hr.leave.period') || 'Period' }}
            p(style="color: var(--text-primary)") {{ leaveRequest?.startDate }} → {{ leaveRequest?.endDate }}
          div(v-if="leaveRequest?.reason")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:note-bold" size="20" class="mr-2")
              p {{ $t('hr.leave.reason') }}
            p(style="color: var(--text-primary)") {{ leaveRequest.reason }}
          div(v-if="leaveRequest?.rejectionReason")
            .font-medium.mb-2.flex.items-center(style="color: var(--text-muted)")
              Icon(name="ph:warning-bold" size="20" class="mr-2")
              p {{ $t('hr.leave.rejectionReason') || 'Rejection Reason' }}
            p.text-red-500 {{ leaveRequest.rejectionReason }}

    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      .mt-4
        RecordTimeline(entityType="leaveRequest" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.comments') || 'Comments'" name="comments")
      .mt-4
        RecordComments(entityType="leaveRequest" :entityId="route.params.id")

    el-tab-pane(:label="$t('common.attachments') || 'Attachments'" name="attachments")
      .mt-4
        RecordAttachments(entityType="leaveRequest" :entityId="route.params.id")

  template(#sidebar)
    .glass-card.p-5.rounded-2xl
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.info') || 'Quick Info' }}
      .space-y-3
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('hr.leave.status') }}
          span.text-sm.font-medium {{ leaveRequest?.status }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('hr.leave.type') }}
          span.text-sm(style="color: var(--text-primary)") {{ leaveRequest?.leaveType }}
        .flex.justify-between
          span.text-sm(style="color: var(--text-muted)") {{ $t('common.days') }}
          span.text-sm.font-bold(style="color: var(--text-primary)") {{ dayCount }}

    .glass-card.p-5.rounded-2xl(v-if="leaveRequest?.status === 'PENDING'")
      h4.font-semibold.mb-4(style="color: var(--text-primary)") {{ $t('common.actions') }}
      .space-y-2
        el-button(type="success" class="w-full !rounded-xl" size="large" @click="handleApprove") {{ $t('hr.leave.approve') }}
        el-button(type="danger" class="w-full !rounded-xl" size="large" @click="rejectPopup = true") {{ $t('hr.leave.reject') }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")

  el-dialog(v-model="rejectPopup" :title="$t('hr.leave.reject')" width="500px")
    el-form(label-position="top")
      el-form-item(:label="$t('hr.leave.rejectionReason') || 'Reason'")
        el-input(v-model="rejectReason" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="rejectPopup = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="rejecting" @click="confirmReject" class="!rounded-2xl") {{ $t('hr.leave.reject') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { fetchLeaveRequestById, approveLeave, rejectLeave, deleteLeaveRequest } from '~/composables/useHR';

definePageMeta({ middleware: 'permissions' });
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeTab = ref('summary');
const deletePopup = ref(false);
const rejectPopup = ref(false);
const deleting = ref(false);
const rejecting = ref(false);
const rejectReason = ref('');

const leaveRequest = ref(await fetchLeaveRequestById(route.params.id as string));

const dayCount = computed(() => {
  if (!leaveRequest.value?.startDate || !leaveRequest.value?.endDate) return 0;
  const start = new Date(leaveRequest.value.startDate);
  const end = new Date(leaveRequest.value.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
});

async function handleApprove() {
  const res = await approveLeave(Number(route.params.id));
  if (res.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.approved') || 'Approved' });
    leaveRequest.value = await fetchLeaveRequestById(route.params.id as string);
  }
}

async function confirmReject() {
  rejecting.value = true;
  try {
    const res = await rejectLeave(Number(route.params.id), rejectReason.value);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.leave.rejected') || 'Rejected' });
      rejectPopup.value = false;
      leaveRequest.value = await fetchLeaveRequestById(route.params.id as string);
    }
  } finally {
    rejecting.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    const res = await deleteLeaveRequest(Number(route.params.id));
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      router.push('/hr/leave-requests');
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}
</script>
