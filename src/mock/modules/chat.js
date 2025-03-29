import Mock from 'mockjs'

const Random = Mock.Random

// 生成用户数据
const generateUser = (id, isCurrentUser = false) => {
  if (isCurrentUser) {
    return {
      id: 1,
      name: '测试用户',
      avatar: Random.image('100x100', Random.color(), Random.color(), 'png', 'TU'),
      school: '测试大学'
    }
  }
  
  return {
    id,
    name: Random.cname(),
    avatar: Random.image('100x100', Random.color(), Random.color(), 'png', Random.first()),
    school: Random.pick(['北京大学', '清华大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '武汉大学', '中山大学'])
  }
}

// 生成消息数据
const generateMessage = (conversationId, senderId, receiverId, index, isCurrentUser) => {
  const messageTypes = ['text', 'image', 'file']
  const messageType = Random.pick(messageTypes, [0.8, 0.15, 0.05]) // 文本消息概率更高
  
  const baseMessage = {
    id: `msg_${conversationId}_${index}`,
    senderId,
    receiverId,
    createTime: Random.date('yyyy-MM-dd HH:mm:ss'),
    isRead: Random.boolean(0.8)
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
      content: Random.image('400x300', Random.color(), Random.color(), 'png', 'Chat'),
      thumbnail: Random.image('100x75', Random.color(), Random.color(), 'png', 'Thumb')
    }
  } else {
    const fileTypes = ['doc', 'pdf', 'zip', 'xls', 'txt']
    const fileExt = Random.pick(fileTypes)
    return {
      ...baseMessage,
      type: 'file',
      content: `${Random.word(3, 10)}.${fileExt}`,
      fileUrl: `https://example.com/files/${Random.word(8, 16)}.${fileExt}`,
      fileSize: Random.natural(1, 100) // MB
    }
  }
}

// 生成会话数据
const generateConversations = (count = 20) => {
  const conversations = []
  
  for (let i = 1; i <= count; i++) {
    const otherUserId = i + 1
    const otherUser = generateUser(otherUserId)
    
    const messageCount = Random.natural(1, 30)
    let lastMessage = null
    const messages = []
    
    for (let j = 1; j <= messageCount; j++) {
      // 随机确定是当前用户发送还是对方发送
      const isCurrentUserSending = Random.boolean()
      const senderId = isCurrentUserSending ? 1 : otherUserId
      const receiverId = isCurrentUserSending ? otherUserId : 1
      
      const message = generateMessage(i, senderId, receiverId, j, isCurrentUserSending)
      messages.push(message)
      
      if (j === messageCount) {
        lastMessage = message
      }
    }
    
    // 按时间顺序排序
    messages.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
    
    // 计算未读消息数
    const unreadCount = messages.filter(m => m.receiverId === 1 && !m.isRead).length
    
    conversations.push({
      id: i,
      userId: otherUserId, // 对方ID
      user: otherUser, // 对方信息
      lastMessage,
      unreadCount,
      messages,
      createTime: messages[0].createTime,
      updateTime: lastMessage.createTime
    })
  }
  
  // 按最近消息时间排序
  conversations.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
  
  return conversations
}

// 生成会话数据
const conversations = generateConversations()

// 获取会话列表
const getConversationList = () => {
  // 返回会话列表，不包含详细消息
  const conversationList = conversations.map(({ id, userId, user, lastMessage, unreadCount, createTime, updateTime }) => ({
    id,
    userId,
    user,
    lastMessage,
    unreadCount,
    createTime,
    updateTime
  }))
  
  return {
    code: 200,
    data: conversationList,
    message: '获取成功'
  }
}

// 获取会话详情
const getConversationDetail = (config) => {
  const userId = config.url.match(/\/api\/chat\/conversation\/(\d+)/)[1]
  
  // 查找会话
  const conversation = conversations.find(c => c.userId === Number(userId))
  
  if (!conversation) {
    // 如果不存在会话，创建一个新的空会话
    const newUser = generateUser(Number(userId))
    const newConversation = {
      id: conversations.length + 1,
      userId: Number(userId),
      user: newUser,
      messages: [],
      unreadCount: 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    conversations.push(newConversation)
    
    return {
      code: 200,
      data: newConversation,
      message: '获取成功'
    }
  }
  
  // 标记所有接收的消息为已读
  conversation.messages.forEach(message => {
    if (message.receiverId === 1) {
      message.isRead = true
    }
  })
  
  // 更新未读数量
  conversation.unreadCount = 0
  
  return {
    code: 200,
    data: conversation,
    message: '获取成功'
  }
}

// 发送消息
const sendMessage = (config) => {
  const userId = config.url.match(/\/api\/chat\/send\/(\d+)/)[1]
  const { content, type = 'text' } = JSON.parse(config.body)
  
  // 查找或创建会话
  let conversation = conversations.find(c => c.userId === Number(userId))
  
  if (!conversation) {
    // 创建新会话
    const newUser = generateUser(Number(userId))
    conversation = {
      id: conversations.length + 1,
      userId: Number(userId),
      user: newUser,
      messages: [],
      unreadCount: 0,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    conversations.push(conversation)
  }
  
  // 创建新消息
  const now = new Date().toISOString()
  const newMessage = {
    id: `msg_${conversation.id}_${conversation.messages.length + 1}`,
    senderId: 1,
    receiverId: Number(userId),
    type,
    content,
    createTime: now,
    isRead: false
  }
  
  // 添加特定类型的属性
  if (type === 'image') {
    newMessage.thumbnail = content; // 假设缩略图和原图相同
  } else if (type === 'file') {
    newMessage.fileUrl = `https://example.com/files/${Random.word(8, 16)}.${content.split('.').pop()}`;
    newMessage.fileSize = Random.natural(1, 100); // MB
  }
  
  // 添加消息
  conversation.messages.push(newMessage)
  
  // 更新会话信息
  conversation.lastMessage = newMessage
  conversation.updateTime = now
  
  // 返回新消息
  return {
    code: 200,
    data: newMessage,
    message: '发送成功'
  }
}

// 标记会话为已读
const markConversationAsRead = (config) => {
  const conversationId = config.url.match(/\/api\/chat\/read\/(\d+)/)[1]
  
  // 查找会话
  const conversation = conversations.find(c => c.id === Number(conversationId))
  
  if (!conversation) {
    return {
      code: 404,
      message: '会话不存在'
    }
  }
  
  // 标记所有接收的消息为已读
  conversation.messages.forEach(message => {
    if (message.receiverId === 1) {
      message.isRead = true
    }
  })
  
  // 更新未读数量
  conversation.unreadCount = 0
  
  return {
    code: 200,
    message: '标记已读成功'
  }
}

// 删除会话
const deleteConversation = (config) => {
  const conversationId = config.url.match(/\/api\/chat\/conversation\/(\d+)/)[1]
  
  // 查找会话索引
  const index = conversations.findIndex(c => c.id === Number(conversationId))
  
  if (index === -1) {
    return {
      code: 404,
      message: '会话不存在'
    }
  }
  
  // 删除会话
  conversations.splice(index, 1)
  
  return {
    code: 200,
    message: '删除成功'
  }
}

// 获取未读消息数量
const getUnreadMessageCount = () => {
  // 计算所有会话的未读消息总数
  const totalUnread = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
  
  return {
    code: 200,
    data: {
      count: totalUnread
    },
    message: '获取成功'
  }
}

// 上传聊天图片
const uploadChatImage = () => {
  // 模拟上传成功
  const image = Random.image('800x600', Random.color(), Random.color(), 'png', 'Chat')
  
  return {
    code: 200,
    data: {
      url: image
    },
    message: '上传成功'
  }
}

// 上传聊天文件
const uploadChatFile = (config) => {
  // 从请求体中获取文件名
  // 实际应用中会从FormData中获取文件信息
  const fileName = Random.word(5, 10) + '.' + Random.pick(['doc', 'pdf', 'zip', 'xls', 'txt'])
  
  return {
    code: 200,
    data: {
      url: `https://example.com/files/${Random.word(8, 16)}.${fileName.split('.').pop()}`,
      fileName,
      fileSize: Random.natural(1, 100) // MB
    },
    message: '上传成功'
  }
}

export default {
  'GET /api/chat/conversation': getConversationList,
  'GET /api/chat/conversation/\\d+': getConversationDetail,
  'POST /api/chat/send/\\d+': sendMessage,
  'POST /api/chat/read/\\d+': markConversationAsRead,
  'DELETE /api/chat/conversation/\\d+': deleteConversation,
  'GET /api/chat/unread': getUnreadMessageCount,
  'POST /api/chat/image': uploadChatImage,
  'POST /api/chat/file': uploadChatFile
}