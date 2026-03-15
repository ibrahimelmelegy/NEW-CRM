<template lang="pug">
.notifications-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('notificationPreferences.title') }}
    p(style="color: var(--text-muted)") {{ $t('notificationPreferences.subtitle') }}

  .max-w-4xl
    //- Loading State
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    template(v-else)
      //- Category Groups
      .glass-card.p-6.mb-6(v-for="group in notificationGroups" :key="group.key")
        .flex.items-center.gap-4.mb-6
          .icon-box(:style="{ background: group.color + '1a' }")
            Icon(:name="group.icon" size="28" :style="{ color: group.color }")
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('notificationPreferences.categories.' + group.key) }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('notificationPreferences.categoryDescriptions.' + group.key) }}

        //- Channel Headers
        .grid.items-center.gap-4.mb-4(style="grid-template-columns: 1fr 80px 80px 80px")
          .text-xs.font-semibold.uppercase(style="color: var(--text-muted)") {{ $t('notificationPreferences.notificationType') }}
          .text-xs.font-semibold.uppercase.text-center(style="color: var(--text-muted)") {{ $t('notificationPreferences.channels.inApp') }}
          .text-xs.font-semibold.uppercase.text-center(style="color: var(--text-muted)") {{ $t('notificationPreferences.channels.email') }}
          .text-xs.font-semibold.uppercase.text-center(style="color: var(--text-muted)") {{ $t('notificationPreferences.channels.push') }}

        //- Notification Types
        .grid.items-center.gap-4.py-3(
          v-for="type in group.types"
          :key="type.key"
          style="grid-template-columns: 1fr 80px 80px 80px; border-top: 1px solid var(--border-glass, rgba(255,255,255,0.08))"
        )
          .text-sm(style="color: var(--text-primary)") {{ $t('notificationPreferences.types.' + type.key) }}
          .flex.justify-center
            el-switch(
              v-model="preferences[type.key + '_inApp']"
              :active-color="group.color"
              @change="debouncedSave"
            )
          .flex.justify-center
            el-switch(
              v-model="preferences[type.key + '_email']"
              :active-color="group.color"
              @change="debouncedSave"
            )
          .flex.justify-center
            el-switch(
              v-model="preferences[type.key + '_push']"
              :active-color="group.color"
              @change="debouncedSave"
            )

      //- Save Status
      Transition(name="fade")
        .flex.items-center.gap-2.mt-4(v-if="saveStatus")
          Icon(:name="saveStatus === 'saved' ? 'ph:check-circle-bold' : 'ph:warning-circle-bold'" size="16" :style="{ color: saveStatus === 'saved' ? '#22c55e' : '#ef4444' }")
          span.text-sm(:style="{ color: saveStatus === 'saved' ? '#22c55e' : '#ef4444' }") {{ saveStatus === 'saved' ? $t('notificationPreferences.saved') : $t('notificationPreferences.saveFailed') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

definePageMeta({
  title: 'Notification Preferences'
});

const loading = ref(true);
const saveStatus = ref<'saved' | 'error' | ''>('');
let saveTimeout: ReturnType<typeof setTimeout>;
let statusTimeout: ReturnType<typeof setTimeout>;

const notificationGroups = [
  {
    key: 'sales',
    icon: 'ph:chart-line-up-bold',
    color: '#7849ff',
    types: [{ key: 'lead_assigned' }, { key: 'lead_converted' }, { key: 'deal_stage_changed' }, { key: 'deal_won' }, { key: 'deal_lost' }]
  },
  {
    key: 'operations',
    icon: 'ph:gear-six-bold',
    color: '#3b82f6',
    types: [{ key: 'task_assigned' }, { key: 'task_due_soon' }, { key: 'task_overdue' }, { key: 'project_updated' }, { key: 'daily_task_reminder' }]
  },
  {
    key: 'approvals',
    icon: 'ph:stamp-bold',
    color: '#f59e0b',
    types: [{ key: 'approval_requested' }, { key: 'approval_approved' }, { key: 'approval_rejected' }, { key: 'invoice_created' }]
  },
  {
    key: 'system',
    icon: 'ph:bell-bold',
    color: '#22c55e',
    types: [{ key: 'mention' }, { key: 'comment_added' }, { key: 'sla_breach' }, { key: 'system_announcement' }]
  }
];

// Build reactive preferences object
const allTypeKeys: string[] = [];
for (const group of notificationGroups) {
  for (const type of group.types) {
    allTypeKeys.push(type.key);
  }
}

const preferences = reactive<Record<string, boolean>>({});
for (const key of allTypeKeys) {
  preferences[key + '_inApp'] = true;
  preferences[key + '_email'] = true;
  preferences[key + '_push'] = false;
}

onMounted(async () => {
  try {
    const response = await useApiFetch('notification/preferences');
    if (response?.success && response?.body) {
      const prefs = response.body as Record<string, unknown>;
      // Map backend prefs to our reactive object
      for (const key of allTypeKeys) {
        if (prefs[key + '_inApp'] !== undefined) preferences[key + '_inApp'] = !!prefs[key + '_inApp'];
        if (prefs[key + '_email'] !== undefined) preferences[key + '_email'] = !!prefs[key + '_email'];
        if (prefs[key + '_push'] !== undefined) preferences[key + '_push'] = !!prefs[key + '_push'];
      }
      // Also handle nested format: { lead_assigned: { inApp: true, email: false, push: false } }
      for (const key of allTypeKeys) {
        if (prefs[key] && typeof prefs[key] === 'object') {
          if (prefs[key].inApp !== undefined) preferences[key + '_inApp'] = !!prefs[key].inApp;
          if (prefs[key].email !== undefined) preferences[key + '_email'] = !!prefs[key].email;
          if (prefs[key].push !== undefined) preferences[key + '_push'] = !!prefs[key].push;
        }
      }
    }
  } catch (e) {
    logger.error('Failed to load notification preferences', e);
  } finally {
    loading.value = false;
  }
});

async function savePreferences() {
  try {
    // Convert flat preferences back to nested format for backend
    const payload: Record<string, unknown> = {};
    for (const key of allTypeKeys) {
      payload[key] = {
        inApp: preferences[key + '_inApp'],
        email: preferences[key + '_email'],
        push: preferences[key + '_push']
      };
    }
    const response = await useApiFetch('notification/preferences', 'PUT', payload);
    saveStatus.value = response?.success ? 'saved' : 'error';
  } catch {
    saveStatus.value = 'error';
  }
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    saveStatus.value = '';
  }, 3000);
}

function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(savePreferences, 800);
}
</script>

<style lang="scss" scoped>
.notifications-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
