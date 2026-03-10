<template lang="pug">
    OperationsDailyTasksForm( :loading="loading" @fetchClient = "fetchClient" @submit="submitForm")
      .flex.items-center.justify-between.mb-8
        .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.dailyTasks.form.createTitle', { status: validatedStatus }) }}
        .flex.items-center.gap-x-2
          el-button(   size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
          el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class="w-full !px-5 !rounded-2xl") {{ $t('common.save') }}
    ActionModel(v-model="openFormClient" , :loading="loadingClient",style="width:100wh",:title="$t('operations.dailyTasks.form.createClient')" ,:btn-text="$t('common.save')",@confirm="submitFormClient")
     template(#input)
      InputText.mt-3(:label="$t('operations.dailyTasks.form.clientName')" @change ="setClient" name="clientName" :value="data?.clientName" is-form)

      InputText.mt-3(:label="$t('operations.dailyTasks.form.companyName')" @change ="setCompany" name="companyName" :value="data?.companyName" is-form)
      InputText.mt-3(:label="$t('operations.dailyTasks.form.email')"  name="email" @change ="setEmail" :value=" data?.email" @value="val=> isEmail = !!val" is-form)
      p.mt-3 {{ $t('operations.dailyTasks.form.phone') }}
      InputPhone.mt-3(label=""  name="phone" @change ="setPhone" :value=" data?.phoneNumber" @value="val=> isPhone = !!val" @validphone="val=> validPhone = val" mode="international")
      InputSelect.mt-3(:label="$t('operations.dailyTasks.form.clientType')" name="clientType"  @change ="setType" :options="clientTypes" :value="data?.clientType")
      
    </template>

<script lang="ts" setup>
/* eslint-disable require-await */
useHead({
  title: 'App HP Tech | Add Daily Task'
});
const route = useRoute();
const router = useRouter();

// Validate route query status parameter
const VALID_STATUSES = ['Active', 'Completed', 'Granted', 'Pending'] as const;
type TaskStatus = typeof VALID_STATUSES[number];
const rawStatus = (route.query.status as string) || '';
const validatedStatus: TaskStatus | '' = VALID_STATUSES.includes(rawStatus as TaskStatus)
  ? (rawStatus as TaskStatus)
  : '';
const switchValue = ref(true);
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);
const openFormClient = ref(false);
const ClientNew = ref({
  name: '',
  phone: '',
  email: '',
  companyName: '',
  clientType: ''
});

let users = await useApiFetch('users');
users = users?.body?.docs?.map(e => ({
  label: e.name,
  value: e.id
}));

const selectedLead = ref<Record<string, unknown>>([]);

const leadId = null;

async function setClient(pre: unknown) {
  ClientNew.value.name = pre.target?.value;
}

async function setEmail(pre: unknown) {
  ClientNew.value.email = pre.target?.value;
}
async function setPhone(pre: unknown) {
  ClientNew.value.phone = pre.target?.value;
}
async function setCompany(pre: unknown) {
  ClientNew.value.companyName = pre.target?.value;
}
async function setType(pre: unknown) {
  ClientNew.value.clientType = pre.target?.value;
}

const fetchClient = (clientId: string) => {
  if (clientId === '0') openFormClient.value = true;
};

const loading = ref(false);
async function submitForm(values: DailyTask) {
  loading.value = true;
  await createDailyTask(values);
  loading.value = false;
}

const loadingClient = ref(false);
async function submitFormClient() {
  loadingClient.value = true;
  try {
    const formattedValues = cleanObject({
      clientName: ClientNew.value?.name,
      phone: ClientNew.value?.phone,
      email: ClientNew.value?.email,
      companyName: ClientNew.value?.companyName,
      clientType: ClientNew.value?.clientType
    });
    await createClient(formattedValues);
  } catch (err) {
    console.error('Error saving forms:', err);
    loadingClient.value = false;
  } finally {
    openFormClient.value = false;
    loadingClient.value = false;
  }
}
</script>

<style lang="scss"></style>
