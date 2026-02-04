import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isLight = ref(false)

  const initializeTheme = () => {
    const saved = localStorage.getItem('theme')
    isLight.value = saved === 'light'
    applyTheme()
  }

  const toggleTheme = () => {
    isLight.value = !isLight.value
    localStorage.setItem('theme', isLight.value ? 'light' : 'dark')
    applyTheme()
  }

  const applyTheme = () => {
    if (isLight.value) {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
  }

  return {
    isLight,
    initializeTheme,
    toggleTheme,
    applyTheme,
  }
})
