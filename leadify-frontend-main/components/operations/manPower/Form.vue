<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  div(:class="{'2xl:w-1/2 w-[90%]  card m-auto glass-card p-10 rounded-3xl': !isModal}")
      .grid.grid-cols-2.gap-3
        InputText(:label="$t('operations.manpower.form.fullName')"  name="name" :value="data?.name" )
        InputSelect(:label="$t('operations.manpower.form.nationality')" name="nationality" :options="ManpowerNationalityOptions" :value="data?.nationality" )
        InputText(:label="$t('operations.manpower.form.email')"  name="email" :value="data?.email" @value="val=> isEmail = !!val" )
        InputPhone(:label="$t('operations.manpower.form.phone')"  name="phone" :value="data?.phone" @validphone="val=> validPhone = val" mode="international" @value="val=> isPhone = !!val" )
        InputSelect(:label="$t('operations.manpower.form.role')" name="role" isMultiple :options="manpowerRoles" :value="data?.role" )
        InputSelect(:label="$t('operations.manpower.form.availabilityStatus')" name="availabilityStatus" :options="manpowerAvailabilityStatus" :value="data?.availabilityStatus" )
      InputText(:label="$t('operations.manpower.form.salary')" :placeholder="$t('operations.manpower.form.salaryPlaceholder')" name="salary" :value="data?.salary" )
      .grid.grid-cols-2.gap-3
        InputText.mt-4(:label="$t('operations.manpower.form.variableAllowance')"  :placeholder="$t('operations.manpower.form.variableAllowancePlaceholder')" name="variableAllowance" :value="data?.variableAllowance" )
        InputText.mt-4(:label="$t('operations.manpower.form.transportationAllowance')"  :placeholder="$t('operations.manpower.form.transportationAllowancePlaceholder')" name="transportationAllowance" :value="data?.transportationAllowance" )
        InputText.mt-4(:label="$t('operations.manpower.form.iqamaCost')"  :placeholder="$t('operations.manpower.form.iqamaCostPlaceholder')" name="iqamaCost" :value="data?.iqamaCost" )
        InputText.mt-4(:label="$t('operations.manpower.form.eof')"  :placeholder="$t('operations.manpower.form.eofPlaceholder')" name="endOfServiceBenefit" :value="data?.endOfServiceBenefit" )
        InputText.mt-4(:label="$t('operations.manpower.form.saudization')"  :placeholder="$t('operations.manpower.form.saudizationPlaceholder')" name="saudization" :value="data?.saudization" )
        InputText.mt-4(:label="$t('operations.manpower.form.visaFees')"  :placeholder="$t('operations.manpower.form.visaFeesPlaceholder')" name="visaFees" :value="data?.visaFees" )
        InputText.mt-4(:label="$t('operations.manpower.form.incomingFlight')"  :placeholder="$t('operations.manpower.form.incomingFlightPlaceholder')" name="incomingFlightTicket" :value="data?.incomingFlightTicket" )
        InputText.mt-4(:label="$t('operations.manpower.form.healthInsurance')"  :placeholder="$t('operations.manpower.form.healthInsurancePlaceholder')" name="healthInsurance" :value="data?.healthInsurance" )
      InputText.mt-4(:label="$t('operations.manpower.form.socialInsurance')"  :placeholder="$t('operations.manpower.form.socialInsurancePlaceholder')" name="generalOrganizationForSocialInsurance" :value="data?.generalOrganizationForSocialInsurance" )
      InputText.mt-4(type="textarea" :placeholder="$t('operations.manpower.form.notesPlaceholder')"  :label="$t('operations.manpower.form.notes')"  name="notes" :value="data?.notes" )
  slot(name="modal-footer")
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import isEmailValidator from 'validator/lib/isEmail';
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
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);

const formSchema = yup.object({
  name: yup.string().trim().required().min(2).max(100).label('Full Name'),
  nationality: yup.string().trim().required().min(2).max(100).label('Nationality'),
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
          (message: any) => 'Invalid email',
          (value: any) => !value || isEmailValidator(value)
        )
        .label('Email'),
    otherwise: () =>
      yup
        .string()
        .email()
        .max(100)
        .required('At least one of email or phone number is required')
        .test(
          'is-valid',
          (message: any) => 'Invalid email',
          (value: any) => (value ? isEmailValidator(value) : new yup.ValidationError('Invalid value'))
        )
        .label('Email')
  }),
  phone: yup.number().when([], {
    is: () => isEmail.value,
    then: () =>
      yup
        .number()
        .nullable() // Allows the value to be null
        .transform((value: any, originalValue: any) => (originalValue === '' ? null : Number.isNaN(value) ? null : value))
        .label('Phone Number')
        .test('Phone number', 'Invalid Phone', function (value: any) {
          if (value === null || value === undefined) {
            return true;
          }
          return !!validPhone.value;
        }),
    otherwise: () =>
      yup
        .number()
        .transform((value: any) => (Number.isNaN(value) ? null : value))
        .nullable()
        .required('At least one of email or phone number is required')
        .label('Phone Number')
        .test('Phone number', 'invalid Phone', function (value: any) {
          return !!validPhone.value;
        })
  }),
  role: yup.array().of(yup.string()).required().min(1).label('Role'),
  availabilityStatus: yup.string().trim().required().min(2).max(100).label('Availability Status'),
  salary: yup
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
    .label('Salary'),
  variableAllowance: yup
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
    .label('V. Allowance'),
  transportationAllowance: yup
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
    .label('T. Allowance'),
  iqamaCost: yup
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
    .label('Iqama Cost'),
  endOfServiceBenefit: yup
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
    .label('V. Allowance'),
  saudization: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Saudization'),
  visaFees: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Visa Fees'),
  incomingFlightTicket: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Incoming Flight'),
  healthInsurance: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('Health Insurance'),
  generalOrganizationForSocialInsurance: yup
    .string() // Use string to allow flexible input (empty, float, or integer)
    .nullable()
    .test(
      'is-valid-number',
      'Please enter a valid number.', // Custom error message
      (value: any) => {
        if (!value) return true; // Allow empty input
        return /^\d*\.?\d*$/.test(value); // Check if value is a valid integer or float
      }
    )
    .max(25)
    .label('General Organization for Social Insurance'),
  notes: yup.string().nullable().trim().max(2000).label('Additional Notes')
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: any, actions: any) => {
  emit('submit', cleanObject(values));
});

if (props.data?.email) {
  isEmail.value = true;
} else if (props.data?.phone) {
  isPhone.value = true;
}
</script>
