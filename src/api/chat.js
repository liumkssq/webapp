import request from '@/utils/request'

/**
 * 获取聊天会话列表
 * @returns {Promise} Promise对象
 */
export function getChatList() {
  return request({
    url: '/api/chat/list',
    method: 'get'
  })
}

/**
 * 获取与特定用户的聊天记录
 * @param {number} userId 用户ID
 * @param {object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.limit 每页数量
 * @returns {Promise} Promise对象
 */
export function getChatHistory(userId, params) {
  return request({
    url: `/api/chat/history/${userId}`,
    method: 'get',
    params
  })
}

/**
 * 获取会话详情
 * @param {number} userId 用户ID
 * @returns {Promise} Promise对象
 */
export function getConversationDetail(userId) {
  return request({
    url: `/api/chat/conversation/${userId}`,
    method: 'get'
  })
}

/**
 * 发送消息
 * @param {object} data 消息数据
 * @param {number} data.receiverId 接收者ID
 * @param {string} data.content 消息内容
 * @param {string} data.type 消息类型(text/image/file)
 * @returns {Promise} Promise对象
 */
export function sendMessage(data) {
  return request({
    url: '/api/chat/send',
    method: 'post',
    data
  })
}

/**
 * 标记消息为已读
 * @param {number} conversationId 会话ID
 * @returns {Promise} Promise对象
 */
export function markAsRead(conversationId) {
  return request({
    url: `/api/chat/read/${conversationId}`,
    method: 'put'
  })
}

/**
 * 删除消息
 * @param {number} messageId 消息ID
 * @returns {Promise} Promise对象
 */
export function deleteMessage(messageId) {
  return request({
    url: `/api/chat/message/${messageId}`,
    method: 'delete'
  })
}

/**
 * 上传聊天图片
 * @param {FormData} data 包含图片文件的FormData
 * @returns {Promise} Promise对象
 */
export function uploadChatImage(data) {
  return request({
    url: '/api/chat/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取未读消息数量
 * @returns {Promise} Promise对象
 */
export function getUnreadCount() {
  return request({
    url: '/api/chat/unread',
    method: 'get'
  })
}