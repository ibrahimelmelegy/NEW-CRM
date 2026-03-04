<template lang="pug">
.active-sessions
  .flex.items-center.justify-between.mb-6
    h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.activeSessions') }}
    el-button(
      type="danger"
      plain
      size="default"
      @click="handleTerminateAll"
      :loading="terminatingAll"
      :disabled="otherSessionsCount === 0"
      class="!rounded-xl"
    )
      Icon(name="ph:sign-out-bold" size="16")
      span.ml-1 {{ $t('security.terminateAllOther') }}

  div(v-loading="loading")
    .text-center.py-8(v-if="!loading && sessions.length === 0")
      Icon(name="ph:devices-bold" size="48" style="color: var(--text-muted)")
      p.mt-2(style="color: var(--text-muted)") {{ $t('security.noActiveSessions') }}

    .space-y-3(v-else)
      .session-card.glass-card.p-4(
        v-for="session in sessions"
        :key="session.id"
        :class="{ 'current-session': session.isCurrent }"
      )
        .flex.items-center.justify-between
          .flex.items-center.gap-4
            .icon-box(:style="session.isCurrent ? 'background: rgba(34, 197, 94, 0.1)' : 'background: rgba(120, 73, 255, 0.1)'")
              Icon(
                :name="session.isCurrent ? 'ph:device-mobile-bold' : 'ph:desktop-bold'"
                size="24"
                :class="session.isCurrent ? 'text-green-500' : 'text-[#7849ff]'"
              )
            div
              .flex.items-center.gap-2
                span.font-semibold(style="color: var(--text-primary)") {{ $t('security.session') + ' #' + session.id }}
                el-tag(
                  v-if="session.isCurrent"
                  type="success"
                  effect="dark"
                  size="small"
                  round
                ) {{ $t('security.currentSession') }}
              .text-xs.mt-1(style="color: var(--text-muted)") {{ $t('security.expiresAt') }}: {{ formatDate(session.expiresAt) }}
          el-button(
            v-if="!session.isCurrent"
            type="danger"
            plain
            size="small"
            @click="handleTerminate(session.id)"
            :loading="terminatingId === session.id"
            class="!rounded-xl"
          )
            Icon(name="ph:x-bold" size="14")
            span.ml-1 {{ $t('security.terminate') }}
</template>

<script setup lang="ts">
import { useSecurity, type SessionInfo } from '~/composables/useSecurity';

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const { sessions, loading, fetchSessions, terminateSession, terminateAllSessions } = useSecurity();

const terminatingId = ref<number | null>(null);
const terminatingAll = ref(false);

const otherSessionsCount = computed(() => sessions.value.filter(s => !s.isCurrent).length);

onMounted(async () => {
  await fetchSessions();
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

async function handleTerminate(sessionId: number) {
  terminatingId.value = sessionId;
  const success = await terminateSession(sessionId);
  terminatingId.value = null;
  if (success) {
    ElMessage.success(t('security.sessionTerminated'));
  } else {
    ElMessage.error(t('security.sessionTerminateFailed'));
  }
}

async function handleTerminateAll() {
  try {
    await ElMessageBox.confirm(t('security.terminateAllConfirmMessage'), t('security.terminateAllConfirmTitle'), {
      confirmButtonText: t('security.terminateAllConfirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    terminatingAll.value = true;
    const success = await terminateAllSessions();
    terminatingAll.value = false;
    if (success) {
      ElMessage.success(t('security.allSessionsTerminated'));
    } else {
      ElMessage.error(t('security.terminateAllFailed'));
    }
  } catch {
    // User cancelled
  }
}
</script>

<style lang="scss" scoped>
.icon-box {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.session-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.current-session {
  border: 1px solid rgba(34, 197, 94, 0.3) !important;
}
</style>
