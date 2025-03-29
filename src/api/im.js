import request from '@/utils/request'

/**
 * 获取会话列表
 * @returns {Promise<Object>} 会话列表，包含目标用户信息和最后一条消息
 */
export function getConversationList() {
  return request({
    url: '/api/im/conversations',
    method: 'get'
  })
}

/**
 * 获取会话详情
 * @param {number} conversationId 会话ID
 * @returns {Promise<Object>} 会话详情，包含所有消息
 */
export function getConversationDetail(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}`,
    method: 'get'
  })
}

/**
 * 获取消息历史
 * @param {number} conversationId 会话ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页条数
 * @returns {Promise<Object>} 分页的消息列表
 */
export function getMessageHistory(conversationId, params) {
  return request({
    url: `/api/im/conversations/${conversationId}/messages`,
    method: 'get',
    params
  })
}

/**
 * 发送文本消息
 * @param {number} conversationId 会话ID
 * @param {string} content 消息内容
 * @returns {Promise<Object>} 发送的消息对象
 */
export function sendTextMessage(conversationId, content) {
  return request({
    url: `/api/im/conversations/${conversationId}/messages`,
    method: 'post',
    data: {
      type: 'text',
      content
    }
  })
}

/**
 * 发送图片消息
 * @param {number} conversationId 会话ID
 * @param {File} file 图片文件
 * @returns {Promise<Object>} 发送的消息对象
 */
export function sendImageMessage(conversationId, file) {
  const formData = new FormData()
  formData.append('image', file)
  
  return request({
    url: `/api/im/conversations/${conversationId}/images`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 发送语音消息
 * @param {number} conversationId 会话ID
 * @param {File} file 语音文件
 * @param {number} duration 语音时长（秒）
 * @returns {Promise<Object>} 发送的消息对象
 */
export function sendVoiceMessage(conversationId, file, duration) {
  const formData = new FormData()
  formData.append('voice', file)
  formData.append('duration', duration)
  
  return request({
    url: `/api/im/conversations/${conversationId}/voice`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 标记会话消息为已读
 * @param {number} conversationId 会话ID
 * @returns {Promise<Object>} 操作结果
 */
export function markAsRead(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}/read`,
    method: 'put'
  })
}

/**
 * 删除消息
 * @param {number} conversationId 会话ID
 * @param {string} messageId 消息ID
 * @returns {Promise<Object>} 操作结果
 */
export function deleteMessage(conversationId, messageId) {
  return request({
    url: `/api/im/conversations/${conversationId}/messages/${messageId}`,
    method: 'delete'
  })
}

/**
 * 创建新会话
 * @param {number} targetUserId 目标用户ID
 * @returns {Promise<Object>} 新创建的会话对象
 */
export function createConversation(targetUserId) {
  return request({
    url: '/api/im/conversations',
    method: 'post',
    data: {
      targetUserId
    }
  })
}

/**
 * 获取未读消息数
 * @returns {Promise<Object>} 未读消息数量
 */
export function getUnreadCount() {
  return request({
    url: '/api/im/unread',
    method: 'get'
  })
}

/**
 * 清空会话消息
 * @param {number} conversationId 会话ID
 * @returns {Promise<Object>} 操作结果
 */
export function clearMessages(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}/clear`,
    method: 'delete'
  })
}

/**
 * 删除会话
 * @param {number} conversationId 会话ID
 * @returns {Promise<Object>} 操作结果
 */
export function deleteConversation(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}`,
    method: 'delete'
  })
} 