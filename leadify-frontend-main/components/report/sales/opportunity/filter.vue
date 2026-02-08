<template lang="pug">
el-form(@submit.prevent='onSubmit')
  .grid.grid-cols-2.gap-3
    InputSelect(:label="$t('opportunities.reports.filter.stage')" name="stage" :placeholder="$t('opportunities.reports.filter.selectStage')" :options="stageOptions.map(o => ({...o, label: $t(o.label)}))")
    InputSelect(:label="$t('opportunities.reports.filter.assigned')" name="userId" :placeholder="$t('opportunities.reports.filter.selectUser')" :options="mappedUsers")
    InputSelect(:label="$t('opportunities.reports.filter.priority')" name="priority" :placeholder="$t('opportunities.reports.filter.selectPriority')" :options="priorityOptions.map(o => ({...o, label: $t(o.label)}))")
  .grid.grid-cols-2.gap-3
    InputDate(:label="$t('opportunities.reports.filter.fromCloseDate')" :placeholder="$t('opportunities.reports.filter.enterDateRange')" name="fromExpectedCloseDate")
    InputDate(:label="$t('opportunities.reports.filter.toCloseDate')" :placeholder="$t('opportunities.reports.filter.enterDateRange')" name="toExpectedCloseDate")
  .flex.justify-end
    el-button(native-type="submit" size='large' type="primary" class="!rounded-2xl") {{ $t('opportunities.reports.filter.showResult') }}
    el-button(@click="ResetFilter" size='large' class="!rounded-2xl text-col") {{ $t('opportunities.reports.filter.reset') }}
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { stageOptions, priorityOptions } from '@/composables/useOpportunity';

const { t } = useI18n();
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const users = await useApiFetch('users');
const mappedUsers = users?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const onSubmit = handleSubmit(async (values: any) => {
  if (values.fromExpectedCloseDate) {
    values.fromExpectedCloseDate = [getYear(values.fromExpectedCloseDate.toISOString())];
  }
  if (values.toExpectedCloseDate) {
    values.toExpectedCloseDate = [getYear(values.toExpectedCloseDate.toISOString())];
  }
  emit('showFilter', values);
});

const ResetFilter = async () => {
  emit('showFilter', {
    stage: '',
    userId: '',
    priority: '',
    fromExpectedCloseDate: '',
    toExpectedCloseDate: ''
  });
  resetForm();
};
</script>
