<template lang="pug">
div
  ModuleHeader(
    :title="$t('calendarSync.title')"
    :subtitle="$t('calendarSync.subtitle')"
  )
    template(#actions)
      el-button(
        size="large"
        type="primary"
        :loading="syncing"
        @click="syncAll"
        class="!rounded-2xl"
        :disabled="!hasConnectedProvider"
      )
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('calendarSync.syncNow') }}

  //- Status notification from OAuth redirect
  el-alert(
    v-if="routeStatus"
    :type="routeStatus === 'connected' ? 'success' : 'error'"
    :title="routeStatus === 'connected' ? $t('calendarSync.connectionSuccess') : $t('calendarSync.connectionFailed')"
    :description="routeMessage"
    show-icon
    closable
    class="mb-6"
    @close="clearRouteStatus"
  )

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Provider Cards
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")

      //- Google Calendar Card
      .glass-card.rounded-xl.overflow-hidden.animate-entrance
        .p-6
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: #f1f3f4")
                Icon(name="logos:google-calendar" size="28")
              div
                .text-lg.font-bold(style="color: var(--text-primary)") Google Calendar
                .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.googleDescription') }}
            //- Status badge
            el-tag(
              :type="googleStatus.connected ? 'success' : 'info'"
              effect="dark"
              size="small"
              round
            )
              .flex.items-center.gap-1
                .rounded-full(class="w-1.5 h-1.5" :class="googleStatus.connected ? 'bg-white' : 'bg-gray-300'")
                span {{ googleStatus.connected ? $t('calendarSync.connected') : $t('calendarSync.disconnected') }}

          //- Connected State
          template(v-if="googleStatus.connected")
            .space-y-3.mb-4
              //- Email
              .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input)")
                .flex.items-center.gap-2
                  Icon(name="ph:envelope-bold" size="16" style="color: var(--text-muted)")
                  .text-sm(style="color: var(--text-primary)") {{ googleStatus.email }}
                el-tag(effect="plain" size="small" type="success") {{ $t('calendarSync.verified') }}

              //- Sync Stats
              .grid.grid-cols-2.gap-3
                .p-3.rounded-lg.text-center(style="background: var(--bg-input)")
                  .text-lg.font-bold(style="color: #4285F4") {{ googleStatus.syncedEventsCount }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.syncedEvents') }}
                .p-3.rounded-lg.text-center(style="background: var(--bg-input)")
                  .text-sm.font-medium(style="color: var(--text-primary)") {{ formatLastSync(googleStatus.lastSyncAt) }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.lastSync') }}

              //- Auto-sync toggle
              .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input)")
                .flex.items-center.gap-2
                  Icon(name="ph:arrows-clockwise-bold" size="16" style="color: var(--text-muted)")
                  .text-sm(style="color: var(--text-primary)") {{ $t('calendarSync.autoSync') }}
                el-switch(
                  v-model="googleAutoSync"
                  @change="(val: boolean) => handleAutoSync('google', val)"
                )

              //- Error display
              .flex.items-start.gap-2.p-3.rounded-lg(
                v-if="googleStatus.lastError"
                style="background: rgba(239, 68, 68, 0.1)"
              )
                Icon(name="ph:warning-bold" size="16" style="color: #ef4444" class="shrink-0 mt-0.5")
                .text-xs(style="color: #ef4444") {{ googleStatus.lastError }}

            //- Actions
            .flex.gap-2
              el-button(
                type="primary"
                :loading="syncingGoogle"
                @click="syncProvider('google')"
                class="!rounded-2xl flex-1"
              )
                Icon(name="ph:arrows-clockwise-bold" size="14")
                span.ml-1 {{ $t('calendarSync.syncNow') }}
              el-popconfirm(
                :title="$t('calendarSync.disconnectConfirm')"
                @confirm="handleDisconnect('google')"
              )
                template(#reference)
                  el-button(type="danger" class="!rounded-2xl")
                    Icon(name="ph:plug-bold" size="14")
                    span.ml-1 {{ $t('calendarSync.disconnect') }}

          //- Disconnected State
          template(v-else)
            .py-6.text-center
              Icon(name="ph:cloud-arrow-down-bold" size="48" class="mx-auto mb-3" style="color: var(--text-muted); opacity: 0.4")
              .text-sm.mb-4(style="color: var(--text-muted)") {{ $t('calendarSync.connectGoogleDesc') }}
              el-button(
                type="primary"
                size="large"
                :loading="connectingGoogle"
                @click="connectGoogle"
                class="!rounded-2xl"
              )
                Icon(name="logos:google-calendar" size="18")
                span.ml-2 {{ $t('calendarSync.connectGoogle') }}

      //- Outlook Calendar Card
      .glass-card.rounded-xl.overflow-hidden.animate-entrance
        .p-6
          .flex.items-start.justify-between.mb-4
            .flex.items-center.gap-3
              .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: #f3f2f1")
                Icon(name="logos:microsoft-icon" size="28")
              div
                .text-lg.font-bold(style="color: var(--text-primary)") Outlook Calendar
                .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.outlookDescription') }}
            el-tag(
              :type="outlookStatus.connected ? 'success' : 'info'"
              effect="dark"
              size="small"
              round
            )
              .flex.items-center.gap-1
                .rounded-full(class="w-1.5 h-1.5" :class="outlookStatus.connected ? 'bg-white' : 'bg-gray-300'")
                span {{ outlookStatus.connected ? $t('calendarSync.connected') : $t('calendarSync.disconnected') }}

          //- Connected State
          template(v-if="outlookStatus.connected")
            .space-y-3.mb-4
              .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input)")
                .flex.items-center.gap-2
                  Icon(name="ph:envelope-bold" size="16" style="color: var(--text-muted)")
                  .text-sm(style="color: var(--text-primary)") {{ outlookStatus.email }}
                el-tag(effect="plain" size="small" type="success") {{ $t('calendarSync.verified') }}

              .grid.grid-cols-2.gap-3
                .p-3.rounded-lg.text-center(style="background: var(--bg-input)")
                  .text-lg.font-bold(style="color: #0078D4") {{ outlookStatus.syncedEventsCount }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.syncedEvents') }}
                .p-3.rounded-lg.text-center(style="background: var(--bg-input)")
                  .text-sm.font-medium(style="color: var(--text-primary)") {{ formatLastSync(outlookStatus.lastSyncAt) }}
                  .text-xs(style="color: var(--text-muted)") {{ $t('calendarSync.lastSync') }}

              .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input)")
                .flex.items-center.gap-2
                  Icon(name="ph:arrows-clockwise-bold" size="16" style="color: var(--text-muted)")
                  .text-sm(style="color: var(--text-primary)") {{ $t('calendarSync.autoSync') }}
                el-switch(
                  v-model="outlookAutoSync"
                  @change="(val: boolean) => handleAutoSync('outlook', val)"
                )

              .flex.items-start.gap-2.p-3.rounded-lg(
                v-if="outlookStatus.lastError"
                style="background: rgba(239, 68, 68, 0.1)"
              )
                Icon(name="ph:warning-bold" size="16" style="color: #ef4444" class="shrink-0 mt-0.5")
                .text-xs(style="color: #ef4444") {{ outlookStatus.lastError }}

            .flex.gap-2
              el-button(
                type="primary"
                :loading="syncingOutlook"
                @click="syncProvider('outlook')"
                class="!rounded-2xl flex-1"
              )
                Icon(name="ph:arrows-clockwise-bold" size="14")
                span.ml-1 {{ $t('calendarSync.syncNow') }}
              el-popconfirm(
                :title="$t('calendarSync.disconnectConfirm')"
                @confirm="handleDisconnect('outlook')"
              )
                template(#reference)
                  el-button(type="danger" class="!rounded-2xl")
                    Icon(name="ph:plug-bold" size="14")
                    span.ml-1 {{ $t('calendarSync.disconnect') }}

          //- Disconnected State
          template(v-else)
            .py-6.text-center
              Icon(name="ph:cloud-arrow-down-bold" size="48" class="mx-auto mb-3" style="color: var(--text-muted); opacity: 0.4")
              .text-sm.mb-4(style="color: var(--text-muted)") {{ $t('calendarSync.connectOutlookDesc') }}
              el-button(
                type="primary"
                size="large"
                :loading="connectingOutlook"
                @click="connectOutlook"
                class="!rounded-2xl"
              )
                Icon(name="logos:microsoft-icon" size="18")
                span.ml-2 {{ $t('calendarSync.connectOutlook') }}

    //- How It Works Section
    .glass-card.rounded-xl.p-6.mt-6.animate-entrance
      h3.text-sm.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('calendarSync.howItWorks') }}
      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        .flex.items-start.gap-3
          .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
            .text-sm.font-bold(style="color: #7849ff") 1
          div
            .text-sm.font-medium(style="color: var(--text-primary)") {{ $t('calendarSync.step1Title') }}
            .text-xs(class="mt-0.5" style="color: var(--text-muted)") {{ $t('calendarSync.step1Desc') }}
        .flex.items-start.gap-3
          .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
            .text-sm.font-bold(style="color: #7849ff") 2
          div
            .text-sm.font-medium(style="color: var(--text-primary)") {{ $t('calendarSync.step2Title') }}
            .text-xs(class="mt-0.5" style="color: var(--text-muted)") {{ $t('calendarSync.step2Desc') }}
        .flex.items-start.gap-3
          .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
            .text-sm.font-bold(style="color: #7849ff") 3
          div
            .text-sm.font-medium(style="color: var(--text-primary)") {{ $t('calendarSync.step3Title') }}
            .text-xs(class="mt-0.5" style="color: var(--text-muted)") {{ $t('calendarSync.step3Desc') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchSyncStatus,
  initiateGoogleAuth,
  initiateOutlookAuth,
  triggerSync,
  disconnectCalendarProvider,
  toggleCalendarAutoSync,
  formatSyncTime
} from '~/composables/useCalendar';
import type { CalendarSyncStatus } from '~/composables/useCalendar';

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();
const router = useRouter();

// ─── State ──────────────────────────────────────────────────────────────────
const loading = ref(true);
const syncing = ref(false);
const syncingGoogle = ref(false);
const syncingOutlook = ref(false);
const connectingGoogle = ref(false);
const connectingOutlook = ref(false);
const syncStatusData = ref<CalendarSyncStatus | null>(null);
const googleAutoSync = ref(false);
const outlookAutoSync = ref(false);

// Route-based status from OAuth callback redirect
const routeStatus = ref((route.query.status as string) || '');
const routeMessage = ref((route.query.message as string) || '');

const googleStatus = computed(
  () =>
    syncStatusData.value?.google || {
      connected: false,
      email: null,
      lastSyncAt: null,
      syncStatus: 'disconnected',
      autoSync: false,
      syncedEventsCount: 0,
      lastError: null
    }
);

const outlookStatus = computed(
  () =>
    syncStatusData.value?.outlook || {
      connected: false,
      email: null,
      lastSyncAt: null,
      syncStatus: 'disconnected',
      autoSync: false,
      syncedEventsCount: 0,
      lastError: null
    }
);

const hasConnectedProvider = computed(() => googleStatus.value.connected || outlookStatus.value.connected);

function formatLastSync(dateStr: string | null): string {
  return formatSyncTime(dateStr);
}

function clearRouteStatus() {
  routeStatus.value = '';
  routeMessage.value = '';
  // Remove query params from URL
  router.replace({ query: {} });
}

// ─── Connect Providers ──────────────────────────────────────────────────────
async function connectGoogle() {
  connectingGoogle.value = true;
  try {
    const result = await initiateGoogleAuth();
    if (result?.url) {
      if (result.mock) {
        // For mock mode, call the callback directly via API
        await handleMockConnect('google');
      } else {
        window.location.href = result.url;
      }
    }
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('calendarSync.connectionFailed') });
  } finally {
    connectingGoogle.value = false;
  }
}

async function connectOutlook() {
  connectingOutlook.value = true;
  try {
    const result = await initiateOutlookAuth();
    if (result?.url) {
      if (result.mock) {
        await handleMockConnect('outlook');
      } else {
        window.location.href = result.url;
      }
    }
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('calendarSync.connectionFailed') });
  } finally {
    connectingOutlook.value = false;
  }
}

async function handleMockConnect(provider: 'google' | 'outlook') {
  // In mock mode, trigger sync which will create mock connection
  try {
    await triggerSync(provider);
    ElNotification({ type: 'success', title: t('common.success'), message: t('calendarSync.connectionSuccess') });
    await loadSyncStatus();
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('calendarSync.connectionFailed') });
  }
}

// ─── Sync ───────────────────────────────────────────────────────────────────
async function syncProvider(provider: 'google' | 'outlook') {
  if (provider === 'google') syncingGoogle.value = true;
  else syncingOutlook.value = true;

  try {
    const result = await triggerSync(provider);
    if (result) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: `${t('calendarSync.syncComplete')}: ${result.created} ${t('calendarSync.created')}, ${result.updated} ${t('calendarSync.updated')}`
      });
    }
    await loadSyncStatus();
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('calendarSync.syncFailed') });
  } finally {
    syncingGoogle.value = false;
    syncingOutlook.value = false;
  }
}

async function syncAll() {
  syncing.value = true;
  try {
    await triggerSync();
    ElNotification({ type: 'success', title: t('common.success'), message: t('calendarSync.syncComplete') });
    await loadSyncStatus();
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: t('calendarSync.syncFailed') });
  } finally {
    syncing.value = false;
  }
}

// ─── Disconnect ─────────────────────────────────────────────────────────────
async function handleDisconnect(provider: 'google' | 'outlook') {
  try {
    await disconnectCalendarProvider(provider);
    ElNotification({ type: 'success', title: t('common.success'), message: t('calendarSync.disconnected') });
    await loadSyncStatus();
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: String(error) });
  }
}

// ─── Auto-Sync Toggle ──────────────────────────────────────────────────────
async function handleAutoSync(provider: 'google' | 'outlook', enabled: boolean) {
  try {
    await toggleCalendarAutoSync(provider, enabled);
  } catch (error) {
    // Revert toggle on error
    if (provider === 'google') googleAutoSync.value = !enabled;
    else outlookAutoSync.value = !enabled;
    ElNotification({ type: 'error', title: t('common.error'), message: String(error) });
  }
}

// ─── Load Data ──────────────────────────────────────────────────────────────
async function loadSyncStatus() {
  const status = await fetchSyncStatus();
  syncStatusData.value = status;
  if (status) {
    googleAutoSync.value = status.google.autoSync;
    outlookAutoSync.value = status.outlook.autoSync;
  }
}

onMounted(async () => {
  try {
    await loadSyncStatus();
  } finally {
    loading.value = false;
  }
});
</script>
