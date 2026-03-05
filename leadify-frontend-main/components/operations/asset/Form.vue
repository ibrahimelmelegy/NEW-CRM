<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  div(:class="{'2xl:w-1/2 w-[90%]  card m-auto glass-card p-10 rounded-3xl': !isModal}")
    InputText(:label="$t('operations.assets.form.name')" name="name" :placeholder="$t('operations.assets.form.namePlaceholder')" :value="data?.name" )
    .grid.grid-cols-2.gap-3
      InputText.mt-4(:label="$t('operations.assets.form.rentPrice')"  :placeholder="$t('operations.assets.form.rentPricePlaceholder')" name="rentPrice" :value="data?.rentPrice" )
      InputText.mt-4(:label="$t('operations.assets.form.buyPrice')"  :placeholder="$t('operations.assets.form.buyPricePlaceholder')" name="buyPrice" :value="data?.buyPrice" )
  slot(name="modal-footer")
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
const router = useRouter();
const props = defineProps({
  loading: Boolean,
  isModal: Boolean,
  label: String,
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['submit']);

const formSchema = yup.object({
  name: yup.string().trim().required().min(2).max(100).label('Assets Name'),
  rentPrice: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: unknown) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Rent Price'),
  buyPrice: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: unknown) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Buy Price')
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: unknown, actions: unknown) => {
  emit('submit', values);
});
</script>
