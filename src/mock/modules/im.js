import Mock from 'mockjs'
import { getUrlParams, delay, generateId } from '../utils/mock-helpers'
import { getMockAdapter } from '../interceptor'

// 获取mock适配器实例
const mockAdapter = getMockAdapter()

// 当前用户ID (模拟)
const currentUserId = 1

// 模拟WebSocket连接
class MockWebSocket {
  static instance = null

  constructor() {
    // 单例模式
    if (MockWebSocket.instance) {
      return MockWebSocket.instance
    }
    
    this.connected = false
    this.listeners = new Map()
    this.mockData = {
      conversations: [],
      messages: {},
      contacts: [],
      onlineStatus: {}
    }
    
    // 初始化一些模拟数据
    this.initMockData()
    
    // 模拟接收消息
    this.startMessageSimulation()
    
    MockWebSocket.instance = this
  }

  // 初始化模拟数据
  initMockData() {
    // 生成联系人
    this.mockData.contacts = Array(20).fill().map((_, i) => ({
      id: i + 10,
      name: Mock.mock('@cname'),
      avatar: Mock.mock('@image("100x100", "#4A7BF7", "#FFF", "头像")'),
      online: Mock.mock('@boolean(7, 3)'), // 70%概率在线
      lastActive: Mock.mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
      remarkName: null
    }))
    
    // 随机选择5个联系人创建会话
    const selectedContacts = this.mockData.contacts
      .slice(0, 5)
      .map(contact => ({
        id: `private_${currentUserId}_${contact.id}`,
        type: 'private',
        targetId: contact.id,
        targetName: contact.name,
        targetAvatar: contact.avatar,
        unreadCount: Mock.mock('@integer(0, 5)'),
        lastMessage: {
          id: generateId(),
          type: 'text',
          content: Mock.mock('@csentence(5, 20)'),
          timestamp: Mock.mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
          senderId: Mock.mock('@boolean') ? currentUserId : contact.id
        }
      }))
    
    // 创建一个群聊
    const groupChat = {
      id: `group_${generateId()}`,
      type: 'group',
      targetId: generateId(),
      targetName: '项目交流群',
      targetAvatar: Mock.mock('@image("100x100", "#4A7BF7", "#FFF", "群")'),
      unreadCount: Mock.mock('@integer(0, 10)'),
      memberCount: Mock.mock('@integer(5, 20)'),
      lastMessage: {
        id: generateId(),
        type: 'text',
        content: Mock.mock('@csentence(5, 20)'),
        timestamp: Mock.mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
        senderId: Mock.mock('@integer(10, 30)'),
        senderName: Mock.mock('@cname')
      }
    }
    
    // 设置会话列表
    this.mockData.conversations = [...selectedContacts, groupChat]
    
    // 为每个会话生成消息历史
    this.mockData.conversations.forEach(conversation => {
      const messageCount = Mock.mock('@integer(10, 30)')
      const messages = []
      
      for (let i = 0; i < messageCount; i++) {
        const isFromSelf = Mock.mock('@boolean')
        const senderId = isFromSelf ? currentUserId : (conversation.type === 'private' ? conversation.targetId : Mock.mock('@integer(10, 30)'))
        const senderName = isFromSelf ? '我' : (conversation.type === 'private' ? conversation.targetName : Mock.mock('@cname'))
        const senderAvatar = isFromSelf ? '' : (conversation.type === 'private' ? conversation.targetAvatar : Mock.mock('@image("100x100", "#4A7BF7", "#FFF", "头像")'))
        
        // 随机选择消息类型
        const messageTypes = ['text', 'text', 'text', 'text', 'image', 'file', 'location']
        const type = messageTypes[Math.floor(Math.random() * messageTypes.length)]
        
        // 根据类型设置内容
        let content = ''
        let extra = null
        
        switch (type) {
          case 'text':
            content = Mock.mock('@csentence(5, 30)')
            break
          case 'image':
            content = Mock.mock('@image("300x200", "#894FC4", "#FFF", "图片")')
            break
          case 'file':
            content = JSON.stringify({
              name: Mock.mock('@ctitle(3, 8)') + '.pdf',
              size: Mock.mock('@integer(100, 1024)') + 'KB',
              url: '#'
            })
            break
          case 'location':
            content = JSON.stringify({
              name: Mock.mock('@city(true)'),
              address: Mock.mock('@county(true)') + Mock.mock('@csentence(5, 10)'),
              latitude: Mock.mock('@float(20, 40, 6, 6)'),
              longitude: Mock.mock('@float(100, 120, 6, 6)')
            })
            break
        }
        
        // 生成消息对象
        messages.push({
          id: generateId(),
          conversationId: conversation.id,
          type,
          content,
          senderId,
          senderName,
          senderAvatar,
          receiverId: isFromSelf ? conversation.targetId : currentUserId,
          timestamp: new Date(Date.now() - (messageCount - i) * 60000 * 5).toISOString(),
          status: 'sent',
          isRead: true,
          isRevoked: false,
          extra
        })
      }
      
      this.mockData.messages[conversation.id] = messages
    })
    
    // 设置在线状态
    this.mockData.contacts.forEach(contact => {
      this.mockData.onlineStatus[contact.id] = contact.online ? 'online' : 'offline'
    })
  }

  // 模拟接收新消息
  async startMessageSimulation() {
    await delay(10000) // 等待10秒后开始模拟
    
    // 随机选择一个会话
    setInterval(() => {
      if (!this.connected) return
      
      // 30%概率收到新消息
      if (Math.random() > 0.3) return
      
      const randomIndex = Math.floor(Math.random() * this.mockData.conversations.length)
      const conversation = this.mockData.conversations[randomIndex]
      
      if (!conversation) return
      
      // 创建新消息
      const newMessage = {
        id: generateId(),
        conversationId: conversation.id,
        type: 'text',
        content: Mock.mock('@csentence(5, 20)'),
        senderId: conversation.targetId,
        senderName: conversation.targetName,
        senderAvatar: conversation.targetAvatar,
        receiverId: currentUserId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        isRead: false,
        isRevoked: false
      }
      
      // 触发消息事件
      this.triggerEvent('message', {
        type: 'chat_message',
        data: newMessage
      })
      
      // 将消息添加到历史记录
      if (this.mockData.messages[conversation.id]) {
        this.mockData.messages[conversation.id].push(newMessage)
      } else {
        this.mockData.messages[conversation.id] = [newMessage]
      }
      
      // 更新会话的最后消息
      conversation.lastMessage = {
        id: newMessage.id,
        type: newMessage.type,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        senderId: newMessage.senderId
      }
      
      // 增加未读数
      conversation.unreadCount = (conversation.unreadCount || 0) + 1
    }, 30000) // 每30秒检查一次
    
    // 模拟用户在线状态变更
    setInterval(() => {
      if (!this.connected) return
      
      // 随机选择一个联系人
      const randomIndex = Math.floor(Math.random() * this.mockData.contacts.length)
      const contact = this.mockData.contacts[randomIndex]
      
      if (!contact) return
      
      // 切换在线状态
      const newStatus = this.mockData.onlineStatus[contact.id] === 'online' ? 'offline' : 'online'
      this.mockData.onlineStatus[contact.id] = newStatus
      
      // 触发状态变更事件
      this.triggerEvent('message', {
        type: 'user_status',
        data: {
          userId: contact.id,
          status: newStatus
        }
      })
    }, 60000) // 每60秒检查一次
  }

  // 连接WebSocket
  connect() {
    console.log('Mock WebSocket: 连接建立')
    this.connected = true
    
    // 触发连接成功事件
    setTimeout(() => {
      this.triggerEvent('open')
      
      // 发送用户初始在线状态
      Object.entries(this.mockData.onlineStatus).forEach(([userId, status]) => {
        this.triggerEvent('message', {
          type: 'user_status',
          data: {
            userId: parseInt(userId),
            status
          }
        })
      })
    }, 100)
    
    return Promise.resolve()
  }

  // 关闭WebSocket
  close() {
    console.log('Mock WebSocket: 连接关闭')
    this.connected = false
    this.triggerEvent('close')
  }

  // 发送消息
  send(data) {
    if (!this.connected) {
      console.error('Mock WebSocket: 未连接，无法发送消息')
      return false
    }
    
    console.log('Mock WebSocket: 发送消息', data)
    
    // 模拟处理不同类型的消息
    const message = typeof data === 'string' ? JSON.parse(data) : data
    
    switch (message.type) {
      case 'ping':
        // 响应ping
        setTimeout(() => {
          this.triggerEvent('message', {
            type: 'pong',
            data: { timestamp: Date.now() }
          })
        }, 10)
        break
      
      case 'chat_message':
        // 处理聊天消息
        this.handleChatMessage(message.data)
        break
      
      case 'read_ack':
        // 处理已读回执
        this.handleReadAck(message.data)
        break
      
      case 'recall_message':
        // 处理消息撤回
        this.handleRecallMessage(message.data)
        break
      
      case 'user_status':
        // 处理用户状态变更
        break
      
      case 'typing':
        // 处理正在输入
        this.handleTyping(message.data)
        break
    }
    
    return true
  }

  // 处理聊天消息
  handleChatMessage(message) {
    if (!message || !message.conversationId) return
    
    // 保存消息到历史记录
    if (!this.mockData.messages[message.conversationId]) {
      this.mockData.messages[message.conversationId] = []
    }
    this.mockData.messages[message.conversationId].push(message)
    
    // 查找或创建会话
    let conversation = this.mockData.conversations.find(item => item.id === message.conversationId)
    
    if (!conversation) {
      // 如果是新会话，需要创建
      const isGroup = message.conversationId.startsWith('group_')
      
      conversation = {
        id: message.conversationId,
        type: isGroup ? 'group' : 'private',
        targetId: message.receiverId,
        targetName: message.receiverName || '未知用户',
        targetAvatar: message.receiverAvatar || '',
        unreadCount: 0
      }
      
      this.mockData.conversations.push(conversation)
    }
    
    // 更新会话的最后消息
    conversation.lastMessage = {
      id: message.id,
      type: message.type,
      content: message.content,
      timestamp: message.timestamp,
      senderId: message.senderId
    }
    
    // 模拟服务器响应，返回消息已送达
    setTimeout(() => {
      this.triggerEvent('message', {
        type: 'message_ack',
        data: {
          messageId: message.id,
          conversationId: message.conversationId,
          status: 'delivered'
        }
      })
    }, 500)
    
    // 模拟对方已读回执
    setTimeout(() => {
      this.triggerEvent('message', {
        type: 'read_ack',
        data: {
          conversationId: message.conversationId,
          readerId: message.receiverId,
          timestamp: new Date().toISOString()
        }
      })
    }, 2000)
  }

  // 处理已读回执
  handleReadAck(data) {
    if (!data || !data.conversationId) return
    
    // 查找会话
    const conversation = this.mockData.conversations.find(item => item.id === data.conversationId)
    if (!conversation) return
    
    // 重置未读计数
    conversation.unreadCount = 0
  }

  // 处理消息撤回
  handleRecallMessage(data) {
    if (!data || !data.messageId || !data.conversationId) return
    
    // 查找消息
    const messages = this.mockData.messages[data.conversationId] || []
    const message = messages.find(msg => msg.id === data.messageId)
    
    if (!message) return
    
    // 标记为已撤回
    message.isRevoked = true
    
    // 通知所有客户端
    setTimeout(() => {
      this.triggerEvent('message', {
        type: 'recall_message',
        data: {
          messageId: data.messageId,
          conversationId: data.conversationId,
          recallerId: currentUserId,
          timestamp: new Date().toISOString()
        }
      })
    }, 300)
  }

  // 处理正在输入
  handleTyping(data) {
    if (!data || !data.conversationId) return
    
    // 通知其他客户端
    setTimeout(() => {
      this.triggerEvent('message', {
        type: 'typing',
        data: {
          conversationId: data.conversationId,
          userId: currentUserId,
          timestamp: Date.now()
        }
      })
    }, 100)
  }

  // 添加事件监听器
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    
    this.listeners.get(event).push(callback)
  }

  // 移除事件监听器
  removeEventListener(event, callback) {
    if (!this.listeners.has(event)) return
    
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    
    if (index !== -1) {
      callbacks.splice(index, 1)
    }
    
    if (callbacks.length === 0) {
      this.listeners.delete(event)
    }
  }

  // 触发事件
  triggerEvent(event, data) {
    if (!this.listeners.has(event)) return
    
    const callbacks = this.listeners.get(event)
    for (const callback of callbacks) {
      try {
        if (event === 'message') {
          callback({ data: JSON.stringify(data) })
        } else {
          callback(data)
        }
      } catch (error) {
        console.error(`Mock WebSocket: 执行事件"${event}"的回调函数时出错`, error)
      }
    }
  }

  // 获取会话列表数据
  getConversations() {
    return this.mockData.conversations
  }

  // 获取消息历史数据
  getMessages(conversationId, page = 1, limit = 20) {
    const messages = this.mockData.messages[conversationId] || []
    
    // 按时间倒序排序
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + Number(limit)
    const pageMessages = messages.slice(startIndex, endIndex)
    
    return {
      list: pageMessages,
      total: messages.length,
      hasMore: endIndex < messages.length
    }
  }
}

// 创建一个全局实例供所有模块使用
const globalMockWebSocket = new MockWebSocket()

// 注册IM相关的API端点
if (mockAdapter) {
  // 获取会话列表
  mockAdapter.onGet('/api/im/conversations').reply(config => {
    console.log('Mock: 拦截到 GET /api/im/conversations 请求')
    const { conversations } = globalMockWebSocket.mockData
    return [200, {
      code: 200,
      message: '获取成功',
      data: conversations
    }]
  })

  // 获取会话消息
  mockAdapter.onGet(/\/api\/im\/conversation\/\d+\/messages/).reply(config => {
    console.log('Mock: 拦截到 GET /api/im/conversation/:id/messages 请求')
    const conversationId = config.url.split('/').pop()
    const { page = 1, limit = 20 } = getUrlParams(config.url)
    
    const messages = globalMockWebSocket.mockData.messages[conversationId] || []
    const start = (page - 1) * limit
    const end = start + parseInt(limit)
    const pagedMessages = messages.slice(start, end)
    
    return [200, {
      code: 200,
      message: '获取成功',
      data: {
        list: pagedMessages,
        total: messages.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }]
  })
}

// 重写浏览器WebSocket类，拦截WebSocket请求
class WebSocketMock {
  constructor(url) {
    console.log('创建Mock WebSocket:', url)
    
    this.url = url
    this.readyState = 0 // CONNECTING
    
    // 属性设置
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    
    // 连接到Mock服务
    setTimeout(() => {
      globalMockWebSocket.connect()
        .then(() => {
          this.readyState = 1 // OPEN
          if (this.onopen) this.onopen({ target: this })
        })
        .catch(error => {
          this.readyState = 3 // CLOSED
          if (this.onerror) this.onerror({ target: this, error })
          if (this.onclose) this.onclose({ target: this, code: 1006, reason: 'Connection failed' })
        })
    }, 200)
    
    // 监听消息
    globalMockWebSocket.addEventListener('message', (event) => {
      if (this.onmessage) this.onmessage(event)
    })
    
    // 监听关闭
    globalMockWebSocket.addEventListener('close', () => {
      this.readyState = 3 // CLOSED
      if (this.onclose) this.onclose({ target: this, code: 1000, reason: 'Normal closure' })
    })
  }

  send(data) {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not open')
    }
    
    globalMockWebSocket.send(typeof data === 'string' ? JSON.parse(data) : data)
  }

  close(code = 1000, reason = '') {
    globalMockWebSocket.close()
    this.readyState = 3 // CLOSED
    if (this.onclose) this.onclose({ target: this, code, reason })
  }

  addEventListener(type, listener) {
    switch (type) {
      case 'open':
        this.onopen = listener
        break
      case 'message':
        this.onmessage = listener
        break
      case 'close':
        this.onclose = listener
        break
      case 'error':
        this.onerror = listener
        break
    }
  }

  removeEventListener(type, listener) {
    switch (type) {
      case 'open':
        if (this.onopen === listener) this.onopen = null
        break
      case 'message':
        if (this.onmessage === listener) this.onmessage = null
        break
      case 'close':
        if (this.onclose === listener) this.onclose = null
        break
      case 'error':
        if (this.onerror === listener) this.onerror = null
        break
    }
  }
}

// 只在开发环境中启用Mock WebSocket
if (process.env.NODE_ENV === 'development') {
  try {
    // 保存原始WebSocket
    const OriginalWebSocket = window.WebSocket
    
    // 替换为Mock版本
    window.WebSocket = WebSocketMock
    
    // 提供恢复方法
    window.__restoreWebSocket = () => {
      window.WebSocket = OriginalWebSocket
      console.log('Restored original WebSocket')
    }
    
    console.log('WebSocket已被Mock版本替代')
  } catch (error) {
    console.error('无法替换WebSocket:', error)
  }
}

// 模拟获取会话列表接口
Mock.mock(/\/api\/im\/conversations/, 'get', () => {
  return {
    code: 200,
    message: '获取成功',
    data: globalMockWebSocket.getConversations()
  }
})

// 模拟获取消息接口
Mock.mock(/\/api\/im\/messages/, 'get', (config) => {
  const params = getUrlParams(config.url)
  const { conversationId, page = 1, limit = 20 } = params
  
  if (!conversationId) {
    return {
      code: 400,
      message: '缺少conversationId参数'
    }
  }
  
  return {
    code: 200,
    message: '获取成功',
    data: globalMockWebSocket.getMessages(conversationId, page, limit)
  }
})

// 模拟发送消息接口
Mock.mock(/\/api\/im\/message/, 'post', (config) => {
  const message = JSON.parse(config.body)
  
  if (!message.conversationId) {
    return {
      code: 400,
      message: '缺少conversationId参数'
    }
  }
  
  // 生成消息ID
  message.id = message.id || generateId()
  message.timestamp = message.timestamp || new Date().toISOString()
  message.status = 'sent'
  
  // 保存消息
  globalMockWebSocket.handleChatMessage(message)
  
  return {
    code: 200,
    message: '发送成功',
    data: {
      messageId: message.id,
      conversationId: message.conversationId,
      timestamp: message.timestamp,
      status: 'sent'
    }
  }
})

// 模拟未读消息数接口
Mock.mock(/\/api\/im\/unread-count/, 'get', () => {
  const conversations = globalMockWebSocket.getConversations()
  let total = 0
  
  const conversionsWithUnread = conversations.map(conv => {
    total += conv.unreadCount || 0
    return {
      conversationId: conv.id,
      count: conv.unreadCount || 0
    }
  })
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      total,
      conversations: conversionsWithUnread
    }
  }
})

// 模拟设置已读接口
Mock.mock(/\/api\/im\/conversation\/.*\/read/, 'put', (config) => {
  const conversationId = config.url.match(/\/conversation\/(.+?)\/read/)[1]
  
  if (!conversationId) {
    return {
      code: 400,
      message: '缺少conversationId参数'
    }
  }
  
  globalMockWebSocket.handleReadAck({ conversationId })
  
  return {
    code: 200,
    message: '标记已读成功',
    data: { success: true }
  }
})

// 模拟消息撤回接口
Mock.mock(/\/api\/im\/message\/.*\/recall/, 'put', (config) => {
  const messageId = config.url.match(/\/message\/(.+?)\/recall/)[1]
  const { conversationId } = JSON.parse(config.body)
  
  if (!messageId || !conversationId) {
    return {
      code: 400,
      message: '参数错误'
    }
  }
  
  globalMockWebSocket.handleRecallMessage({ messageId, conversationId })
  
  return {
    code: 200,
    message: '消息撤回成功',
    data: { success: true }
  }
})

// 模拟上传图片接口
Mock.mock(/\/api\/im\/upload\/image/, 'post', () => {
  return {
    code: 200,
    message: '上传成功',
    data: {
      url: Mock.mock('@image("300x200", "#894FC4", "#FFF", "图片")')
    }
  }
})

// 模拟上传文件接口
Mock.mock(/\/api\/im\/upload\/file/, 'post', () => {
  return {
    code: 200,
    message: '上传成功',
    data: {
      name: Mock.mock('@ctitle(3, 8)') + '.pdf',
      size: Mock.mock('@integer(100, 1024)') + 'KB',
      url: '#'
    }
  }
})

// 模拟获取联系人列表接口
Mock.mock(/\/api\/im\/contacts/, 'get', () => {
  return {
    code: 200,
    message: '获取成功',
    data: globalMockWebSocket.mockData.contacts
  }
})

// 模拟查询联系人接口
Mock.mock(/\/api\/im\/search-contacts/, 'get', (config) => {
  const params = getUrlParams(config.url)
  const { keyword } = params
  
  if (!keyword) {
    return {
      code: 400,
      message: '缺少keyword参数'
    }
  }
  
  // 模糊搜索
  const results = globalMockWebSocket.mockData.contacts.filter(contact => 
    contact.name.includes(keyword) || (contact.remarkName && contact.remarkName.includes(keyword))
  )
  
  return {
    code: 200,
    message: '获取成功',
    data: results
  }
})

// 模拟删除会话接口
Mock.mock(/\/api\/im\/conversation\/.*/, 'delete', (config) => {
  const idMatch = config.url.match(/\/conversation\/([^/]+)/);
  const id = idMatch ? idMatch[1] : null;
  
  if (!id) {
    return {
      code: 400,
      message: '缺少会话 ID',
      data: null
    }
  }
  
  // 删除会话逻辑
  const conversations = globalMockWebSocket.getConversations();
  const index = conversations.findIndex(c => c.id === id);
  
  if (index > -1) {
    conversations.splice(index, 1);
  }
  
  return {
    code: 200,
    message: '删除成功',
    data: { success: true }
  }
})

// 模拟获取好友申请列表接口
Mock.mock(/\/api\/im\/friend-requests/, 'get', (config) => {
  const params = getUrlParams(config.url)
  const { status } = params
  
  // 生成模拟的好友申请数据
  const generateRequests = () => {
    const count = Mock.Random.integer(0, 5)
    const requests = []
    
    for (let i = 0; i < count; i++) {
      requests.push({
        id: Mock.Random.id(),
        userId: Mock.Random.integer(100, 999),
        userName: Mock.Random.cname(),
        userAvatar: Mock.mock('@image("100x100", "#4A7BF7", "#FFF", "头像")'),
        requestMessage: Mock.Random.csentence(5, 20),
        status: status || Mock.Random.pick(['pending', 'accepted', 'rejected']),
        createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
      })
    }
    
    return { requests, count }
  }
  
  const { requests, count } = generateRequests()
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      list: requests,
      total: count,
      page: params.page || 1,
      limit: params.limit || 20
    }
  }
})

// 导出mock模块
export default {
  globalMockWebSocket
}