<template lang="pug">
LeadsForm( :loading="loading" @submit="submitForm" :data="lead")
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('leads.editTitle') }}
    .flex.items-center.gap-x-2
      el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
      el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.update') }}

</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

useHead({
  title: t('leads.editTitle')
});
definePageMeta({
  middleware: 'permissions',
  permission: 'EDIT_LEADS'
});
const router = useRouter();
const route = useRoute();
const loading = ref(false);

const lead = ref<any>(null);

onMounted(async () => {
  loading.value = true;
  const rawSlug = route.params.slug;
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '') as string;
  const leadData = await getLead(slug);
  lead.value = leadData;
  loading.value = false;
});

// Call API to update the lead
async function submitForm(values: LeadValues) {
  loading.value = true;
  await updateLead({ ...values, id: route.params.slug });
  loading.value = false;
}
</script>

<style lang="scss"></style>
