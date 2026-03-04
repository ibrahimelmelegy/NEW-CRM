<template lang="pug">
FormPage(
  :title="$t('payments.recordPayment')"
  :subtitle="$t('payments.recordPaymentSubtitle')"
  :breadcrumbs="[{ label: $t('navigation.finance'), to: '/finance/payments' }, { label: $t('payments.title'), to: '/finance/payments' }, { label: $t('payments.record') }]"
  :loading="saving"
  @submit="handleSubmit"
)
  PaymentPaymentForm(
    ref="paymentFormRef"
    :invoiceId="preselectedInvoiceId"
    @submitted="onFormSubmitted"
  )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { recordPayment } from '~/composables/usePayments';

definePageMeta({ middleware: 'permissions' });
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const saving = ref(false);
const paymentFormRef = ref();

const preselectedInvoiceId = computed(() => {
  return route.query.invoiceId ? String(route.query.invoiceId) : undefined;
});

async function handleSubmit() {
  // Trigger form submission through the child component
  paymentFormRef.value?.submit();
}

async function onFormSubmitted(formData: any) {
  saving.value = true;
  try {
    const res = await recordPayment({
      invoiceId: formData.invoiceId ? Number(formData.invoiceId) : undefined,
      clientId: formData.clientId,
      amount: formData.amount,
      date: formData.date,
      method: formData.method,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined
    });

    if (res.success) {
      router.push('/finance/payments');
    }
  } finally {
    saving.value = false;
  }
}
</script>
