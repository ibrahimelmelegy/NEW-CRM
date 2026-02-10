<template lang="pug">
el-dialog(v-model='dialog' width='480' align-center='' class="glass-dialog !rounded-3xl" destroy-on-close)
    .text-center.py-4.px-2
      .mx-auto.mb-4.w-16.h-16.rounded-2xl.flex.items-center.justify-center(v-if="icon" style="background: rgba(0, 120, 212, 0.1)")
        img.h-10.w-10.object-contain(:src="icon" alt="icon")
      p.text-xl.font-bold.mb-2(style="color: var(--color-text-primary)") {{title}}
      p.text-sm(style="color: var(--color-text-secondary)") {{descriptionOne}}
      p.text-xs.mt-1(v-if="descriptionTwo" style="color: var(--color-text-tertiary)") {{descriptionTwo}}
    slot(name="input")
    template(#footer='')
      .flex.gap-3.px-2.pb-2
        el-button.flex-1(class="!rounded-xl !h-11" @click='dialog = false' size="large") {{ $t('common.cancel') }}
        el-button.flex-1(class="!rounded-xl !h-11" type='primary' @click='confirm' size="large" :loading="loading" :disabled="loading") {{btnText}}

</template>

<script setup>
const props = defineProps({
  title: String,
  description: String,
  descriptionOne: String,
  descriptionTwo: String,
  loading: Boolean,
  icon: String,
  btnText: {
    type: String,
    default: 'Confirm'
  }
});
const emit = defineEmits(['confirm']);
const confirm = () => {
  emit('confirm');
};
const dialog = defineModel();
</script>
