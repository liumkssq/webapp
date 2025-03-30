import request from '@/utils/request'

// 获取联系人列表
export function getContactList(params) {
  return request({
    url: '/api/im/contacts',
    method: 'get',
    params
  })
}

// 获取好友申请列表
export function getFriendRequests(params) {
  return request({
    url: '/api/im/friend-requests',
    method: 'get',
    params
  })
}

// 发送好友申请
export function sendFriendRequest(data) {
  return Promise.resolve({
    code: 200,
    message: '好友申请已发送',
    data: { requestId: Math.floor(Math.random() * 10000) }
  })
}

// 处理好友申请
export function handleFriendRequest(data) {
  const { requestId, action } = data
  
  return Promise.resolve({
    code: 200,
    message: action === 'accept' ? '已添加为好友' : '已拒绝好友申请',
    data: { success: true }
  })
}

// 获取用户信息
export function getUserInfo(id) {
  const mockData = generateMockData('userInfo', { id })
  
  return Promise.resolve({
    code: 200,
    message: '获取用户信息成功',
    data: mockData
  })
}

// 设置好友备注
export function setFriendNote(data) {
  return Promise.resolve({
    code: 200,
    message: '设置备注成功',
    data: { success: true }
  })
}

// 删除好友
export function deleteFriend(id) {
  return Promise.resolve({
    code: 200,
    message: '删除好友成功',
    data: { success: true }
  })
}

// 获取群聊列表
export function getGroupList() {
  const mockData = generateMockData('groupList')
  
  return Promise.resolve({
    code: 200,
    message: '获取群聊列表成功',
    data: mockData
  })
}

// 创建群聊
export function createGroup(data) {
  return Promise.resolve({
    code: 200,
    message: '创建群聊成功',
    data: {
      groupId: Math.floor(Math.random() * 10000),
      groupName: data.name,
      createTime: new Date().toISOString()
    }
  })
}

// 获取群聊详情
export function getGroupInfo(id) {
  const mockData = generateMockData('groupInfo', { id })
  
  return Promise.resolve({
    code: 200,
    message: '获取群聊信息成功',
    data: mockData
  })
}

// 邀请好友加入群聊
export function inviteToGroup(data) {
  return Promise.resolve({
    code: 200,
    message: '邀请已发送',
    data: { success: true }
  })
}

// 退出群聊
export function leaveGroup(id) {
  return Promise.resolve({
    code: 200,
    message: '已退出群聊',
    data: { success: true }
  })
}

// 获取用户详情
export function getUserDetail(id) {
  const mockData = generateMockData('userDetail', { id })
  
  return Promise.resolve({
    code: 200,
    message: '获取用户详情成功',
    data: mockData
  })
}

// 获取会话列表
export function getConversationList() {
  // 这里不再使用utils/mock.js，直接请求mock服务接口
  return request({
    url: '/api/im/conversations',
    method: 'get'
  })
}

// 获取聊天记录
export function getChatMessages(params) {
  const { conversationId, page = 1, limit = 20 } = params
  const mockData = generateMockData('chatMessages', { conversationId, page, limit })
  
  return Promise.resolve({
    code: 200,
    message: '获取聊天记录成功',
    data: mockData
  })
}

// 发送消息
export function sendMessage(data) {
  const { conversationId, content, type } = data
  
  return Promise.resolve({
    code: 200,
    message: '发送消息成功',
    data: {
      messageId: Math.floor(Math.random() * 100000),
      conversationId,
      content,
      type,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  })
}

// 标记消息已读
export function markMessageRead(conversationId) {
  return Promise.resolve({
    code: 200,
    message: '标记消息已读成功',
    data: { success: true }
  })
}

// 获取未读消息数
export function getUnreadCount() {
  return request({
    url: '/api/im/unread-count',
    method: 'get'
  })
}

// 搜索联系人
export function searchContacts(keyword) {
  const mockData = generateMockData('searchContacts', { keyword })
  
  return Promise.resolve({
    code: 200,
    message: '搜索联系人成功',
    data: mockData
  })
}

// 获取会话详情
export function getConversationDetail(id) {
  const mockData = generateMockData('conversationDetail', { id })
  
  return Promise.resolve({
    code: 200,
    message: '获取会话详情成功',
    data: mockData
  })
}

// 创建会话
export function createConversation(data) {
  return Promise.resolve({
    code: 200,
    message: '创建会话成功',
    data: {
      conversationId: Math.floor(Math.random() * 10000),
      type: data.type || 'private',
      createTime: new Date().toISOString()
    }
  })
}

// 删除会话
export function deleteConversation(id) {
  return Promise.resolve({
    code: 200,
    message: '删除会话成功',
    data: { success: true }
  })
}

// 清空会话消息
export function clearMessages(conversationId) {
  return Promise.resolve({
    code: 200,
    message: '聊天记录已清空',
    data: { success: true }
  })
}

// 删除消息
export function deleteMessage(messageId) {
  return Promise.resolve({
    code: 200,
    message: '消息已删除',
    data: { success: true }
  })
}

// 获取消息历史
export function getMessageHistory(conversationId, params = {}) {
  const { page = 1, limit = 20 } = params
  return getChatMessages({ conversationId, page, limit })
}

// 发送文本消息
export function sendTextMessage(conversationId, content) {
  return Promise.resolve({
    code: 200,
    message: '发送消息成功',
    data: {
      id: Math.floor(Math.random() * 100000),
      conversationId,
      senderId: 1, // 当前用户ID
      type: 'text',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  })
}

// 发送图片消息
export function sendImageMessage(conversationId, imageUrl) {
  return Promise.resolve({
    code: 200,
    message: '发送图片成功',
    data: {
      id: Math.floor(Math.random() * 100000),
      conversationId,
      senderId: 1, // 当前用户ID
      type: 'image',
      content: imageUrl,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  })
}

// 发送语音消息
export function sendVoiceMessage(conversationId, audioUrl, duration) {
  return Promise.resolve({
    code: 200,
    message: '发送语音成功',
    data: {
      id: Math.floor(Math.random() * 100000),
      conversationId,
      senderId: 1, // 当前用户ID
      type: 'voice',
      content: audioUrl,
      duration: duration || Math.floor(Math.random() * 60) + 1, // 默认随机1-60秒
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  })
}

// 标记为已读
export function markAsRead(conversationId) {
  return Promise.resolve({
    code: 200,
    message: '标记为已读成功',
    data: { success: true }
  })
}