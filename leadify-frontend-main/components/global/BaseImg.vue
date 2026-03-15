<template lang="pug">
.lazyImage(class="w-full h-full" :class="{'loaded' : isloaded}")
    nuxt-img(:src="`${runtimeConfig.public.BASE_URL}assets/${generatedSrc}`" v-if="generatedSrc" loading="lazy"  @load="addclass")
</template>

<script lang="ts" setup>
/* eslint-disable require-await */
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';
import { useAuthStore } from '~/stores/auth';
import logger from '~/utils/logger'
const authStore = useAuthStore();

const activeName = ref('Personal info');
const mainStore = useMain();

const props = defineProps(['src']);
const isloaded = ref(false);
const generatedSrc = ref('');

function addclass() {
  isloaded.value = true;
}

const runtimeConfig = useRuntimeConfig();
function getImageRedirectedLink(link: string) {
  if (props.src.includes(runtimeConfig.public.BASE_URL)) {
    getRedirectedUrlWithHeaders(props.src)
      .then(response => {
        generatedSrc.value = response;
      })
      .catch(error => {
        logger.error('Error:', error);
      });
  } else {
    generatedSrc.value = props.src;
  }
}

if (props.src) {
  getImageRedirectedLink(props.src);
}
watch(
  () => props.src,
  async () => {
    getImageRedirectedLink(props.src);
  }
);

async function getRedirectedUrlWithHeaders(url: string) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        Authorization: `Bearer ${(authStore as unknown).token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const redirectedUrl = response.url;

    return redirectedUrl;
  } catch (error) {
    logger.error('Error getting redirected URL:', error);
    throw error;
  }
}
</script>

<style scoped>
.lazyImage {
  background: linear-gradient(90deg, #dbdbdb, #dfdfdf, #ebebeb, #dddddd);
  background-size: 400% 400%;
  animation: gradientBG 3s ease infinite reverse;
  overflow: hidden;
}
.loaded {
  background: transparent !important;
  display: flex;
  justify-content: center;
}
.loaded img {
  opacity: 1 !important;
}

.lazyImage > img {
  object-fit: cover;
  object-position: center;
  /* width: 100%; */
  height: 100%;
  opacity: 0;
  transition: opacity 500ms ease-in-out;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
