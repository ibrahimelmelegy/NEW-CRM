<template lang="pug">
.flex.items-center.justify-between.mb-8
  div
    .flex.items-center.gap-3.mb-1(v-if="breadcrumbs && breadcrumbs.length")
      template(v-for="(crumb, i) in breadcrumbs" :key="i")
        NuxtLink.text-sm(v-if="crumb.to" :to="crumb.to" style="color: var(--text-muted)") {{ crumb.label }}
        span.text-sm(v-else style="color: var(--text-primary); font-weight: 600") {{ crumb.label }}
        Icon(v-if="i < breadcrumbs.length - 1" name="ph:caret-right" size="12" style="color: var(--text-muted)")
    h2.text-2xl.font-bold.capitalize(style="color: var(--text-primary)") {{ title }}
    p.mt-1(v-if="subtitle" style="color: var(--text-muted)") {{ subtitle }}
  .flex.items-center.gap-x-3
    slot(name="actions")
    template(v-for="(action, i) in actions" :key="i")
      NuxtLink(v-if="action.to && (!action.permission || hasPermission(action.permission))" :to="action.to")
        el-button(size="large" :type="action.type || 'primary'" :icon="action.icon" :loading="action.loading" class="!rounded-2xl") {{ action.label }}
      el-button(v-else-if="!action.to && (!action.permission || hasPermission(action.permission))" size="large" :type="action.type || 'primary'" :icon="action.icon" :loading="action.loading" class="!rounded-2xl" @click="action.onClick") {{ action.label }}
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface ActionItem {
  label: string;
  to?: string;
  type?: string;
  icon?: Component;
  loading?: boolean;
  permission?: string;
  onClick?: () => void;
}

defineProps<{
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
}>();

const { hasPermission } = usePermissionsSync();
</script>
