<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-5.mt-5
    div
      .flex.items-center.gap-3.mb-1(v-if="breadcrumbs && breadcrumbs.length")
        template(v-for="(crumb, i) in breadcrumbs" :key="i")
          NuxtLink.text-sm(v-if="crumb.to" :to="crumb.to" style="color: var(--text-muted)") {{ crumb.label }}
          span.text-sm(v-else style="color: var(--text-primary); font-weight: 600") {{ crumb.label }}
          Icon(v-if="i < breadcrumbs.length - 1" name="ph:caret-right" size="12" style="color: var(--text-muted)")
      .title.font-bold.text-2xl.capitalize {{ title }}
    .flex.items-center.gap-3
      slot(name="header-actions")
      el-dropdown(v-if="$slots['dropdown-actions']" trigger="click")
        span.el-dropdown-link
          button.rounded-btn(class="!px-4"): Icon(name="IconToggle" size="24")
        template(#dropdown)
          el-dropdown-menu
            slot(name="dropdown-actions")

  //- Content with optional sidebar
  .grid.gap-6(:class="hasSidebar ? 'lg:grid-cols-3' : ''")
    .space-y-6(:class="hasSidebar ? 'lg:col-span-2' : ''")
      slot
    .space-y-6(v-if="hasSidebar")
      slot(name="sidebar")
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string;
  to?: string;
}

defineProps<{
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  hasSidebar?: boolean;
}>();

const slots = useSlots();
</script>
