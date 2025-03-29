import request from '@/utils/request'

/**
 * 获取聊天会话列表
 * @returns {Promise}
 */
export function getChatSessions() {
  return request({
    url: '/api/chat/sessions',
    method: 'get'
  })
}

/**
 * 获取指定会话的聊天记录
 * @param {string} sessionId 会话ID
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，默认1
 * @param {number} params.size 每页数量，默认20
 * @returns {Promise}
 */
export function getMessages(sessionId, params) {
  return request({
    url: `/api/chat/messages/${sessionId}`,
    method: 'get',
    params
  })
}

/**
 * 发送消息
 * @param {Object} data 消息数据
 * @param {string} data.sessionId 会话ID
 * @param {string} data.content 消息内容
 * @param {string} data.contentType 消息类型：text-文本，image-图片，file-文件
 * @param {Object} data.extras 额外信息，用于图片或文件消息
 * @returns {Promise}
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
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export function markAsRead(sessionId) {
  return request({
    url: `/api/chat/read/${sessionId}`,
    method: 'put'
  })
}

/**
 * 删除会话
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export function deleteSession(sessionId) {
  return request({
    url: `/api/chat/session/${sessionId}`,
    method: 'delete'
  })
}

/**
 * 获取用户列表（用于添加好友或创建新会话）
 * @param {Object} params 查询参数
 * @param {string} params.keyword 搜索关键词
 * @returns {Promise}
 */
export function getUsers(params) {
  return request({
    url: '/api/chat/users',
    method: 'get',
    params
  })
}

/**
 * 创建新会话
 * @param {Object} data 会话数据
 * @param {string} data.userId 用户ID
 * @returns {Promise}
 */
export function createSession(data) {
  return request({
    url: '/api/chat/session/create',
    method: 'post',
    data
  })
}

/**
 * 获取未读消息总数
 * @returns {Promise}
 */
export function getUnreadCount() {
  return request({
    url: '/api/chat/unread-count',
    method: 'get'
  })
}