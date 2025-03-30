/**
 * IM聊天相关的状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { WebSocketClient } from '@/utils/websocket'
import { 
  getConversationList, 
  getMessageHistory, 
  sendTextMessage, 
  sendImageMessage, 
  sendFileMessage,
  markAsRead, 
  getUnreadCount,
  initWebSocketConnection,
  closeWebSocketConnection,
  addWebSocketListener,
  removeWebSocketListener
} from '@/api/im'
import { useUserStore } from './user'

/**
 * 聊天对话状态管理
 */
export const useIMStore = defineStore('im', () => {
  // WebSocket客户端实例
  const wsClient = ref(null)
  const isWebSocketConnected = ref(false)
  const reconnecting = ref(false)
  
  // 存储聊天数据
  const conversations = ref([])
  const messageCache = reactive({}) // 格式: { conversationId: [messages] }
  const hasMoreMessages = reactive({}) // 格式: { conversationId: boolean }
  const unreadCounts = reactive({}) // 格式: { conversationId: number }
  const currentConversation = ref(null)
  
  // 在线用户缓存
  const onlineUsers = ref(new Set())
  
  // 事件监听器
  const eventListeners = reactive({
    new_message: [],
    typing: [],
    message_recall: [],
    user_online: [],
    user_offline: [],
    group_created: [],
    group_updated: [],
    group_member_joined: [],
    group_member_left: [],
  })
  
  // 用户store
  const userStore = useUserStore()
  
  // 计算属性
  const totalUnreadCount = computed(() => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0)
  })
  
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      // 置顶的排在前面
      if (a.isSticky && !b.isSticky) return -1
      if (!a.isSticky && b.isSticky) return 1
      
      // 按照最后消息时间排序
      const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
      const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
      return bTime - aTime
    })
  })
  
  const isUserOnline = (userId) => {
    return onlineUsers.value.has(String(userId))
  }
  
  // WebSocket连接初始化
  const initWebSocket = async () => {
    if (wsClient.value && isWebSocketConnected.value) {
      console.log('WebSocket已连接')
      return
    }
    
    try {
      // 获取用户信息
      const token = userStore.token
      const userId = userStore.userId
      
      if (!token || !userId) {
        console.error('无法初始化WebSocket: 未登录')
        return
      }
      
      // 创建WebSocket客户端
      wsClient.value = new WebSocketClient({
        url: import.meta.env.VITE_WS_URL || `${window.location.origin.replace('http', 'ws')}/api/ws`,
        params: { token, userId },
        onOpen: handleSocketOpen,
        onClose: handleSocketClose,
        onError: handleSocketError,
        onMessage: handleSocketMessage,
        debug: process.env.NODE_ENV === 'development'
      })
      
      // 连接WebSocket
      await wsClient.value.connect()
      
      // 加载会话列表
      await loadConversations()
    } catch (error) {
      console.error('初始化WebSocket失败', error)
      reconnectWebSocket()
    }
  }
  
  // 重新连接WebSocket
  const reconnectWebSocket = async () => {
    if (reconnecting.value) return
    
    reconnecting.value = true
    
    try {
      await wsClient.value?.disconnect()
      wsClient.value = null
      isWebSocketConnected.value = false
      
      // 延迟重连
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await initWebSocket()
    } catch (error) {
      console.error('重连WebSocket失败', error)
    } finally {
      reconnecting.value = false
    }
  }
  
  // WebSocket事件处理
  const handleSocketOpen = () => {
    console.log('WebSocket连接成功')
    isWebSocketConnected.value = true
  }
  
  const handleSocketClose = () => {
    console.log('WebSocket连接关闭')
    isWebSocketConnected.value = false
    
    // 尝试重连
    reconnectWebSocket()
  }
  
  const handleSocketError = (error) => {
    console.error('WebSocket错误', error)
    isWebSocketConnected.value = false
    
    // 尝试重连
    reconnectWebSocket()
  }
  
  const handleSocketMessage = (message) => {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data
      
      console.log('收到WebSocket消息', { type, payload })
      
      switch (type) {
        case 'new_message':
          handleNewMessage(payload)
          break
        case 'typing':
          handleTypingStatus(payload)
          break
        case 'message_recall':
          handleMessageRecall(payload)
          break
        case 'user_online':
          handleUserOnline(payload)
          break
        case 'user_offline':
          handleUserOffline(payload)
          break
        case 'group_created':
        case 'group_updated':
        case 'group_member_joined':
        case 'group_member_left':
          handleGroupEvent(type, payload)
          break
        default:
          console.log('未处理的WebSocket消息类型', type)
      }
      
      // 触发事件监听器
      triggerEvent(type, payload)
    } catch (error) {
      console.error('处理WebSocket消息失败', error)
    }
  }
  
  // 消息处理函数
  const handleNewMessage = (payload) => {
    const { conversationId, message } = payload
    
    // 如果不在缓存中，创建新数组
    if (!messageCache[conversationId]) {
      messageCache[conversationId] = []
    }
    
    // 检查消息是否已存在
    const exists = messageCache[conversationId].some(msg => msg.id === message.id)
    if (!exists) {
      // 添加到消息缓存
      messageCache[conversationId].push(message)
      
      // 更新会话的最后一条消息
      updateConversationLastMessage(conversationId, message)
      
      // 如果不是当前会话或者当前聊天窗口没有激活，增加未读数
      if (
        !currentConversation.value || 
        currentConversation.value.id !== conversationId ||
        document.hidden
      ) {
        unreadCounts[conversationId] = (unreadCounts[conversationId] || 0) + 1
      }
    }
  }
  
  const handleTypingStatus = (payload) => {
    // 处理正在输入状态
    console.log('用户正在输入', payload)
  }
  
  const handleMessageRecall = (payload) => {
    const { conversationId, messageId } = payload
    
    // 查找并更新消息
    if (messageCache[conversationId]) {
      const message = messageCache[conversationId].find(msg => msg.id === messageId)
      if (message) {
        message.isRevoked = true
        message.content = ''
      }
    }
    
    // 如果是最后一条消息，更新会话预览
    const conversation = conversations.value.find(conv => conv.id === conversationId)
    if (conversation && conversation.lastMessage && conversation.lastMessage.id === messageId) {
      conversation.lastMessage.isRevoked = true
      conversation.lastMessage.content = '该消息已撤回'
    }
  }
  
  const handleUserOnline = (payload) => {
    const { userId } = payload
    onlineUsers.value.add(String(userId))
  }
  
  const handleUserOffline = (payload) => {
    const { userId } = payload
    onlineUsers.value.delete(String(userId))
  }
  
  const handleGroupEvent = (type, payload) => {
    // 处理群组相关事件
    loadConversations()
  }
  
  // 更新会话的最后一条消息
  const updateConversationLastMessage = (conversationId, message) => {
    const conversation = conversations.value.find(conv => conv.id === conversationId)
    if (conversation) {
      conversation.lastMessage = message
      
      // 更新会话排序
      conversations.value = [...conversations.value]
    } else {
      // 如果会话不存在，可能是新会话，重新加载会话列表
      loadConversations()
    }
  }
  
  // 加载会话列表
  const loadConversations = async () => {
    try {
      const response = await getConversationList()
      
      if (response.code === 200) {
        conversations.value = response.data.list || []
        
        // 初始化未读数
        conversations.value.forEach(conv => {
          unreadCounts[conv.id] = conv.unreadCount || 0
        })
      }
    } catch (error) {
      console.error('加载会话列表失败', error)
    }
  }
  
  // 加载会话消息
  const loadMessages = async (conversationId, options = {}) => {
    try {
      const params = {
        page: 1,
        limit: 20,
        ...options
      }
      
      const response = await getMessageHistory(conversationId, params)
      
      if (response.code === 200) {
        messageCache[conversationId] = response.data.list || []
        hasMoreMessages[conversationId] = response.data.hasMore
        return {
          messages: messageCache[conversationId],
          hasMore: hasMoreMessages[conversationId]
        }
      }
      
      return { messages: [], hasMore: false }
    } catch (error) {
      console.error('加载会话消息失败', error)
      return { messages: [], hasMore: false }
    }
  }
  
  // 加载更多会话消息
  const loadMoreMessages = async (conversationId) => {
    if (!hasMoreMessages[conversationId]) return false
    
    const currentMessages = messageCache[conversationId] || []
    const currentPage = Math.floor(currentMessages.length / 20) + 1
    
    try {
      const response = await getMessageHistory(conversationId, {
        page: currentPage,
        limit: 20
      })
      
      if (response.code === 200) {
        const newMessages = response.data.list || []
        
        if (newMessages.length > 0) {
          messageCache[conversationId] = [...newMessages, ...currentMessages]
        }
        
        hasMoreMessages[conversationId] = response.data.hasMore
        
        return {
          messages: messageCache[conversationId],
          hasMore: hasMoreMessages[conversationId]
        }
      }
      
      return { messages: currentMessages, hasMore: false }
    } catch (error) {
      console.error('加载更多消息失败', error)
      return { messages: currentMessages, hasMore: false }
    }
  }
  
  // 设置当前会话
  const setCurrentConversation = (conversation) => {
    currentConversation.value = conversation
    
    // 如果有当前会话，将其未读数清零
    if (conversation) {
      unreadCounts[conversation.id] = 0
    }
  }
  
  // 标记会话已读
  const readConversation = (conversationId) => {
    unreadCounts[conversationId] = 0
  }
  
  // 发送消息
  const sendMessageToConversation = async (messageData) => {
    if (!messageData.conversationId || !isWebSocketConnected.value) {
      console.error('无法发送消息: WebSocket未连接或会话ID为空')
      return null
    }
    
    try {
      // 根据消息类型发送
      let response
      const { conversationId, type, content } = messageData
      
      switch (type) {
        case 'text':
          response = await sendTextMessage(conversationId, content)
          break
        case 'image':
          response = await sendImageMessage(conversationId, content)
          break
        case 'file':
          response = await sendFileMessage(conversationId, content)
          break
        default:
          console.error('不支持的消息类型', type)
          return null
      }
      
      if (response.code === 200) {
        const message = response.data
        
        // 添加到消息缓存
        if (!messageCache[conversationId]) {
          messageCache[conversationId] = []
        }
        
        messageCache[conversationId].push(message)
        
        // 更新会话的最后一条消息
        updateConversationLastMessage(conversationId, message)
        
        return message
      }
      
      return null
    } catch (error) {
      console.error('发送消息失败', error)
      return null
    }
  }
  
  // 重发消息
  const resendMessage = async (message) => {
    try {
      // 将消息标记为正在发送
      message.sendStatus = 'sending'
      
      // 根据消息类型重发
      const { conversationId, type, content } = message
      
      let response
      switch (type) {
        case 'text':
          response = await sendTextMessage(conversationId, content)
          break
        case 'image':
          response = await sendImageMessage(conversationId, content)
          break
        case 'file':
          response = await sendFileMessage(conversationId, content)
          break
        default:
          console.error('不支持的消息类型', type)
          message.sendStatus = 'failed'
          return false
      }
      
      if (response.code === 200) {
        // 更新消息状态
        Object.assign(message, response.data)
        return true
      }
      
      message.sendStatus = 'failed'
      return false
    } catch (error) {
      console.error('重发消息失败', error)
      message.sendStatus = 'failed'
      return false
    }
  }
  
  // 删除会话
  const deleteConversation = async (conversationId) => {
    try {
      // 发送删除会话请求
      // const response = await deleteConversationApi(conversationId)
      
      // 从列表中移除
      conversations.value = conversations.value.filter(conv => conv.id !== conversationId)
      
      // 清空消息缓存
      delete messageCache[conversationId]
      delete hasMoreMessages[conversationId]
      delete unreadCounts[conversationId]
      
      return true
    } catch (error) {
      console.error('删除会话失败', error)
      return false
    }
  }
  
  // 发送消息
  const sendMessage = async (conversationId, type, content) => {
    return sendMessageToConversation({
      conversationId,
      type,
      content,
      senderId: userStore.userId,
      senderName: userStore.userInfo?.nickname || userStore.userInfo?.username || '我',
      senderAvatar: userStore.userInfo?.avatar,
      timestamp: new Date().toISOString()
    })
  }
  
  // 发送输入状态
  const sendTypingStatus = (conversationId) => {
    if (!wsClient.value || !isWebSocketConnected.value) return
    
    wsClient.value.send(JSON.stringify({
      type: 'typing',
      payload: {
        conversationId,
        userId: userStore.userId,
        timestamp: Date.now()
      }
    }))
  }
  
  // 事件注册与触发
  const on = (eventName, callback) => {
    if (!eventListeners[eventName]) {
      eventListeners[eventName] = []
    }
    eventListeners[eventName].push(callback)
  }
  
  const off = (eventName, callback) => {
    if (!eventListeners[eventName]) return
    
    eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback)
  }
  
  const triggerEvent = (eventName, data) => {
    if (!eventListeners[eventName]) return
    
    for (const callback of eventListeners[eventName]) {
      try {
        callback(data)
      } catch (error) {
        console.error(`执行${eventName}事件回调时出错`, error)
      }
    }
  }
  
  // 关闭WebSocket连接
  const disconnect = () => {
    if (wsClient.value) {
      wsClient.value.disconnect()
      wsClient.value = null
    }
    
    isWebSocketConnected.value = false
    
    // 清空数据
    conversations.value = []
    Object.keys(messageCache).forEach(key => delete messageCache[key])
    Object.keys(hasMoreMessages).forEach(key => delete hasMoreMessages[key])
    Object.keys(unreadCounts).forEach(key => delete unreadCounts[key])
    currentConversation.value = null
    onlineUsers.value.clear()
  }
  
  // 返回状态与方法
  return {
    // 状态
    isWebSocketConnected,
    conversations,
    messageCache,
    hasMoreMessages,
    unreadCounts,
    totalUnreadCount,
    currentConversation,
    sortedConversations,
    onlineUsers,
    
    // 工具方法
    isUserOnline,
    
    // WebSocket操作
    initWebSocket,
    disconnect,
    reconnectWebSocket,
    
    // 消息操作
    loadConversations,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    sendMessageToConversation,
    resendMessage,
    sendTypingStatus,
    
    // 会话操作
    setCurrentConversation,
    readConversation,
    deleteConversation,
    
    // 事件监听
    on,
    off
  }
})