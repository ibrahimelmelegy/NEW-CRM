<template>
  <div class="empty-layout relative">
    <ProfessionalBackground />
    <slot />
  </div>
</template>

<script setup></script>

<style lang="scss">
.empty-layout {
  min-height: 100vh;
  width: 100%;
}
</style>
