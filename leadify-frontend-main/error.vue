<template lang="pug">
.flex.items-center.justify-center.h-screen
    .text-center.glass-card.rounded-2xl.p-5
      div.m-auto(class="w-[500px]")
        h3.text-4xl.mb-4(:style="{ color: 'var(--color-danger)' }") {{error.statusCode}}
        p.text-xl.max-w-xl.mb-10(:style="{ color: 'var(--color-text-primary)' }") {{error.message  || `Oops! This page is still under construction.`}}
        el-button(size='large' type="primary" @click="handleerror")  Go back Home

</template>

<script setup>
defineProps(['error', 'statusCode']);

const handleerror = () => {
  clearError({ redirect: '/' });
};
</script>

<style scoped></style>
