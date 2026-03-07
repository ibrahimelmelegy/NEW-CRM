<template lang="pug">  
 el-form(@submit.prevent='onSubmit' )
  .grid.grid-cols-2.gap-3     
    InputSelect(:label="$t('reports.dealStage')" name="stage"  :placeholder="$t('common.selectType')"  :options="dealStageOptions" )
    InputSelect(:label="$t('reports.assignedUser')" name="userId"  :placeholder="$t('reports.selectUser')"   :options="mappedUsers")
    InputSelect(:label="$t('reports.contactType')" name="contractType"  :placeholder="$t('reports.selectContactType')" :options="contractTypeOptions"  )
  .grid.grid-cols-2.gap-3
    InputDate(:label="$t('reports.fromExpectedSignDate')" :placeholder="$t('reports.enterDate')"  name="fromDate")  
    InputDate(:label="$t('reports.toExpectedSignDate')" :placeholder="$t('reports.enterDate')"  name="toDate")  
  .flex.justify-end
    el-button(  native-type="submit" size='large' type="primary"  class="!rounded-2xl")  {{ $t('reports.showFilterResult') }}
    el-button(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { useForm } from 'vee-validate';
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const users = await useApiFetch('users');
const mappedUsers = users?.body?.docs?.map(e => ({
  label: e.name,
  value: e.id
}));

const onSubmit = handleSubmit(async (values: unknown) => {
  if (values.fromDate) {
    values.fromDate = [getYear(values.fromDate.toISOString())];
  }
  if (values.toDate) {
    values.toDate = [getYear(values.toDate.toISOString())];
  }
  emit('showFilter', values);
});

const ResetFilter = async () => {
  emit('showFilter', {
    stage: '',
    userId: '',
    contractType: '',
    fromDate: '',
    toDate: ''
  });
  resetForm();
};
</script>
