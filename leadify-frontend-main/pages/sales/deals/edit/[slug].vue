<template lang="pug">
.flex.items-center.justify-between.mb-8
  .title.font-bold.text-2xl.mb-1.capitalize.mb-5.mt-5 {{ $t('deals.editTitle') }}
  .flex.items-center.gap-x-2
    el-button(size='large' plain type="primary" class="w-full !rounded-2xl" @click="navigateTo('/sales/deals')") {{ $t('common.cancel') }}
    el-button(size='large' type="primary" native-type="submit" :loading="loading" :disabled="loading" class="w-full !px-5 !rounded-2xl" @click="saveAllForms") {{ $t('common.save') }}
el-tabs.demo-tabs(v-model="activeName", :lazy="false")
  el-tab-pane(:label="$t('deals.tabs.deal')", name="deal")
    DealInformation( :loading="loading" ref="informationRef" @onSubmit="getDealInformation" :deal="deal" editMode)
  el-tab-pane(:label="$t('deals.tabs.invoices')", name="invoices")
    DealInvoices( :loading="loading" ref="invoicesRef" @onSubmit="getInvoices" :invoices="deal.invoice" editMode @isValid="(value)=>isInvoices = value")
  el-tab-pane(:label="$t('deals.tabs.deliveries')", name="delivery")
    DealDelivery( :loading="loading" ref="deliveryRef" @onSubmit="getDeliveries" :deliveries="deal.deliveryDetails" editMode @isValid="(value)=>isDeliveries = value")
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import logger from '~/utils/logger';
const { t } = useI18n();
const activeName = ref('deal');
const informationRef = ref();
const invoicesRef = ref();
const deliveryRef = ref();
useHead({
  title: t('deals.editTitle')
});
definePageMeta({
  middleware: 'permissions',
  permission: 'EDIT_DEALS'
});
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const isInvoices = ref(false);
const isDeliveries = ref(false);

const combinedValues = ref<DealValues>({});

const deal = await getDeal(route.params.slug as string);

function getDealInformation(values: unknown) {
  combinedValues.value = { ...combinedValues.value, ...values };
}

function getInvoices(values: unknown) {
  combinedValues.value.invoiceDetails = [...values];
}

function getDeliveries(values: unknown) {
  combinedValues.value.deliveryDetails = [...values];
}

async function ensureTabRefs() {
  const originalTab = activeName.value;
  for (const tab of ['deal', 'invoices', 'delivery']) {
    activeName.value = tab;
    await nextTick();
  }
  activeName.value = originalTab;
  await nextTick();
}

async function saveAllForms() {
  // reset the values
  combinedValues.value = {};
  try {
    loading.value = true;
    await ensureTabRefs();
    await informationRef.value?.onSubmitInformation();
    await invoicesRef.value?.onSubmitInvoices();
    await deliveryRef.value?.onSubmitDeliveries();
    if ((combinedValues.value?.deal?.name || combinedValues.value?.name) && isInvoices.value && isDeliveries.value) {
      let response;
      if (combinedValues.value?.clientId) {
        response = await updateDeal({
          ...combinedValues.value.deal,
          clientId: combinedValues.value.clientId,
          dealId: route.params.slug as string
        } as unknown);
      } else {
        response = await updateDeal({ ...combinedValues.value, dealId: route.params.slug as string } as unknown);
      }
      if (response?.success) {
        navigateTo('/sales/deals');
      }
    }
  } catch (error) {
    logger.error('Error saving forms:', error);
  } finally {
    loading.value = false;
  }
}
</script>
