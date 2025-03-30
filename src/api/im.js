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
 * @param {string} conversationType 会话类型 private|group
 * @param {number} targetId 目标ID（用户ID或群组ID）
 * @returns {Promise<Object>} 操作结果
 */
export function deleteConversationByType(conversationType, targetId) {
  return request({
    url: '/api/im/conversations',
    method: 'delete',
    data: { conversationType, targetId }
  })
}

// --------------------- 群聊相关 API ---------------------

/**
 * 获取群聊列表
 * @returns {Promise<Object>} 群聊列表
 */
export function getGroupList() {
  return request({
    url: '/api/im/groups',
    method: 'get'
  })
}

/**
 * 获取群聊详情
 * @param {number} groupId 群聊ID
 * @returns {Promise<Object>} 群聊详情
 */
export function getGroupDetail(groupId) {
  return request({
    url: `/api/im/groups/${groupId}`,
    method: 'get'
  })
}

/**
 * 创建群聊
 * @param {Object} data 群聊信息
 * @param {string} data.name 群聊名称
 * @param {string} data.avatar 群聊头像
 * @param {Array<number>} data.memberIds 成员ID列表
 * @returns {Promise<Object>} 创建的群聊对象
 */
export function createGroup(data) {
  return request({
    url: '/api/im/groups',
    method: 'post',
    data
  })
}

/**
 * 更新群聊信息
 * @param {number} groupId 群聊ID
 * @param {Object} data 更新的信息
 * @returns {Promise<Object>} 更新后的群聊对象
 */
export function updateGroup(groupId, data) {
  return request({
    url: `/api/im/groups/${groupId}`,
    method: 'put',
    data
  })
}

/**
 * 加入群聊
 * @param {number} groupId 群聊ID
 * @returns {Promise<Object>} 操作结果
 */
export function joinGroup(groupId) {
  return request({
    url: `/api/im/groups/${groupId}/join`,
    method: 'post'
  })
}

/**
 * 退出群聊
 * @param {number} groupId 群聊ID
 * @returns {Promise<Object>} 操作结果
 */
export function leaveGroup(groupId) {
  return request({
    url: `/api/im/groups/${groupId}/leave`,
    method: 'post'
  })
}

/**
 * 获取群聊消息
 * @param {number} groupId 群聊ID
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 群聊消息列表
 */
export function getGroupMessages(groupId, params) {
  return request({
    url: `/api/im/groups/${groupId}/messages`,
    method: 'get',
    params
  })
}

/**
 * 发送群聊消息
 * @param {number} groupId 群聊ID
 * @param {Object} data 消息数据
 * @returns {Promise<Object>} 发送的消息对象
 */
export function sendGroupMessage(groupId, data) {
  return request({
    url: `/api/im/groups/${groupId}/messages`,
    method: 'post',
    data
  })
}

/**
 * 邀请用户加入群聊
 * @param {number} groupId 群聊ID
 * @param {Array<number>} userIds 用户ID列表
 * @returns {Promise<Object>} 操作结果
 */
export function inviteToGroup(groupId, userIds) {
  return request({
    url: `/api/im/groups/${groupId}/invite`,
    method: 'post',
    data: {
      userIds
    }
  })
}

/**
 * 移除群聊成员
 * @param {number} groupId 群聊ID
 * @param {number} userId 用户ID
 * @returns {Promise<Object>} 操作结果
 */
export function removeGroupMember(groupId, userId) {
  return request({
    url: `/api/im/groups/${groupId}/members/${userId}`,
    method: 'delete'
  })
}

// --------------------- 好友相关 API ---------------------

/**
 * 获取好友列表
 * @returns {Promise<Object>} 好友列表
 */
export function getFriendList() {
  return request({
    url: '/api/im/friends',
    method: 'get'
  })
}

/**
 * 获取好友申请列表
 * @param {Object} params 查询参数
 * @param {number} [params.page=1] 页码
 * @param {number} [params.pageSize=20] 每页条数
 * @param {string} [params.status] 状态筛选 pending|accepted|rejected
 * @returns {Promise<Object>} 好友请求列表
 */
export function getFriendRequests(params) {
  return request({
    url: '/api/im/friend-requests',
    method: 'get',
    params
  })
}

/**
 * 发送好友申请
 * @param {Object} data 请求数据
 * @param {number} data.userId 用户ID
 * @param {string} [data.message] 申请消息
 * @returns {Promise<Object>} 操作结果
 */
export function sendFriendRequest(data) {
  return request({
    url: '/api/im/friend-requests',
    method: 'post',
    data
  })
}

/**
 * 处理好友申请
 * @param {number} requestId 申请ID
 * @param {Object} data 请求数据
 * @param {string} data.action 操作类型 accept|reject
 * @returns {Promise<Object>} 操作结果
 */
export function handleFriendRequest(requestId, data) {
  return request({
    url: `/api/im/friend-requests/${requestId}`,
    method: 'put',
    data
  })
}

/**
 * 删除好友
 * @param {number} friendId 好友ID
 * @returns {Promise<Object>} 操作结果
 */
export function deleteFriend(friendId) {
  return request({
    url: `/api/im/friends/${friendId}`,
    method: 'delete'
  })
}

/**
 * 设置好友备注
 * @param {number} friendId 好友ID
 * @param {string} remark 备注名
 * @returns {Promise<Object>} 操作结果
 */
export function setFriendRemark(friendId, remark) {
  return request({
    url: `/api/im/friends/${friendId}/remark`,
    method: 'put',
    data: {
      remark
    }
  })
}

/**
 * 获取好友详情
 * @param {number} friendId 好友ID
 * @returns {Promise<Object>} 好友详情
 */
export function getFriendDetail(friendId) {
  return request({
    url: `/api/im/friends/${friendId}`,
    method: 'get'
  })
}

/**
 * 搜索用户
 * @param {string} keyword 搜索关键词
 * @returns {Promise<Object>} 搜索结果
 */
export function searchUsers(keyword) {
  return request({
    url: '/api/im/users/search',
    method: 'get',
    params: {
      keyword
    }
  })
}

/**
 * 获取用户在线状态
 * @param {Array<number>} userIds 用户ID列表
 * @returns {Promise<Object>} 用户在线状态
 */
export function getUsersOnlineStatus(userIds) {
  return request({
    url: '/api/im/users/online-status',
    method: 'post',
    data: {
      userIds
    }
  })
}

/**
 * 设置会话置顶
 * @param {string} conversationType 会话类型 private|group
 * @param {number} targetId 目标ID（用户ID或群组ID）
 * @param {boolean} isSticky 是否置顶
 * @returns {Promise<Object>} 操作结果
 */
export function setConversationSticky(conversationType, targetId, isSticky) {
  return request({
    url: '/api/im/conversations/sticky',
    method: 'put',
    data: { conversationType, targetId, isSticky }
  })
}

/**
 * 设置会话免打扰
 * @param {string} conversationType 会话类型 private|group
 * @param {number} targetId 目标ID（用户ID或群组ID）
 * @param {boolean} isMuted 是否免打扰
 * @returns {Promise<Object>} 操作结果
 */
export function setConversationMuted(conversationType, targetId, isMuted) {
  return request({
    url: '/api/im/conversations/muted',
    method: 'put',
    data: { conversationType, targetId, isMuted }
  })
}

/**
 * 清空会话消息
 * @param {string} conversationType 会话类型 private|group
 * @param {number} targetId 目标ID（用户ID或群组ID）
 * @returns {Promise<Object>} 操作结果
 */
export function clearConversationMessages(conversationType, targetId) {
  return request({
    url: '/api/im/conversations/clear-messages',
    method: 'put',
    data: { conversationType, targetId }
  })
}

/**
 * 搜索消息
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 关键词
 * @param {string} [params.conversationType] 会话类型 private|group
 * @param {number} [params.targetId] 目标ID（用户ID或群组ID）
 * @param {number} [params.page=1] 页码
 * @param {number} [params.pageSize=20] 每页条数
 * @returns {Promise<Object>} 搜索结果
 */
export function searchMessages(params) {
  return request({
    url: '/api/im/messages/search',
    method: 'get',
    params
  })
}

/**
 * 查询用户在线状态
 * @param {number[]} userIds 用户ID列表
 * @returns {Promise<Object>} 用户在线状态
 */
export function getUserOnlineStatus(userIds) {
  return request({
    url: '/api/im/users/online-status',
    method: 'post',
    data: { userIds }
  })
} 