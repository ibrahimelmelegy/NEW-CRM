<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  div(:class="{'2xl:w-1/2 w-[90%] p-10  card m-auto glass-card rounded-3xl': !isModal}")
    .grid.grid-cols-2.gap-3
      InputText(:label="$t('operations.service.form.name')" name="type" :placeholder="$t('operations.service.form.enterName')" :value="data?.type" )
      InputText(:label="$t('operations.service.form.cost')"  :placeholder="$t('operations.service.form.enterCost')" name="price" :value="data?.price" )
  slot(name="modal-footer")
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const router = useRouter();
const props = defineProps({
  loading: Boolean,
  label: String,
  isModal: Boolean,
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['submit']);

const formSchema = yup.object({
  type: yup.string().trim().required().min(2).max(100).label(t('operations.service.form.name')),
  price: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .required()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label(t('operations.service.form.cost'))
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: any, actions: any) => {
  emit('submit', values);
});
</script>
