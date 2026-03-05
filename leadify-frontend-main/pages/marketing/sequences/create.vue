<template lang="pug">
.sequence-create-page.p-8
  //- Back Button
  .mb-6
    el-button(text @click="useSafeBack('/marketing/sequences')")
      Icon.mr-1(name="ph:arrow-left-bold" size="16")
      | {{ $t('common.back') }}

  .max-w-3xl
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('sequences.createSequence') }}
    p.mb-8(style="color: var(--text-muted)") {{ $t('sequences.createDescription') }}

    .glass-card.p-6.mb-6
      el-form(:model="form" label-position="top")
        el-form-item(:label="$t('sequences.name')" required)
          el-input(v-model="form.name" :placeholder="$t('sequences.namePlaceholder')")
        el-form-item(:label="$t('sequences.descriptionLabel')")
          el-input(v-model="form.description" type="textarea" :rows="3" :placeholder="$t('sequences.descriptionPlaceholder')")
        el-form-item(:label="$t('sequences.activeStatus')")
          el-switch(v-model="form.isActive")

    //- Steps Builder
    .glass-card.p-6.mb-6
      .flex.items-center.justify-between.mb-4
        h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('sequences.steps') }}
        el-button(type="primary" plain @click="addStep" class="!rounded-lg")
          Icon.mr-1(name="ph:plus-bold" size="14")
          | {{ $t('sequences.addStep') }}

      .space-y-4(v-if="form.steps.length")
        .p-4.rounded-xl(
          v-for="(step, idx) in form.steps"
          :key="idx"
          style="border: 1px solid var(--border-glass, rgba(255,255,255,0.08)); background: var(--card-bg, rgba(255,255,255,0.03))"
        )
          .flex.items-center.justify-between.mb-3
            .flex.items-center.gap-2
              .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
                span.text-xs.font-bold(style="color: #7849ff") {{ idx + 1 }}
              el-tag(size="small" :type="stepTypeTag(step.type)") {{ step.type }}
            el-button(type="danger" text size="small" @click="removeStep(idx)")
              Icon(name="ph:trash-bold" size="14")
          .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
            el-form-item(:label="$t('sequences.stepType')" class="!mb-0")
              el-select(v-model="step.type" style="width: 100%")
                el-option(:label="$t('sequences.stepTypeEmail')" value="email")
                el-option(:label="$t('sequences.stepTypeWait')" value="wait")
                el-option(:label="$t('sequences.stepTypeTask')" value="task")
            el-form-item(:label="$t('sequences.delayDays')" class="!mb-0")
              el-input-number(v-model="step.delayDays" :min="0" style="width: 100%")
          el-form-item.mt-3(:label="$t('sequences.subject')" class="!mb-0")
            el-input(v-model="step.subject")
          el-form-item.mt-3(:label="$t('sequences.body')" class="!mb-0")
            el-input(v-model="step.body" type="textarea" :rows="3")

      .text-center.py-6(v-else)
        p.text-sm(style="color: var(--text-muted)") {{ $t('sequences.noSteps') }}

    //- Submit
    .flex.justify-end
      el-button(@click="useSafeBack('/marketing/sequences')") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleCreate" :loading="saving" class="!rounded-xl") {{ $t('sequences.createSequence') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import { createSequence } from '~/composables/useSequences';
import type { SequenceStep } from '~/composables/useSequences';
import { useSafeBack } from '~/composables/useSafeBack';

definePageMeta({ title: 'Create Sequence' });

const router = useRouter();
const { $i18n } = useNuxtApp();
const t = $i18n.t;
const saving = ref(false);

const form = reactive({
  name: '',
  description: '',
  isActive: true,
  steps: [] as SequenceStep[]
});

function addStep() {
  form.steps.push({ order: form.steps.length, type: 'email', subject: '', body: '', delayDays: 1 });
}

function removeStep(idx: number) {
  form.steps.splice(idx, 1);
  form.steps.forEach((s, i) => {
    s.order = i;
  });
}

function stepTypeTag(type: string) {
  const map: Record<string, string> = { email: 'primary', wait: 'warning', task: 'success' };
  return (map[type] || 'info') as unknown;
}

async function handleCreate() {
  if (!form.name) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const res = await createSequence({
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      steps: form.steps
    });
    if (res?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.createdSuccessfully') });
      router.push('/marketing/sequences');
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res?.message || t('common.error') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.sequence-create-page {
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
