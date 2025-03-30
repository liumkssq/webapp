import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    unreadMessageCount: 0,
    unreadNotificationCount: 0
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    totalUnreadCount: (state) => state.unreadMessageCount + state.unreadNotificationCount
  },
  
  actions: {
    login(token, userInfo) {
      this.token = token
      this.userInfo = userInfo
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
    
    setLoggedIn(status) {
      if (status && !this.token) {
        // 模拟登录，设置模拟token和用户信息
        const token = `mock_token_${Date.now()}`
        const userInfo = {
          id: 1,
          username: 'testuser',
          nickname: '测试用户',
          avatar: 'https://img01.yzcdn.cn/vant/cat.jpeg'
        }
        this.login(token, userInfo)
      } else if (!status && this.token) {
        this.logout()
      }
    },
    
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },
    
    updateUnreadMessageCount(count) {
      this.unreadMessageCount = count
    },
    
    updateUnreadNotificationCount(count) {
      this.unreadNotificationCount = count
    }
  }
})