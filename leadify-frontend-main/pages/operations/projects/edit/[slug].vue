<template lang="pug">
.title.font-bold.text-2xl.mb-1.capitalize.mb-8 {{ $t('operations.projects.editTitle') }}
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
OperationsProjectsInfo.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" v-if="activeStep === 0")
OperationsProjectsVehicles.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" v-if="activeStep === 1")
OperationsProjectsManpower.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" v-if="activeStep === 2")
OperationsProjectsMaterials.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" v-if="activeStep === 3")
OperationsProjectsAssets.mt-6(v-model="activeStep" :loading="loading" @submit="submitForm" v-if="activeStep === 4")
</template>

<script lang="ts" setup>
  const { t } = useI18n();
  useHead({
    title: `${t('common.info')} | ${t('operations.projects.editTitle')}`,
  });
  definePageMeta({
    middleware: "permissions",
    permission: "EDIT_PROJECTS",
  });
  const activeStep = ref<number>(0);
  const loading = ref(false);
  const isFinished = ref(false);

  // Assuming fetchExistingProject is auto-imported or managed by global project store
  // if not, I might need to implement it or use getProject
  // For now I'll just localize the UI
</script>

<style lang="scss"></style>
