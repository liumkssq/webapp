import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, getUserInfo, logout } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userId = ref(localStorage.getItem('userId') || '')
  const username = ref('')
  const nickname = ref('')
  const avatar = ref('')
  const phone = ref('')
  const userInfo = ref({})
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  
  // 操作方法
  // 登录
  const userLogin = async (loginForm) => {
    try {
      const { data } = await login(loginForm)
      token.value = data.token
      userId.value = data.userId
      
      // 存储到本地
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      
      // 获取用户信息
      await fetchUserInfo()
      
      return true
    } catch (error) {
      console.error('登录失败', error)
      return false
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return
      
      const { data } = await getUserInfo()
      username.value = data.username
      nickname.value = data.nickname
      avatar.value = data.avatar
      phone.value = data.phone
      userInfo.value = data
      
      return data
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }
  
  // 登出
  const userLogout = async () => {
    try {
      if (token.value) {
        await logout()
      }
    } catch (error) {
      console.error('登出请求失败', error)
    } finally {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      
      // 重置状态
      token.value = ''
      userId.value = ''
      username.value = ''
      nickname.value = ''
      avatar.value = ''
      phone.value = ''
      userInfo.value = {}
    }
  }
  
  // 更新用户信息
  const updateUserInfo = (info) => {
    if (info.username) username.value = info.username
    if (info.nickname) nickname.value = info.nickname
    if (info.avatar) avatar.value = info.avatar
    if (info.phone) phone.value = info.phone
    
    userInfo.value = {
      ...userInfo.value,
      ...info
    }
  }
  
  return {
    token,
    userId,
    username,
    nickname,
    avatar,
    phone,
    userInfo,
    isLoggedIn,
    userLogin,
    fetchUserInfo,
    userLogout,
    updateUserInfo
  }
})