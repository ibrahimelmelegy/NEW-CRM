<template lang="pug">
.p-6.animate-entrance.w-full.mx-auto(class="max-w-[1000px]")
  //- Header
  .flex.items-center.justify-between.mb-8
    .flex.items-center.gap-4
      el-button(circle plain @click="router.push('/settings')" class="!w-11 !h-11")
        Icon(name="ph:arrow-left-bold" size="18")
      div
        h2.text-3xl.font-black(style="color: var(--text-primary)") {{ $t('tenant.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('tenant.subtitle') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Main content
  template(v-else-if="tenantInfo")
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
      //- Left: Tenant details
      .space-y-6(class="lg:col-span-2")

        //- Organization Info Card
        .glass-card.rounded-2xl.p-6
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:buildings-bold" size="20" style="color: #7849ff")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('tenant.organizationInfo') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('tenant.organizationInfoDesc') }}

          .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.orgName') }}
              .text-sm.font-semibold(style="color: var(--text-primary)") {{ tenantInfo.name }}
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.orgDomain') }}
              .text-sm.font-semibold(style="color: var(--text-primary)") {{ tenantInfo.domain || '-' }}
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.orgStatus') }}
              el-tag(:type="statusType" size="small" round) {{ tenantInfo.status }}
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.orgPlan') }}
              .flex.items-center.gap-2
                el-tag(:type="planType" size="small" round effect="dark") {{ planLabel }}
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.orgId') }}
              .text-xs.font-mono(style="color: var(--text-muted)") {{ tenantInfo.id }}
            .info-row
              label.block.text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ $t('tenant.createdAt') }}
              .text-sm(style="color: var(--text-primary)") {{ formatDate(tenantInfo.createdAt) }}

        //- Usage Card
        .glass-card.rounded-2xl.p-6(v-if="usage")
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.1)")
              Icon(name="ph:chart-bar-bold" size="20" style="color: #22c55e")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('tenant.resourceUsage') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('tenant.resourceUsageDesc') }}

          .space-y-5
            //- Users usage
            div
              .flex.items-center.justify-between.mb-2
                .text-sm.font-medium(style="color: var(--text-primary)") {{ $t('tenant.users') }}
                .text-sm(style="color: var(--text-muted)") {{ usage.users.current }} / {{ usage.users.max }}
              el-progress(
                :percentage="usage.users.percentage"
                :color="progressColor(usage.users.percentage)"
                :stroke-width="8"
                :show-text="false"
              )

            //- Storage usage
            div
              .flex.items-center.justify-between.mb-2
                .text-sm.font-medium(style="color: var(--text-primary)") {{ $t('tenant.storage') }}
                .text-sm(style="color: var(--text-muted)") {{ usage.storage.currentMB }} MB / {{ usage.storage.maxMB }} MB
              el-progress(
                :percentage="usage.storage.percentage"
                :color="progressColor(usage.storage.percentage)"
                :stroke-width="8"
                :show-text="false"
              )

      //- Right: Plan info sidebar
      .col-span-1
        .glass-card.rounded-2xl.p-6.sticky(style="top: 24px")
          .flex.items-center.gap-3.mb-6
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.1)")
              Icon(name="ph:crown-bold" size="20" style="color: #3b82f6")
            div
              h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('tenant.planDetails') }}
              p.text-xs(style="color: var(--text-muted)") {{ $t('tenant.planDetailsDesc') }}

          .space-y-4
            .flex.items-center.justify-between
              .text-xs(style="color: var(--text-muted)") {{ $t('tenant.currentPlan') }}
              el-tag(:type="planType" size="small" round effect="dark") {{ planLabel }}

            .flex.items-center.justify-between
              .text-xs(style="color: var(--text-muted)") {{ $t('tenant.maxUsers') }}
              .text-sm.font-semibold(style="color: var(--text-primary)") {{ tenantInfo.maxUsers }}

            .flex.items-center.justify-between
              .text-xs(style="color: var(--text-muted)") {{ $t('tenant.maxStorage') }}
              .text-sm.font-semibold(style="color: var(--text-primary)") {{ tenantInfo.maxStorageMB }} MB

            .flex.items-center.justify-between(v-if="usage")
              .text-xs(style="color: var(--text-muted)") {{ $t('tenant.rateLimit') }}
              .text-sm.font-semibold(style="color: var(--text-primary)") {{ usage.limits.rateLimit }} {{ $t('tenant.reqPerMin') }}

          .mt-6.pt-4.border-t(style="border-color: var(--border-default)")
            .text-xs.leading-relaxed(style="color: var(--text-muted)") {{ $t('tenant.upgradeHint') }}

  //- No tenant state
  template(v-else)
    .text-center.py-20
      Icon.mx-auto.mb-4(name="ph:buildings" size="48" style="color: var(--text-muted)")
      p.text-sm(style="color: var(--text-muted)") {{ $t('tenant.noTenant') }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

const router = useRouter();

interface TenantInfo {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  status: string;
  plan: string;
  maxUsers: number;
  maxStorageMB: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TenantUsage {
  tenantId: string;
  tenantName: string;
  plan: string;
  users: { current: number; max: number; percentage: number };
  storage: { currentMB: number; maxMB: number; percentage: number };
  limits: { rateLimit: number };
}

const loading = ref(true);
const tenantInfo = ref<TenantInfo | null>(null);
const usage = ref<TenantUsage | null>(null);

const statusType = computed(() => {
  switch (tenantInfo.value?.status) {
    case 'ACTIVE':
      return 'success';
    case 'TRIAL':
      return 'warning';
    case 'SUSPENDED':
      return 'danger';
    default:
      return 'info';
  }
});

const planType = computed(() => {
  switch (tenantInfo.value?.plan) {
    case 'enterprise':
      return 'danger';
    case 'pro':
      return 'warning';
    default:
      return 'info';
  }
});

const planLabel = computed(() => {
  const p = tenantInfo.value?.plan || 'free';
  return p.charAt(0).toUpperCase() + p.slice(1);
});

function progressColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function loadTenantInfo() {
  loading.value = true;
  try {
    const [infoRes, usageRes] = await Promise.all([useApiFetch<TenantInfo>('tenant/me'), useApiFetch<TenantUsage>('tenant/usage')]);

    if (infoRes.success && infoRes.body) {
      tenantInfo.value = infoRes.body as TenantInfo;
    }
    if (usageRes.success && usageRes.body) {
      usage.value = usageRes.body as TenantUsage;
    }
  } catch (e) {
    logger.error('Failed to load tenant info', e);
  } finally {
    loading.value = false;
  }
}

await loadTenantInfo().catch(() => {
  loading.value = false;
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.animate-entrance {
  animation: entrance 0.4s ease-out;
}

@keyframes entrance {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
