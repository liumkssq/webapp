import Mock from 'mockjs'

const Random = Mock.Random

// 生成用户数据
const generateUser = (id) => {
  return {
    id,
    name: Random.cname(),
    avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${Random.word(8)}`,
    status: Random.pick(['online', 'offline', 'away']),
    lastSeen: Random.datetime('yyyy-MM-dd HH:mm:ss')
  }
}

// 生成消息数据
const generateMessage = (conversationId, senderId, receiverId, index) => {
  const messageTypes = ['text', 'image', 'voice']
  const messageType = Random.pick(messageTypes, [0.8, 0.15, 0.05]) // 文本消息概率更高
  
  const baseMessage = {
    id: `msg_${conversationId}_${index}`,
    conversationId,
    senderId,
    receiverId,
    timestamp: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    isRead: Random.boolean(0.8),
    status: 'sent'
  }
  
  if (messageType === 'text') {
    return {
      ...baseMessage,
      type: 'text',
      content: Random.csentence(3, 30)
    }
  } else if (messageType === 'image') {
    return {
      ...baseMessage,
      type: 'image',
      content: Random.image('400x300', Random.color(), Random.color(), 'png', 'IM'),
      thumbnail: Random.image('100x75', Random.color(), Random.color(), 'png', 'Thumb')
    }
  } else {
    return {
      ...baseMessage,
      type: 'voice',
      content: `https://example.com/audio/${Random.guid()}.mp3`,
      duration: Random.integer(1, 60)
    }
  }
}

// 生成会话数据
const generateConversations = (count = 20) => {
  const conversations = []
  const currentUserId = 1 // 假设当前用户ID为1
  
  for (let i = 1; i <= count; i++) {
    const targetUserId = i + 1
    const targetUser = generateUser(targetUserId)
    
    const messageCount = Random.natural(5, 30)
    const messages = []
    
    for (let j = 1; j <= messageCount; j++) {
      // 随机确定是当前用户发送还是对方发送
      const isCurrentUserSending = Random.boolean()
      const senderId = isCurrentUserSending ? currentUserId : targetUserId
      const receiverId = isCurrentUserSending ? targetUserId : currentUserId
      
      const message = generateMessage(i, senderId, receiverId, j)
      messages.push(message)
    }
    
    // 按时间顺序排序
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // 计算未读消息数
    const unreadCount = messages.filter(m => m.receiverId === currentUserId && !m.isRead).length
    
    // 获取最后一条消息
    const lastMessage = messages[messages.length - 1]
    
    conversations.push({
      id: i,
      participants: [currentUserId, targetUserId],
      targetUser,
      messages,
      unreadCount,
      lastMessage,
      createdAt: messages[0].timestamp,
      updatedAt: lastMessage.timestamp
    })
  }
  
  // 按最近消息时间排序
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  
  return conversations
}

// 生成会话数据
const conversations = generateConversations()

// 获取会话列表
const getConversationList = () => {
  // 返回会话列表，不包含详细消息
  const conversationList = conversations.map(({ id, participants, targetUser, lastMessage, unreadCount, createdAt, updatedAt }) => ({
    id,
    participants,
    targetUser,
    lastMessage,
    unreadCount,
    createdAt,
    updatedAt
  }))
  
  return {
    code: 200,
    data: conversationList,
    message: '获取成功'
  }
}

// 获取会话详情
const getConversationDetail = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)/)[1])
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  return {
    code: 200,
    message: '获取成功',
    data: conversation
  }
}

// 获取会话消息历史
const getMessageHistory = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)\/messages/)[1])
  const { page = 1, limit = 20 } = config.params || {}
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  // 分页获取消息
  const start = (page - 1) * limit
  const end = start + limit
  const messages = conversation.messages.slice(start, end)
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      list: messages,
      total: conversation.messages.length,
      page: Number(page),
      limit: Number(limit),
      hasMore: end < conversation.messages.length
    }
  }
}

// 发送消息
const sendMessage = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)\/messages/)[1])
  const { content, type = 'text' } = JSON.parse(config.body)
  const currentUserId = 1 // 假设当前用户ID为1
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  const targetUserId = conversation.targetUser.id
  
  // 创建新消息
  const newMessage = {
    id: `msg_${conversationId}_${conversation.messages.length + 1}`,
    conversationId,
    senderId: currentUserId,
    receiverId: targetUserId,
    type,
    content,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    isRead: false,
    status: 'sent'
  }
  
  // 添加消息到会话
  conversation.messages.push(newMessage)
  
  // 更新会话的最后一条消息和更新时间
  conversation.lastMessage = newMessage
  conversation.updatedAt = newMessage.timestamp
  
  return {
    code: 200,
    message: '发送成功',
    data: newMessage
  }
}

// 发送图片消息
const sendImageMessage = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)\/images/)[1])
  const currentUserId = 1 // 假设当前用户ID为1
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  const targetUserId = conversation.targetUser.id
  
  // 创建新图片消息
  const newMessage = {
    id: `msg_${conversationId}_${conversation.messages.length + 1}`,
    conversationId,
    senderId: currentUserId,
    receiverId: targetUserId,
    type: 'image',
    content: Random.image('400x300', Random.color(), Random.color(), 'png', 'Upload'),
    thumbnail: Random.image('100x75', Random.color(), Random.color(), 'png', 'Thumb'),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    isRead: false,
    status: 'sent'
  }
  
  // 添加消息到会话
  conversation.messages.push(newMessage)
  
  // 更新会话的最后一条消息和更新时间
  conversation.lastMessage = newMessage
  conversation.updatedAt = newMessage.timestamp
  
  return {
    code: 200,
    message: '发送成功',
    data: newMessage
  }
}

// 标记消息为已读
const markAsRead = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)\/read/)[1])
  const currentUserId = 1 // 假设当前用户ID为1
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  // 标记所有接收的消息为已读
  conversation.messages.forEach(message => {
    if (message.receiverId === currentUserId) {
      message.isRead = true
    }
  })
  
  // 更新未读消息计数
  conversation.unreadCount = 0
  
  return {
    code: 200,
    message: '标记成功',
    data: null
  }
}

// 获取未读消息数量
const getUnreadCount = () => {
  // 计算所有会话的未读消息总数
  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0)
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      count: totalUnread
    }
  }
}

// 创建新会话
const createConversation = (config) => {
  const { targetUserId } = JSON.parse(config.body)
  const currentUserId = 1 // 假设当前用户ID为1
  
  // 检查是否已存在会话
  const existingConversation = conversations.find(c => 
    c.participants.includes(currentUserId) && 
    c.participants.includes(Number(targetUserId))
  )
  
  if (existingConversation) {
    return {
      code: 200,
      message: '会话已存在',
      data: existingConversation
    }
  }
  
  // 创建新会话
  const newConversation = {
    id: conversations.length + 1,
    participants: [currentUserId, Number(targetUserId)],
    targetUser: generateUser(Number(targetUserId)),
    messages: [],
    unreadCount: 0,
    lastMessage: null,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
  
  // 添加新会话
  conversations.push(newConversation)
  
  return {
    code: 200,
    message: '创建成功',
    data: newConversation
  }
}

// 删除消息
const deleteMessage = (config) => {
  const matches = config.url.match(/\/conversations\/(\d+)\/messages\/(.+)/)
  const conversationId = parseInt(matches[1])
  const messageId = matches[2]
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  // 查找消息索引
  const messageIndex = conversation.messages.findIndex(m => m.id === messageId)
  
  if (messageIndex === -1) {
    return {
      code: 404,
      message: '消息不存在',
      data: null
    }
  }
  
  // 删除消息
  conversation.messages.splice(messageIndex, 1)
  
  // 更新最后一条消息
  if (conversation.messages.length > 0) {
    conversation.lastMessage = conversation.messages[conversation.messages.length - 1]
  } else {
    conversation.lastMessage = null
  }
  
  return {
    code: 200,
    message: '删除成功',
    data: null
  }
}

// 清空会话消息
const clearMessages = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)\/clear/)[1])
  
  // 查找会话
  const conversation = conversations.find(c => c.id === conversationId)
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  // 清空消息
  conversation.messages = []
  conversation.lastMessage = null
  conversation.unreadCount = 0
  
  return {
    code: 200,
    message: '清空成功',
    data: null
  }
}

// 删除会话
const deleteConversation = (config) => {
  const conversationId = parseInt(config.url.match(/\/conversations\/(\d+)/)[1])
  
  // 查找会话索引
  const conversationIndex = conversations.findIndex(c => c.id === conversationId)
  
  if (conversationIndex === -1) {
    return {
      code: 404,
      message: '会话不存在',
      data: null
    }
  }
  
  // 删除会话
  conversations.splice(conversationIndex, 1)
  
  return {
    code: 200,
    message: '删除成功',
    data: null
  }
}

// 导出Mock接口
export default {
  'GET /api/im/conversations': getConversationList,
  'GET /api/im/conversations/:id': getConversationDetail,
  'GET /api/im/conversations/:id/messages': getMessageHistory,
  'POST /api/im/conversations/:id/messages': sendMessage,
  'POST /api/im/conversations/:id/images': sendImageMessage,
  'PUT /api/im/conversations/:id/read': markAsRead,
  'DELETE /api/im/conversations/:id/messages/:messageId': deleteMessage,
  'POST /api/im/conversations': createConversation,
  'GET /api/im/unread': getUnreadCount,
  'DELETE /api/im/conversations/:id/clear': clearMessages,
  'DELETE /api/im/conversations/:id': deleteConversation
} 