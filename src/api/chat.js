import request from './request'

// 聊天相关接口
export default {
  // 获取聊天会话列表
  getChatSessionList() {
    return request.get('/chat/sessions')
  },
  
  // 获取与特定用户的聊天记录
  getChatHistory(userId, page = 1, limit = 20) {
    return request.get(`/chat/history/${userId}`, { page, limit })
  },
  
  // 发送消息
  sendMessage(userId, content, type = 'text') {
    return request.post('/chat/send', { userId, content, type })
  },
  
  // 标记消息为已读
  markMessagesAsRead(sessionId) {
    return request.put(`/chat/read/${sessionId}`)
  },
  
  // 删除聊天会话
  deleteSession(sessionId) {
    return request.delete(`/chat/session/${sessionId}`)
  },
  
  // 上传聊天图片
  uploadChatImage(file, onProgress) {
    return request.upload('/chat/upload-image', file, onProgress)
  },
  
  // 获取未读消息数量
  getUnreadCount() {
    return request.get('/chat/unread-count')
  },
  
  // 创建新的聊天会话（如从商品详情页发起聊天）
  createChatSession(userId, initialMessage, relatedItemType, relatedItemId) {
    return request.post('/chat/create-session', {
      userId,
      initialMessage,
      relatedItemType,
      relatedItemId
    })
  }
}