<template lang="pug">
img(
  :src="resolvedSrc"
  :alt="alt"
  :class="{ 'img-small': small }"
  loading="lazy"
  @error="onError"
)
</template>

<script setup lang="ts">
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  small: { type: Boolean, default: false }
});

const runtimeConfig = useRuntimeConfig();

const resolvedSrc = computed(() => {
  if (!props.src) return '/images/avatar.png';
  if (props.src.startsWith('http') || props.src.startsWith('data:') || props.src.startsWith('/')) {
    return props.src;
  }
  return runtimeConfig.public.BUCKET_URL + props.src;
});

function onError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img.src !== '/images/avatar.png') {
    img.src = '/images/avatar.png';
  }
}
</script>

<style scoped>
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-small {
  width: 32px;
  height: 32px;
}
</style>
