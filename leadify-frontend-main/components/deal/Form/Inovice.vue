<template lang="pug">
el-form(
  autocomplete="off"
  @submit.prevent="onSubmit"
  ref="formRef"
  label-position="top"
)
  .card.m-auto.bg-neutral-50.p-6.rounded-3xl.mb-4
    .flex.justify-between.items-center.mb-4
      h3.text-xl.font-semibold.my-4 {{ $t('deals.form.invoiceTitle') }}
      el-button(
        v-if="!editMode"
        size="medium"
        plain
        type="primary"
        :icon="Delete"
        native-type="button"
        class="!rounded-2xl !py-5 !px-3"
        @click="onDelete"
      )
    .grid.grid-cols-2.gap-3
      InputText(:label="$t('deals.table.invoiceNumber')" name="invoiceNumber" :value="invoice?.invoiceNumber")
      InputText(:label="$t('deals.table.amount')" type="number" name="amount" :value="invoice?.amount")
      InputDate.mt-4(:label="$t('deals.form.enterInvoiceDate')" :placeholder="$t('deals.form.enterInvoiceDate')" :value="invoice?.invoiceDate" name="invoiceDate")
      InputSelect.mt-4(
        :label="$t('deals.form.chooseCollected')"
        :placeholder="$t('deals.form.chooseCollected')"
        name="collected"
        :options="[{ label: $t('common.yes'), value: true }, { label: $t('common.no'), value: false }]"
        :value="invoice?.collected"
        @change="handleCollectedChange"
      )
      InputDate(
        :label="$t('deals.form.enterCollectedDate')"
        v-if="isCollected"
        :placeholder="$t('deals.form.enterCollectedDate')"
        :value="invoice?.collectedDate"
        name="collectedDate"
      )
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';

import { Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { id } from 'yup-locales';

const { t } = useI18n();

// Props
const props = defineProps({
  invoice: { type: Object, required: true },
  editMode: { type: Boolean, required: false }
});

// Emit events
const emit = defineEmits(['onSubmit', 'onDelete']);

// Validation schema
const formSchema = yup.object({
  invoiceNumber: yup.string().trim().required().min(2).max(50).label(t('deals.table.invoiceNumber')),
  amount: yup
    .number()
    .required()
    .label(t('deals.table.amount'))
    .transform((value: any, originalValue: any) => (String(originalValue).trim() === '' ? null : value)),
  invoiceDate: yup.date().nullable().label(t('deals.table.invoiceDate')),
  collectedDate: yup.date().nullable().label(t('deals.table.collectedDate')),
  collected: yup.string().trim().nullable().label(t('deals.table.collected'))
});

// Form setup
const { handleSubmit, errors, validate, values } = useForm({ validationSchema: formSchema });

const formRef = ref();

//  Emit submittion values
const onSubmit = handleSubmit((values: any) => {
  const formattedValues = {
    ...values,
    id: props.invoice.id,
    collectedDate: isCollected.value ? values.collectedDate : null
  };
  emit('onSubmit', formattedValues);
});

// Emit delete
function onDelete() {
  emit('onDelete', props.invoice.id);
}

/**
 * Handles the change event for the "collected" field.
 */
const isCollected = ref(false);
function handleCollectedChange(value: any) {
  if (value.label === 'Yes') {
    isCollected.value = true;
  } else {
    isCollected.value = false;
  }
}
if (props.invoice?.collected) {
  isCollected.value = true;
}

// Expose methods to the parent component
defineExpose({ onSubmit, validate, errors, values });
</script>
