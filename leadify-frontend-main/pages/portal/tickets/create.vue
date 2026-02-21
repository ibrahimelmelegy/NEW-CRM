<template lang="pug">
.portal-create-ticket
  .flex.items-center.gap-3.mb-6
    el-button(text @click="navigateTo('/portal/tickets')" class="!rounded-xl")
      Icon(name="ph:arrow-left-bold" size="16" aria-label="Back")
    div
      h2.text-2xl.font-bold.mb-1(style="color: var(--text-primary)") {{ $t('portal.tickets.createTitle') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('portal.tickets.createSubtitle') }}

  .glass-card.p-6(style="max-width: 700px")
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submitTicket")
      el-form-item(:label="$t('portal.tickets.subject')" prop="subject")
        el-input(v-model="form.subject" :placeholder="$t('portal.tickets.subjectPlaceholder')" size="large")

      el-form-item(:label="$t('portal.tickets.priority')" prop="priority")
        el-select(v-model="form.priority" size="large" class="w-full")
          el-option(value="LOW" :label="$t('portal.tickets.low')")
          el-option(value="MEDIUM" :label="$t('portal.tickets.medium')")
          el-option(value="HIGH" :label="$t('portal.tickets.high')")
          el-option(value="URGENT" :label="$t('portal.tickets.urgent')")

      el-form-item(:label="$t('portal.tickets.description')" prop="description")
        el-input(
          v-model="form.description"
          type="textarea"
          :rows="6"
          :placeholder="$t('portal.tickets.descriptionPlaceholder')"
        )

      .flex.justify-end.gap-3
        el-button(@click="navigateTo('/portal/tickets')" class="!rounded-xl") {{ $t('common.cancel') }}
        el-button(
          type="primary"
          native-type="submit"
          :loading="submitting"
          class="!bg-[#7849ff] hover:!bg-[#6a3ae0] !border-none !rounded-xl"
        ) {{ $t('portal.tickets.submit') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';

definePageMeta({ layout: 'portal' });

const { portalFetch, init, isAuthenticated } = usePortalAuth();
const { t } = useI18n();

const formRef = ref();
const submitting = ref(false);

const form = reactive({
  subject: '',
  description: '',
  priority: 'MEDIUM'
});

const rules = {
  subject: [{ required: true, message: () => t('portal.tickets.subjectRequired'), trigger: 'blur' }],
  description: [{ required: true, message: () => t('portal.tickets.descriptionRequired'), trigger: 'blur' }]
};

onMounted(() => {
  init();
  if (!isAuthenticated()) {
    navigateTo('/portal/login');
  }
});

async function submitTicket() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const res = await portalFetch('tickets', 'POST', form);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('portal.tickets.created') });
      navigateTo('/portal/tickets');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message || 'Failed' });
    }
  } finally {
    submitting.value = false;
  }
}
</script>
