import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 从本地存储获取初始值
  const getInitialDarkMode = () => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      return savedMode === 'true'
    }
    // 默认跟随系统
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // 状态
  const darkMode = ref(getInitialDarkMode())
  const appLoading = ref(false)
  const appError = ref(null)
  
  // 设置深色模式
  const setDarkMode = (value) => {
    darkMode.value = value
    localStorage.setItem('darkMode', value.toString())
    
    // 更新文档类
    if (value) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }
  
  // 切换深色模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode.value)
  }
  
  // 设置加载状态
  const setLoading = (value) => {
    appLoading.value = value
  }
  
  // 设置错误信息
  const setError = (error) => {
    appError.value = error
  }
  
  // 清除错误信息
  const clearError = () => {
    appError.value = null
  }
  
  // 初始化应用
  const initApp = () => {
    // 初始应用于深色模式
    if (darkMode.value) {
      document.documentElement.classList.add('dark-mode')
    }
    
    // 监听系统颜色方案变化
    if (window.matchMedia) {
      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e) => {
        // 只有当用户没有手动设置过时才跟随系统
        if (localStorage.getItem('darkMode') === null) {
          setDarkMode(e.matches)
        }
      }
      
      // 添加监听器
      if (colorSchemeQuery.addEventListener) {
        colorSchemeQuery.addEventListener('change', handleChange)
      } else if (colorSchemeQuery.addListener) {
        // 兼容旧版本
        colorSchemeQuery.addListener(handleChange)
      }
    }
  }
  
  // 监听深色模式变化
  watch(darkMode, (newValue) => {
    if (newValue) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  })
  
  return {
    darkMode,
    appLoading,
    appError,
    setDarkMode,
    toggleDarkMode,
    setLoading,
    setError,
    clearError,
    initApp
  }
})