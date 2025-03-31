import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/user'

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
    
    setToken(token) {
      this.token = token
      // 不重复写入localStorage，因为Login.vue已经处理了
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('tokenExpire')
      localStorage.removeItem('refreshAfter')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
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
    },
    
    async getUserInfo() {
      try {
        console.log('从Pinia store中获取用户信息');
        const res = await getUserInfo();
        
        // 处理各种响应格式
        if (res && res.data) {
          if (res.code === 200) {
            console.log('成功获取用户信息，更新store');
            this.updateUserInfo(res.data);
            return res.data;
          } else {
            console.error('获取用户信息响应错误码:', res.code, res.message);
          }
        } else if (res && !res.code && res.userId) {
          // 处理直接返回用户对象的情况
          console.log('后端直接返回用户对象，进行处理');
          const userData = {
            id: res.userId || res.id,
            username: res.username || '未知用户',
            nickname: res.nickname || res.username || '未知用户',
            avatar: res.avatar || '',
            phone: res.phone || '',
            email: res.email || '',
            gender: res.gender || '',
            bio: res.bio || '',
            school: res.school || '',
            followerCount: res.followerCount || res.followersCount || 0,
            followingCount: res.followingCount || 0,
            productCount: res.productCount || 0,
            articleCount: res.articleCount || 0,
            lostFoundCount: res.lostFoundCount || 0,
            favoriteCount: res.favoriteCount || 0
          };
          this.updateUserInfo(userData);
          return userData;
        } else {
          console.error('获取用户信息失败，响应格式异常:', res);
        }
        return null;
      } catch (error) {
        console.error('获取用户信息异常', error);
        return null;
      }
    }
  }
})