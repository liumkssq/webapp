// IM Store - 管理WebSocket连接和消息状态
import { getWebSocketUrl } from '@/api/im'
import { getToken } from '@/utils/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocialStore } from './social'

/**
 * IM Store - 管理WebSocket连接和消息状态
 */
export const useIMStore = defineStore('im', () => {
  // 获取社交状态
  const socialStore = useSocialStore()
  
  // WebSocket连接
  const ws = ref(null)
  const connected = ref(false)
  const connecting = ref(false)
  const reconnectCount = ref(0)
  const maxReconnectAttempts = 5
  const userId = ref(null)
  
  // 消息队列 - 当WebSocket未连接时缓存消息
  const messageQueue = ref([])
  
  // 当前会话
  const activeConversationId = ref(null)
  
  // 会话列表
  const conversations = ref([])
  
  // 消息缓存 - 对于每个会话，存储消息
  const messageCache = ref({})
  
  // 添加请求状态跟踪
  let isLoadingConversations = false;
  let lastConversationRequestTime = 0;
  const MIN_REQUEST_INTERVAL = 5000; // 最小请求间隔5秒
  // 添加请求结果缓存
  let conversationsCache = null;
  const CACHE_LIFETIME = 15000; // 缓存有效期15秒
  
  // 创建WebSocket连接
  const initWebSocket = (currentUserId) => {
    // 记录调试信息
    console.log(`尝试初始化WebSocket连接，userId: ${currentUserId}, 当前状态：已连接=${connected.value}, 正在连接=${connecting.value}`);
    
    // 如果已经连接或正在连接，返回
    if (connected.value || connecting.value) {
      console.log('WebSocket已经连接或正在连接中，跳过初始化');
      return;
    }
    
    try {
      // 设置用户ID
      userId.value = currentUserId;
      connecting.value = true;
      
      // 创建WebSocket连接
      const wsUrl = getWebSocketUrl(currentUserId);
      console.log(`获取WebSocket URL: ${wsUrl}`);
      const token = getToken();
      console.log(`获取用户token: ${token ? '有效' : '无效'}`);
      
      // 传递token作为websocket协议
      if (token) {
        console.log('使用token建立WebSocket连接');
        ws.value = new WebSocket(wsUrl, [token]);
      } else {
        console.log('未找到token，使用无协议方式连接');
        ws.value = new WebSocket(wsUrl);
      }
      
      // 连接打开
      ws.value.onopen = () => {
        console.log('WebSocket连接已建立');
        connected.value = true;
        connecting.value = false;
        reconnectCount.value = 0;
        
        // 发送在线状态
        sendOnlineStatus();
        
        // 发送队列中的消息
        processPendingMessages();
      }
      
      // 接收消息
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('收到WebSocket消息:', data);
          handleIncomingMessage(data);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      }
      
      // 连接关闭
      ws.value.onclose = (event) => {
        console.log(`WebSocket连接已关闭，代码: ${event.code}, 原因: ${event.reason}`);
        connected.value = false;
        connecting.value = false;
        
        // 尝试重新连接
        if (reconnectCount.value < maxReconnectAttempts) {
          // 增加重连计数并使用指数退避算法
          const delay = Math.min(1000 * Math.pow(2, reconnectCount.value), 30000);
          console.log(`WebSocket将在${delay}ms后尝试第${reconnectCount.value + 1}次重连`);
          setTimeout(() => {
            reconnectCount.value++;
            initWebSocket(userId.value);
          }, delay);
        } else {
          console.warn(`WebSocket重连已达最大次数${maxReconnectAttempts}，停止尝试`);
        }
      }
      
      // 连接错误
      ws.value.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        connecting.value = false;
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      connecting.value = false;
    }
  }
  
  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (ws.value && (connected.value || connecting.value)) {
      ws.value.close();
      ws.value = null;
      connected.value = false;
      connecting.value = false;
    }
  }
  
  // 发送在线状态
  const sendOnlineStatus = () => {
    if (!connected.value || !ws.value) return false;
    
    try {
      const message = {
        frameType: 0,
        id: String(Date.now()),
        method: "user.online",
        data: {
          userId: userId.value
        }
      }
      
      ws.value.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送在线状态失败:', error);
      return false;
    }
  }
  
  // 发送聊天消息
  const sendChatMessage = (conversationId, receiverId, message) => {
    if (!userId.value) return false;
    
    // 分析conversationId获取chatType
    const isGroup = conversationId.startsWith('group_');
    const chatType = isGroup ? 1 : 2; // 1:群聊 2:单聊
    
    const chatMessage = {
      frameType: 0,
      id: String(Date.now()),
      method: "conversation.chat",
      data: {
        conversationId: conversationId,
        chatType: chatType,
        sendId: userId.value,
        recvId: receiverId,
        msg: {
          mType: message.type === 'text' ? 0 : 1, // 0:文本 1:图片 等
          content: message.content
        }
      }
    }
    
    // 如果WebSocket已连接，直接发送
    if (connected.value && ws.value) {
      try {
        ws.value.send(JSON.stringify(chatMessage));
        return true;
      } catch (error) {
        console.error('发送消息失败:', error);
        // 发送失败，加入队列
        messageQueue.value.push(chatMessage);
        return false;
      }
    } else {
      // WebSocket未连接，加入队列
      messageQueue.value.push(chatMessage);
      return false;
    }
  }
  
  // 处理发送队列中的消息
  const processPendingMessages = () => {
    if (!connected.value || !ws.value || messageQueue.value.length === 0) return;
    
    // 复制队列并清空原队列
    const pendingMessages = [...messageQueue.value];
    messageQueue.value = [];
    
    // 发送所有待发送消息
    pendingMessages.forEach(message => {
      try {
        ws.value.send(JSON.stringify(message));
      } catch (error) {
        console.error('发送队列消息失败:', error);
        // 发送失败，重新加入队列
        messageQueue.value.push(message);
      }
    });
  }
  
  // 处理收到的消息
  const handleIncomingMessage = (data) => {
    if (!data || !data.method) return
    
    console.log('收到WebSocket消息:', data)
    
    switch (data.method) {
      case 'conversation.chat':
        // 处理新聊天消息
        handlePushMessage(data)
        break
      case 'user.status.changed':
        // 处理用户状态变化消息
        handleUserStatusChange(data)
        break
      case 'friend.request':
        // 处理好友申请消息
        handleFriendRequest(data)
        break
      case 'friend.request.accepted':
        // 处理好友申请被接受
        handleFriendRequestAccepted(data)
        break
      case 'group.request':
        // 处理入群申请
        handleGroupRequest(data)
        break
      case 'group.request.accepted':
        // 处理入群申请被接受
        handleGroupRequestAccepted(data)
        break
      default:
        console.log('未知的WebSocket消息类型:', data.method)
    }
  }
  
  // 处理推送消息
  const handlePushMessage = (data) => {
    // 确保消息数据有效
    if (!data.data || !data.data.msg) return
    
    const { conversationId, sendId, recvId, msg } = data.data
    
    if (!conversationId) {
      console.error('推送消息缺少conversationId')
      return
    }
    
    // 构建标准消息对象
    const message = {
      id: data.id || Date.now().toString(),
      senderId: sendId,
      receiverId: recvId,
      type: msg.mType === 0 ? 'text' : 'image', // 简化处理
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
      status: 'received',
      isFromSelf: sendId === userId.value
    }
    
    // 添加消息到缓存
    addMessageToCache(conversationId, message)
    
    // 更新会话
    updateConversationWithMessage(message)
  }
  
  // 处理用户状态变化
  const handleUserStatusChange = (data) => {
    if (!data.data || !data.data.userId) return
    
    const { userId: targetUserId, online } = data.data
    
    // 使用社交store更新用户在线状态
    socialStore.updateOnlineStatus(targetUserId, online)
  }
  
  // 处理好友申请
  const handleFriendRequest = (data) => {
    if (!data.data) return
    
    // 重新加载好友申请列表
    socialStore.loadFriendRequests()
  }
  
  // 处理好友申请被接受
  const handleFriendRequestAccepted = (data) => {
    if (!data.data || !data.data.userId) return
    
    const { userId: friendId, info } = data.data
    
    // 添加好友到列表
    if (info) {
      socialStore.addFriend(info)
    } else {
      // 如果没有提供好友信息，重新加载好友列表
      socialStore.loadFriendList()
    }
  }
  
  // 处理入群申请
  const handleGroupRequest = (data) => {
    if (!data.data) return
    
    // 重新加载群组申请列表
    socialStore.loadGroupRequests()
  }
  
  // 处理入群申请被接受
  const handleGroupRequestAccepted = (data) => {
    if (!data.data || !data.data.groupId) return
    
    const { groupId, info } = data.data
    
    // 添加群组到列表
    if (info) {
      socialStore.addGroup(info)
    } else {
      // 如果没有提供群组信息，重新加载群组列表
      socialStore.loadGroupList()
    }
  }
  
  // 更新会话消息
  const updateConversationWithMessage = (message) => {
    // 查找会话
    const conversationId = message.conversationId || `${message.isFromSelf ? 'private_' + message.receiverId : 'private_' + message.senderId}`
    
    let conversation = conversations.value.find(c => c.id === conversationId)
    
    if (conversation) {
      // 更新现有会话
      conversation.lastMessage = {
        content: message.content,
        type: message.type,
        timestamp: message.timestamp
      }
      
      // 如果不是当前活跃会话，增加未读计数
      if (conversationId !== activeConversationId.value && !message.isFromSelf) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1
      }
    } else {
      // 创建新会话
      const isGroup = conversationId.startsWith('group_')
      const targetId = isGroup 
        ? conversationId.replace('group_', '')
        : (message.isFromSelf ? message.receiverId : message.senderId)
      
      conversation = {
        id: conversationId,
        type: isGroup ? 'group' : 'private',
        targetId: targetId,
        unreadCount: message.isFromSelf ? 0 : 1,
        lastMessage: {
          content: message.content,
          type: message.type,
          timestamp: message.timestamp
        },
        // 临时目标信息，稍后应该从用户服务获取
        targetInfo: {
          id: targetId,
          name: `用户${targetId}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${targetId}`
        }
      }
      
      conversations.value.push(conversation)
    }
  }
  
  // 添加消息到缓存
  const addMessageToCache = (conversationId, message) => {
    if (!messageCache.value[conversationId]) {
      messageCache.value[conversationId] = []
    }
    
    messageCache.value[conversationId].push(message)
  }
  
  // 会话标记为已读
  const readConversation = (conversationId) => {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.unreadCount = 0
    }
  }
  
  // 检查用户在线状态
  const isUserOnline = (userId) => {
    // 通过社交store检查用户在线状态
    const status = socialStore.onlineStatus[userId]
    return status ? status.online : false
  }
  
  // 设置当前活跃会话
  const setCurrentConversation = (conversation) => {
    if (!conversation) return
    
    activeConversationId.value = conversation.id
    
    // 标记为已读
    readConversation(conversation.id)
  }
  
  // 加载更多消息
  const loadMoreMessages = async (conversationId, beforeTime) => {
    console.log('加载更多消息', conversationId, beforeTime)
    // 这里应该发起API请求获取历史消息
    // 然后添加到messageCache中
    
    // 目前仅返回缓存中的消息
    return messageCache.value[conversationId] || []
  }
  
  // 发送消息到会话
  const sendMessageToConversation = async (messageData) => {
    console.log('发送消息到会话', messageData)
    
    const { conversationId, receiverId, content, type = 'text' } = messageData
    
    if (!conversationId || !content) {
      console.error('发送消息缺少必要参数')
      return false
    }
    
    // 创建标准消息对象
    const message = {
      id: Date.now().toString(),
      senderId: userId.value,
      receiverId,
      conversationId,
      content,
      type,
      timestamp: Date.now(),
      status: 'sending',
      isFromSelf: true
    }
    
    // 添加消息到缓存
    addMessageToCache(conversationId, message)
    
    // 更新会话
    updateConversationWithMessage(message)
    
    // 通过WebSocket发送消息
    const success = sendChatMessage(conversationId, receiverId, {
      type,
      content
    })
    
    // 更新消息状态
    if (success) {
      message.status = 'sent'
    } else {
      message.status = 'failed'
    }
    
    return success
  }
  
  // 设置会话列表
  const setConversations = (newConversations) => {
    conversations.value = newConversations
  }
  
  /**
   * 获取用户会话列表
   */
  const fetchConversations = async () => {
    // 检查时间间隔
    const now = Date.now();
    
    // 如果有缓存且在缓存有效期内，直接返回缓存结果
    if (conversationsCache && now - lastConversationRequestTime < CACHE_LIFETIME) {
      console.log('使用缓存的会话列表数据');
      return;
    }
    
    // 防止重复请求
    if (isLoadingConversations) {
      console.log('已有会话列表请求正在进行中，跳过此次请求');
      return;
    }
    
    // 检查最小请求间隔
    if (now - lastConversationRequestTime < MIN_REQUEST_INTERVAL) {
      console.log(`请求间隔过短(${now - lastConversationRequestTime}ms)，跳过此次请求`);
      return;
    }
    
    try {
      isLoadingConversations = true;
      lastConversationRequestTime = now;
      
      console.log('开始获取会话列表...');
      const response = await getConversations();
      
      if (response.code === 200 && response.data) {
        // 更新缓存
        conversationsCache = response;
        
        // 验证响应数据格式
        if (!response.data.userId) {
          console.error('会话列表响应缺少userId字段', response.data);
          return;
        }
        
        const { userId, conversationList } = response.data;
        
        // 格式化会话数据
        const formattedConversations = [];
        if (conversationList && typeof conversationList === 'object') {
          Object.keys(conversationList).forEach(key => {
            const conversation = conversationList[key];
            if (conversation && conversation.conversationId) {
              formattedConversations.push({
                id: conversation.conversationId,
                type: conversation.ChatType === 1 ? 'group' : 'private',
                unreadCount: conversation.unreadCount || 0,
                lastMessage: conversation.lastMessage || null,
                isShow: conversation.isShow !== false,
                timestamp: conversation.updateTime || Date.now()
              });
            }
          });
        }
        
        // 更新state
        conversations.value = formattedConversations;
        console.log('会话列表获取成功', formattedConversations);
      } else {
        console.error('获取会话列表失败', response.message || '未知错误');
      }
    } catch (error) {
      console.error('获取会话列表出错', error);
    } finally {
      isLoadingConversations = false;
    }
  };
  
  return {
    // 状态
    connected,
    connecting,
    userId,
    conversations,
    messageCache,
    activeConversationId,
    
    // 方法
    initWebSocket,
    closeWebSocket,
    sendChatMessage,
    sendMessageToConversation,
    setCurrentConversation,
    readConversation,
    loadMoreMessages,
    setConversations,
    isUserOnline,
    fetchConversations
  }
})