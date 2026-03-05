<template lang="pug">  
  el-form(@submit.prevent='onSubmit' )
   .grid.grid-cols-2.gap-3     
    InputSelect(:label="$t('reports.manufacturer')" name="manufacturer"  :placeholder="$t('reports.selectManufacturer')" :options="manufacturers" )
   .grid.grid-cols-4.gap-3     
    InputText(:label="$t('reports.fromRentCost')" :placeholder="$t('reports.enterFromRentCost')" name="fromRentCost" )
    InputText(:label="$t('reports.toRentCost')" :placeholder="$t('reports.enterToRentCost')" name="toRentCost" )

    InputText(:label="$t('reports.fromMaintenanceCost')" :placeholder="$t('reports.enterFromMaintenanceCost')" name="fromRegularMaintenanceCost" )
    InputText(:label="$t('reports.toMaintenanceCost')" :placeholder="$t('reports.enterToMaintenanceCost')" name="toRegularMaintenanceCost" )
   .flex.justify-end
    el-button.mt-2(  native-type="submit" size='large' type="primary"  class="!rounded-2xl" )  {{ $t('reports.showFilterResult') }}
    el-button.mt-2(  @click="ResetFilter" size='large'   class="!rounded-2xl text-col")  {{ $t('reports.resetFilter') }}
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
    manufacturer: '',
    fromRentCost: '',
    toRentCost: '',
    fromRegularMaintenanceCost: '',
    toRegularMaintenanceCost: ''
  });
  resetForm();
};
</script>
