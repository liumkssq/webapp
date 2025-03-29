import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const unreadMessageCount = ref(0)
  
  // 登录状态
  const isLoggedIn = computed(() => {
    return !!token.value && !!currentUser.value
  })
  
  // 用户ID
  const userId = computed(() => {
    return currentUser.value?.id
  })
  
  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      if (!token.value) return
      
      const res = await getUserInfo()
      if (res.code === 200 && res.data) {
        setUser(res.data)
      } else {
        // 如果获取用户信息失败，可能是token已过期
        clearUser()
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      // 出错时清除用户状态
      clearUser()
    }
  }
  
  // 设置用户信息
  const setUser = (user) => {
    currentUser.value = user
  }
  
  // 设置token
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  // 更新用户信息
  const updateUserInfo = (userData) => {
    if (!currentUser.value) return
    
    currentUser.value = {
      ...currentUser.value,
      ...userData
    }
  }
  
  // 更新未读消息数量
  const updateUnreadMessageCount = (count) => {
    unreadMessageCount.value = count
  }
  
  // 清除用户状态
  const clearUser = () => {
    currentUser.value = null
    token.value = ''
    unreadMessageCount.value = 0
    localStorage.removeItem('token')
  }
  
  // 初始化加载
  if (token.value) {
    loadUserInfo()
  }
  
  return {
    currentUser,
    token,
    unreadMessageCount,
    isLoggedIn,
    userId,
    setUser,
    setToken,
    updateUserInfo,
    updateUnreadMessageCount,
    loadUserInfo,
    clearUser
  }
})