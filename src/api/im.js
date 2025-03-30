import request from '@/utils/request'
import { getWebSocketClient } from '@/utils/websocket'
import { MessageType, createMessage } from '@/utils/messageFormatter'

/**
 * 初始化WebSocket连接
 * @param {string} token - 用户认证令牌
 * @returns {Promise} 连接结果Promise
 */
export function initWebSocketConnection(token) {
  const ws = getWebSocketClient()
  return ws ? ws.connect() : Promise.reject(new Error('WebSocket客户端未初始化'))
}

/**
 * 关闭WebSocket连接
 */
export function closeWebSocketConnection() {
  const ws = getWebSocketClient()
  if (ws) {
    ws.disconnect()
  }
}

/**
 * 添加WebSocket消息监听器
 * @param {string} event - 事件名称
 * @param {Function} callback - 回调函数
 */
export function addWebSocketListener(event, callback) {
  const ws = getWebSocketClient()
  if (ws) {
    ws.on(event, callback)
  }
}

/**
 * 移除WebSocket消息监听器
 * @param {string} event - 事件名称
 * @param {Function} callback - 回调函数
 */
export function removeWebSocketListener(event, callback) {
  const ws = getWebSocketClient()
  if (ws) {
    ws.off(event, callback)
  }
}

/**
 * 通过WebSocket发送消息
 * @param {Object} message - 消息对象
 * @returns {boolean} 发送结果
 */
export function sendWebSocketMessage(message) {
  const ws = getWebSocketClient()
  return ws ? ws.send({
    type: 'chat_message',
    data: message
  }) : false
}

/**
 * 通过WebSocket发送事件
 * @param {string} event - 事件名称
 * @param {Object} data - 事件数据
 * @returns {boolean} 发送结果
 */
export function emitWebSocketEvent(event, data) {
  const ws = getWebSocketClient()
  return ws ? ws.send({
    type: event,
    payload: data
  }) : false
}

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
  return request({
    url: '/api/im/friend-request',
    method: 'post',
    data
  })
}

// 处理好友申请
export function handleFriendRequest(data) {
  const { requestId, action } = data
  
  return request({
    url: '/api/im/friend-request/' + requestId,
    method: 'put',
    data: { action }
  })
}

// 获取用户信息
export function getUserInfo(id) {
  return request({
    url: `/api/im/user/${id}/info`,
    method: 'get'
  })
}

// 设置好友备注
export function setFriendNote(data) {
  return request({
    url: '/api/im/friend/note',
    method: 'put',
    data
  })
}

// 删除好友
export function deleteFriend(id) {
  return request({
    url: `/api/im/friend/${id}`,
    method: 'delete'
  })
}

// 获取群聊列表
export function getGroupList() {
  return request({
    url: '/api/im/groups',
    method: 'get'
  })
}

// 创建群聊
export function createGroup(data) {
  return request({
    url: '/api/im/group',
    method: 'post',
    data
  })
}

// 获取群聊详情
export function getGroupInfo(id) {
  return request({
    url: `/api/im/group/${id}`,
    method: 'get'
  })
}

// 获取群成员列表
export function getGroupMembers(id, params) {
  return request({
    url: `/api/im/group/${id}/members`,
    method: 'get',
    params
  })
}

// 邀请好友加入群聊
export function inviteToGroup(data) {
  return request({
    url: '/api/im/group/invite',
    method: 'post',
    data
  })
}

// 申请加入群聊
export function applyToJoinGroup(data) {
  return request({
    url: '/api/im/group/apply',
    method: 'post',
    data
  })
}

// 处理入群申请
export function handleGroupApplication(data) {
  const { applicationId, action } = data
  
  return request({
    url: `/api/im/group/application/${applicationId}`,
    method: 'put',
    data: { action }
  })
}

// 获取入群申请列表
export function getGroupApplications(groupId) {
  return request({
    url: `/api/im/group/${groupId}/applications`,
    method: 'get'
  })
}

// 设置群成员角色
export function setGroupMemberRole(data) {
  return request({
    url: '/api/im/group/member/role',
    method: 'put',
    data
  })
}

// 移除群成员
export function removeGroupMember(data) {
  return request({
    url: '/api/im/group/member',
    method: 'delete',
    data
  })
}

// 退出群聊
export function leaveGroup(id) {
  return request({
    url: `/api/im/group/${id}/leave`,
    method: 'post'
  })
}

// 解散群聊
export function dismissGroup(id) {
  return request({
    url: `/api/im/group/${id}/dismiss`,
    method: 'post'
  })
}

// 更新群聊信息
export function updateGroupInfo(id, data) {
  return request({
    url: `/api/im/group/${id}`,
    method: 'put',
    data
  })
}

// 获取用户详情
export function getUserDetail(id) {
  return request({
    url: `/api/im/user/${id}`,
    method: 'get'
  })
}

// 获取会话列表
export function getConversationList() {
  return request({
    url: '/api/im/conversations',
    method: 'get'
  })
}

// 获取聊天记录
export function getChatMessages(params) {
  return request({
    url: '/api/im/messages',
    method: 'get',
    params
  })
}

// 为向后兼容提供别名
export const getMessages = getChatMessages

// 发送消息
export function sendMessage(data) {
  // 同时通过HTTP和WebSocket发送消息
  const wsResult = sendWebSocketMessage(data)
  
  // 如果WebSocket发送失败，则使用HTTP发送
  if (!wsResult) {
    return request({
      url: '/api/im/message',
      method: 'post',
      data
    })
  }
  
  // 返回一个模拟的成功响应
  return Promise.resolve({
    code: 200,
    message: '发送消息成功',
    data: {
      messageId: data.id || Date.now().toString(),
      conversationId: data.conversationId,
      content: data.content,
      type: data.type,
      timestamp: new Date().toISOString(),
      status: 'sent'
    }
  })
}

// 标记消息已读
export function markMessageRead(conversationId) {
  // 使用WebSocket发送已读状态
  emitWebSocketEvent('im.message.read', { conversationId })
  
  return request({
    url: `/api/im/conversation/${conversationId}/read`,
    method: 'put'
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
  return request({
    url: '/api/im/search-contacts',
    method: 'get',
    params: { keyword }
  })
}

// 搜索用户
export function searchUsers(keyword) {
  return request({
    url: '/api/im/search-users',
    method: 'get',
    params: { keyword }
  })
}

// 获取好友列表
export function getFriendList() {
  return request({
    url: '/api/im/friends',
    method: 'get'
  })
}

// 获取会话详情
export function getConversationDetail(id) {
  return request({
    url: `/api/im/conversation/${id}`,
    method: 'get'
  })
}

// 创建会话
export function createConversation(data) {
  return request({
    url: '/api/im/conversation',
    method: 'post',
    data
  })
}

// 删除会话
export function deleteConversation(data) {
  const id = typeof data === 'object' ? data.conversationId : data
  
  return request({
    url: `/api/im/conversation/${id}`,
    method: 'delete'
  })
}

// 为向后兼容提供别名
export const deleteSession = deleteConversation

// 清空会话消息
export function clearMessages(conversationId) {
  return request({
    url: `/api/im/conversation/${conversationId}/messages`,
    method: 'delete'
  })
}

// 删除消息
export function deleteMessage(messageId) {
  return request({
    url: `/api/im/message/${messageId}`,
    method: 'delete'
  })
}

// 为向后兼容提供别名
export const recallMessage = deleteMessage

// 获取消息历史
export function getMessageHistory(conversationId, params = {}) {
  const { page = 1, limit = 20 } = params
  return getChatMessages({ conversationId, page, limit })
}

// 发送文本消息
export function sendTextMessage(conversationId, content, options = {}) {
  const { userId, userName, userAvatar } = options
  
  // 创建消息对象
  const message = createMessage({
    type: MessageType.TEXT,
    content,
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    conversationId
  })
  
  // 发送消息
  return sendMessage(message)
}

// 发送图片消息
export function sendImageMessage(conversationId, imageUrl, options = {}) {
  const { userId, userName, userAvatar } = options
  
  // 创建消息对象
  const message = createMessage({
    type: MessageType.IMAGE,
    content: imageUrl,
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    conversationId
  })
  
  // 发送消息
  return sendMessage(message)
}

// 发送语音消息
export function sendVoiceMessage(conversationId, audioUrl, duration, options = {}) {
  const { userId, userName, userAvatar } = options
  
  // 创建消息对象
  const message = createMessage({
    type: MessageType.AUDIO,
    content: audioUrl,
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    conversationId,
    extra: { duration }
  })
  
  // 发送消息
  return sendMessage(message)
}

// 发送位置消息
export function sendLocationMessage(conversationId, location, options = {}) {
  const { userId, userName, userAvatar } = options
  
  // 创建消息对象
  const message = createMessage({
    type: MessageType.LOCATION,
    content: JSON.stringify(location),
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    conversationId
  })
  
  // 发送消息
  return sendMessage(message)
}

// 发送文件消息
export function sendFileMessage(conversationId, fileInfo, options = {}) {
  const { userId, userName, userAvatar } = options
  
  // 创建消息对象
  const message = createMessage({
    type: MessageType.FILE,
    content: JSON.stringify(fileInfo),
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    conversationId
  })
  
  // 发送消息
  return sendMessage(message)
}

// 标记为已读
export function markAsRead(conversationId) {
  // 使用WebSocket发送已读状态
  emitWebSocketEvent('im.message.read', { conversationId })
  
  // 同时通过HTTP API发送
  return request({
    url: `/api/im/conversation/${conversationId}/read`,
    method: 'put'
  })
}

// 撤回消息
export function recallMessageById(messageId, conversationId) {
  // 使用WebSocket发送撤回指令
  emitWebSocketEvent('im.message.revoke', { 
    messageId,
    conversationId 
  })
  
  // 同时通过HTTP API发送
  return request({
    url: `/api/im/message/${messageId}/recall`,
    method: 'put',
    data: { conversationId }
  })
}

// 发送正在输入状态
export function sendTypingStatus(conversationId) {
  return emitWebSocketEvent('im.message.keyboard', {
    conversationId,
    timestamp: Date.now()
  })
}

// 上传聊天图片
export function uploadChatImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/im/upload/image',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}

// 上传聊天文件
export function uploadChatFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/im/upload/file',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}

// 获取用户在线状态
export function getUserOnlineStatus(userIds) {
  return request({
    url: '/api/im/user/online-status',
    method: 'post',
    data: { userIds }
  })
}

// 设置用户状态
export function setUserStatus(status) {
  // 使用WebSocket发送状态更新
  emitWebSocketEvent('user_status', { status })
  
  // 同时通过HTTP API发送
  return request({
    url: '/api/im/user/status',
    method: 'put',
    data: { status }
  })
}

// 搜索群聊
export function searchGroups(keyword) {
  return request({
    url: '/api/im/search-groups',
    method: 'get',
    params: { keyword }
  })
}

// 获取群公告
export function getGroupAnnouncements(groupId) {
  return request({
    url: `/api/im/group/${groupId}/announcements`,
    method: 'get'
  })
}

// 发布群公告
export function publishGroupAnnouncement(groupId, content) {
  return request({
    url: `/api/im/group/${groupId}/announcement`,
    method: 'post',
    data: { content }
  })
}

// 获取聊天窗口初始数据（会话信息和历史消息）
export function getChatInitData(conversationType, targetId) {
  return Promise.all([
    conversationType === 'group' 
      ? getGroupInfo(targetId) 
      : getUserDetail(targetId),
    getMessageHistory(
      conversationType === 'group' 
        ? `group_${targetId}` 
        : `private_${targetId}`
    )
  ]).then(([detailResponse, messagesResponse]) => {
    return {
      detail: detailResponse.data,
      messages: messagesResponse.data
    }
  })
}

// 解析图片内容
export function parseImageContent(content) {
  try {
    if (typeof content === 'string' && content.startsWith('{')) {
      const data = JSON.parse(content)
      return data.url || content
    }
    return content
  } catch (e) {
    return content
  }
}

// 解析文件内容
export function parseFileContent(content) {
  try {
    if (typeof content === 'string' && content.startsWith('{')) {
      return JSON.parse(content)
    }
    return { name: '未知文件', url: content }
  } catch (e) {
    return { name: '未知文件', url: content }
  }
}

// 解析位置内容
export function parseLocationContent(content) {
  try {
    if (typeof content === 'string' && content.startsWith('{')) {
      return JSON.parse(content)
    }
    return { address: '未知位置', latitude: 0, longitude: 0 }
  } catch (e) {
    return { address: '未知位置', latitude: 0, longitude: 0 }
  }
}