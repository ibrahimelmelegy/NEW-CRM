<template lang="pug">
.workflow-toolbar.flex.items-center.justify-between.gap-4.flex-wrap
  .flex.items-center.gap-3
    el-input(
      v-model="name"
      style="width: 250px"
      @change="$emit('update:name', $event)"
      :placeholder="$t('workflows.workflowName')"
    )
    el-switch(
      v-model="active"
      @change="$emit('update:active', $event)"
      active-text="Active"
      inactive-text="Inactive"
    )
  .flex.items-center.gap-2
    el-button(@click="$emit('save')" type="primary" :loading="saving")
      Icon.mr-1(name="ph:floppy-disk-bold" size="14")
      | Save
    el-button(@click="$emit('back')" type="default" plain)
      Icon.mr-1(name="ph:arrow-left-bold" size="14")
      | Back
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  active: boolean;
  saving: boolean;
}>();

defineEmits(['update:name', 'update:active', 'save', 'back']);

const name = computed({
  get: () => props.name,
  set: () => {}
});

const active = computed({
  get: () => props.active,
  set: () => {}
});
</script>

<style lang="scss" scoped>
.workflow-toolbar {
  padding: 12px 16px;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
}
</style>
