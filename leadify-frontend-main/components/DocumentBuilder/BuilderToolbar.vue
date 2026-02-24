<template lang="pug">
.builder-toolbar.flex.items-center.justify-between.px-4.py-2.glass-card.rounded-xl.mb-4
  .flex.items-center.gap-3
    NuxtLink(to="/settings/document-templates")
      el-button(text size="small")
        Icon(name="ph:arrow-left-bold" size="18")
        span.ml-1 {{ $t('documentTemplates.builder.backToTemplates') }}
    el-divider(direction="vertical")
    el-input.max-w-60(
      v-model="localName"
      :placeholder="$t('documentTemplates.builder.templateName')"
      size="small"
      @input="$emit('update:name', localName)"
    )
    el-select.max-w-40(
      v-model="localType"
      :placeholder="$t('documentTemplates.builder.templateType')"
      size="small"
      @change="$emit('update:type', localType)"
    )
      el-option(:label="$t('documentTemplates.invoice')" value="INVOICE")
      el-option(:label="$t('documentTemplates.purchaseOrder')" value="PURCHASE_ORDER")

  .flex.items-center.gap-2
    el-tooltip(:content="$t('documentTemplates.builder.undo') + ' (Ctrl+Z)'")
      el-button(text size="small" @click="$emit('undo')" :disabled="!canUndo")
        Icon(name="ph:arrow-counter-clockwise-bold" size="18")
    el-tooltip(:content="$t('documentTemplates.builder.redo') + ' (Ctrl+Y)'")
      el-button(text size="small" @click="$emit('redo')" :disabled="!canRedo")
        Icon(name="ph:arrow-clockwise-bold" size="18")
    el-divider(direction="vertical")
    el-button(size="small" @click="$emit('preview')" class="!rounded-xl")
      Icon(name="ph:eye-bold" size="16" class="mr-1")
      span {{ $t('documentTemplates.builder.preview') }}
    el-button(size="small" @click="$emit('pick-template')" class="!rounded-xl")
      Icon(name="ph:squares-four-bold" size="16" class="mr-1")
      span {{ $t('documentTemplates.builder.pickTemplate') }}
    el-divider(direction="vertical")
    el-button(type="primary" size="small" :loading="saving" @click="$emit('save')" class="!rounded-xl")
      Icon(name="ph:floppy-disk-bold" size="16" class="mr-1")
      span {{ $t('documentTemplates.builder.save') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  type: string;
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
}>();

defineEmits(['update:name', 'update:type', 'undo', 'redo', 'save', 'preview', 'pick-template']);

const localName = ref(props.name);
const localType = ref(props.type);

watch(() => props.name, (v) => { localName.value = v; });
watch(() => props.type, (v) => { localType.value = v; });
</script>
