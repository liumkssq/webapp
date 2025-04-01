import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/user'
import { getToken, setToken, removeToken, setUserInfo as setAuthUserInfo, getUserInfo as getAuthUserInfo } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: getAuthUserInfo() || {},
    unreadMessageCount: 0,
    unreadNotificationCount: 0
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    totalUnreadCount: (state) => state.unreadMessageCount + state.unreadNotificationCount
  },
  
  actions: {
    /**
     * 恢复用户会话
     * 在应用启动或页面刷新时调用，验证token并获取最新用户信息
     */
    async restoreUserSession() {
      console.log('尝试恢复用户会话...');
      
      // 检查是否有token
      const storedToken = getToken();
      if (!storedToken) {
        console.log('无法恢复会话：没有有效token');
        return null;
      }
      
      // 确保store中的token与auth.js同步
      this.token = storedToken;
      
      try {
        // 尝试获取用户信息以验证token有效性
        console.log('验证token有效性并获取最新用户信息');
        const userData = await this.getUserInfo();
        
        if (userData) {
          console.log('成功恢复用户会话', userData);
          return userData;
        } else {
          console.warn('token可能已失效，无法获取用户信息');
          return null;
        }
      } catch (error) {
        console.error('恢复会话时出错:', error);
        return null;
      }
    },
    
    // 优化login方法，确保token正确保存
    login(token, userInfo = null) {
      console.log('登录成功，保存token和用户信息');
      
      if (!token) {
        console.error('无法登录：未提供token');
        return;
      }
      
      // 使用auth.js中的方法保存token
      setToken(token);
      this.token = token;
      
      // 如果同时提供了用户信息，也保存它
      if (userInfo) {
        this.setUserInfo(userInfo);
      }
      
      console.log('登录状态已更新，token已保存');
    },
    
    setToken(token) {
      this.token = token;
      setToken(token);
    },
    
    setUserInfo(userInfo) {
      console.log('更新用户信息:', userInfo);
      
      // 如果用户信息为空，直接返回
      if (!userInfo) {
        console.warn('传入的用户信息为空，无法更新');
        return;
      }
      
      // 确保id字段存在 - 兼容处理不同格式的后端响应
      if (!userInfo.id && userInfo.userId) {
        console.log('兼容处理：将userId作为id使用');
        userInfo.id = userInfo.userId;
      } else if (!userInfo.id && !userInfo.userId) {
        // 尝试从localStorage中获取userId
        const localUserId = localStorage.getItem('userId');
        if (localUserId) {
          console.log('兼容处理：使用localStorage中的userId作为id');
          userInfo.id = parseInt(localUserId);
        } else {
          console.warn('警告：无法获取用户ID');
        }
      }
      
      // 更新用户信息
      this.userInfo = userInfo;
      
      // 使用auth.js中的方法保存用户信息
      setAuthUserInfo(userInfo);
      
      console.log('用户信息更新完成，当前状态:', this.userInfo);
    },
    
    logout() {
      this.token = '';
      this.userInfo = {};
      
      // 使用auth.js中的方法移除token
      removeToken();
      
      // 兼容性清理其他可能存在的本地存储信息
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('tokenExpire');
      localStorage.removeItem('refreshAfter');
      localStorage.removeItem('username');
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
      this.userInfo = { ...this.userInfo, ...userInfo };
      setAuthUserInfo(this.userInfo);
    },
    
    updateUnreadMessageCount(count) {
      this.unreadMessageCount = count
    },
    
    updateUnreadNotificationCount(count) {
      this.unreadNotificationCount = count
    },
    
    async getUserInfo() {
      try {
        console.log('Pinia store: 调用getUserInfo获取用户信息');
        
        // 如果没有token，直接返回空对象
        if (!this.token) {
          console.warn('获取用户信息失败：未登录状态(无token)');
          return null;
        }
        
        const response = await getUserInfo();
        console.log('Pinia store getUserInfo响应:', response);
        
        if (response && response.code === 200 && response.data) {
          const userData = response.data;
          
          // 确保id字段存在 - 兼容处理不同格式的后端响应
          if (!userData.id && userData.userId) {
            console.log('兼容处理：将userId作为id使用');
            userData.id = userData.userId;
          } else if (!userData.id && !userData.userId) {
            // 尝试从localStorage中获取userId
            const localUserId = localStorage.getItem('userId');
            if (localUserId) {
              console.log('兼容处理：使用localStorage中的userId作为id');
              userData.id = parseInt(localUserId);
            } else {
              console.warn('警告：无法获取用户ID');
            }
          }
          
          // 更新用户信息
          this.setUserInfo(userData);
          console.log('用户信息更新成功:', userData);
          return userData;
        } else if (response && response.userId) {
          // 直接返回用户对象的情况
          const userData = {
            ...response,
            id: response.id || response.userId // 确保id字段存在
          };
          this.setUserInfo(userData);
          console.log('直接返回用户对象，更新成功:', userData);
          return userData;
        } else {
          console.error('获取用户信息失败:', response?.message || '服务器错误');
          return null;
        }
      } catch (error) {
        console.error('获取用户信息异常:', error);
        return null;
      }
    }
  }
})