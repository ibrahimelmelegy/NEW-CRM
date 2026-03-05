<template lang="pug">
ClientForm( :loading="loading" @submit="submitForm")
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('clients.createTitle') }}
    .flex.items-center.gap-x-2
      el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="navigateTo('/sales/clients')") {{ $t('common.cancel') }}
      el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.save') }}

</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
useHead({
  title: t('clients.createTitle')
});
definePageMeta({
  middleware: 'permissions',
  permission: 'CREATE_CLIENTS'
});
const router = useRouter();
const route = useRoute();
const loading = ref(false);
async function submitForm(values: FormattedValues) {
  loading.value = true;
  try {
    const response = await createClient(values);
    if (response?.success) {
      navigateTo('/sales/clients');
    }
  } catch (error: unknown) {
    (useNuxtApp() as unknown).$notify?.error?.({ message: error?.message || t('clients.errors.createFailed') });
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss"></style>
