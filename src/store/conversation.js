// 会话状态管理
import {
    deleteSession,
    getConversations,
    getUnreadCount,
    setUpUserConversation
} from '@/api/im'
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    // 会话列表
    conversations: [],
    // 加载状态
    loading: false,
    // 未读消息总数
    totalUnread: 0,
    // 当前激活的会话ID
    activeConversationId: null,
    // 最后更新时间
    lastUpdateTime: 0
  }),
  
  getters: {
    /**
     * 获取排序后的会话列表(按最后消息时间倒序)
     * @returns {Array} 排序后的会话列表
     */
    sortedConversations: (state) => {
      return [...state.conversations].sort((a, b) => {
        // 置顶的会话排在前面
        if (a.isTop && !b.isTop) return -1
        if (!a.isTop && b.isTop) return 1
        
        // 按最后消息时间倒序
        const timeA = a.lastMessage?.sendTime || a.updateTime || 0
        const timeB = b.lastMessage?.sendTime || b.updateTime || 0
        return timeB - timeA
      })
    },
    
    /**
     * 获取指定ID的会话
     * @param {string} id 会话ID
     * @returns {Object|null} 会话对象或null
     */
    getConversationById: (state) => (id) => {
      return state.conversations.find(conv => conv.id === id) || null
    },
    
    /**
     * 获取当前激活的会话
     * @returns {Object|null} 会话对象或null
     */
    activeConversation: (state) => {
      if (!state.activeConversationId) return null
      return state.conversations.find(conv => conv.id === state.activeConversationId) || null
    },
    
    /**
     * 获取未读消息的会话数量
     * @returns {number} 未读会话数量
     */
    unreadConversationsCount: (state) => {
      return state.conversations.filter(conv => conv.unreadCount > 0).length
    }
  },
  
  actions: {
    /**
     * 加载会话列表
     * @param {boolean} force 是否强制刷新
     */
    async loadConversations(force = false) {
      const now = Date.now()
      
      // 如果不是强制刷新，且距离上次更新时间小于1分钟，则不重新加载
      if (!force && this.conversations.length > 0 && now - this.lastUpdateTime < 60000) {
        return this.conversations
      }
      
      this.loading = true
      
      try {
        const response = await getConversations()
        
        if (response.code === 200) {
          this.conversations = response.data || []
          this.lastUpdateTime = now
          await this.loadUnreadCount()
          return this.conversations
        } else {
          console.error('加载会话列表失败:', response.message)
          return this.conversations
        }
      } catch (error) {
        console.error('加载会话出错:', error)
        return this.conversations
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 加载未读消息数量
     */
    async loadUnreadCount() {
      try {
        const response = await getUnreadCount()
        
        if (response.code === 200) {
          this.totalUnread = response.data.total || 0
          
          // 更新各会话的未读数
          if (response.data.conversations) {
            this.updateConversationsUnread(response.data.conversations)
          }
        } else {
          console.error('加载未读消息数量失败:', response.message)
        }
      } catch (error) {
        console.error('加载未读消息数量出错:', error)
      }
    },
    
    /**
     * 更新会话未读数
     * @param {Object} unreadData 未读数据，键为会话ID，值为未读数量
     */
    updateConversationsUnread(unreadData) {
      Object.keys(unreadData).forEach(conversationId => {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        
        if (conversation) {
          conversation.unreadCount = unreadData[conversationId]
        }
      })
    },
    
    /**
     * 创建或获取会话
     * @param {Object} params 会话参数
     * @param {string|number} params.targetId 目标用户/群组ID
     * @param {number} params.chatType 聊天类型 1:群聊 2:单聊
     * @returns {Promise<Object>} 会话对象
     */
    async getOrCreateConversation(params) {
      if (!params.targetId) {
        throw new Error('创建会话失败: 缺少targetId')
      }
      
      const userStore = useUserStore()
      const userId = userStore.userInfo.id
      
      if (!userId) {
        throw new Error('创建会话失败: 未登录')
      }
      
      // 默认为单聊
      const chatType = params.chatType || 2
      
      try {
        // 检查是否已有现成的会话
        // 对于单聊，会话ID格式为 senderId_receiverId 或 receiverId_senderId
        const possibleIds = [`${userId}_${params.targetId}`, `${params.targetId}_${userId}`]
        const existingConv = this.conversations.find(conv => 
          possibleIds.includes(conv.id) && conv.chatType === chatType
        )
        
        if (existingConv) {
          console.log('使用现有会话:', existingConv)
          this.setActiveConversation(existingConv.id)
          return existingConv
        }
        
        // 创建新会话
        console.log('创建新会话:', { SendId: userId, recvId: params.targetId, chatType })
        const response = await setUpUserConversation({
          SendId: userId,  // 注意大小写：SendId首字母大写
          recvId: params.targetId, // recvId小写
          chatType
        })
        
        if (response.code === 200) {
          const conversationData = response.data
          
          // 检查会话是否已存在
          const existingIndex = this.conversations.findIndex(conv => conv.id === conversationData.id)
          
          if (existingIndex !== -1) {
            // 更新已有会话
            this.conversations[existingIndex] = {
              ...this.conversations[existingIndex],
              ...conversationData
            }
          } else {
            // 添加新会话
            this.conversations.push(conversationData)
          }
          
          // 设置活动会话
          this.setActiveConversation(conversationData.id)
          
          return conversationData
        } else {
          throw new Error(response.message || '创建会话失败')
        }
      } catch (error) {
        console.error('创建会话出错:', error)
        throw error
      }
    },
    
    /**
     * 设置活动会话
     * @param {string} conversationId 会话ID
     */
    setActiveConversation(conversationId) {
      this.activeConversationId = conversationId
      
      // 将当前活动会话的未读数清零
      if (conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        
        if (conversation && conversation.unreadCount > 0) {
          // 更新总未读数
          this.totalUnread = Math.max(0, this.totalUnread - conversation.unreadCount)
          
          // 更新会话未读数
          conversation.unreadCount = 0
        }
      }
    },
    
    /**
     * 更新会话的最后消息
     * @param {string} conversationId 会话ID
     * @param {Object} message 消息对象
     */
    updateConversationLastMessage(conversationId, message) {
      const conversation = this.conversations.find(conv => conv.id === conversationId)
      
      if (conversation) {
        // 更新最后消息
        conversation.lastMessage = message
        
        // 如果不是当前活动会话，增加未读数
        if (this.activeConversationId !== conversationId) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1
          this.totalUnread++
        }
        
        // 更新会话时间
        conversation.updateTime = message.sendTime || Date.now()
      } else {
        // 会话不存在，可能需要重新加载会话列表
        this.loadConversations(true)
      }
    },
    
    /**
     * 置顶会话
     * @param {string} conversationId 会话ID
     * @param {boolean} isTop 是否置顶
     */
    setConversationTop(conversationId, isTop) {
      const conversation = this.conversations.find(conv => conv.id === conversationId)
      
      if (conversation) {
        conversation.isTop = isTop
      }
    },
    
    /**
     * 删除会话
     * @param {string} conversationId 会话ID
     */
    async deleteConversation(conversationId) {
      try {
        const response = await deleteSession({ conversationId })
        
        if (response.code === 200) {
          // 从本地移除会话
          this.conversations = this.conversations.filter(conv => conv.id !== conversationId)
          
          // 如果删除的是当前活动会话，清空活动会话
          if (this.activeConversationId === conversationId) {
            this.activeConversationId = null
          }
          
          return true
        } else {
          throw new Error(response.message || '删除会话失败')
        }
      } catch (error) {
        console.error('删除会话出错:', error)
        throw error
      }
    },
    
    /**
     * 重置状态
     */
    resetState() {
      this.conversations = []
      this.loading = false
      this.totalUnread = 0
      this.activeConversationId = null
      this.lastUpdateTime = 0
    }
  }
})