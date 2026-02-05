import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isLight = ref(false)

  const initializeTheme = () => {
    const saved = localStorage.getItem('theme')
    isLight.value = saved === 'light' || saved === 'true' // support legacy values
    applyTheme()
  }

  const toggleTheme = () => {
    isLight.value = !isLight.value
    localStorage.setItem('theme', isLight.value ? 'light' : 'dark')
    applyTheme()
  }

  const applyTheme = () => {
    if (isLight.value) {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }

  return {
    isLight,
    initializeTheme,
    toggleTheme,
    applyTheme,
  }
})
