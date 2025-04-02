// IM Store - 管理WebSocket连接和消息状态
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWebSocketUrl, wsActions } from '@/api/im'

/**
 * IM Store - 管理WebSocket连接和消息状态
 */
export const useIMStore = defineStore('im', () => {
  // WebSocket连接
  const ws = ref(null)
  const connected = ref(false)
  const connecting = ref(false)
  const reconnectCount = ref(0)
  const maxReconnectAttempts = 5
  const userId = ref(null)
  
  // 消息队列 - 当WebSocket未连接时缓存消息
  const messageQueue = ref([])
  
  // 当前会话
  const activeConversationId = ref(null)
  
  // 会话列表
  const conversations = ref([])
  
  // 创建WebSocket连接
  const initWebSocket = (currentUserId) => {
    // 如果已经连接或正在连接，返回
    if (connected.value || connecting.value) return
    
    try {
      // 设置用户ID
      userId.value = currentUserId
      connecting.value = true
      
      // 创建WebSocket连接
      const wsUrl = getWebSocketUrl(currentUserId)
      ws.value = new WebSocket(wsUrl)
      
      // 连接打开
      ws.value.onopen = () => {
        console.log('WebSocket连接已建立')
        connected.value = true
        connecting.value = false
        reconnectCount.value = 0
        
        // 发送在线状态
        sendOnlineStatus()
        
        // 发送队列中的消息
        processPendingMessages()
      }
      
      // 接收消息
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleIncomingMessage(data)
    } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }
      
      // 连接关闭
      ws.value.onclose = () => {
        console.log('WebSocket连接已关闭')
        connected.value = false
        connecting.value = false
        
        // 尝试重新连接
        if (reconnectCount.value < maxReconnectAttempts) {
          // 增加重连计数并使用指数退避算法
          const delay = Math.min(1000 * Math.pow(2, reconnectCount.value), 30000)
          setTimeout(() => {
            reconnectCount.value++
            initWebSocket(userId.value)
          }, delay)
        }
      }
      
      // 连接错误
      ws.value.onerror = (error) => {
        console.error('WebSocket连接错误:', error)
        connecting.value = false
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      connecting.value = false
    }
  }
  
  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (ws.value && (connected.value || connecting.value)) {
      ws.value.close()
      ws.value = null
      connected.value = false
      connecting.value = false
    }
  }
  
  // 发送在线状态
  const sendOnlineStatus = () => {
    if (!connected.value || !ws.value) return false
    
    try {
      const message = {
        action: wsActions.USER_ONLINE,
        user_id: userId.value
      }
      
      ws.value.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('发送在线状态失败:', error)
      return false
    }
  }
  
  // 发送聊天消息
  const sendChatMessage = (conversationId, receiverId, message) => {
    if (!userId.value) return false
    
    const chatMessage = {
      action: wsActions.CONVERSATION_CHAT,
      conversation_id: conversationId,
      send_id: userId.value,
      recv_id: receiverId,
      msg_type: message.type === 'text' ? 1 : 2, // 1:文本 2:图片
      msg_content: message.content
    }
    
    // 如果WebSocket已连接，直接发送
    if (connected.value && ws.value) {
      try {
        ws.value.send(JSON.stringify(chatMessage))
        return true
      } catch (error) {
        console.error('发送消息失败:', error)
        // 发送失败，加入队列
        messageQueue.value.push(chatMessage)
        return false
      }
    } else {
      // WebSocket未连接，加入队列
      messageQueue.value.push(chatMessage)
      return false
    }
  }
  
  // 处理发送队列中的消息
  const processPendingMessages = () => {
    if (!connected.value || !ws.value || messageQueue.value.length === 0) return
    
    // 复制队列并清空原队列
    const pendingMessages = [...messageQueue.value]
    messageQueue.value = []
    
    // 发送所有待发送消息
    pendingMessages.forEach(message => {
      try {
        ws.value.send(JSON.stringify(message))
      } catch (error) {
        console.error('发送队列消息失败:', error)
        // 发送失败，重新加入队列
        messageQueue.value.push(message)
      }
    })
  }
  
  // 处理收到的消息
  const handleIncomingMessage = (data) => {
    if (!data || !data.action) return
    
    switch (data.action) {
      case wsActions.PUSH:
        // 处理推送消息
        handlePushMessage(data)
        break
      default:
        console.log('收到未知类型的消息:', data)
    }
  }
  
  // 处理推送消息
  const handlePushMessage = (data) => {
    if (!data.data) return
    
    // 根据消息类型处理
    switch (data.type) {
      case 'new_message':
        // 新消息
        handleNewMessage(data.data)
        break
      case 'read_message':
        // 消息已读
        handleReadMessage(data.data)
        break
      case 'new_conversation':
        // 新会话
        handleNewConversation(data.data)
        break
      default:
        console.log('收到未知类型的推送:', data)
    }
  }
  
  // 处理新消息
  const handleNewMessage = (message) => {
    // 更新会话列表中的最新消息
    updateConversationWithMessage(message)
    
    // 如果是当前活跃会话，更新消息列表
    if (message.conversation_id === activeConversationId.value) {
      // 这里可以触发一个事件通知UI更新
      // 或者在UI组件中监听特定的状态变化
    }
  }
  
  // 处理消息已读状态
  const handleReadMessage = (data) => {
    // 更新会话的已读状态
    const { conversation_id } = data
    const conversationIndex = conversations.value.findIndex(
      c => c.id === conversation_id
    )
    
    if (conversationIndex !== -1) {
      conversations.value[conversationIndex].unreadCount = 0
    }
  }
  
  // 处理新会话
  const handleNewConversation = (conversation) => {
    // 检查会话是否已存在
    const exists = conversations.value.some(c => c.id === conversation.id)
    if (!exists) {
      conversations.value.push(conversation)
    }
  }
  
  // 更新会话的最新消息
  const updateConversationWithMessage = (message) => {
    const { conversation_id, send_id, recv_id, msg_content, msg_type, send_time } = message
    
    // 查找会话
    const conversationIndex = conversations.value.findIndex(
      c => c.id === conversation_id
    )
    
    if (conversationIndex !== -1) {
      // 更新现有会话
      const conversation = conversations.value[conversationIndex]
      
      // 更新最新消息
      conversation.lastMessage = {
        content: msg_content,
        type: msg_type,
        sendTime: send_time
      }
      
      // 如果不是自己发的消息且不是当前会话，增加未读数
      if (send_id !== userId.value && conversation_id !== activeConversationId.value) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1
      }
      
      // 移动到列表顶部
      const updatedConversation = {...conversation}
      conversations.value.splice(conversationIndex, 1)
      conversations.value.unshift(updatedConversation)
    } else {
      // 如果会话不存在，可能需要获取最新的会话列表
      // 这里可以触发重新获取会话列表的操作
    }
  }
  
  // 设置当前活跃会话
  const setActiveConversation = (conversationId) => {
    activeConversationId.value = conversationId
    
    // 重置该会话的未读消息计数
    const conversationIndex = conversations.value.findIndex(
      c => c.id === conversationId
    )
    
    if (conversationIndex !== -1) {
      conversations.value[conversationIndex].unreadCount = 0
    }
  }
  
  // 设置会话列表
  const setConversations = (newConversations) => {
    conversations.value = newConversations
  }
  
  // 计算未读消息总数
  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0)
    }, 0)
  })
  
  return {
    // 状态
    connected,
    connecting,
    conversations,
    activeConversationId,
    totalUnreadCount,
    
    // 方法
    initWebSocket,
    closeWebSocket,
    sendChatMessage,
    setActiveConversation,
    setConversations
  }
})