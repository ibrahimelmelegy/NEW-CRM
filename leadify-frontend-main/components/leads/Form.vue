<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  .glass-card.m-auto.p-10(class="2xl:w-1/2 w-[90%] ")
      .grid.grid-cols-2.gap-3
        InputText(:label="$t('leads.table.leadName')"  name="leadName" :value="data?.name" )
        InputText(:label="$t('common.companyName')"  name="companyName" :value="data?.companyName" )
        InputText.mt-4(:label="$t('leads.info.email')"  name="email" :value="data?.email" @value="val=> isEmail = !!val" )
        InputPhone.mt-4(:label="$t('leads.info.phone')"  name="phone" @value="val=> isPhone = !!val" :value="data?.phone" @validphone="val=> validPhone = val" mode="international" )
        InputSelect(:label="$t('leads.table.status')" name="leadState" :options="leadStates" :value="data?.status" )
        InputSelect(:label="$t('leads.info.leadSource')" name="leadSource" :options="leadSources" :value="data?.leadSource" @change="checkIfOtherSource" )
      InputText(:label="$t('leads.info.otherSource')"  name="otherSource" v-if="isOtherSource" :value="data?.otherSource" )
      InputDate.mt-4(:label="$t('leads.info.lastContact')" v-if="route.path.includes('edit')" :placeholder="$t('leads.info.lastContact')" disabledDate="future" :value="data?.lastContactDate || new Date()" name="lastContactDate" )
      InputSelect.mt-4(:label="$t('leads.info.assign')" name="assignUser" isMultiple :options="users" :value="users?.filter((user: {label: string, value: number}) => data?.users?.map((user: {id: number}) => user.id)?.includes(user.value))?.map((user: {label: string, value: number}) => user.value)"  )
      InputText(type="textarea" :placeholder="$t('leads.notes')"  name="notes" :value="data?.notes" )

</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import isEmailValidator from 'validator/lib/isEmail';
const router = useRouter();
const route = useRoute();
const activeStep = defineModel();
const { $i18n } = useNuxtApp();
const t = $i18n.t;

const props = defineProps({
  loading: Boolean,
  label: String,
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['submit']);
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);
const isOtherSource = ref(false);

const formSchema = computed(() =>
  yup.object({
    leadName: yup.string().trim().required().min(2).max(100).label(t('leads.table.leadName')),
    companyName: yup.string().nullable().trim().max(100).label(t('common.companyName')),
    email: yup.string().when([], {
      is: () => isPhone.value,
      then: () =>
        yup
          .string()
          .email()
          .max(100)
          .nullable()
          .test(
            'is-valid',
            (_message: string | object | undefined) => t('errors.invalidEmail'),
            (value: string | undefined) => !value || isEmailValidator(value)
          )
          .label(t('leads.info.email')),
      otherwise: () =>
        yup
          .string()
          .email()
          .max(100)
          .required(t('errors.emailOrPhoneRequired'))
          .test(
            'is-valid',
            (_message: string | object | undefined) => t('errors.invalidEmail'),
            (value: string | undefined) => (value ? isEmailValidator(value) : new yup.ValidationError('Invalid value'))
          )
          .label(t('leads.info.email'))
    }),
    phone: yup.number().when([], {
      is: () => isEmail.value,
      then: () =>
        yup
          .number()
          .nullable() // Allows the value to be null
          .transform((value: number | null, originalValue: unknown) => (originalValue === '' ? null : Number.isNaN(value) ? null : value))
          .label(t('leads.info.phone'))
          .test('Phone number', t('errors.invalidPhone'), function (value: number | null | undefined) {
            if (value === null || value === undefined) {
              return true;
            }
            return !!validPhone.value;
          }),
      otherwise: () =>
        yup
          .number()
          .transform((value: number | null) => (Number.isNaN(value) ? null : value))
          .nullable()
          .required(t('errors.emailOrPhoneRequired'))
          .label(t('leads.info.phone'))
          .test('Phone number', t('errors.invalidPhone'), function (_value: number | null | undefined) {
            return !!validPhone.value;
          })
    }),
    leadState: yup.string().trim().required().min(2).max(100).label(t('leads.table.status')),
    leadSource: yup.string().nullable().trim().max(100).label(t('leads.info.leadSource')),
    otherSource: yup.string().when([], {
      is: () => isOtherSource.value,
      then: () => yup.string().required().trim().min(2).max(100).label(t('leads.info.otherSource')),
      otherwise: () =>
        yup
          .string()
          .trim()
          .nullable()
          .test('min-length-if-entered', t('errors.minLength', { min: 2 }), (value: string | null | undefined) => !value || value.length >= 2)
          .trim()
          .max(250)
          .label(t('leads.info.otherSource'))
    }),
    assignUser: yup.array().of(yup.number()).required().min(1).label(t('leads.info.assign')),
    lastContactDate: yup.date().nullable().label(t('leads.info.lastContact')),
    notes: yup
      .string()
      .trim()
      .nullable()
      .test('min-length-if-entered', t('errors.minLength', { min: 2 }), (value: string | null | undefined) => !value || value.length >= 2)
      .trim()
      .max(2000)
      .label(t('leads.notes'))
  })
);

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: Record<string, unknown>) => {
  emit('submit', values);
});

const usersRes = await useApiFetch('users');
const users = usersRes?.body?.docs?.map((e: { name: string; id: number }) => ({
  label: e.name,
  value: e.id
}));

function checkIfOtherSource(value: { label: string; value: string }) {
  if (value.value === 'OTHER') {
    isOtherSource.value = true;
  } else {
    isOtherSource.value = false;
  }
}
if (props.data?.leadSource === 'OTHER') {
  isOtherSource.value = true;
}
</script>
