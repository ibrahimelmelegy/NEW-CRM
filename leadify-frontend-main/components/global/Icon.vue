<template lang="pug">
//- If it's a custom icon (starts with 'Icon'), use dynamic component
component(:is="name" v-if="isCustom" v-bind="$attrs" :class="iconClasses" :style="iconStyles")

//- Otherwise, use the standard Icon component from nuxt-icon (renamed to NuxtIcon in nuxt.config.js)
NuxtIcon(v-else :name="name" :size="size" v-bind="$attrs")
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '1em'
  }
});

// Custom components are auto-imported by Nuxt from components/global/Icon/ as IconHome, IconSales, etc.
const isCustom = computed(() => {
  return typeof props.name === 'string' && props.name.startsWith('Icon') && !props.name.includes(':');
});

const iconClasses = computed(() => {
  return ['custom-icon-wrapper', isCustom.value ? 'is-custom' : ''];
});

const iconStyles = computed(() => {
  const s = typeof props.size === 'number' ? `${props.size}px` : props.size;
  return {
    fontSize: s,
    width: s,
    height: s,
    display: 'inline-block',
    verticalAlign: 'middle'
  };
});
</script>

<style scoped>
.custom-icon-wrapper {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
:deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
:global(.nuxt-icon) {
  display: inline-block;
  vertical-align: middle;
}
</style>
