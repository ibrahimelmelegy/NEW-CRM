<template lang="pug">  
  el-form(@submit.prevent='onSubmit' )
   .grid.grid-cols-2.gap-3     
    InputText(:label="$t('reports.fromPrice')" :placeholder="$t('reports.enterFromPrice')" name="fromPrice" )
    InputText(:label="$t('reports.toPrice')" :placeholder="$t('reports.enterToPrice')" name="toPrice" )

   .flex.justify-end
    el-button.mt-2(native-type="submit" size='large' type="primary"  class="!rounded-2xl" )  {{ $t('reports.showFilterResult') }}
    el-button.mt-2(@click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
 </template>

<script setup lang="ts">
/* eslint-disable require-await */
import { useForm } from 'vee-validate';
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const onSubmit = handleSubmit(async (values: unknown) => {
  emit('showFilter', values);
});

const ResetFilter = async () => {
  // await resetForm()
  emit('showFilter', {
    fromPrice: '',
    toPrice: ''
  });
  resetForm();
};
</script>
