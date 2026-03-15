<template lang="pug">
.lead-scoring-page.p-8
  .header.mb-8
    h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('leadScoring.title') }}
    p(style="color: var(--text-muted)") {{ $t('leadScoring.subtitle') }}

  .max-w-4xl
    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    template(v-else)
      //- Grade Thresholds
      .glass-card.p-6.mb-6(v-if="grades.length")
        .flex.items-center.gap-4.mb-6
          .icon-box(style="background: rgba(120, 73, 255, 0.1)")
            Icon(name="ph:trophy-bold" size="28" class="text-[#7849ff]")
          div
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('leadScoring.grades') }}
            p.text-xs(style="color: var(--text-muted)") {{ $t('leadScoring.gradeDescription') }}

        .grid.gap-3(class="grid-cols-2 md:grid-cols-4")
          .p-4.rounded-xl.text-center(v-for="grade in grades" :key="grade.grade" :style="{ background: grade.color + '15', border: '1px solid ' + grade.color + '30' }")
            .text-2xl.font-bold.mb-1(:style="{ color: grade.color }") {{ grade.grade }}
            .text-xs(style="color: var(--text-muted)") {{ grade.minScore }} - {{ grade.maxScore }} pts

      //- Rules Section
      .glass-card.p-6
        .flex.items-center.justify-between.mb-6
          .flex.items-center.gap-4
            .icon-box(style="background: rgba(59, 130, 246, 0.1)")
              Icon(name="ph:list-bold" size="28" class="text-[#3b82f6]")
            div
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('leadScoring.rules') }}
              p.text-xs(style="color: var(--text-muted)") {{ rules.length }} {{ $t('leadScoring.rules').toLowerCase() }}
          el-button(type="primary" @click="openRuleDialog()" class="!rounded-xl")
            Icon.mr-1(name="ph:plus-bold" size="16")
            | {{ $t('leadScoring.newRule') }}

        //- Rules Table
        .space-y-3(v-if="rules.length")
          .flex.items-center.justify-between.p-4.rounded-xl(
            v-for="rule in rules"
            :key="rule.id"
            style="background: var(--card-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border-glass, rgba(255,255,255,0.08))"
          )
            .flex.items-center.gap-4
              div
                p.text-sm.font-semibold(style="color: var(--text-primary)") {{ rule.name }}
                .flex.items-center.gap-3.mt-1
                  el-tag(size="small" type="info") {{ rule.entityType }}
                  span.text-xs(style="color: var(--text-muted)") {{ rule.criteria?.length || 0 }} {{ $t('leadScoring.criteria').toLowerCase() }}
            .flex.items-center.gap-3
              el-switch(v-model="rule.isActive" @change="handleToggleRule(rule)" active-color="#7849ff")
              el-button(size="small" @click="openRuleDialog(rule)" class="!rounded-lg")
                Icon(name="ph:pencil-bold" size="14")
              el-button(size="small" type="danger" plain @click="handleDeleteRule(rule)" class="!rounded-lg")
                Icon(name="ph:trash-bold" size="14")

        //- Empty State
        .text-center.py-12(v-else)
          Icon(name="ph:chart-line-up-bold" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('leadScoring.noRules') }}

  //- Rule Dialog
  el-dialog(v-model="ruleDialogVisible" :title="editingRule ? $t('leadScoring.editRule') : $t('leadScoring.newRule')" width="700px")
    el-form(:model="ruleForm" label-position="top")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('leadScoring.ruleName')" required)
          el-input(v-model="ruleForm.name" :placeholder="$t('leadScoring.ruleNamePlaceholder')")
        el-form-item(:label="$t('leadScoring.entityType')")
          el-select(v-model="ruleForm.entityType" style="width: 100%")
            el-option(:label="$t('leadScoring.lead')" value="lead")
            el-option(:label="$t('leadScoring.deal')" value="deal")
            el-option(:label="$t('leadScoring.client')" value="client")
            el-option(:label="$t('leadScoring.opportunity')" value="opportunity")

      //- Criteria Builder
      .mb-4
        .flex.items-center.justify-between.mb-3
          h4.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('leadScoring.criteria') }}
          el-button(size="small" @click="addCriteria" class="!rounded-lg")
            Icon.mr-1(name="ph:plus-bold" size="14")
            | {{ $t('leadScoring.addCriteria') }}

        .space-y-3
          .flex.items-center.gap-2(v-for="(criteria, index) in ruleForm.criteria" :key="index")
            el-input(v-model="criteria.field" :placeholder="$t('leadScoring.field')" style="width: 25%")
            el-select(v-model="criteria.operator" style="width: 20%")
              el-option(:label="$t('common.equals')" value="equals")
              el-option(:label="$t('common.contains')" value="contains")
              el-option(:label="$t('common.greaterThan')" value="gt")
              el-option(:label="$t('common.lessThan')" value="lt")
              el-option(:label="$t('common.notEmpty')" value="not_empty")
            el-input(v-model="criteria.value" :placeholder="$t('leadScoring.value')" style="width: 25%")
            el-input-number(v-model="criteria.points" :placeholder="$t('leadScoring.points')" style="width: 20%" :min="-100" :max="100")
            el-button(size="small" type="danger" plain @click="removeCriteria(index)" class="!rounded-lg")
              Icon(name="ph:x-bold" size="14")

    template(#footer)
      el-button(@click="ruleDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveRule" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchScoringRules, createScoringRule, updateScoringRule, deleteScoringRule, getGradeThresholds } from '~/composables/useLeadScoring';
import type { ScoringRule, ScoringCriteria, GradeThreshold } from '~/composables/useLeadScoring';
import logger from '~/utils/logger'

definePageMeta({ title: 'Lead Scoring' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const ruleDialogVisible = ref(false);
const editingRule = ref<ScoringRule | null>(null);

const rules = ref<ScoringRule[]>([]);
const grades = ref<GradeThreshold[]>([]);

const ruleForm = reactive({
  name: '',
  entityType: 'lead',
  criteria: [] as ScoringCriteria[]
});

// Load data
try {
  const [rulesData, gradesData] = await Promise.all([fetchScoringRules(), getGradeThresholds()]);
  rules.value = rulesData;
  grades.value = gradesData;
} catch (e) {
  logger.error('Failed to load lead scoring data', e);
} finally {
  loading.value = false;
}

function openRuleDialog(rule?: ScoringRule) {
  if (rule) {
    editingRule.value = rule;
    ruleForm.name = rule.name;
    ruleForm.entityType = rule.entityType;
    ruleForm.criteria = [...(rule.criteria || []).map(c => ({ ...c }))];
  } else {
    editingRule.value = null;
    ruleForm.name = '';
    ruleForm.entityType = 'lead';
    ruleForm.criteria = [];
  }
  ruleDialogVisible.value = true;
}

function addCriteria() {
  ruleForm.criteria.push({ field: '', operator: 'equals', value: '', points: 10 });
}

function removeCriteria(index: number) {
  ruleForm.criteria.splice(index, 1);
}

async function handleSaveRule() {
  if (!ruleForm.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: ruleForm.name,
      entityType: ruleForm.entityType,
      criteria: ruleForm.criteria,
      isActive: true
    };

    if (editingRule.value) {
      await updateScoringRule(editingRule.value.id, payload);
    } else {
      await createScoringRule(payload);
    }

    rules.value = await fetchScoringRules();
    ruleDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('leadScoring.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleToggleRule(rule: ScoringRule) {
  try {
    await updateScoringRule(rule.id, { isActive: rule.isActive });
  } catch {
    rule.isActive = !rule.isActive;
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  }
}

async function handleDeleteRule(rule: ScoringRule) {
  try {
    await ElMessageBox.confirm(t('leadScoring.confirmDelete'), t('common.warning'), { type: 'warning' });
    await deleteScoringRule(rule.id);
    rules.value = await fetchScoringRules();
    ElNotification({ type: 'success', title: t('common.success'), message: t('leadScoring.deleted') });
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
  }
}
</script>

<style lang="scss" scoped>
.lead-scoring-page {
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
