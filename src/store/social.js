// 社交功能的状态管理
import { defineStore } from 'pinia'
import { getFriendList, getOnlineFriends, getFriendRequestCount } from '@/api/social'

export const useSocialStore = defineStore('social', {
  state: () => ({
    // 好友列表
    friendList: [],
    // 在线好友列表
    onlineFriends: [],
    // 好友列表是否加载中
    loading: false,
    // 好友请求未读数量
    friendRequestCount: 0,
    // 最后更新时间
    lastUpdateTime: 0
  }),
  
  getters: {
    // 获取所有好友
    allFriends: (state) => state.friendList,
    
    // 获取在线好友
    onlineFriendsList: (state) => state.onlineFriends,
    
    // 好友总数
    friendCount: (state) => state.friendList.length,
    
    // 在线好友数量
    onlineFriendCount: (state) => state.onlineFriends.length,
    
    // 是否有新的好友请求
    hasNewFriendRequests: (state) => state.friendRequestCount > 0
  },
  
  actions: {
    /**
     * 加载好友列表
     * @param {boolean} [force=false] 是否强制刷新
     */
    async loadFriendList(force = false) {
      // 如果不是强制刷新，且距离上次更新时间小于5分钟，则不重新加载
      const now = Date.now()
      if (!force && this.friendList.length > 0 && (now - this.lastUpdateTime < 5 * 60 * 1000)) {
        return
      }
      
      this.loading = true
      
      try {
        const response = await getFriendList()
        
        if (response.code === 200) {
          this.friendList = response.data.items || []
          this.lastUpdateTime = now
        } else {
          console.error('加载好友列表失败:', response.message)
        }
      } catch (error) {
        console.error('加载好友列表失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 加载在线好友列表
     */
    async loadOnlineFriends() {
      try {
        const response = await getOnlineFriends()
        
        if (response.code === 200) {
          this.onlineFriends = response.data.items || []
        } else {
          console.error('加载在线好友列表失败:', response.message)
        }
      } catch (error) {
        console.error('加载在线好友列表失败:', error)
      }
    },
    
    /**
     * 加载好友请求未读数量
     */
    async loadFriendRequestCount() {
      try {
        const response = await getFriendRequestCount()
        
        if (response.code === 200) {
          this.friendRequestCount = response.data.count || 0
        } else {
          console.error('加载好友请求未读数量失败:', response.message)
        }
      } catch (error) {
        console.error('加载好友请求未读数量失败:', error)
      }
    },
    
    /**
     * 设置好友请求未读数量
     * @param {number} count 未读数量
     */
    setFriendRequestCount(count) {
      this.friendRequestCount = count
    },
    
    /**
     * 好友状态更新
     * @param {string} friendId 好友ID
     * @param {boolean} isOnline 是否在线
     */
    updateFriendStatus(friendId, isOnline) {
      // 更新好友列表中的状态
      const friendIndex = this.friendList.findIndex(f => f.id === friendId)
      
      if (friendIndex !== -1) {
        this.friendList[friendIndex].isOnline = isOnline
      }
      
      // 更新在线好友列表
      if (isOnline) {
        // 如果好友上线且不在在线列表中，则添加
        const onlineIndex = this.onlineFriends.findIndex(f => f.id === friendId)
        
        if (onlineIndex === -1 && friendIndex !== -1) {
          this.onlineFriends.push(this.friendList[friendIndex])
        }
      } else {
        // 如果好友下线，从在线列表中移除
        this.onlineFriends = this.onlineFriends.filter(f => f.id !== friendId)
      }
    },
    
    /**
     * 添加好友
     * @param {Object} friend 好友信息
     */
    addFriend(friend) {
      // 检查是否已存在该好友
      const existIndex = this.friendList.findIndex(f => f.id === friend.id)
      
      if (existIndex === -1) {
        this.friendList.push(friend)
        
        // 如果好友在线，也添加到在线好友列表
        if (friend.isOnline) {
          this.onlineFriends.push(friend)
        }
      }
    },
    
    /**
     * 删除好友
     * @param {string} friendId 好友ID
     */
    removeFriend(friendId) {
      this.friendList = this.friendList.filter(f => f.id !== friendId)
      this.onlineFriends = this.onlineFriends.filter(f => f.id !== friendId)
    },
    
    /**
     * 更新好友信息
     * @param {string} friendId 好友ID
     * @param {Object} updates 更新信息
     */
    updateFriendInfo(friendId, updates) {
      // 更新好友列表
      const friendIndex = this.friendList.findIndex(f => f.id === friendId)
      
      if (friendIndex !== -1) {
        this.friendList[friendIndex] = {
          ...this.friendList[friendIndex],
          ...updates
        }
      }
      
      // 更新在线好友列表
      const onlineIndex = this.onlineFriends.findIndex(f => f.id === friendId)
      
      if (onlineIndex !== -1) {
        this.onlineFriends[onlineIndex] = {
          ...this.onlineFriends[onlineIndex],
          ...updates
        }
      }
    },
    
    /**
     * 重置状态
     */
    resetState() {
      this.friendList = []
      this.onlineFriends = []
      this.loading = false
      this.friendRequestCount = 0
      this.lastUpdateTime = 0
    }
  }
})