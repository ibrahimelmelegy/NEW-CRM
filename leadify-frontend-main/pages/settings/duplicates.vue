<template lang="pug">
.duplicates-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('duplicates.title') }}
        p(style="color: var(--text-muted)") {{ $t('duplicates.subtitle') }}
      .flex.items-center.gap-3
        el-select(v-model="scanEntityType" style="width: 140px")
          el-option(:label="$t('duplicates.lead')" value="lead")
          el-option(:label="$t('duplicates.client')" value="client")
          el-option(:label="$t('duplicates.deal')" value="deal")
        el-button(type="primary" @click="handleScan" :loading="scanning" class="!rounded-xl")
          Icon.mr-1(name="ph:magnifying-glass-bold" size="16")
          | {{ scanning ? $t('duplicates.scanning') : $t('duplicates.scan') }}

  .max-w-5xl
    //- Status Tabs
    el-tabs(v-model="activeStatus" @tab-change="handleStatusChange")
      el-tab-pane(:label="$t('duplicates.detected')" name="DETECTED")
      el-tab-pane(:label="$t('duplicates.confirmed')" name="CONFIRMED")
      el-tab-pane(:label="$t('duplicates.dismissed')" name="DISMISSED")
      el-tab-pane(:label="$t('duplicates.merged')" name="MERGED")

    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    //- Duplicate Sets List
    template(v-else)
      .space-y-4(v-if="duplicateSets.length")
        .glass-card.p-5(v-for="set in duplicateSets" :key="set.id")
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-4
              .flex.items-center.gap-2
                el-tag(type="info" size="small") {{ set.entityType }}
                el-tag(:type="matchScoreType(set.matchScore)" size="small") {{ set.matchScore }}% {{ $t('duplicates.matchScore') }}
              .flex.items-center.gap-1
                span.text-xs(style="color: var(--text-muted)") {{ $t('duplicates.matchedFields') }}:
                el-tag(v-for="field in set.matchedFields" :key="field" size="small" effect="plain") {{ field }}

            .flex.items-center.gap-2(v-if="activeStatus === 'DETECTED' || activeStatus === 'CONFIRMED'")
              el-button(v-if="activeStatus === 'DETECTED'" size="small" type="success" @click="handleConfirm(set)" class="!rounded-lg")
                Icon.mr-1(name="ph:check-bold" size="14")
                | {{ $t('duplicates.confirm') }}
              el-button(v-if="activeStatus === 'DETECTED'" size="small" @click="handleDismiss(set)" class="!rounded-lg")
                Icon.mr-1(name="ph:x-bold" size="14")
                | {{ $t('duplicates.dismiss') }}
              el-button(size="small" type="primary" @click="openMergeDialog(set)" class="!rounded-lg")
                Icon.mr-1(name="ph:git-merge-bold" size="14")
                | {{ $t('duplicates.merge') }}

          //- Records Comparison
          .grid.gap-4(v-if="set.records && set.records.length >= 2" class="grid-cols-1 md:grid-cols-2")
            .p-4.rounded-xl(
              v-for="(record, idx) in set.records.slice(0, 2)"
              :key="idx"
              style="background: var(--card-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border-glass, rgba(255,255,255,0.08))"
            )
              p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('duplicates.records') + ' #' + (idx + 1) + ' (ID: ' + record.entityId + ')' }}
              .space-y-1
                .flex.items-center.gap-2(v-for="(value, key) in record.data" :key="key")
                  span.text-xs.font-semibold(style="color: var(--text-muted); min-width: 80px") {{ key }}:
                  span.text-sm(style="color: var(--text-primary)") {{ value }}

      //- Empty State
      .text-center.py-12(v-else)
        Icon(name="ph:copy-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('duplicates.noDuplicates') }}

  //- Merge Dialog
  el-dialog(v-model="mergeDialogVisible" :title="$t('duplicates.mergeDialog.title')" width="800px")
    p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('duplicates.mergeDialog.description') }}

    template(v-if="mergeSet && mergeSet.records && mergeSet.records.length >= 2")
      .space-y-3
        .flex.items-center.gap-4.p-3.rounded-xl(
          v-for="field in mergeFields"
          :key="field"
          style="background: var(--card-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border-glass, rgba(255,255,255,0.08))"
        )
          span.text-sm.font-semibold(style="color: var(--text-muted); min-width: 120px") {{ field }}
          .flex-1.grid.gap-3(class="grid-cols-2")
            .p-2.rounded-lg.cursor-pointer.text-center(
              v-for="(record, idx) in mergeSet.records.slice(0, 2)"
              :key="idx"
              :class="{ 'ring-2 ring-purple-500': mergeSelections[field] === idx }"
              :style="{ background: mergeSelections[field] === idx ? 'rgba(120, 73, 255, 0.1)' : 'transparent' }"
              @click="mergeSelections[field] = idx"
            )
              span.text-sm(style="color: var(--text-primary)") {{ record.data?.[field] || '-' }}

    template(#footer)
      el-button(@click="mergeDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleMerge" :loading="merging") {{ $t('duplicates.merge') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchDuplicateSets, confirmDuplicate, dismissDuplicate, mergeDuplicates, scanForDuplicates } from '~/composables/useDuplicateDetection';
import type { DuplicateSet } from '~/composables/useDuplicateDetection';

definePageMeta({ title: 'Duplicate Detection' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const scanning = ref(false);
const merging = ref(false);
const activeStatus = ref('DETECTED');
const scanEntityType = ref('lead');
const mergeDialogVisible = ref(false);
const mergeSet = ref<DuplicateSet | null>(null);
const mergeSelections = reactive<Record<string, number>>({});
const mergeFields = ref<string[]>([]);

const duplicateSets = ref<DuplicateSet[]>([]);
const pagination = ref<any>({});

// Load initial data
try {
  const response = await fetchDuplicateSets({ status: 'DETECTED' });
  duplicateSets.value = response.docs;
  pagination.value = response.pagination;
} catch (e) {
  console.error('Failed to load duplicates', e);
} finally {
  loading.value = false;
}

function matchScoreType(score: number) {
  if (score >= 90) return 'danger';
  if (score >= 70) return 'warning';
  return 'info';
}

async function handleStatusChange(status: string) {
  loading.value = true;
  try {
    const response = await fetchDuplicateSets({ status });
    duplicateSets.value = response.docs;
    pagination.value = response.pagination;
  } finally {
    loading.value = false;
  }
}

async function handleScan() {
  scanning.value = true;
  try {
    await scanForDuplicates(scanEntityType.value);
    await handleStatusChange(activeStatus.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('duplicates.scanComplete') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    scanning.value = false;
  }
}

async function handleConfirm(set: DuplicateSet) {
  try {
    await ElMessageBox.confirm(t('duplicates.confirmDuplicate'), t('common.confirm'), { type: 'warning' });
    await confirmDuplicate(set.id);
    await handleStatusChange(activeStatus.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  }
}

async function handleDismiss(set: DuplicateSet) {
  try {
    await dismissDuplicate(set.id);
    await handleStatusChange(activeStatus.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

function openMergeDialog(set: DuplicateSet) {
  mergeSet.value = set;
  // Collect all fields from both records
  const fieldSet = new Set<string>();
  for (const record of set.records?.slice(0, 2) || []) {
    if (record.data) {
      for (const key of Object.keys(record.data)) {
        fieldSet.add(key);
      }
    }
  }
  mergeFields.value = Array.from(fieldSet);
  // Default to first record
  for (const field of mergeFields.value) {
    mergeSelections[field] = 0;
  }
  mergeDialogVisible.value = true;
}

async function handleMerge() {
  if (!mergeSet.value) return;
  try {
    await ElMessageBox.confirm(t('duplicates.confirmMerge'), t('common.warning'), { type: 'warning' });
    merging.value = true;

    // Build merged data from selections
    const primaryRecord = mergeSet.value.records[0]!;
    const secondaryRecord = mergeSet.value.records[1]!;
    const mergedData: Record<string, any> = {};
    for (const field of mergeFields.value) {
      const selectedIdx = mergeSelections[field] || 0;
      mergedData[field] = mergeSet.value.records[selectedIdx]?.data?.[field];
    }

    await mergeDuplicates(mergeSet.value.id, {
      primaryRecordId: primaryRecord.entityId,
      mergedData
    });

    mergeDialogVisible.value = false;
    await handleStatusChange(activeStatus.value);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch (e: any) {
    ElMessage.error(t('common.error'));
  } finally {
    merging.value = false;
  }
}
</script>

<style lang="scss" scoped>
.duplicates-page {
  animation: fadeIn 0.5s ease-out;
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
