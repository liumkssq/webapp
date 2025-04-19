// IM API 模块
import { WS_CONFIG } from '@/config/index'
import request from '@/utils/request'

// WebSocket操作类型常量
export const wsActions = {
  USER_ONLINE: 'user.online',
  CONVERSATION_CHAT: 'conversation.chat',
  CONVERSATION_MARK_CHAT: 'conversation.markChat',
  PUSH: 'push',
  CONNECT: 'connect',                  // 连接
  DISCONNECT: 'disconnect',            // 断开连接
  SEND_MESSAGE: 'sendMessage',         // 发送消息
  RECEIVE_MESSAGE: 'receiveMessage',   // 接收消息
  MARK_READ: 'markRead',               // 标记已读
  HEART_BEAT: 'heartbeat',             // 心跳包
  ACK: 'ack'                           // 确认收到
}

// 聊天类型常量
export const CHAT_TYPE = {
  GROUP: 1, // 群聊
  SINGLE: 2  // 单聊
}

// 消息类型常量
export const MESSAGE_TYPE = {
  TEXT: 1,    // 文本
  IMAGE: 2,   // 图片
  AUDIO: 3,   // 音频
  VIDEO: 4,   // 视频
  FILE: 5,    // 文件
  LOCATION: 6, // 位置
  CARD: 7,    // 名片
  SYSTEM: 8,  // 系统
  CUSTOM: 9,  // 自定义
  RECALL: 10  // 撤回
}

// 内容类型常量
export const CONTENT_TYPE = {
  CHAT_MESSAGE: 0, // 聊天消息
  READ_RECEIPT: 1,  // 已读回执
  TEXT: 1,           // 文本
  IMAGE: 2,          // 图片
  AUDIO: 3,          // 音频
  VIDEO: 4,          // 视频
  FILE: 5,           // 文件
  LOCATION: 6,       // 位置
  CARD: 7,           // 名片
  CUSTOM: 8         // 自定义
}

/**
 * 获取WebSocket URL
 * @param {string|number} userId - 用户ID
 * @returns {string} - WebSocket 连接地址
 */
export function getWebSocketUrl(userId) {
  // 使用配置中的WebSocket基础URL
  const baseUrl = WS_CONFIG.BASE_URL
  
  // 即使userId未定义也返回有效URL
  return `${baseUrl}${userId ? `?userId=${userId}` : ''}`
}

/**
 * 获取聊天历史记录
 * @param {Object} params 请求参数
 * @param {string} params.conversationId 会话ID
 * @param {number} params.startSendTime 开始时间戳
 * @param {number} params.endSendTime 结束时间戳
 * @param {number} params.count 返回消息数量
 * @returns {Promise<Object>} 聊天历史记录
 */
export function getChatLog(params) {
  console.log('请求聊天历史记录:', params);
  return request({
    url: '/api/im/chatlog',
    method: 'GET',
    params
  });
}

/**
 * 创建/获取用户会话
 * @param {Object} data - 参数
 * @param {number} data.sendId - 发送者ID
 * @param {number} data.recvId - 接收者ID
 * @param {number} data.chatType - 聊天类型 1:群聊 2:单聊
 * @returns {Promise}
 */
export function setUpUserConversation(data) {
  return request({
    url: '/api/im/setup/conversation',
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
    url: '/api/im/conversation',
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
    url: '/api/im/conversation',
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
    url: '/api/im/conversation',
    method: 'put',
    data
  })
}

/**
 * 获取未读消息数量
 * @returns {Promise<Object>} 未读消息数量
 */
export function getUnreadCount() {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  
  // 如果启用了mock模式，返回模拟数据
  if (useMock) {
    console.log('[Mock] 使用模拟未读消息数据');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          code: 200,
          message: 'success',
          data: {
            count: Math.floor(Math.random() * 5) // 随机0-4条未读消息
          }
        });
      }, 200);
    });
  }
  
  // 从本地存储获取会话列表并计算未读数，避免不必要的API请求
  const cachedConversations = localStorage.getItem('cachedConversations');
  if (cachedConversations) {
    try {
      const { conversationList } = JSON.parse(cachedConversations);
      // 计算所有会话的未读消息总数
      let totalUnread = 0;
      Object.values(conversationList || {}).forEach(conv => {
        totalUnread += (conv.unreadCount || 0);
      });
      
      console.log('[IM] 从缓存计算未读消息数:', totalUnread);
      return Promise.resolve({
        code: 200,
        message: 'success',
        data: {
          count: totalUnread
        }
      });
    } catch (error) {
      console.warn('[IM] 从缓存计算未读消息数失败:', error);
      // 缓存解析失败，继续使用API请求
    }
  }
  
  // 实际API请求
  console.log('[IM] 请求未读消息数');
  return request({
    url: '/im/unread/count',
    method: 'get',
    needLoading: false,
  }).then(response => {
    // 如果响应成功但没有count字段，设置为0
    if (response.code === 200 && !response.data?.count) {
      response.data = { count: 0 };
    }
    return response;
  }).catch(error => {
    console.warn('[IM] 获取未读消息数失败:', error);
    // 失败时返回一个格式化的错误响应
    return {
      code: 500,
      message: error.message || '获取未读消息数失败',
      data: { count: 0 }
    };
  });
}

/**
 * 搜索用户
 * @param {string} keyword - 搜索关键词
 * @returns {Promise}
 */
export function searchUsers(keyword) {
  return request({
    url: '/api/user/search',
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
    url: '/api/social/friend/putIns',
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
    url: '/api/social/friend/putIn',
    method: 'put',
    data: {
      id: data.requestId,
      status: data.action === 'accept' ? 2 : 3 // 2=通过，3=拒绝
    }
  })
}

/**
 * 发送好友申请
 * @param {Object} data - 参数
 * @param {string} data.targetUserId - 目标用户ID (旧格式)
 * @param {string} data.message - 申请消息 (旧格式)
 * @param {string} data.user_uid - 目标用户ID (新格式)
 * @param {string} data.req_msg - 申请消息 (新格式)
 * @param {number} data.req_time - 申请时间 (新格式)
 * @returns {Promise}
 */
export function sendFriendRequest(data) {
  console.log('发送好友申请，原始参数:', data);
  
  // 准备请求数据，优先使用新格式
  const requestData = {
    user_uid: data.user_uid || data.targetUserId || data.userId || '',
    req_msg: data.req_msg || data.message || data.remark || '',
    req_time: data.req_time || Date.now()
  };
  
  console.log('发送好友申请，处理后参数:', requestData);
  
  return request({
    url: '/api/social/friend/putIn',
    method: 'post',
    data: requestData
  });
}

/**
 * 获取用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserDetail(userId) {
  return request({
    url: `/api/user/${userId}`,
    method: 'get'
  })
}

/**
 * 获取用户个人资料
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export function getUserProfile(userId) {
  return request({
    url: `/api/user/profile/${userId}`,
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
    url: '/api/social/friend/remark',
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
    url: `/api/social/friend/${friendId}`,
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
    url: `/api/im/messages/${messageId}`,
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
    url: `/api/im/messages/${messageId}/recall`,
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
    url: '/api/im/messages/text',
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
    url: '/api/im/messages/image',
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
    url: '/api/upload/chat/image',
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
    url: '/api/upload/chat/file',
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
    url: '/api/im/messages/location',
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
 * 标记消息为已读
 * @param {number|string} conversationId 会话ID
 * @returns {Promise} Promise对象
 */
export function markAsRead(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}/read`,
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
    url: '/api/im/chat/init',
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
    url: '/api/social/group',
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
    url: '/api/social/friends',
    method: 'get'
  })
}

/**
 * 获取群聊列表
 * @returns {Promise}
 */
export function getGroupList() {
  return request({
    url: '/api/social/groups',
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
    url: `/api/im/conversations/${params.conversationId}`,
    method: 'get'
  })
}

/**
 * 通过WebSocket发送聊天消息
 * @param {Object} data 聊天消息数据
 * @returns {Object} 格式化后的WebSocket消息
 */
export function formatChatMessage(data) {
  return {
    conversationId: data.conversationId,
    chatType: data.chatType || CHAT_TYPE.SINGLE,
    sendId: data.senderId,
    recvId: data.receiverId,
    msg: {
      mType: data.messageType || MESSAGE_TYPE.TEXT,
      content: data.content
    }
  }
}

/**
 * 格式化标记已读消息
 * @param {Object} data 已读消息数据
 * @returns {Object} 格式化后的WebSocket消息
 */
export function formatMarkReadMessage(data) {
  return {
    chatType: data.chatType || CHAT_TYPE.SINGLE,
    recvId: data.receiverId,
    conversationId: data.conversationId,
    msgIds: data.messageIds
  }
}

/**
 * 清空会话的所有消息
 * @param {number|string} conversationId 会话ID
 * @returns {Promise} Promise对象
 */
export function clearMessages(conversationId) {
  return request({
    url: `/api/im/conversations/${conversationId}/messages`,
    method: 'delete'
  })
}