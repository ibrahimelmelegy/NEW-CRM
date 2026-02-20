<template lang="pug">
FormPage(
  :title="'Record Payment'"
  :subtitle="'Record a new payment against a client or invoice'"
  :breadcrumbs="[{ label: 'Finance', to: '/finance/payments' }, { label: 'Payments', to: '/finance/payments' }, { label: 'Record' }]"
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
