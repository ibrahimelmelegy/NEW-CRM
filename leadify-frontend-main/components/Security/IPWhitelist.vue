<template lang="pug">
.ip-whitelist
  .flex.items-center.justify-between.mb-6
    h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('security.ipWhitelist') }}
    el-button(size="default" @click="refreshList" :loading="loading" class="!rounded-xl")
      Icon(name="ph:arrows-clockwise-bold" size="16")
      span.ml-1 {{ $t('common.refresh') }}

  //- Add Form
  .glass-card.p-4.mb-6
    .flex.items-center.gap-3
      el-input(
        v-model="newIP"
        :placeholder="$t('security.ipPlaceholder')"
        size="large"
        class="flex-1"
        @keyup.enter="handleAdd"
      )
        template(#prefix)
          Icon(name="ph:globe-bold" size="16")
      el-input(
        v-model="newLabel"
        :placeholder="$t('security.labelPlaceholder')"
        size="large"
        class="flex-1"
        @keyup.enter="handleAdd"
      )
        template(#prefix)
          Icon(name="ph:tag-bold" size="16")
      el-button(
        type="primary"
        size="large"
        @click="handleAdd"
        :loading="adding"
        :disabled="!isValidIP || !newLabel.trim()"
        class="!rounded-xl"
      )
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('security.addIP') }}

    .text-xs.mt-2(v-if="newIP && !isValidIP" style="color: var(--el-color-danger)")
      Icon(name="ph:warning-circle-bold" size="14" class="mr-1")
      | {{ $t('security.invalidIPFormat') }}

  //- Table
  div(v-loading="loading")
    el-table(:data="ipWhitelist" style="width: 100%")
      el-table-column(:label="$t('security.ipAddress')" width="200")
        template(#default="{ row }")
          .flex.items-center.gap-2
            Icon(name="ph:globe-bold" size="16" style="color: var(--text-muted)")
            span.font-mono.font-semibold(style="color: var(--text-primary)") {{ row.ip }}

      el-table-column(:label="$t('security.label')" min-width="200")
        template(#default="{ row }")
          span(style="color: var(--text-secondary)") {{ row.label }}

      el-table-column(:label="$t('security.addedBy')" width="200")
        template(#default="{ row }")
          span.text-sm(style="color: var(--text-secondary)") {{ row.creator?.name || '--' }}

      el-table-column(:label="$t('security.addedOn')" width="180")
        template(#default="{ row }")
          .text-sm(style="color: var(--text-muted)") {{ formatDate(row.createdAt) }}

      el-table-column(:label="$t('common.actions')" width="120" align="center")
        template(#default="{ row }")
          el-popconfirm(
            :title="$t('security.removeIPConfirm')"
            :confirm-button-text="$t('common.delete')"
            :cancel-button-text="$t('common.cancel')"
            @confirm="handleRemove(row.id)"
          )
            template(#reference)
              el-button(type="danger" link size="small")
                Icon(name="ph:trash-bold" size="16")

      template(#empty)
        .py-8.text-center
          Icon(name="ph:shield-slash-bold" size="48" style="color: var(--text-muted)")
          p.mt-2(style="color: var(--text-muted)") {{ $t('security.noWhitelistedIPs') }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('security.noWhitelistDescription') }}
</template>

<script setup lang="ts">
import { useSecurity } from '~/composables/useSecurity';

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const { ipWhitelist, loading, fetchIPWhitelist, addIP, removeIP } = useSecurity();

const newIP = ref('');
const newLabel = ref('');
const adding = ref(false);

// IPv4 and IPv6 validation (basic)
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,7}:$|^::[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,5}$/;
const cidrRegex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\/(?:[0-9]|[12]\d|3[0-2])$/;

const isValidIP = computed(() => {
  const ip = newIP.value.trim();
  if (!ip) return false;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || cidrRegex.test(ip);
});

onMounted(async () => {
  await fetchIPWhitelist();
});

async function handleAdd() {
  if (!isValidIP.value || !newLabel.value.trim()) return;

  adding.value = true;
  const success = await addIP(newIP.value.trim(), newLabel.value.trim());
  adding.value = false;

  if (success) {
    ElMessage.success(t('security.ipAdded'));
    newIP.value = '';
    newLabel.value = '';
  } else {
    ElMessage.error(t('security.ipAddFailed'));
  }
}

async function handleRemove(id: string) {
  const success = await removeIP(id);
  if (success) {
    ElMessage.success(t('security.ipRemoved'));
  } else {
    ElMessage.error(t('security.ipRemoveFailed'));
  }
}

async function refreshList() {
  await fetchIPWhitelist();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>
