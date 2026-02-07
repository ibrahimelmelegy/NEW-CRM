<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  .glass-card.m-auto.p-10(class="2xl:w-1/2 w-[90%] ")
        el-switch.my-4(v-if="!editMode" v-model="switchType", size="large" inline-prompt, style="--el-switch-on-color: #7849FF; --el-switch-off-color: #918E98", active-text="Select Lead", inactive-text="Select Client")
        .flex.justify-between.items-center.mb-6(v-if="switchType")
          h3.text-xl.font-semibold {{ $t('leads.details') }}
          el-switch.ml-2(v-if="!editMode" v-model="switchValue", size="large" inline-prompt, style="--el-switch-on-color: #7849FF; --el-switch-off-color: #918E98", :active-text="$t('leads.newLead')", :inactive-text="$t('leads.title')")
        .grid.grid-cols-2.gap-3(v-if="switchType")
          component(:is="isLeads" :label="$t('leads.table.leadName')"  name="leadName" :options="mappedLeads" :value="selectedLead?.name" @change="getSelectedLead" :disabled="editMode" )
          InputText(:label="$t('common.companyName')"  name="companyName" :value="selectedLead?.companyName" :disabled="editMode" is-form)
          InputText(:label="$t('leads.info.email')"  name="email" :value="selectedLead?.email" @value="val=> isEmail = !!val" :disabled="editMode" is-form)
          InputPhone(:label="$t('leads.info.phone')"  name="phone" :value="selectedLead?.phone" @value="val=> isPhone = !!val" @validphone="val=> validPhone = val" mode="international" :disabled="editMode")
        h3.text-xl.font-semibold.my-6 {{ $t('opportunities.details') }}
        .grid.grid-cols-2.gap-3
          InputSelect(v-if="!switchType" :label="$t('deals.info.client')" name="clientId" :options="mappedClients" :value="data?.clientId" )
          InputText(:label="$t('opportunities.table.name')"  name="opportunityName" :value="data?.name" )
          InputSelect(:label="$t('opportunities.table.stage')" name="opportunityStage" :options="stageOptions.map(o => ({...o, label: $t(o.label)}))" :value="data?.stage" @change="checkIfCancelled" )
          InputText(:label="$t('opportunities.table.profit') + ' (Optional)'" type="number" :placeholder="$t('opportunities.table.profit')" name="profit" :value="data?.profit" )
          InputSelect(:class="{'col-span-2': !switchType}" :label="$t('opportunities.table.assigned')" name="assignUser" isMultiple :options="users" :value="users?.filter((user: any) => data?.users?.map((user: any) => user.id)?.includes(user.value))?.map((user: any) => user.value)" )
        .grid.grid-cols-2.gap-3
          InputText.mt-4(:label="$t('opportunities.info.budget') + ' (Optional)'" type="number" :placeholder="$t('opportunities.info.budget')" name="estimatedValue" :value="data?.estimatedValue" )
          InputDate.mt-4(:label="$t('opportunities.info.closeDate') + ' (Optional)'" disabledDate="past" :placeholder="$t('opportunities.info.closeDate')" :value="data?.expectedCloseDate || new Date()" name="expectedCloseDate" )
          InputSelect(:label="$t('opportunities.info.priority') + ' (Optional)'" name="priority"  :placeholder="$t('opportunities.info.priority')" :options="priorityOptions.map(o => ({...o, label: $t(o.label)}))" :value="data?.priority" )
          InputText(:label="$t('opportunities.info.products') + ' (Optional)'" name="interestedIn"  :placeholder="$t('opportunities.info.products')"  :value="data?.interestedIn" )
        InputSelect(:label="$t('opportunities.info.nextSteps')" isMultiple name="nextSteps" :options="stepsOptions.map(o => ({...o, label: $t(o.label)}))" :value="data?.nextSteps" )
        InputSelect(:label="$t('opportunities.info.reasonLoss')" name="reasons" :options="reasonOptions.map(o => ({...o, label: $t(o.label)}))" :value="data?.reasonOfLose" v-if="isLose" )
        InputText(type="textarea" :placeholder="$t('leads.notes')"  name="notes" :value="data?.notes" )

</template>

<script lang="ts" setup>
import { useForm } from "vee-validate";
import { stageOptions, priorityOptions } from '@/composables/useOpportunity';
import * as yup from "yup";
import isEmailValidator from "validator/lib/isEmail";

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();
const route = useRoute();
const activeStep = defineModel();

const props = defineProps({
  loading: Boolean,
  label: String,
  editMode: {
    type: Boolean || String || Number,
    required: false,
    default: false,
  },
  data: {
    type: Object,
    required: false,
  },
});

const switchValue = ref(true);
const switchType = ref(true);
const emit = defineEmits(["submit", "leadId"]);
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);

const formSchema = computed(() => yup.object({
  leadName: yup.string().when([], {
    is: () => switchType.value,
    then: () => yup.string().trim().required(t('errors.required')).min(2).max(100).label(t('leads.table.leadName')),
    otherwise: () => yup.string().nullable().trim().max(100).label(t('leads.table.leadName')),
  }),
  leadCompanyName: yup.string().nullable().trim().max(100).label(t('common.companyName')),
  clientId: yup.string().when([], {
    is: () => !switchType.value,
    then: () => yup.string().required(t('errors.required')).label(t('deals.info.client')),
    otherwise: () => yup.string().nullable().label(t('deals.info.client')),
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
          "is-valid",
          (message: any) => t('errors.invalidEmail'),
          (value: any) => !value || isEmailValidator(value)
        )
        .label(t('leads.info.email')),
    otherwise: () =>
      yup
        .string()
        .email()
        .max(100)
        .nullable(t('errors.emailOrPhoneRequired'))
        .test(
          "is-valid",
          (message: any) => t('errors.invalidEmail'),
          (value: any) => (value ? isEmailValidator(value) : new yup.ValidationError(t('errors.invalidEmail')))
        )
        .label(t('leads.info.email')),
  }),
  phone: yup.number().when([], {
    is: () => isEmail.value || !switchType.value,
    then: () =>
      yup
        .number()
        .nullable()
        .transform((value: any, originalValue: any) => (originalValue === "" ? null : Number.isNaN(value) ? null : value))
        .label(t('leads.info.phone'))
        .test("Phone number", t('errors.invalidPhone'), function (value: any) {
          if (value === null || value === undefined) {
            return true;
          }
          return validPhone.value ? true : false;
        }),
    otherwise: () =>
      yup
        .number()
        .transform((value: any) => (Number.isNaN(value) ? null : value))
        .nullable()
        .required(t('errors.emailOrPhoneRequired'))
        .label(t('leads.info.phone'))
        .test("Phone number", t('errors.invalidPhone'), function (value: any) {
          return validPhone.value ? true : false;
        }),
  }),
  opportunityName: yup.string().trim().required(t('errors.required')).min(2).max(100).label(t('opportunities.table.name')),
  opportunityStage: yup.string().trim().required(t('errors.required')).min(2).max(100).label(t('opportunities.table.stage')),
  assignUser: yup.array().of(yup.number()).required(t('errors.required')).min(1).label(t('opportunities.table.assigned')),
  estimatedValue: yup
    .number()
    .nullable()
    .max(10000000)
    .label(t('opportunities.info.budget'))
    .transform((value: any, originalValue: any) => (String(originalValue).trim() === "" ? null : value)),
  profit: yup
    .number()
    .nullable()
    .max(10000000)
    .label(t('opportunities.table.profit'))
    .transform((value: any, originalValue: any) => (String(originalValue).trim() === "" ? null : value)),
  expectedCloseDate: yup.date().nullable().label(t('opportunities.info.closeDate')),
  priority: yup.string().nullable().trim().max(100).label(t('opportunities.info.priority')),
  interestedIn: yup.string().nullable().trim().max(200).label(t('opportunities.info.products')),
  nextSteps: yup.array().of(yup.string()).required(t('errors.required')).min(1).label(t('opportunities.info.nextSteps')),
  reasons: yup.string().when([], {
    is: () => isLose.value,
    then: () => yup.string().required(t('errors.required')).trim().min(2).max(250).label(t('opportunities.info.reasonLoss')),
    otherwise: () =>
      yup
        .string()
        .trim()
        .nullable()
        .test(
          "min-length-if-entered",
           t('errors.minLength', {min: 2}),
          (value: any) => !value || value.length >= 2
        )
        .trim()
        .max(250)
        .label(t('opportunities.info.reasonLoss')),
  }),
  notes: yup
    .string()
    .trim()
    .nullable()
    .test("min-length-if-entered",  t('errors.minLength', {min: 2}), (value: any) => !value || value.length >= 2)
    .trim()
    .max(2000)
    .label(t('leads.notes')),
}));

const { handleSubmit } = useForm({
  validationSchema: formSchema,
});

const onSubmit = handleSubmit((values: any, actions: any) => {
  const formatedValues = {
    ...(switchType.value && {
      lead: {
        name: values.leadName,
        companyName: values.companyName,
        email: values.email,
        phone: normalizePhoneNumber(values.phone),
        users: values.assignUser,
      },
    }),
    opportunity: {
      name: values.opportunityName,
      stage: values.opportunityStage,
      estimatedValue: Number(values.estimatedValue),
      profit: Number(values.profit),
      expectedCloseDate: getYear(values.expectedCloseDate),
      priority: values.priority,
      interestedIn: values.interestedIn,
      nextSteps: values.nextSteps,
      reasonOfLose: values.reasons,
      users: values.assignUser,
      notes: values.notes,
      ...(route.path.includes("edit") && values.clientId && !switchType.value && { clientId: values.clientId }),
    },
    ...(!route.path.includes("edit") && values.clientId && { clientId: values.clientId }),
  };
  if (mappedLeads?.length && switchValue.value && switchType.value) emit("leadId", selectedLead.value?.id);
  emit("submit", formatedValues);
});

let users = await useApiFetch("users");
users = users?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id,
}));

const selectedLead = ref<any>([]);
const response = await getLeads();
const leads = response.leads;

const mappedLeads = leads?.map((e: any) => ({
  label: e.name,
  value: e.name,
  id: e.id,
}));

const leadId = props.data?.leadId || route.query?.leadId;

if (props.data?.clientId) {
  switchType.value = false;
}

if (leadId) {
  let lead = selectedLead.value;

  if (props.data?.leadId) {
    lead = await getLead(leadId);
    if (lead) {
      selectedLead.value = lead;
    }
  } else {
    selectedLead.value = leads?.find((lead: any) => lead.id === leadId);
  }

  if (selectedLead.value) {
    isEmail.value = Boolean(selectedLead.value.email);
    isPhone.value = !isEmail.value && Boolean(selectedLead.value.phone);
  }
}

const mappedClients = ref<{ label: string; value: any }[]>();
//  Get clients
let { clients } = await getClients();
// Map clients to Select Options
mappedClients.value = clients?.map((e: any) => ({
  label: e.clientName,
  value: e.id,
}));

function getSelectedLead(e: any) {
  selectedLead.value = leads?.find((lead: any) => lead.id === e.id);
  if (selectedLead.value?.email) {
    isEmail.value = true;
  } else if (selectedLead.value?.phone) {
    isPhone.value = true;
  }
}

const isLeads = computed(() => {
  return mappedLeads?.length && switchValue.value ? resolveComponent("InputSelect") : resolveComponent("InputText");
});

const isLose = ref(false);
function checkIfCancelled(value: any) {
  if (value.label === "Lost") {
    isLose.value = true;
  } else {
    isLose.value = false;
  }
}

if (props.data?.reasonOfLose) {
  isLose.value = true;
}

const stepsOptions = [
    { label: "opportunities.steps.phoneCall", value: "phone_call" },
    { label: "opportunities.steps.meeting", value: "meeting" },
    { label: "opportunities.steps.email", value: "email" },
    { label: "opportunities.steps.demo", value: "Demo" },
    { label: "opportunities.steps.proposal", value: "proposal" },
    { label: "opportunities.steps.followUp", value: "follow_up" },
    { label: "opportunities.steps.negotiation", value: "negotiation" },
];

const reasonOptions = [
    { label: "opportunities.reasons.price", value: "Price" },
    { label: "opportunities.reasons.competitor", value: "Competitor" },
    { label: "opportunities.reasons.product", value: "Product" },
    { label: "opportunities.reasons.timing", value: "Timing" },
    { label: "opportunities.reasons.other", value: "Other" },
];
</script>
