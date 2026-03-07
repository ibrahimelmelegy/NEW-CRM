<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  .glass-card.m-auto.p-10(class="2xl:w-1/2 w-[90%] ")
      el-switch.my-4(v-if="!editMode" v-model="switchType", size="large" inline-prompt, style="--el-switch-on-color: #7849FF; --el-switch-off-color: #918E98", :active-text="$t('deals.form.selectClient')", :inactive-text="$t('deals.form.selectLead')")
      .flex.justify-between.items-center.mb-6(v-if="switchType")
        h3.text-xl.font-semibold {{ $t('deals.form.clientInfo') }}
        el-switch.ml-2(v-if="!editMode" v-model="switchValue", size="large" inline-prompt, style="--el-switch-on-color: #7849FF; --el-switch-off-color: #918E98", :active-text="$t('deals.form.existingClient')", :inactive-text="$t('deals.form.newClient')")
      .grid.grid-cols-2.gap-3(v-if="switchType" :key="selectedClient")
        component(:is="isClients" :label="$t('deals.info.client')"  name="leadName" :options="mappedClients" :value="selectedClient?.clientName" @change="getSelectedClient" :disabled="editMode")
        InputText(:label="$t('common.companyName')"  name="leadCompanyName" :value="selectedClient?.companyName" :disabled="editMode" is-form)
        InputText(:label="$t('leads.info.email')"  name="email" :value="selectedClient?.email" @value="val=> isEmail = !!val" :disabled="editMode" is-form)
        InputPhone(:label="$t('leads.info.phone')"  name="phone" :value="selectedClient?.phoneNumber" @validphone="val=> validPhone = val" @value="val=> isPhone = !!val" mode="international" :disabled="editMode")
      h3.text-xl.font-semibold.my-6 {{ $t('deals.form.dealInfo') }}
      .grid.grid-cols-2.gap-3
        InputSelect(v-if="!switchType" :label="$t('deals.info.lead')" name="leadId" :options="mappedLeads" :value="selectedLead?.id" :disabled="editMode")
        InputText(:label="$t('deals.info.dealName')"  name="dealName" :value="deal?.name"  is-form)
        InputText(:label="$t('common.companyName')"  name="companyName" :value="deal?.companyName" is-form)
        InputText(:label="$t('deals.info.price')"  type="number" name="dealPrice" :value="deal?.price" is-form)
        InputSelect(:label="$t('deals.info.contractType')" name="contractType" :options="contractTypeOptions" :value="deal?.contractType" )
        InputSelect(:label="$t('deals.table.assigned')" name="assignUser" isMultiple :options="users" :value="users?.filter((user) => deal?.users?.map((user) => user.id)?.includes(user.value))?.map((user) => user.value)"  )
        InputDate(:label="$t('deals.info.signatureDate')" :placeholder="$t('deals.form.enterSignatureDate')" :value="deal?.signatureDate" name="signatureDate" )
        InputSelect(:class="{'col-span-2': switchType}" :label="$t('deals.info.dealStage')" name="dealStage" :options="dealStageOptions" :value="deal?.stage" @change="checkIfCancelled" )
      InputText(type="textarea" :placeholder="$t('deals.form.cancellationReason')"  name="cancellationReason" :value="deal?.cancelledReason" v-if="isCancelled")
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import isEmailValidator from 'validator/lib/isEmail';
import * as yup from 'yup';
import { Plus } from '@element-plus/icons-vue';
const props = defineProps({
  editMode: Boolean,
  deal: Object
});

//  refs and composables
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const switchValue = ref(true);
const switchType = ref(false);
const isCancelled = ref(false);
const validPhone = ref(true);
const loading = ref(false);
const emit = defineEmits(['onSubmit']);
const myForm = ref();
const isEmail = ref(false);
const isPhone = ref(false);

// form schema for validation
const formSchema = yup.object({
  leadName: yup.string().when([], {
    is: () => switchType.value,
    then: () => yup.string().trim().required().min(2).max(100).label(t('deals.info.client')),

    otherwise: () => yup.string().nullable().trim().max(100).label(t('deals.info.client'))
  }),
  leadCompanyName: yup.string().nullable().trim().max(100).label(t('common.companyName')),
  leadId: yup.string().when([], {
    is: () => !switchType.value,
    then: () => yup.string().required().label(t('deals.info.lead')),

    otherwise: () => yup.string().nullable().label(t('deals.info.lead'))
  }),
  email: yup.string().when([], {
    is: () => isPhone.value || !switchType.value,
    then: () =>
      yup
        .string()
        .email()
        .max(100)
        .nullable()
        .test(
          'is-valid',
          (message: unknown) => 'Invalid email',
          (value: unknown) => !value || isEmailValidator(value)
        )

        .label(t('leads.info.email')),
    otherwise: () =>
      yup
        .string()
        .email()
        .max(100)
        .nullable(t('errors.emailOrPhoneRequired'))
        .test(
          'is-valid',
          (message: unknown) => 'Invalid email',
          (value: unknown) => (value ? isEmailValidator(value) : new yup.ValidationError('Invalid value'))
        )
        .label(t('leads.info.email'))
  }),
  phone: yup.number().when([], {
    is: () => isEmail.value || !switchType.value,
    then: () =>
      yup
        .number()
        .nullable() // Allows the value to be null
        .transform((value: unknown, originalValue: unknown) => (originalValue === '' ? null : Number.isNaN(value) ? null : value))
        .label(t('leads.info.phone'))
        .test('Phone number', 'Invalid Phone', function (value: unknown) {
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
        .required(t('errors.emailOrPhoneRequired'))
        .label(t('leads.info.phone'))
        .test('Phone number', 'invalid Phone', function (value: unknown) {
          return !!validPhone.value;
        })
  }),
  dealName: yup.string().trim().required().min(2).max(100).label(t('deals.info.dealName')),
  companyName: yup.string().trim().required().min(2).max(100).label(t('common.companyName')),
  contractType: yup.string().trim().required().max(100).label(t('deals.info.contractType')),
  dealStage: yup.string().trim().required().max(100).label(t('deals.info.dealStage')),
  assignUser: yup.array().of(yup.number()).required().min(1).label(t('deals.table.assigned')),
  dealPrice: yup
    .number()
    .nullable() // Allows null values
    .transform((value: unknown, originalValue: unknown) => (String(originalValue).trim() === '' ? null : value))
    .required(t('validation.required', { field: t('deals.info.price') }))
    .max(100000000000)
    .label(t('deals.info.price')),
  signatureDate: yup
    .mixed()
    .test('is-valid-date', 'Signature Date must be a valid date', (value: unknown) => {
      // Check if the value is valid
      return value && !isNaN(new Date(value).getTime());
    })
    .required(t('validation.required', { field: t('deals.info.signatureDate') }))
    .label(t('deals.info.signatureDate')),
  cancellationReason: yup.string().when([], {
    is: () => isCancelled.value,
    then: () => yup.string().required().trim().min(2).max(250).label(t('deals.form.cancellationReason')),
    otherwise: () =>
      yup
        .string()
        .trim()
        .nullable()
        .test('min-length-if-entered', 'Cancellation Reason must be at least 2 characters', (value: unknown) => !value || value.length >= 2)
        .trim()
        .max(250)
        .label(t('deals.form.cancellationReason'))
  })
});

/**
 * Checks if the deal stage has been set to 'Cancelled'.
 */
function checkIfCancelled(value: unknown) {
  if (value.label === 'Cancelled') {
    isCancelled.value = true;
  } else {
    isCancelled.value = false;
  }
}

if (props.deal?.cancelledReason) {
  isCancelled.value = true;
}

//  Get Users
const users = ref<Record<string, unknown>[]>([]);
const mappedLeads = ref<Record<string, unknown>[]>([]);
const selectedClient = ref<Record<string, unknown>>([]);
const mappedClients = ref<{ label: string; value: unknown }[]>();
const allClients = ref<Record<string, unknown>[]>([]);
const selectedLead = ref<string | null>();
const leadId = route.query?.leadId || props?.deal?.leadId;
const opportunityId = route.query?.opportunityId;

onMounted(async () => {
  // Fetch users
  const usersRes: unknown = await useApiFetch('users');
  users.value =
    usersRes?.body?.docs?.map(e => ({
      label: e.name,
      value: e.id
    })) || [];

  // Fetch leads
  const leadsResponse = await getLeads();
  const leads = leadsResponse.leads;
  mappedLeads.value =
    leads?.map(e => ({
      label: e.name,
      value: e.id
    })) || [];

  // Fetch clients
  const { clients } = await getClients();
  allClients.value = clients || [];
  mappedClients.value = clients?.map(e => ({
    label: e.clientName,
    value: e.clientName,
    id: e.id
  }));

  if (props.deal?.clientId) {
    selectedClient.value = clients?.find(client => client.id === props.deal?.clientId);
    switchType.value = true;
  }

  if (leadId) {
    let lead: unknown = leads?.find(l => l.id === leadId);

    if (!lead || opportunityId) {
      lead = await getLead(leadId as string);
    }

    if (lead) {
      mappedLeads.value = [...mappedLeads.value, { label: lead.name, value: lead.id }];
      selectedLead.value = lead;
    }
  }

  if (selectedClient.value?.email) {
    isEmail.value = true;
  } else if (selectedClient.value?.phone) {
    isPhone.value = true;
  }
});

/**
 * Updates the selectedClient variable when a new lead is selected.
 * @param {Object} e - The selected lead object
 */
function getSelectedClient(e: unknown) {
  // Find the selected lead in the clients array and update the selectedClient variable
  selectedClient.value = allClients.value?.find(lead => lead.id === e.id);

  if (selectedClient.value?.email) {
    isEmail.value = true;
  } else if (selectedClient.value?.phone) {
    isPhone.value = true;
  }
}
// computed property to determine which component to render
const isClients = computed(() => {
  return mappedClients.value?.length && switchValue.value ? resolveComponent('InputSelect') : resolveComponent('InputText');
});

// Form Validation
const { handleSubmit, errors, validate, resetForm, values } = useForm({
  validationSchema: formSchema
});

watch(
  () => switchValue.value,
  () => {
    // if (!switchValue.value) {
    selectedClient.value = null;
    // }
  }
);

// submit deal form
const onSubmit = handleSubmit((values: unknown) => {
  try {
    // Prepare formatted values
    const formattedValues = {
      lead: formatLeadData(values),
      deal: formatDealData(values)
    };

    // Set loading state to true
    loading.value = true;

    // Prepare submission payload
    const leadId = route.query?.leadId;
    const opportunityId = route.query?.opportunityId;
    const shouldSubmitWithLead = leadId || (mappedLeads.value?.length && !switchType.value && values.leadId);

    const payload =
      shouldSubmitWithLead || selectedClient.value
        ? {
            ...(switchType.value ? { deal: formattedValues.deal } : formattedValues.deal),
            ...(!route.path.includes('edit') && !switchType.value && { leadId: leadId || values.leadId }),
            ...(switchType.value && { clientId: selectedClient.value?.id }),
            ...(opportunityId && { opportunityId })
          }
        : formattedValues;

    // Emit the submission event
    emit('onSubmit', payload);
  } catch (error) {
    console.error('Error while submitting the form:', error);
  } finally {
    // Reset loading state
    loading.value = false;
  }
});

// Utility functions for formatting data
function formatLeadData(values: unknown) {
  return cleanObject({
    name: values.leadName,
    companyName: values.leadCompanyName,
    email: values.email,
    phone: normalizePhoneNumber(values.phone),
    users: values.assignUser
  });
}

function formatDealData(values: unknown) {
  return cleanObject({
    name: values.dealName,
    price: Number(values.dealPrice),
    contractType: values.contractType,
    stage: values.dealStage,
    signatureDate: getYear(values.signatureDate),
    cancelledReason: values.cancellationReason,
    companyName: values.companyName,
    users: values.assignUser
  });
}

async function onSubmitForm(): Promise<boolean> {
  // Validate the form, and exit early if validation fails
  await validate();
  if (Object.keys(errors.value).length) return false;
  try {
    await onSubmit();
    return true; // form submitted successfully
  } catch (error) {
    ElMessage.error('Submission failed');
    return false; // Submission failed
  }
}

async function onSubmitInformation() {
  const isSubmitted = await onSubmitForm();

  // Only proceed if all forms are submitted successfully
  if (!isSubmitted) {
    ElMessage.error('Please fill in all the required in Deal information fields.');
  }
}

// Expose methods to the parent component
defineExpose({
  onSubmitInformation
});
</script>
