<template lang="pug">
.sequences-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.sequences') }}
        p(style="color: var(--text-muted)") {{ $t('sequences.description') }}
      el-button(type="primary" @click="navigateTo('/marketing/sequences/create')" class="!rounded-xl premium-btn")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('sequences.createSequence') }}

  //- Performance Analytics Cards
  .grid.gap-4.mb-8(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
    .analytics-card.glass-card.p-5
      .flex.items-center.gap-4
        .analytics-icon(style="background: rgba(120, 73, 255, 0.12)")
          Icon(name="ph:flow-arrow-bold" size="24" style="color: #7849ff")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('sequences.activeSequences') }}
          p.text-2xl.font-bold(style="color: #7849ff") {{ activeCount }}

    .analytics-card.glass-card.p-5
      .flex.items-center.gap-4
        .analytics-icon(style="background: rgba(59, 130, 246, 0.12)")
          Icon(name="ph:users-bold" size="24" style="color: #3b82f6")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('sequences.contactsInSequence') }}
          p.text-2xl.font-bold(style="color: #3b82f6") {{ totalContacts }}

    .analytics-card.glass-card.p-5
      .flex.items-center.gap-4
        .analytics-icon(style="background: rgba(34, 197, 94, 0.12)")
          Icon(name="ph:envelope-open-bold" size="24" style="color: #22c55e")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('sequences.avgOpenRate') }}
          .flex.items-center.gap-2
            p.text-2xl.font-bold(style="color: #22c55e") {{ avgOpenRate }}%
            .rate-badge.rate-up(v-if="avgOpenRate > 25")
              Icon(name="ph:trend-up-bold" size="12")

    .analytics-card.glass-card.p-5
      .flex.items-center.gap-4
        .analytics-icon(style="background: rgba(245, 158, 11, 0.12)")
          Icon(name="ph:chat-circle-text-bold" size="24" style="color: #f59e0b")
        div
          p.text-xs.font-semibold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('sequences.avgReplyRate') }}
          .flex.items-center.gap-2
            p.text-2xl.font-bold(style="color: #f59e0b") {{ avgReplyRate }}%
            .rate-badge.rate-up(v-if="avgReplyRate > 10")
              Icon(name="ph:trend-up-bold" size="12")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  template(v-else)
    //- Sequences List
    .space-y-4(v-if="sequences.length")
      .glass-card.overflow-hidden.transition-all(
        v-for="seq in sequences"
        :key="seq.id"
      )
        //- Sequence Header Row
        .p-5.cursor-pointer(@click="toggleSequenceExpand(seq.id)")
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
                  //- Inline performance metrics
                  span.text-xs(v-if="seq.openRate != null" style="color: #22c55e")
                    Icon.mr-1(name="ph:envelope-open-bold" size="12" style="display: inline")
                    | {{ seq.openRate || 0 }}%
                  span.text-xs(v-if="seq.replyRate != null" style="color: #f59e0b")
                    Icon.mr-1(name="ph:chat-circle-text-bold" size="12" style="display: inline")
                    | {{ seq.replyRate || 0 }}%

            .flex.items-center.gap-2
              Icon(:name="expandedSequences.includes(seq.id) ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" size="16" style="color: var(--text-muted)")
              el-button(size="small" plain @click.stop="navigateTo(`/marketing/sequences/${seq.id}`)" class="!rounded-lg")
                Icon(name="ph:arrow-square-out-bold" size="14")
              el-button(size="small" plain @click.stop="handleToggleActive(seq)" class="!rounded-lg")
                Icon(:name="seq.isActive ? 'ph:pause-bold' : 'ph:play-bold'" size="14")
              el-button(type="danger" size="small" plain @click.stop="handleDelete(seq)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

        //- Expanded: Timeline Preview + A/B Test Panel
        transition(name="expand")
          .sequence-expanded(v-if="expandedSequences.includes(seq.id)")
            .px-5.pb-5

              //- Visual Timeline
              .timeline-section.mb-6(v-if="seq.steps?.length")
                h4.text-xs.font-bold.uppercase.tracking-wider.mb-4(style="color: var(--text-muted)")
                  Icon.mr-1(name="ph:path-bold" size="14" style="display: inline; vertical-align: middle")
                  | {{ $t('sequences.timeline') }}

                .sequence-timeline
                  .timeline-track
                    .timeline-node-wrapper(v-for="(step, idx) in seq.steps" :key="idx")
                      //- Connector line
                      .timeline-line(v-if="idx > 0" :class="{ 'has-wait': step.delayDays > 0 }")
                        .wait-badge(v-if="step.delayDays > 0")
                          Icon(name="ph:clock-bold" size="10")
                          span {{ step.delayDays }}d

                      //- Step Node
                      .timeline-step-node(:class="`type-${step.type}`")
                        .node-icon
                          Icon(:name="stepIcon(step.type)" size="16")
                        .node-label
                          .text-xs.font-semibold(style="color: var(--text-primary)") {{ $t(`sequences.dayMarker`) }} {{ cumulativeDay(seq.steps, idx) }}
                          .text-xs(class="mt-0.5" style="color: var(--text-muted)") {{ step.subject || step.type }}

                        //- Branch indicator
                        .branch-badge(v-if="step.branchCondition")
                          Icon(name="ph:git-branch-bold" size="10")
                          span.text-xs {{ $t('sequences.branchCondition') }}

                        //- A/B Test indicator
                        .ab-badge(v-if="step.variantB")
                          span.text-xs.font-bold A/B

              //- A/B Testing Panel
              .ab-test-section(v-if="hasAnyABTest(seq)")
                h4.text-xs.font-bold.uppercase.tracking-wider.mb-3(style="color: var(--text-muted)")
                  Icon.mr-1(name="ph:flask-bold" size="14" style="display: inline; vertical-align: middle")
                  | {{ $t('sequences.abTest') }}

                .space-y-3
                  .ab-test-card(v-for="(step, idx) in seq.steps" :key="idx" v-if="step.variantB")
                    .flex.items-center.justify-between.mb-2
                      span.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t(`sequences.dayMarker`) }} {{ cumulativeDay(seq.steps, idx) }}: {{ step.subject }}
                      el-tag(size="small" effect="plain" round) {{ step.splitPercentage || 50 }}/{{ 100 - (step.splitPercentage || 50) }}

                    .grid.gap-3(class="grid-cols-2")
                      .variant-card.variant-a
                        .flex.items-center.gap-2.mb-2
                          .variant-label A
                          span.text-xs.font-semibold(style="color: var(--text-primary)") {{ $t('sequences.variantA') }}
                        p.text-xs(style="color: var(--text-muted)") {{ step.subject || '—' }}
                        .flex.items-center.gap-3.mt-2
                          .text-xs
                            span(style="color: var(--text-muted)") Open:
                            span.ml-1.font-bold(style="color: #22c55e") {{ step.variantAOpenRate || 0 }}%
                          .text-xs
                            span(style="color: var(--text-muted)") Reply:
                            span.ml-1.font-bold(style="color: #f59e0b") {{ step.variantAReplyRate || 0 }}%

                      .variant-card.variant-b
                        .flex.items-center.gap-2.mb-2
                          .variant-label B
                          span.text-xs.font-semibold(style="color: var(--text-primary)") {{ $t('sequences.variantB') }}
                        p.text-xs(style="color: var(--text-muted)") {{ step.variantB?.subject || '—' }}
                        .flex.items-center.gap-3.mt-2
                          .text-xs
                            span(style="color: var(--text-muted)") Open:
                            span.ml-1.font-bold(style="color: #22c55e") {{ step.variantBOpenRate || 0 }}%
                          .text-xs
                            span(style="color: var(--text-muted)") Reply:
                            span.ml-1.font-bold(style="color: #f59e0b") {{ step.variantBReplyRate || 0 }}%

                    //- Winner indicator
                    .mt-2.text-center(v-if="step.variantAOpenRate || step.variantBOpenRate")
                      el-tag(
                        size="small"
                        :type="(step.variantAOpenRate || 0) >= (step.variantBOpenRate || 0) ? 'success' : 'warning'"
                        round
                      )
                        Icon.mr-1(name="ph:trophy-bold" size="10" style="display: inline")
                        | {{ (step.variantAOpenRate || 0) >= (step.variantBOpenRate || 0) ? $t('sequences.variantA') : $t('sequences.variantB') }} {{ $t('sequences.winning') }}

    //- Empty State
    .text-center.py-12(v-else)
      Icon(name="ph:flow-arrow-bold" size="48" style="color: var(--text-muted)")
      p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('sequences.noSequences') }}
      el-button.mt-4(type="primary" @click="navigateTo('/marketing/sequences/create')" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('sequences.createSequence') }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';
import { fetchSequences, updateSequence, deleteSequence } from '~/composables/useSequences';
import type { Sequence } from '~/composables/useSequences';

definePageMeta({ title: 'Sequences' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const loading = ref(true);
const sequences = ref<Sequence[]>([]);
const expandedSequences = ref<string[]>([]);

// ── Analytics Computed ──
const activeCount = computed(() => sequences.value.filter(s => s.isActive).length);

const totalContacts = computed(() => sequences.value.reduce((sum, s) => sum + ((s as unknown).enrolledCount || 0), 0));

const avgOpenRate = computed(() => {
  const withRate = sequences.value.filter(s => (s as unknown).openRate !== null && (s as unknown).openRate !== undefined);
  if (!withRate.length) return 0;
  return Math.round(withRate.reduce((sum, s) => sum + ((s as unknown).openRate || 0), 0) / withRate.length);
});

const avgReplyRate = computed(() => {
  const withRate = sequences.value.filter(s => (s as unknown).replyRate !== null && (s as unknown).replyRate !== undefined);
  if (!withRate.length) return 0;
  return Math.round(withRate.reduce((sum, s) => sum + ((s as unknown).replyRate || 0), 0) / withRate.length);
});

// ── Load ──
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

await loadData().catch(() => {
  loading.value = false;
});

// ── Helpers ──
function stepIcon(type: string) {
  const map: Record<string, string> = {
    email: 'ph:envelope-simple-bold',
    wait: 'ph:clock-bold',
    task: 'ph:check-square-bold',
    call: 'ph:phone-bold',
    meeting: 'ph:video-camera-bold'
  };
  return map[type] || 'ph:circle-bold';
}

function cumulativeDay(steps: Record<string, unknown>[], idx: number): number {
  let day = 1;
  for (let i = 0; i <= idx; i++) {
    if (i > 0) day += steps[i].delayDays || 0;
  }
  return day;
}

function hasAnyABTest(seq: unknown): boolean {
  return seq.steps?.some(s => s.variantB) || false;
}

function toggleSequenceExpand(id: string) {
  const idx = expandedSequences.value.indexOf(id);
  if (idx >= 0) expandedSequences.value.splice(idx, 1);
  else expandedSequences.value.push(id);
}

// ── Actions ──
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
  } catch (e: unknown) {
    if (e !== 'cancel') {
      ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  }
}
</script>

<style lang="scss" scoped>
.sequences-page {
  animation: fadeIn 0.5s ease-out;
}

.premium-btn {
  background: linear-gradient(135deg, #7849ff 0%, #5a2fd4 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  &:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #7849ff 100%);
  }
}

// ── Analytics Cards ──
.analytics-card {
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
}

.analytics-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.rate-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;

  &.rate-up {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
  }
}

.icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

// ── Sequence Timeline ──
.sequence-timeline {
  overflow-x: auto;
  padding: 12px 0;
}

.timeline-track {
  display: flex;
  align-items: flex-start;
  gap: 0;
  min-width: fit-content;
}

.timeline-node-wrapper {
  display: flex;
  align-items: flex-start;
}

.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 40px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border-glass, rgba(255, 255, 255, 0.1));
  }

  &.has-wait::before {
    background: repeating-linear-gradient(
      90deg,
      var(--border-glass, rgba(255, 255, 255, 0.1)) 0,
      var(--border-glass, rgba(255, 255, 255, 0.1)) 4px,
      transparent 4px,
      transparent 8px
    );
  }
}

.wait-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  font-size: 10px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.timeline-step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  max-width: 140px;
  position: relative;
}

.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  transition: transform 0.2s ease;

  .type-email & {
    background: rgba(120, 73, 255, 0.15);
    color: #7849ff;
  }
  .type-wait & {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
  .type-task & {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
  .type-call & {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
  .type-meeting & {
    background: rgba(236, 72, 153, 0.15);
    color: #ec4899;
  }
}

.node-label {
  text-align: center;
  max-width: 120px;
}

.branch-badge,
.ab-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
}

.branch-badge {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.ab-badge {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}

// ── A/B Testing ──
.ab-test-section {
  border-top: 1px solid var(--border-glass, rgba(255, 255, 255, 0.06));
  padding-top: 16px;
}

.ab-test-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
  background: var(--card-bg, rgba(255, 255, 255, 0.02));
}

.variant-card {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.06));

  &.variant-a {
    border-left: 3px solid #7849ff;
  }
  &.variant-b {
    border-left: 3px solid #ec4899;
  }
}

.variant-label {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;

  .variant-a & {
    background: rgba(120, 73, 255, 0.15);
    color: #7849ff;
  }
  .variant-b & {
    background: rgba(236, 72, 153, 0.15);
    color: #ec4899;
  }
}

// ── Expand Transition ──
.sequence-expanded {
  border-top: 1px solid var(--border-glass, rgba(255, 255, 255, 0.06));
  background: var(--card-bg, rgba(255, 255, 255, 0.01));
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
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
