<template lang="pug">  
el-form(@submit.prevent='onSubmit' )
 .grid.grid-cols-2.gap-3     
   InputSelect(:label="$t('reports.leadSource')" name="leadSource"  :placeholder="$t('reports.selectSource')" :options="leadSources"  )
   InputSelect(:label="$t('reports.leadStatus')" name="status"  :placeholder="$t('common.selectStatus')" :options="leadStates" )
   InputSelect(:label="$t('reports.assignedUser')" name="userId"  :placeholder="$t('reports.selectUser')" :options="mappedUsers" )
 .grid.grid-cols-2.gap-3
   InputDate(:label="$t('reports.fromLastContactDate')" :placeholder="$t('reports.enterDateRange')"  name="fromLastContactDate")
   InputDate(:label="$t('reports.toLastContactDate')" :placeholder="$t('reports.enterDateRange')"  name="toLastContactDate")
 .flex.justify-end
   el-button(  native-type="submit" size='large' type="primary"  class="!rounded-2xl" )  {{ $t('reports.showFilterResult') }}
   el-button(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { useForm } from 'vee-validate';
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const users = await useApiFetch('users');
const mappedUsers = users?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const onSubmit = handleSubmit(async (values: any) => {
  if (values.fromLastContactDate) {
    values.fromLastContactDate = [getYear(values.fromLastContactDate.toISOString())];
  }
  if (values.toLastContactDate) {
    values.toLastContactDate = [getYear(values.toLastContactDate.toISOString())];
  }
  emit('showFilter', values);
});

const ResetFilter = async () => {
  emit('showFilter', {
    leadSource: '',
    userId: '',
    status: '',
    fromLastContactDate: '',
    toLastContactDate: ''
  });
  resetForm();
};
</script>
