import Mock from 'mockjs'

const Random = Mock.Random

// 生成模拟聊天会话数据
const chatSessions = []
const users = []

// 生成模拟用户
for (let i = 0; i < 20; i++) {
  users.push(Mock.mock({
    id: '@guid',
    nickname: '@cname',
    avatar: Random.image('100x100', Random.color(), Random.word(2)),
    'online|1': [true, false],
    lastActiveTime: '@datetime("yyyy-MM-dd HH:mm:ss")'
  }))
}

// 生成模拟会话
for (let i = 0; i < 15; i++) {
  const user = users[i]
  const unreadCount = Random.natural(0, 10)
  const messages = []
  
  // 为每个会话生成聊天记录
  const messageCount = Random.natural(5, 30)
  let lastTime = new Date(new Date().getTime() - 86400000) // 从昨天开始
  
  for (let j = 0; j < messageCount; j++) {
    const isSelf = Random.boolean()
    const timeOffset = Random.natural(60000, 3600000) // 1分钟到1小时的时间间隔
    lastTime = new Date(lastTime.getTime() + timeOffset)
    
    messages.push({
      id: Random.guid(),
      senderId: isSelf ? '00000000-0000-0000-0000-000000000000' : user.id, // 假设当前用户ID固定
      receiverId: isSelf ? user.id : '00000000-0000-0000-0000-000000000000',
      content: Random.cparagraph(1, 3),
      'contentType|1': ['text', 'image', 'file'], // 消息类型：文本、图片或文件
      sendTime: lastTime.toISOString(),
      'status|1': ['sent', 'delivered', 'read'], // 消息状态：已发送、已送达、已读
      extras: {} // 额外信息，如图片URL、文件信息等
    })
  }
  
  chatSessions.push({
    id: user.id,
    user: user,
    lastMessage: messages[messages.length - 1],
    unreadCount,
    messages
  })
}

// 按最后消息时间排序会话
chatSessions.sort((a, b) => {
  return new Date(b.lastMessage.sendTime) - new Date(a.lastMessage.sendTime)
})

export default {
  // 获取会话列表
  'GET /api/chat/sessions': (options) => {
    return {
      code: 200,
      data: chatSessions.map(session => ({
        id: session.id,
        user: session.user,
        lastMessage: session.lastMessage,
        unreadCount: session.unreadCount
      })),
      message: 'success'
    }
  },
  
  // 获取指定会话的聊天记录
  'GET /api/chat/messages/:sessionId': (options) => {
    const { sessionId } = options.url.match(/\/api\/chat\/messages\/([^/]+)/).slice(1)
    const { page = 1, size = 20 } = JSON.parse(options.body || '{}')
    
    const session = chatSessions.find(session => session.id === sessionId)
    
    if (session) {
      // 获取指定分页的消息
      const messages = [...session.messages].reverse() // 倒序，使最新消息在前
      const startIndex = (page - 1) * size
      const endIndex = startIndex + parseInt(size)
      const pageMessages = messages.slice(startIndex, endIndex)
      
      return {
        code: 200,
        data: {
          list: pageMessages,
          total: session.messages.length,
          page: parseInt(page),
          size: parseInt(size)
        },
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '会话不存在'
      }
    }
  },
  
  // 发送消息
  'POST /api/chat/send': (options) => {
    const body = JSON.parse(options.body)
    const { sessionId, content, contentType = 'text' } = body
    
    const session = chatSessions.find(session => session.id === sessionId)
    
    if (session) {
      const newMessage = {
        id: Random.guid(),
        senderId: '00000000-0000-0000-0000-000000000000', // 当前用户ID
        receiverId: session.user.id,
        content,
        contentType,
        sendTime: new Date().toISOString(),
        status: 'sent',
        extras: {}
      }
      
      // 添加到会话消息中
      session.messages.push(newMessage)
      
      // 更新会话的最后一条消息
      session.lastMessage = newMessage
      
      // 重新排序会话列表
      chatSessions.sort((a, b) => {
        return new Date(b.lastMessage.sendTime) - new Date(a.lastMessage.sendTime)
      })
      
      return {
        code: 200,
        data: newMessage,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '会话不存在'
      }
    }
  },
  
  // 标记消息为已读
  'PUT /api/chat/read/:sessionId': (options) => {
    const { sessionId } = options.url.match(/\/api\/chat\/read\/([^/]+)/).slice(1)
    
    const session = chatSessions.find(session => session.id === sessionId)
    
    if (session) {
      // 更新未读消息数
      session.unreadCount = 0
      
      // 更新消息状态
      session.messages.forEach(message => {
        if (message.senderId === session.user.id) {
          message.status = 'read'
        }
      })
      
      return {
        code: 200,
        data: null,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '会话不存在'
      }
    }
  },
  
  // 删除会话
  'DELETE /api/chat/session/:sessionId': (options) => {
    const { sessionId } = options.url.match(/\/api\/chat\/session\/([^/]+)/).slice(1)
    
    const index = chatSessions.findIndex(session => session.id === sessionId)
    
    if (index > -1) {
      const session = chatSessions[index]
      chatSessions.splice(index, 1)
      
      return {
        code: 200,
        data: session,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        data: null,
        message: '会话不存在'
      }
    }
  },
  
  // 获取用户列表（用于添加好友或创建新会话）
  'GET /api/chat/users': (options) => {
    const { keyword } = JSON.parse(options.body || '{}')
    
    let result = [...users]
    
    // 根据关键词筛选
    if (keyword) {
      result = result.filter(user => 
        user.nickname.toLowerCase().includes(keyword.toLowerCase())
      )
    }
    
    return {
      code: 200,
      data: result,
      message: 'success'
    }
  },
  
  // 创建新会话
  'POST /api/chat/session/create': (options) => {
    const { userId } = JSON.parse(options.body)
    
    // 检查会话是否已存在
    const existingSession = chatSessions.find(session => session.id === userId)
    if (existingSession) {
      return {
        code: 200,
        data: existingSession,
        message: '会话已存在'
      }
    }
    
    // 查找用户
    const user = users.find(user => user.id === userId)
    if (!user) {
      return {
        code: 404,
        data: null,
        message: '用户不存在'
      }
    }
    
    // 创建新会话
    const newSession = {
      id: user.id,
      user: user,
      lastMessage: null,
      unreadCount: 0,
      messages: []
    }
    
    chatSessions.unshift(newSession)
    
    return {
      code: 200,
      data: newSession,
      message: 'success'
    }
  }
}