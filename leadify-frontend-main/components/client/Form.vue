<template lang="pug">
el-form.mb-24(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  .glass-card.m-auto(class="2xl:w-1/2 w-[90%] " :class="!withoutPading ? 'p-10' : 'p-[0px]'")
    .flex.align-center.justify-between
      span
      el-switch.my-4(v-if="!editMode && mappedLeads?.length" v-model="switchValue", size="large" inline-prompt, style="--el-switch-on-color: #7849FF; --el-switch-off-color: #918E98", :active-text="$t('clients.form.existingLead')", :inactive-text="$t('clients.form.newClient')")
    .grid.grid-cols-2.gap-3
      component.mt-3(:is="isLeads" :label="switchValue && !editMode && mappedLeads?.length ? $t('clients.form.leadName') : $t('clients.form.clientName')"  name="clientName" :options="mappedLeads" is-form :value="selectedLead?.name || data?.clientName" @change="getSelectedLead" )
      InputText.mt-3(:label="$t('clients.form.companyName')"  name="companyName" :value="selectedLead?.companyName  || data?.companyName" is-form)
      InputText.mt-3(:label="$t('clients.form.email')"  name="email" :value="selectedLead?.email || data?.email" @value="val=> isEmail = !!val" is-form)
      InputPhone.mt-3(:label="$t('clients.form.phone')"  name="phone" :value="selectedLead?.phone || data?.phoneNumber" @value="val=> isPhone = !!val" @validphone="val=> validPhone = val" mode="international")
      InputSelect.mt-3(:label="$t('clients.form.clientType')" name="clientType" :options="clientTypes" :value="data?.clientType")
      InputSelect.mt-3(:label="$t('clients.form.assignUser')" name="users" isMultiple :options="users" :value="users?.filter((user) => data?.users?.map((user) => user.id)?.includes(user.value))?.map((user) => user.value)" )
    .grid.grid-cols-2.gap-3
      InputText(:label="$t('clients.form.city')" name="city"  :placeholder="$t('clients.form.enterCity')"  :value="data?.city" )
      InputText(:label="$t('clients.form.street')" name="streetAddress"  :placeholder="$t('clients.form.enterStreet')"  :value="data?.streetAddress" )
      InputText.mt-3(:label="$t('clients.form.state')" name="state"  :placeholder="$t('clients.form.enterState')"  :value="data?.state" )
      InputText.mt-3(:label="$t('clients.form.zipCode')" name="zipCode"  :placeholder="$t('clients.form.enterZip')"  :value="data?.zipCode" )
      InputSelect.mt-3(:label="$t('clients.form.industry')" name="industry" :options="clientIndustries" :value="data?.industry" )
      InputSelect.mt-3(:label="$t('clients.form.clientStatus')" name="clientStatus" :options="clientStatuses" :value="data?.clientStatus" )
    InputUploadFiles.mt-3(:label="$t('clients.form.uploadFile')" name="file" :value="data?.fileUpload?.map((file) => ({name: file, response: file, uid: uuidv4() }))" multiple)
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import isEmailValidator from 'validator/lib/isEmail';
import { useI18n } from 'vue-i18n';
import { v4 as uuidv4 } from 'uuid';
const { t } = useI18n(); // To generate unique IDs
const route = useRoute();
const props = defineProps({
  loading: Boolean,
  withoutPading: Boolean,
  label: String,
  data: {
    type: Object,
    required: false
  },
  editMode: {
    type: Boolean,
    required: false
  }
});

const switchValue = ref(true);
const emit = defineEmits(['submit', 'leadId']);
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);
const formSchema = yup.object({
  clientName: yup.string().trim().required().min(2).max(100).label(t('clients.form.clientName')),
  companyName: yup.string().nullable().trim().max(100).label(t('clients.form.companyName')),
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
          (message: unknown) => t('errors.invalidEmail'),
          (value: unknown) => !value || isEmailValidator(value)
        )
        .label(t('clients.form.email')),
    otherwise: () =>
      yup
        .string()
        .email()
        .max(100)
        .required(t('errors.required'))
        .test(
          'is-valid',
          (message: unknown) => t('errors.invalidEmail'),
          (value: unknown) => (value ? isEmailValidator(value) : new yup.ValidationError('Invalid value'))
        )
        .label(t('clients.form.email'))
  }),
  phone: yup.number().when([], {
    is: () => isEmail.value,
    then: () =>
      yup
        .number()
        .nullable() // Allows the value to be null
        .transform((value: unknown, originalValue: unknown) => (originalValue === '' ? null : Number.isNaN(value) ? null : value))
        .label(t('clients.form.phone'))
        .test('Phone number', t('errors.invalidPhone'), function (value: unknown) {
          if (value === null || value === undefined) {
            return true;
          }
          return !!validPhone.value;
        }),
    otherwise: () =>
      yup
        .number()
        .transform((value: unknown) => (Number.isNaN(value) ? null : value))
        .nullable()
        .required(t('errors.required'))
        .label(t('clients.form.phone'))
        .test('Phone number', t('errors.invalidPhone'), function (value: unknown) {
          return !!validPhone.value;
        })
  }),
  clientType: yup.string().trim().nullable().max(100).label(t('clients.form.clientType')),
  users: yup.array().of(yup.number()).nullable().label(t('clients.form.assignUser')),
  city: yup.string().nullable().trim().max(50).label(t('clients.form.city')),
  streetAddress: yup.string().nullable().trim().max(100).label(t('clients.form.street')),
  state: yup.string().nullable().trim().max(50).label(t('clients.form.state')),
  zipCode: yup.string().nullable().trim().max(10).label(t('clients.form.zipCode')),
  industry: yup.string().trim().nullable().max(100).label(t('clients.form.industry')),
  clientStatus: yup.string().trim().nullable().max(100).label(t('clients.form.clientStatus')),
  file: yup.array().nullable().label(t('clients.form.uploadFile'))
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: unknown, actions: unknown) => {
  const formattedValues = cleanObject({
    ...values,
    ...(values.file?.length && { fileUpload: values.file?.map(file => file.response) }),
    ...(selectedLead.value && switchValue.value && !props.editMode && { leadId: selectedLead.value?.id })
  });
  delete formattedValues.file;

  emit('submit', formattedValues);
});

let users: unknown = await useApiFetch('users');
users = users?.body?.docs?.map(e => ({
  label: e.name,
  value: e.id
}));

const selectedLead = ref<Record<string, unknown>>([]);
const response = await getLeads();
const leads = response.leads;

const mappedLeads = leads?.map(e => ({
  label: e.name,
  value: e.name,
  id: e.id
}));

const leadId = props.data?.leadId || route.query?.leadId;

if (leadId) {
  let lead = selectedLead.value;

  if (props.data?.leadId) {
    lead = await getLead(leadId);
    if (lead) {
      selectedLead.value = lead;
    }
  } else {
    selectedLead.value = leads?.find(lead => lead.id === leadId);
  }

  if (selectedLead.value) {
    isEmail.value = Boolean(selectedLead.value.email);
    isPhone.value = !isEmail.value && Boolean(selectedLead.value.phone);
  }
}

function getSelectedLead(e: unknown) {
  selectedLead.value = leads?.find(lead => lead.id === e.id);
  if (selectedLead.value?.email) {
    isEmail.value = true;
  } else if (selectedLead.value?.phone) {
    isPhone.value = true;
  }
}

const isLeads = computed(() => {
  return mappedLeads?.length && switchValue.value && !props.editMode ? resolveComponent('InputSelect') : resolveComponent('InputText');
});
</script>
