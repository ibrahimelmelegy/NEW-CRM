<template lang="pug">
el-dialog(v-model='dialog' width='750' title="Add New Service Module" append-to-body align-center='')
  OperationsServiceForm.border-t.pt-4( :loading="loading" @submit="submitForm" is-modal :data="modifiedService")
    template(#modal-footer)
        .dialog-footer.mt-8
            .flex.justify-end
                el-button(  class="!rounded-2xl" @click='dialog = false' size="large"   ) Cancel
                el-button(class="!rounded-2xl" type='primary' native-type="submit" size="large" :loading="loading") {{ manpower?.id ? 'Update' : 'Save' }}
</template>

<script setup lang="ts">
const loading = ref(false);
const props = defineProps({
  service: Object as () => Service
});

const modifiedService = ref<Service>({
  type: props.service?.label || '',
  price: props.service?.price || 0,
  id: props.service?.value || 0
});

const dialog = defineModel();
const emit = defineEmits(['confirm', 'submit']);
async function submitForm(values: Service) {
  loading.value = true;
  try {
    if (modifiedService.value?.id) {
      await updateService({ ...values, id: modifiedService.value?.id }, false);
      emit('confirm', modifiedService.value?.id);
    } else {
      await createService(values, false);
      emit('confirm');
    }
    dialog.value = false;
  } finally {
    loading.value = false;
  }
}
</script>
