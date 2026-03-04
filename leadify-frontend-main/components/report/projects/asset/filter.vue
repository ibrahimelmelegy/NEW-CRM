<template lang="pug">  
  el-form(@submit.prevent='onSubmit' )
   .grid.grid-cols-2.gap-3     
    InputText(:label="$t('reports.fromRentPrice')" :placeholder="$t('reports.enterFromRentPrice')" name="fromRentPrice" )  
    InputText(:label="$t('reports.toRentPrice')" :placeholder="$t('reports.enterToRentPrice')" name="toRentPrice" ) 

    InputText(:label="$t('reports.fromBuyPrice')" :placeholder="$t('reports.enterFromBuyPrice')" name="fromBuyPrice" )  
    InputText(:label="$t('reports.toBuyPrice')" :placeholder="$t('reports.enterToBuyPrice')" name="toBuyPrice" ) 
   .flex.justify-end
    el-button.mt-2(  native-type="submit" size='large' type="primary"  class="!rounded-2xl")  {{ $t('reports.showFilterResult') }}
    el-button.mt-2(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
 </template>

<script setup lang="ts">
/* eslint-disable require-await */
import { useForm } from 'vee-validate';
const { handleSubmit, errors, values, resetForm } = useForm();
const emit = defineEmits(['showFilter']);

const onSubmit = handleSubmit(async (values: any) => {
  emit('showFilter', values);
});

const ResetFilter = async () => {
  // await resetForm()
  emit('showFilter', {
    fromRentPrice: '',
    toRentPrice: '',
    fromBuyPrice: '',
    toBuyPrice: ''
  });
  resetForm();
};
</script>
