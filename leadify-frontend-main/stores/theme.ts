import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<'light' | 'dark'>('dark')
  const systemPreference = ref<'light' | 'dark'>('dark')

  // Getters
  const isDarkMode = () => currentTheme.value === 'dark'
  const isLightMode = () => currentTheme.value === 'light'

  // Actions
  const initializeTheme = () => {
    // Check localStorage first
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      currentTheme.value = saved
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    }

    applyTheme()
  }

  const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    applyTheme()
  }

  const toggleTheme = () => {
    const newTheme = isDarkMode() ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const applyTheme = () => {
    const html = document.documentElement
    
    // Remove both classes first
    html.classList.remove('light-mode', 'dark-mode')
    
    // Add the appropriate class
    if (currentTheme.value === 'dark') {
      html.classList.add('dark-mode')
      html.style.colorScheme = 'dark'
    } else {
      html.classList.add('light-mode')
      html.style.colorScheme = 'light'
    }
  }

  return {
    // State
    currentTheme,
    systemPreference,
    
    // Getters
    isDarkMode,
    isLightMode,
    
    // Actions
    initializeTheme,
    setTheme,
    toggleTheme,
    applyTheme,
  }
})
