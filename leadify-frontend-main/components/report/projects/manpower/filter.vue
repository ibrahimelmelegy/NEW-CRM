<template lang="pug">  
 el-form(@submit.prevent='onSubmit' )
  .grid.grid-cols-2.gap-3     
   InputSelect(:label="$t('reports.role')" name="role"  :placeholder="$t('reports.selectRole')"   :options="manpowerRoles" )
   InputSelect(:label="$t('reports.availabilityStatus')" name="availabilityStatus"  :placeholder="$t('reports.selectAvailabilityStatus')"   :options="manpowerAvailabilityStatus" )
  .grid.grid-cols-2.gap-3
   InputDate(:label="$t('reports.fromDate')" :placeholder="$t('reports.enterDateRange')" name="fromDate" )
   InputDate(:label="$t('reports.toDate')" :placeholder="$t('reports.enterDateRange')" name="toDate" )
  .flex.justify-end
   el-button.mt-2(  native-type="submit" size='large' type="primary"  class="!rounded-2xl")  {{ $t('reports.showFilterResult') }}
   el-button.mt-2(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { useForm } from 'vee-validate';
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

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
  // await resetForm()
  emit('showFilter', {
    role: '',
    availabilityStatus: '',
    fromDate: '',
    toDate: ''
  });
  resetForm();
};
</script>
