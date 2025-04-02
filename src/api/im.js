// IM API 模块
import request from '@/utils/request'

// WebSocket操作类型常量
export const wsActions = {
  USER_ONLINE: 'user.online',
  CONVERSATION_CHAT: 'conversation.chat',
  PUSH: 'push'
}

/**
 * 获取聊天记录
 * @param {Object} params - 参数
 * @param {string} params.conversationId - 会话ID
 * @param {number} params.count - 获取数量
 * @param {number} params.startSendTime - 开始时间
 * @param {number} params.endSendTime - 结束时间
 * @returns {Promise}
 */
export function getChatLog(params) {
  return request({
    url: '/v1/im/chat/logs',
    method: 'get',
    params
  })
}

/**
 * 创建/获取用户会话
 * @param {Object} data - 参数
 * @param {number} data.sendId - 发送者ID
 * @param {number} data.recvId - 接收者ID
 * @param {number} data.chatType - 聊天类型 1:单聊 2:群聊
 * @returns {Promise}
 */
export function setUpUserConversation(data) {
  return request({
    url: '/v1/im/conversations/setup',
    method: 'post',
    data
  })
}

/**
 * 获取用户所有会话
 * @returns {Promise}
 */
export function getConversations() {
  return request({
    url: '/v1/im/conversations',
    method: 'get'
  })
}

/**
 * 获取会话列表(分页版本)
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise}
 */
export function getConversationList(params) {
  return request({
    url: '/v1/im/conversation',
    method: 'get',
    params
  })
}

/**
 * 更新会话状态(已读/删除等)
 * @param {Object} data - 参数
 * @param {Object} data.conversationList - 会话列表，键为会话ID，值为操作对象
 * @returns {Promise}
 * 
 * 示例:
 * {
 *   conversationList: {
 *     "conversation_id_1": { read: 1 },
 *     "conversation_id_2": { isShow: false }
 *   }
 * }
 */
export function putConversations(data) {
  return request({
    url: '/v1/im/conversations',
    method: 'put',
    data
  })
}

/**
 * 获取未读消息数
 * @returns {Promise}
 */
export function getUnreadCount() {
  return request({
    url: '/v1/im/unread/count',
    method: 'get'
  })
}

/**
 * 搜索用户
 * @param {string} keyword - 搜索关键词
 * @returns {Promise}
 */
export function searchUsers(keyword) {
  return request({
    url: '/v1/user/search',
    method: 'get',
    params: { keyword }
  })
}

/**
 * 获取好友申请列表
 * @param {Object} params - 参数
 * @param {string} params.status - 状态(pending/accepted/rejected)
 * @returns {Promise}
 */
export function getFriendRequests(params) {
  return request({
    url: '/v1/im/friend/requests',
    method: 'get',
    params
  })
}

/**
 * 处理好友申请
 * @param {Object} data - 参数
 * @param {number} data.requestId - 申请ID
 * @param {string} data.action - 操作(accept/reject)
 * @returns {Promise}
 */
export function handleFriendRequest(data) {
  return request({
    url: '/v1/im/friend/requests/handle',
    method: 'post',
    data
  })
}

/**
 * 发送好友申请
 * @param {Object} data - 参数
 * @param {number} data.targetUserId - 目标用户ID
 * @param {string} data.message - 申请消息
 * @returns {Promise}
 */
export function sendFriendRequest(data) {
  return request({
    url: '/v1/im/friend/requests/send',
    method: 'post',
    data
  })
}

/**
 * 获取用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserDetail(userId) {
  return request({
    url: `/v1/user/${userId}`,
    method: 'get'
  })
}

/**
 * 设置好友备注
 * @param {Object} data - 参数
 * @param {number} data.friendId - 好友ID
 * @param {string} data.note - 备注名
 * @returns {Promise}
 */
export function setFriendNote(data) {
  return request({
    url: '/v1/im/friend/note',
    method: 'put',
    data
  })
}

/**
 * 删除好友
 * @param {number} friendId - 好友ID
 * @returns {Promise}
 */
export function deleteFriend(friendId) {
  return request({
    url: `/v1/im/friend/${friendId}`,
    method: 'delete'
  })
}

/**
 * 标记消息已读
 * @param {Object} data - 参数
 * @param {string} data.conversationId - 会话ID
 * @returns {Promise}
 */
export function markMessageRead(data) {
  return putConversations({
    conversationList: {
      [data.conversationId]: {
        read: 1
      }
    }
  })
}

/**
 * 删除会话
 * @param {Object} data - 参数
 * @param {string} data.conversationId - 会话ID
 * @returns {Promise}
 */
export function deleteSession(data) {
  return putConversations({
    conversationList: {
      [data.conversationId]: {
        isShow: false
      }
    }
  })
}

/**
 * 删除消息
 * @param {string} messageId - 消息ID
 * @returns {Promise}
 */
export function deleteMessage(messageId) {
  return request({
    url: `/v1/im/messages/${messageId}`,
    method: 'delete'
  })
}

/**
 * 撤回消息
 * @param {string} messageId - 消息ID
 * @returns {Promise}
 */
export function recallMessageById(messageId) {
  return request({
    url: `/v1/im/messages/${messageId}/recall`,
    method: 'put'
  })
}

/**
 * 发送文本消息
 * @param {Object} data - 参数
 * @param {string} data.conversationId - 会话ID
 * @param {number} data.receiverId - 接收者ID
 * @param {string} data.content - 消息内容
 * @returns {Promise}
 */
export function sendTextMessage(data) {
  return request({
    url: '/v1/im/messages/text',
    method: 'post',
    data
  })
}

/**
 * 发送图片消息
 * @param {Object} data - 参数
 * @param {string} data.conversationId - 会话ID
 * @param {number} data.receiverId - 接收者ID
 * @param {string} data.imageUrl - 图片URL
 * @returns {Promise}
 */
export function sendImageMessage(data) {
  return request({
    url: '/v1/im/messages/image',
    method: 'post',
    data
  })
}

/**
 * 上传聊天图片
 * @param {FormData} formData - 包含图片的FormData
 * @returns {Promise}
 */
export function uploadChatImage(formData) {
  return request({
    url: '/v1/upload/chat/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传聊天文件
 * @param {FormData} formData - 包含文件的FormData
 * @returns {Promise}
 */
export function uploadChatFile(formData) {
  return request({
    url: '/v1/upload/chat/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 发送位置消息
 * @param {Object} data - 参数
 * @param {string} data.conversationId - 会话ID
 * @param {number} data.receiverId - 接收者ID
 * @param {Object} data.location - 位置信息
 * @returns {Promise}
 */
export function sendLocationMessage(data) {
  return request({
    url: '/v1/im/messages/location',
    method: 'post',
    data
  })
}

/**
 * 解析图片内容
 * @param {string} content - 图片消息内容
 * @returns {string} 图片URL
 */
export function parseImageContent(content) {
  try {
    if (typeof content === 'string') {
      if (content.startsWith('http')) {
        return content;
      }
      const parsed = JSON.parse(content);
      return parsed.url || content;
    }
    return content.url || content;
  } catch (e) {
    return content;
  }
}

/**
 * 解析文件内容
 * @param {string} content - 文件消息内容
 * @returns {Object} 解析后的文件对象
 */
export function parseFileContent(content) {
  try {
    return typeof content === 'string' ? JSON.parse(content) : content
  } catch (e) {
    return { url: content, name: '未知文件' }
  }
}

/**
 * 解析位置内容
 * @param {string} content - 位置消息内容
 * @returns {Object} 解析后的位置对象
 */
export function parseLocationContent(content) {
  try {
    return typeof content === 'string' ? JSON.parse(content) : content
  } catch (e) {
    return { address: '未知位置', latitude: 0, longitude: 0 }
  }
}

/**
 * WebSocket连接地址
 * @param {number} userId - 用户ID
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl(userId) {
  // 根据环境获取WebSocket基础URL
  const wsBaseUrl = process.env.NODE_ENV === 'production'
    ? 'wss://im.ws.example.com'
    : 'ws://localhost:10090'
    
  return `${wsBaseUrl}?userId=${userId}`
}

/**
 * 发送正在输入状态
 * @param {string|number} conversationId - 会话ID
 * @returns {Promise}
 */
export function sendTypingStatus(conversationId) {
  return request({
    url: '/v1/im/conversations/typing',
    method: 'post',
    data: { conversationId }
  })
}

/**
 * 清空聊天记录
 * @param {string} conversationId - 会话ID
 * @returns {Promise}
 */
export function clearMessages(conversationId) {
  return request({
    url: `/v1/im/conversations/${conversationId}/messages/clear`,
    method: 'delete'
  })
}

/**
 * 标记消息为已读
 * @param {number|string} conversationId 会话ID
 * @returns {Promise} Promise对象
 */
export function markAsRead(conversationId) {
  return request({
    url: `/v1/im/conversations/${conversationId}/read`,
    method: 'put'
  })
}

/**
 * 获取聊天初始化数据
 * @param {Object} params - 参数
 * @param {string} params.conversationId - 会话ID
 * @returns {Promise}
 */
export function getChatInitData(params) {
  return request({
    url: '/v1/im/chat/init',
    method: 'get',
    params
  })
}

/**
 * 创建群聊
 * @param {Object} data - 群聊创建参数
 * @param {string} data.name - 群聊名称
 * @param {string} data.avatar - 群聊头像
 * @param {Array<number>} data.memberIds - 群成员ID列表
 * @returns {Promise}
 */
export function createGroup(data) {
  return request({
    url: '/v1/im/groups',
    method: 'post',
    data
  })
}

/**
 * 获取好友列表
 * @returns {Promise}
 */
export function getFriendList() {
  return request({
    url: '/v1/im/friend/list',
    method: 'get'
  })
}

/**
 * 获取群聊列表
 * @returns {Promise}
 */
export function getGroupList() {
  return request({
    url: '/v1/im/groups',
    method: 'get'
  })
}

/**
 * 获取会话详情
 * @param {Object} params - 参数
 * @param {string} params.conversationId - 会话ID
 * @returns {Promise}
 */
export function getConversationDetail(params) {
  return request({
    url: `/v1/im/conversations/${params.conversationId}`,
    method: 'get'
  })
}