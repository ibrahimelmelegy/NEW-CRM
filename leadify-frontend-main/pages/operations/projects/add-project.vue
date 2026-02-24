<template lang="pug">
.title.font-bold.text-2xl.mb-1.capitalize.mb-8 {{ $t('operations.projects.createTitle') }}
el-steps(
  style="min-width: 100%"
  :space="500"
  :active="activeStep"
  align-center
)
  el-step(:title="$t('operations.projects.steps.info')")
  el-step(:title="$t('operations.projects.steps.vehicles')")
  el-step(:title="$t('operations.projects.steps.manpower')")
  el-step(:title="$t('operations.projects.steps.materials')")
  el-step(:title="$t('operations.projects.steps.assets')")
  el-step(:title="$t('operations.projects.steps.preview')")
OperationsProjectsInfo.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" @cancel="isCanceling = true" v-if="activeStep === 0")
OperationsProjectsVehicles.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm"  @cancel="isCanceling = true" v-if="activeStep === 1")
OperationsProjectsManpower.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm"  @cancel="isCanceling = true" v-if="activeStep === 2")
OperationsProjectsMaterials.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm"  @cancel="isCanceling = true" v-if="activeStep === 3")
OperationsProjectsAssets.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm"  @cancel="isCanceling = true" v-if="activeStep === 4")
OperationsProjectsPreview.mt-6(v-model="activeStep" @onFinish="confirmCompeleteForm" :loading="loading"  @cancel="isCanceling = true" v-if="activeStep === 5")
ActionModel(v-model="isFinished" v-if="isFinished" @confirm="submitForm" :loading="loading" :title="$t('operations.projects.modals.confirmCreateTitle')" :description="$t('operations.projects.modals.confirmCreateDesc')" )
ActionModel(v-model="isCanceling" v-if="isCanceling" @confirm="submitCancel" :loading="loading" :title="$t('operations.projects.modals.cancelCreateTitle')" :description="$t('operations.projects.modals.cancelCreateDesc')" icon="/images/delete-image.png" )
</template>

<script lang="ts" setup>
const { t } = useI18n();
useHead({
  title: `App HP Tech | ${t('operations.projects.createTitle')}`
});
definePageMeta({
  middleware: 'permissions',
  permission: 'CREATE_PROJECTS'
});
const router = useRouter();
const activeStep = ref<number>(0);
const loading = ref(false);
const isFinished = ref(false);
const isCanceling = ref(false);
const values = ref<any>({});
const finalvalues = ref<any>({});

onMounted(async () => {
  await fetchExistingProject();
  activeStep.value = project.value?.step ? project.value.step - 1 : 0;
});

async function submitForm() {
  loading.value = true;
  await completeProject(values.value);
  loading.value = false;
}

async function submitCancel() {
  loading.value = true;
  await deleteProject();
  loading.value = false;
}

function confirmCompeleteForm(val: any) {
  isFinished.value = true;
  values.value = val;
}
</script>

<style lang="scss"></style>
