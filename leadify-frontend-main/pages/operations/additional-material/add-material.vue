<template lang="pug">
.flex.items-center.justify-between.mb-8
  .title.font-bold.text-2xl.mb-1.capitalize {{ $t('operations.additionalMaterials.new') }}
  .flex.items-center.gap-x-2
    el-button(size='large' plain type="primary" class="w-full !rounded-2xl" @click="router.back()") {{ $t('common.cancel') }}
    el-button(size='large' type="primary" native-type="submit" :loading="loading" :disabled="loading" class="w-full !px-5 !rounded-2xl" @click="onSubmitMaterials") {{ $t('common.save') }}

.card.m-auto.bg-white.p-10.rounded-3xl(class="2xl:w-1/2 w-[90%]")
  OperationsMaterialCategory(ref="categoryRef" @onSubmit="submitCategoryForm")
  OperationsMaterialCategoryItem(ref="categoryItemRef" @onSubmit="submitCategoryItemForm")
</template>

<script lang="ts" setup>
/* eslint-disable require-await */
import { ref } from 'vue';
import logger from '~/utils/logger'
const { t } = useI18n();
const loading = ref(false);
const categoryRef = ref();
const categoryItemRef = ref();
useHead({
  title: computed(() => `App HP Tech | ${t('operations.additionalMaterials.new')}`)
});
definePageMeta({
  middleware: 'permissions',
  permission: 'CREATE_ADDITIONAL_MATERIAL'
});

const finalValues = ref<AdditionalMaterial>({
  name: '',
  items: []
});

async function submitCategoryForm(values: unknown) {
  finalValues.value = { ...finalValues.value, ...values };
}

async function submitCategoryItemForm(values: unknown) {
  finalValues.value.items = [...values];
}
async function onSubmitMaterials() {
  //  reset values
  finalValues.value = {} as AdditionalMaterial;
  try {
    loading.value = true;
    await categoryRef.value.onSubmit();
    await categoryItemRef.value.onSubmitCategoryItems();
    if (!finalValues.value?.name || !finalValues.value?.items || !finalValues.value?.items?.length) return;
    await createAdditionalMaterial(finalValues.value);
    loading.value = false;
  } catch (error) {
    logger.error('Error saving forms:', error);
    loading.value = false;
  } finally {
    loading.value = false;
  }
}
</script>
