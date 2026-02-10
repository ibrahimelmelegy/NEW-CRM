<template lang="pug">
el-form(autocomplete="off" @submit.prevent='onSubmit' ref="myForm" label-position="top" :validationSchema="formSchema")
  slot
  div(:class="{'2xl:w-1/2 w-[90%] card m-auto glass-card p-10 rounded-3xl': !isModal}")
    //- Task Details
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:check-square-bold" size="20")
        div
          .section-title Task Details
      .grid.grid-cols-2.gap-4
        InputText(:label="$t('operations.dailyTasks.form.name')" :placeholder="$t('operations.dailyTasks.form.enterName')" name="name" :value="data?.name")
        InputSelect(:label="$t('operations.dailyTasks.form.priority')" name="priority" :options="taskPriorityOptions" :value="data?.priority")
        InputSelect(:label="$t('operations.dailyTasks.form.status')" name="status" :options="taskStatusOptions" :value="data?.status ?? (route.query.status ? route.query.status.toString().toUpperCase() : '')")
        InputSelect(:label="$t('operations.dailyTasks.form.user')" name="userId" :options="users" :value="data?.userId")
        InputSelect(:label="$t('operations.dailyTasks.form.client')" name="clientId" :options="clients" @change="[onFetchClient($event?.value)]" :value="data?.clientId")
        InputSelect(:label="$t('operations.dailyTasks.form.salesRep')" name="salesRepresentativeId" :options="users" :value="data?.salesRepresentativeId")

    //- Financial Details
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:money-bold" size="20")
        div
          .section-title Financial Details
      .grid.grid-cols-2.gap-4
        InputText(:label="$t('operations.dailyTasks.form.cost')" :placeholder="$t('operations.dailyTasks.form.enterCost')" name="cost" :value="data?.cost")
        InputText(:label="$t('operations.dailyTasks.form.downPayment')" :placeholder="$t('operations.dailyTasks.form.enterDownPayment')" name="downPayment" :value="data?.downPayment")
      InputText.mt-4(:label="$t('operations.dailyTasks.form.totalPaid')" :placeholder="$t('operations.dailyTasks.form.enterTotalPaid')" name="totalPaid" :value="data?.totalPaid")

    //- Notes
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:note-pencil-bold" size="20")
        div
          .section-title Notes
      InputText(type="textarea" :placeholder="$t('operations.dailyTasks.form.notes')" name="notes" :value="data?.notes")
  slot(name="modal-footer")
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const props = defineProps({
  loading: Boolean,
  label: String,
  isModal: Boolean,
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['submit', 'fetchClient']);

const formSchema = yup.object({
  name: yup.string().trim().required().min(2).max(100).label(t('operations.dailyTasks.form.name')),
  cost: yup
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
    .label(t('operations.dailyTasks.form.cost')),
  downPayment: yup
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
    .label(t('operations.dailyTasks.form.downPayment')),
  totalPaid: yup
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
    .label(t('operations.dailyTasks.form.totalPaid')),
  status: yup.string().trim().nullable().max(100).label(t('operations.dailyTasks.form.status')),
  priority: yup.string().trim().nullable().max(100).label(t('operations.dailyTasks.form.priority')),
  clientId: yup.string().trim().nullable().label(t('operations.dailyTasks.form.client')),
  userId: yup.string().required().label(t('operations.dailyTasks.form.user')),
  salesRepresentativeId: yup.string().required().label(t('operations.dailyTasks.form.salesRep'))
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

// Emit delete
function onFetchClient(id: string) {
  emit('fetchClient', id);
}
//  Get Users
const usersRes = await useApiFetch('users?limit=10000');
// Map Users to Select Options
const users = usersRes?.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

//  Get Clients
const clientsRes = await useApiFetch('client?limit=10000');
// Map Clients to Select Options
const clients = computed(() => [
  { label: t('common.add') + ' ' + t('operations.dailyTasks.form.client'), value: 0 },
  ...(clientsRes?.body?.docs?.map((e: any) => ({
    label: e.clientName,
    value: e.id
  })) || [])
]);

const onSubmit = handleSubmit((values: any, actions: any) => {
  emit('submit', {
    ...values,
    cost: Number(values.cost),
    downPayment: Number(values.downPayment),
    totalPaid: Number(values.totalPaid)
  });
});
</script>
