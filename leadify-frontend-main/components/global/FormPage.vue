<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      .flex.items-center.gap-3.mb-1(v-if="breadcrumbs && breadcrumbs.length")
        template(v-for="(crumb, i) in breadcrumbs" :key="i")
          NuxtLink.text-sm(v-if="crumb.to" :to="crumb.to" style="color: var(--text-muted)") {{ crumb.label }}
          span.text-sm(v-else style="color: var(--text-primary); font-weight: 600") {{ crumb.label }}
          Icon(v-if="i < breadcrumbs.length - 1" name="ph:caret-right" size="12" style="color: var(--text-muted)")
      h2.text-2xl.font-bold.capitalize(style="color: var(--text-primary)") {{ title }}
      p.mt-1(v-if="subtitle" style="color: var(--text-muted)") {{ subtitle }}

  //- Form body
  .glass-card.p-8.rounded-3xl
    slot

  //- Sticky footer
  .sticky.bottom-0.mt-6.py-4(style="background: var(--bg-primary); z-index: 10")
    .flex.items-center.justify-end.gap-3
      el-button(size="large" @click="handleCancel" class="!rounded-2xl") {{ $t('common.cancel') }}
      slot(name="extra-actions")
      el-button(size="large" type="primary" :loading="loading" @click="$emit('submit')" class="!rounded-2xl") {{ submitLabel || $t('common.save') }}
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string;
  to?: string;
}

defineProps<{
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  loading?: boolean;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const router = useRouter();

function handleCancel() {
  emit('cancel');
  router.back();
}
</script>
