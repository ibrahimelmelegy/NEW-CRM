<template lang="pug">
.sequences-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.sequences') || 'Sequences' }}
        p(style="color: var(--text-muted)") {{ $t('sequences.description') }}
      el-button(type="primary" @click="navigateTo('/marketing/sequences/create')" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('sequences.createSequence') }}

  //- Stats
  .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sequences.totalSequences') }}
      p.text-3xl.font-bold(style="color: #7849ff") {{ sequences.length }}

    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sequences.active') }}
      p.text-3xl.font-bold(style="color: #22c55e") {{ sequences.filter(s => s.isActive).length }}

    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sequences.inactive') }}
      p.text-3xl.font-bold(style="color: #f59e0b") {{ sequences.filter(s => !s.isActive).length }}

    .glass-card.p-5.text-center
      p.text-xs.font-semibold.uppercase.mb-2(style="color: var(--text-muted)") {{ $t('sequences.totalSteps') }}
      p.text-3xl.font-bold(style="color: #3b82f6") {{ sequences.reduce((sum, s) => sum + (s.steps?.length || 0), 0) }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Sequences List
    .space-y-4(v-if="sequences.length")
      .glass-card.p-5.cursor-pointer.transition-all(
        v-for="seq in sequences"
        :key="seq.id"
        @click="navigateTo(`/marketing/sequences/${seq.id}`)"
      )
        .flex.items-center.justify-between
          .flex.items-center.gap-4
            .icon-box(style="background: rgba(120, 73, 255, 0.1)")
              Icon(name="ph:flow-arrow-bold" size="28" style="color: #7849ff")
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ seq.name }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ seq.description || $t('sequences.noDescription') }}
              .flex.items-center.gap-3.mt-2
                el-tag(size="small" :type="seq.isActive ? 'success' : 'info'") {{ seq.isActive ? $t('common.active') : $t('common.inactive') }}
                span.text-xs(style="color: var(--text-muted)")
                  Icon.mr-1(name="ph:steps-bold" size="12" style="display: inline")
                  | {{ seq.steps?.length || 0 }} {{ $t('sequences.steps') }}
          .flex.items-center.gap-2
            el-button(size="small" plain @click.stop="handleToggleActive(seq)" class="!rounded-lg")
              Icon(:name="seq.isActive ? 'ph:pause-bold' : 'ph:play-bold'" size="14")
            el-button(type="danger" size="small" plain @click.stop="handleDelete(seq)" class="!rounded-lg")
              Icon(name="ph:trash-bold" size="14")

    //- Empty State
    .text-center.py-12(v-else)
      Icon(name="ph:flow-arrow-bold" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('sequences.noSequences') }}
      el-button.mt-4(type="primary" @click="navigateTo('/marketing/sequences/create')" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('sequences.createSequence') }}
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';
import { fetchSequences, updateSequence, deleteSequence } from '~/composables/useSequences';
import type { Sequence } from '~/composables/useSequences';

definePageMeta({ title: 'Sequences' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const loading = ref(true);
const sequences = ref<Sequence[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchSequences();
    sequences.value = res.docs;
  } catch (e) {
    console.error('Failed to load sequences', e);
  } finally {
    loading.value = false;
  }
}

await loadData().catch(() => { loading.value = false; });

async function handleToggleActive(seq: Sequence) {
  try {
    await updateSequence(seq.id, { isActive: !seq.isActive });
    seq.isActive = !seq.isActive;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.updatedSuccessfully') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleDelete(seq: Sequence) {
  try {
    await ElMessageBox.confirm(t('sequences.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteSequence(seq.id);
    sequences.value = sequences.value.filter(s => s.id !== seq.id);
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deletedSuccessfully') });
  } catch {}
}
</script>

<style lang="scss" scoped>
.sequences-page {
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
