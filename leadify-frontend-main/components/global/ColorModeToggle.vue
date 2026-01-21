<template lang="pug">
button.mode-toggle(@click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'")
    Icon.text-xl(v-if="isDark" name="ph:sun-bold")
    Icon.text-xl(v-else name="ph:moon-bold")
</template>

<script setup lang="ts">
const isDark = ref(true);

const toggleTheme = () => {
    isDark.value = !isDark.value;
    updateTheme();
};

const updateTheme = () => {
    const body = document.querySelector('body');
    if (isDark.value) {
        body?.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body?.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
};

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        isDark.value = false;
        updateTheme();
    } else {
        // Default to dark
        isDark.value = true;
        document.querySelector('body')?.classList.remove('light-mode');
    }
});
</script>

<style lang="scss" scoped>
.mode-toggle {
    background-color: rgba(22, 21, 31, 0.5);
    border: 1px solid var(--border-glass);
    color: #FFFFFF;
    transition: all 0.3s ease;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
        background-color: rgba(139, 92, 246, 0.1);
        border-color: var(--accent-purple);
        color: var(--accent-purple);
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
    }
}

// Light mode overrides for the button itself (contained here or rely on global)
:global(body.light-mode) .mode-toggle {
    background-color: white;
    color: #64748B;
    border-color: #E2E8F0;

    &:hover {
        background-color: #F8FAFC;
        color: var(--accent-purple);
        border-color: var(--accent-purple);
    }
}
</style>
