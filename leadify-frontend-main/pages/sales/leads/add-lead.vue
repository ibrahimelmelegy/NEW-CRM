<template lang="pug">
LeadsForm( :loading="loading" @submit="submitForm")
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('leads.createTitle') }}
    .flex.items-center.gap-x-2
      el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
      el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.save') }}

</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();
  useHead({
    title: t('leads.createTitle'),
  });
  definePageMeta({
    middleware: "permissions",
    permission: "CREATE_LEADS",
  });
  const router = useRouter();
  const loading = ref(false);
  async function submitForm(values: LeadValues) {
    loading.value = true;
    await createLead(values);
    loading.value = false;
  }
</script>

<style lang="scss"></style>
