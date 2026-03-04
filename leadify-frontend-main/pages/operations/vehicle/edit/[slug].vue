<template lang="pug">
OperationsVehicleForm( :loading="loading" @submit="submitForm" :data="vehicle")
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.vehicles.edit') }}
    .flex.items-center.gap-x-2
      el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
      el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.save') }}

</template>

<script lang="ts" setup>
const { t } = useI18n();
useHead({
  title: computed(() => `App HP Tech | ${t('operations.vehicles.edit')}`)
});
definePageMeta({
  middleware: 'permissions',
  permission: 'EDIT_VEHICLES'
});
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const vehicle = await getVehicle(route.params.slug as string);

async function submitForm(values: Vehicle) {
  loading.value = true;
  await updateVehicle({ ...values, vehicleId: +(route.params.slug as string) });
  loading.value = false;
}
</script>

<style lang="scss"></style>
