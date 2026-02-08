<template lang="pug">  
 el-form(@submit.prevent='onSubmit' )
  .grid.grid-cols-2.gap-3     
   InputSelect(:label="$t('operations.projects.table.type')" name="type"  :placeholder="$t('common.choose')" :options="getProjectCategories()" )
   InputSelect(:label="$t('operations.projects.table.status')" name="status"  :placeholder="$t('common.choose')" :options="getProjectStatuses()" )
  .grid.grid-cols-2.gap-3
   InputDate(:label="$t('operations.projects.table.startDate')" :placeholder="$t('common.choose')"  name="fromStartDate")
   InputDate(:label="$t('operations.projects.table.startDate')" :placeholder="$t('common.choose')"  name="toStartDate")
   InputDate(:label="$t('operations.projects.table.endDate')" :placeholder="$t('common.choose')"  name="fromEndDate")
   InputDate(:label="$t('operations.projects.table.endDate')" :placeholder="$t('common.choose')"  name="toEndDate")
  .flex.justify-end
   el-button.mt-2(  native-type="submit" size='large' type="primary"  class="!rounded-2xl") {{ $t('common.filter') }}
   el-button.mt-2(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col") {{ $t('common.reset') }}
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
const { t } = useI18n();
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const onSubmit = handleSubmit(async (values: any) => {
  const formatYear = (val: any) => {
    if (!val) return null;
    const date = new Date(val);
    return !isNaN(date.getTime()) ? date.getFullYear().toString() : null;
  };

  if (values.fromStartDate) {
    values.fromStartDate = [formatYear(values.fromStartDate)];
  }
  if (values.toStartDate) {
    values.toStartDate = [formatYear(values.toStartDate)];
  }
  if (values.fromEndDate) {
    values.fromEndDate = [formatYear(values.fromEndDate)];
  }
  if (values.toEndDate) {
    values.toEndDate = [formatYear(values.toEndDate)];
  }
  emit('showFilter', values);
});

const ResetFilter = async () => {
  // await resetForm()
  emit('showFilter', {
    type: '',
    status: '',
    fromStartDate: '',
    toStartDate: '',
    fromEndDate: '',
    toEndDate: ''
  });
  resetForm();
};
</script>
