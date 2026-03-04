<template lang="pug">
.h-full.w-full
  DocumentHubWrapper(
    documentType="purchase_order"
    backUrl="/procurement/purchase-orders"
    :backLabel="$t('procurement.purchaseOrders.backLabel')"
  )
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PURCHASE_ORDER'
});
</script>
