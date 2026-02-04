<template>
    <button class="mode-toggle" @click="toggleTheme" :title="isLight ? 'Dark Mode' : 'Light Mode'">
        <span class="icon">{{ isLight ? '🌙' : '☀️' }}</span>
    </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isLight = ref(false);

const enableLightMode = () => {
    document.body.classList.add('light-theme');
    localStorage.setItem('theme', 'light');
};

const disableLightMode = () => {
    document.body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
};

const toggleTheme = () => {
    isLight.value = !isLight.value;
    if (isLight.value) {
        enableLightMode();
    } else {
        disableLightMode();
    }
};

onMounted(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        isLight.value = true;
        enableLightMode();
    } else {
        isLight.value = false;
        disableLightMode();
    }
});
</script>

<style scoped lang="scss">
.mode-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: var(--bg-card);
    cursor: pointer;
    transition: all 0.3s ease;

    .icon {
        font-size: 20px;
    }

    &:hover {
        transform: scale(1.1);
    }
}
</style>
