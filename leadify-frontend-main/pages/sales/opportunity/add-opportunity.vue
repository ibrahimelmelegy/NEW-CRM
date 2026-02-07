<template lang="pug">
OpportunityForm( :loading="loading" @submit="submitForm" @leadId="(value)=>  leadId = value" :editMode="route.query.leadId")
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('opportunities.createTitle') }}
    .flex.items-center.gap-x-2
      el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
      el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.save') }}

</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();
  useHead({
    title: t('opportunities.createTitle'),
  });

  definePageMeta({
    middleware: "permissions",
    permission: "CREATE_OPPORTUNITIES",
  });

  const router = useRouter();
  const route = useRoute();
  const loading = ref(false);
  const leadId = ref("");
  async function submitForm(values: FormattedValues) {
    loading.value = true;
    if (values?.clientId) {
      await createOpportunity(values);
    } else if (route.query.leadId || leadId.value) {
      await convertLeadToOpportunity({
        ...values.opportunity,
        ...((route.query.leadId || leadId.value) && { leadId: route.query.leadId || leadId.value }),
        ...(values.clientId && { clientId: values.clientId }),
      });
    } else {
      await createOpportunity(values);
    }
    loading.value = false;
  }
</script>

<style lang="scss"></style>
