// IM Store - 管理WebSocket连接和消息状态
import { getChatLog, getConversations, markAsRead, sendTextMessage, setUpUserConversation } from '@/api/im'
import { ConnectionState, wsClient } from '@/utils/websocket'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './user'

/**
 * IM Store - 管理WebSocket连接和消息状态
 */
export const useIMStore = defineStore('im', () => {
  // 导入 state
  const userStore = useUserStore();
  
  // 响应式状态
  const connected = ref(false);
  const connecting = ref(false);
  const reconnectCount = ref(0);
  const userId = ref(null);
  const messageQueue = ref([]);
  const activeConversationId = ref(null);
  const conversations = ref([]);
  const messageCache = ref({});
  const onlineUsers = ref(new Set());
  const userLastActive = ref({});
  const loading = ref({
    conversations: false,
    messages: false
  });
  const error = ref(null);
  const connectionState = ref('disconnected');
  
  // 配置常量
  const MAX_RECONNECT_ATTEMPTS = 5;
  const MIN_REQUEST_INTERVAL = 5000; // 最小请求间隔5秒
  const CACHE_LIFETIME = 15000; // 缓存有效期15秒
  
  // 缓存变量
  let isLoadingConversations = false;
  let lastConversationRequestTime = 0;
  let conversationsCache = null;
  let eventListeners = {};
  
  // 计算属性
  const getConversationList = computed(() => conversations.value);
  
  const getConversationById = computed(() => {
    return (id) => conversations.value.find(conv => conv.id === id);
  });
  
  const getMessagesByConversationId = computed(() => {
    return (conversationId) => messageCache.value[conversationId] || [];
  });
  
  const getCurrentConversation = computed(() => {
    if (!activeConversationId.value) return null;
    return conversations.value.find(conv => conv.id === activeConversationId.value);
  });
  
  const getTotalUnreadCount = computed(() => {
    return conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  });
  
  const isUserOnline = computed(() => {
    return (userId) => onlineUsers.value.has(userId);
  });
  
  // 方法
  
  // 设置当前活跃会话
  function setCurrentConversation(conversationId) {
    activeConversationId.value = conversationId;
  }
  
  // 添加在线用户
  function addOnlineUser(userId) {
    onlineUsers.value.add(userId);
    // 更新用户最后活跃时间
    userLastActive.value[userId] = new Date().toISOString();
  }
  
  // 更新用户最后活跃时间
  function updateUserLastActive(userId) {
    userLastActive.value[userId] = new Date().toISOString();
  }
  
  // 获取用户最后活跃时间
  function getUserLastActiveTime(userId) {
    return userLastActive.value[userId];
  }
  
  // 移除在线用户
  function removeOnlineUser(userId) {
    onlineUsers.value.delete(userId);
  }
  
  // 设置会话列表
  function setConversations(newConversations) {
    conversations.value = newConversations;
  }
  
  // 添加会话
  function addConversation(conversation) {
    // 检查会话是否已存在
    const index = conversations.value.findIndex(c => c.id === conversation.id);
    if (index !== -1) {
      // 更新已有会话
      conversations.value[index] = { ...conversations.value[index], ...conversation };
    } else {
      // 添加新会话
      conversations.value.push(conversation);
    }
  }
  
  // 移除会话
  function removeConversation(conversationId) {
    conversations.value = conversations.value.filter(c => c.id !== conversationId);
    // 清除缓存的消息
    delete messageCache.value[conversationId];
  }
  
  // 更新会话最后一条消息
  function updateConversationLastMessage(conversationId, message) {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations.value[index].lastMessage = {
        content: message.content,
        type: message.type,
        timestamp: message.timestamp
      };
    }
  }
  
  // 增加会话未读计数
  function incrementUnreadCount(conversationId) {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      if (!conversations.value[index].unreadCount) {
        conversations.value[index].unreadCount = 0;
      }
      conversations.value[index].unreadCount++;
    }
  }
  
  // 标记会话为已读
  function markConversationAsRead(conversationId) {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations.value[index].unreadCount = 0;
      // 调用API标记为已读
      markAsRead(conversationId).catch(error => {
        console.error('标记会话已读失败:', error);
      });
    }
  }
  
  // 清空会话未读计数
  function resetConversationUnread(conversationId) {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations.value[index].unreadCount = 0;
    }
  }
  
  // 更新会话消息缓存
  function updateMessageCache(conversationId, messages) {
    messageCache.value[conversationId] = [...messages];
  }
  
  // 添加消息到缓存
  function addMessageToCache(conversationId, message) {
    if (!messageCache.value[conversationId]) {
      messageCache.value[conversationId] = [];
    }
    
    // 检查消息是否已存在
    const existingIndex = messageCache.value[conversationId].findIndex(m => m.id === message.id);
    if (existingIndex !== -1) {
      // 更新已有消息
      messageCache.value[conversationId][existingIndex] = { ...message };
    } else {
      // 添加新消息
      messageCache.value[conversationId].push({ ...message });
      // 如果消息不是来自当前用户且当前会话不是活跃会话，增加未读计数
      if (!message.isSelf && activeConversationId.value !== conversationId) {
        incrementUnreadCount(conversationId);
      }
    }
    
    // 更新会话最后一条消息
    updateConversationLastMessage(conversationId, message);
    
    // 触发新消息事件
    emit('new_message', message);
  }
  
  // 删除消息
  function deleteMessage(conversationId, messageId) {
    if (!messageCache.value[conversationId]) return;
    
    // 从缓存移除消息
    messageCache.value[conversationId] = messageCache.value[conversationId].filter(m => m.id !== messageId);
    
    // 如果还有消息，更新会话最后一条消息
    if (messageCache.value[conversationId].length > 0) {
      const lastMessage = messageCache.value[conversationId][messageCache.value[conversationId].length - 1];
      updateConversationLastMessage(conversationId, lastMessage);
    }
  }
  
  // 撤回消息
  function recallMessage(conversationId, messageId) {
    if (!messageCache.value[conversationId]) return;
    
    // 找到要撤回的消息
    const messageIndex = messageCache.value[conversationId].findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      // 修改消息内容为"消息已撤回"
      messageCache.value[conversationId][messageIndex] = {
        ...messageCache.value[conversationId][messageIndex],
        content: '消息已撤回',
        type: 'recall',
        recalled: true
      };
      
      // 更新会话最后一条消息
      const lastMessageIndex = messageCache.value[conversationId].length - 1;
      if (messageIndex === lastMessageIndex) {
        updateConversationLastMessage(conversationId, messageCache.value[conversationId][messageIndex]);
      }
    }
  }
  
  // 更新消息状态
  function updateMessageStatus(conversationId, messageId, status) {
    if (!messageCache.value[conversationId]) return;
    
    const messageIndex = messageCache.value[conversationId].findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messageCache.value[conversationId][messageIndex].status = status;
    }
  }
  
  // 重发消息
  async function resendMessage(message) {
    const { conversationId, id, content, type } = message;
    
    // 更新消息状态为发送中
    updateMessageStatus(conversationId, id, 'sending');
    
    try {
      // 根据消息类型构建发送参数
      const params = {
        conversationId,
        senderId: userStore.userInfo.id,
        receiverId: message.receiverId,
        content: content,
        messageType: type,
        chatType: 2 // 默认为单聊
      };
      
      // 发送消息
      let result;
      if (type === 'text') {
        result = await sendTextMessage(params);
      } else if (type === 'image') {
        result = await sendImageMessage(params);
      } else {
        throw new Error('不支持的消息类型');
      }
      
      // 更新消息状态
      if (result.code === 200) {
        updateMessageStatus(conversationId, id, 'sent');
        return result;
      } else {
        throw new Error(result.message || '发送失败');
      }
    } catch (error) {
      console.error('重发消息失败:', error);
      updateMessageStatus(conversationId, id, 'failed');
      throw error;
    }
  }
  
  // 发送消息到会话
  async function sendMessageToConversation(messageData) {
    const { conversationId, content, type = 'text', receiverId } = messageData;
    
    // 验证必要参数
    if (!content || !receiverId) {
      throw new Error('发送消息缺少必要参数');
    }
    
    // 检查会话ID是否存在，如果不存在需要创建会话
    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const newConversation = await createConversation(receiverId);
      targetConversationId = newConversation.id;
    }
    
    // 创建本地消息对象
    const localMessage = {
      id: Date.now().toString(),
      conversationId: targetConversationId,
      senderId: userStore.userInfo.id,
      receiverId: receiverId,
      content: content,
      type: type,
      timestamp: Date.now(),
      status: 'sending',
      isSelf: true
    };
    
    // 添加到消息缓存
    addMessageToCache(targetConversationId, localMessage);
    
    // 发送消息
    try {
      const params = {
        conversationId: targetConversationId,
        senderId: userStore.userInfo.id,
        receiverId: receiverId,
        content: content,
        messageType: type,
        chatType: 2 // 默认为单聊
      };
      
      let result;
      if (type === 'text') {
        result = await sendTextMessage(params);
      } else if (type === 'image') {
        result = await sendImageMessage(params);
      } else {
        throw new Error('不支持的消息类型');
      }
    
    // 更新消息状态
      if (result.code === 200) {
        updateMessageStatus(targetConversationId, localMessage.id, 'sent');
        
        // 如果是新创建的会话，可能需要返回服务器生成的消息ID
        if (result.data && result.data.msgId) {
          localMessage.serverId = result.data.msgId;
        }
        
        return localMessage;
    } else {
        throw new Error(result.message || '发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      updateMessageStatus(targetConversationId, localMessage.id, 'failed');
      throw error;
    }
  }
  
  // 加载更多消息
  async function loadMoreMessages(conversationId, options = {}) {
    const { refresh = false, page = 1, pageSize = 20 } = options;
    
    if (!conversationId) {
      throw new Error('会话ID不能为空');
    }
    
    loading.value.messages = true;
    error.value = null;
    
    try {
      const params = {
        conversationId,
        page,
        pageSize
      };
      
      const response = await getChatLog(params);
      
      if (response.code === 200 && response.data) {
        const chatMessages = response.data.list || [];
        
        // 格式化消息
        const formattedMessages = chatMessages.map(msg => ({
          id: msg.msgId,
          conversationId: msg.conversationId || conversationId,
          senderId: msg.sendId,
          receiverId: msg.recvId,
          content: msg.content,
          type: msg.mType || 'text',
          timestamp: msg.sendTime,
          status: 'sent',
          isSelf: msg.sendId === userStore.userInfo.id,
          readRecords: msg.readRecords || {}
        }));
        
        // 更新消息缓存
        if (refresh) {
          updateMessageCache(conversationId, formattedMessages);
        } else {
          // 将新消息添加到现有缓存
          const existingMessages = messageCache.value[conversationId] || [];
          const newMessages = [...formattedMessages, ...existingMessages];
          // 确保消息没有重复
          const uniqueMessages = Array.from(
            new Map(newMessages.map(msg => [msg.id, msg])).values()
          );
          updateMessageCache(conversationId, uniqueMessages);
        }
        
        return {
          messages: formattedMessages,
          hasMore: formattedMessages.length === pageSize,
          total: response.data.total || 0
        };
      } else {
        throw new Error(response.message || '获取消息失败');
      }
    } catch (err) {
      console.error('加载消息失败:', err);
      error.value = err.message || '加载消息失败';
      throw err;
    } finally {
      loading.value.messages = false;
    }
  }
  
  // 创建会话
  async function createConversation(targetUserId, chatType = 2) {
    if (!targetUserId) {
      throw new Error('目标用户ID不能为空');
    }
    
    error.value = null;
    
    try {
      const data = {
        sendId: userStore.userInfo.id,
        recvId: targetUserId,
        chatType
      };
      
      const response = await setUpUserConversation(data);
      
      if (response.code === 200 && response.data) {
        const newConversation = {
          id: response.data.conversationId,
          targetId: targetUserId,
          type: chatType === 1 ? 'group' : 'private',
          chatType: chatType,
          unreadCount: 0,
          targetInfo: {
            id: targetUserId,
            name: response.data.targetName || `用户${targetUserId}`,
            avatar: response.data.targetAvatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=user${targetUserId}`
          },
          lastMessage: {
            content: '开始对话',
            type: 'text',
            timestamp: Date.now()
          }
        };
        
        // 添加到会话列表
        addConversation(newConversation);
        
        return newConversation;
      } else {
        throw new Error(response.message || '创建会话失败');
      }
    } catch (err) {
      console.error('创建会话失败:', err);
      error.value = err.message || '创建会话失败';
      throw err;
    }
  }
  
  // 获取会话列表
  async function fetchConversations() {
    // 如果已经在加载，不再重复请求
    if (isLoadingConversations) {
      return;
    }
    
    // 检查请求频率限制
    const now = Date.now();
    if (now - lastConversationRequestTime < MIN_REQUEST_INTERVAL && conversationsCache) {
      console.log('使用缓存的会话列表数据');
      return conversationsCache;
    }
    
    isLoadingConversations = true;
    loading.value.conversations = true;
    error.value = null;
    
    try {
      const response = await getConversations();
      lastConversationRequestTime = Date.now();
      
      // 检查响应
      if (!response.userId || !response.conversationList) {
        throw new Error(response.message || '获取会话列表失败');
      }
      
      const result = processConversationsResponse(response);
      conversationsCache = result;
      
      // 缓存过期后清除
      setTimeout(() => {
        conversationsCache = null;
      }, CACHE_LIFETIME);
      
      return result;
    } catch (err) {
      console.error('获取会话列表失败:', err);
      error.value = err.message || '获取会话列表失败';
      throw err;
    } finally {
      isLoadingConversations = false;
      loading.value.conversations = false;
    }
  }
  
  // 处理会话列表响应
  function processConversationsResponse(response) {
    // TODO: 实现该函数以处理服务器返回的会话数据
    // 这个函数应该将服务器返回的数据转换为应用所需的格式
    return [];
  }
  
  // 设置WebSocket连接状态
  function setConnectionState(state) {
    connectionState.value = state;
    connected.value = state === 'connected';
    connecting.value = state === 'connecting' || state === 'reconnecting';
  }
  
  // 注册事件监听器
  function on(eventName, callback) {
    if (!eventListeners[eventName]) {
      eventListeners[eventName] = [];
    }
    eventListeners[eventName].push(callback);
  }
  
  // 移除事件监听器
  function off(eventName, callback) {
    if (eventListeners[eventName]) {
      eventListeners[eventName] = eventListeners[eventName].filter(cb => cb !== callback);
    }
  }
  
  // 触发事件
  function emit(eventName, data) {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach(callback => callback(data));
    }
  }
  
  // 设置WebSocket消息监听
  function setupWebSocketListeners() {
    const handleConnectionChange = (state) => {
      // 转换WebSocket连接状态
      switch (state) {
        case ConnectionState.CONNECTED:
          setConnectionState('connected');
          break;
        case ConnectionState.CONNECTING:
          setConnectionState('connecting');
          break;
        case ConnectionState.RECONNECTING:
          setConnectionState('reconnecting');
          break;
        case ConnectionState.DISCONNECTED:
          setConnectionState('disconnected');
          break;
      }
    };
    
    const handleMessage = (message) => {
      console.log('收到WebSocket消息:', message);
      
      // 处理推送消息
      if (message.method === 'push' && message.data) {
        const { conversationId, sendId, recvId, content, 
                mType, msgId, sendTime, contentType } = message.data;
        
        // 如果是聊天消息
        if (contentType === 0) {
          const chatMessage = {
            id: msgId,
            conversationId: conversationId,
            senderId: sendId,
            receiverId: recvId,
            content: content,
            type: mType,
            timestamp: sendTime,
            status: 'received',
            isSelf: sendId === userStore.userInfo.id
          };
          
          // 添加到消息缓存
          addMessageToCache(conversationId, chatMessage);
        }
        // 如果是已读回执
        else if (contentType === 1 && msgId) {
          // 更新消息的已读状态
          if (messageCache.value[conversationId]) {
            const messageIndex = messageCache.value[conversationId].findIndex(msg => msg.id === msgId);
            if (messageIndex !== -1) {
              messageCache.value[conversationId][messageIndex].readRecords = 
                { ...messageCache.value[conversationId][messageIndex].readRecords, ...message.data.readRecords };
            }
          }
        }
      }
    };
    
    // 添加WebSocket监听器
    wsClient.addListener({
      onStateChange: handleConnectionChange,
      onMessage: handleMessage,
      onError: (error) => {
        console.error('WebSocket错误:', error);
        emit('ws_error', error);
      }
    });
  }
  
  // 初始化WebSocket连接
  function initWebSocket() {
    // 如果用户已登录但WebSocket未连接，则连接
    if (userStore.isLoggedIn && !wsClient.isConnected()) {
      wsClient.connect();
    }
    
    // 设置WebSocket监听器
    setupWebSocketListeners();
  }
  
  // 初始化
  function init() {
    // 初始化WebSocket
    initWebSocket();
    
    // 设置用户ID
    userId.value = userStore.userInfo?.id;
    
    // 加载会话列表
    if (userStore.isLoggedIn) {
      fetchConversations()
        .then(result => {
          if (result && result.length > 0) {
            conversations.value = result;
          }
        })
        .catch(err => {
          console.error('加载会话列表失败:', err);
        });
    }
  }
  
  // 初始化
  init();
  
  // 确保WebSocket连接并发送消息
  const ensureWebSocketAndSendMessage = async (message) => {
    if (!wsClient) {
      console.error('WebSocket客户端未初始化');
      return { error: { message: 'WebSocket客户端未初始化' } };
    }

    // 检查连接状态
    if (!wsClient.isConnected()) {
      console.log('WebSocket未连接，尝试连接...');
      try {
        await wsClient.connect();
        console.log('WebSocket连接成功');
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        return { error: { message: '无法连接到消息服务器' } };
      }
    }

    // 返回一个Promise以便异步等待消息响应
    return new Promise((resolve) => {
      wsClient.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  // 发送聊天消息的方法
  const sendChatMessage = async (conversationId, recvId, chatType, messageType, content) => {
    // 输入验证
    if (!conversationId) {
      console.error('发送消息错误: conversationId不能为空');
      return {
        success: false,
        error: { message: 'conversationId不能为空' }
      };
    }
    
    if (!recvId) {
      console.error('发送消息错误: recvId不能为空');
      return {
        success: false,
        error: { message: 'recvId不能为空' }
      };
    }
    
    // chatType必须是数字类型
    if (typeof chatType !== 'number') {
      console.warn('chatType不是数字类型，尝试转换...');
      chatType = chatType === 'group' ? 1 : 2; // 1=群聊, 2=单聊
    }
    
    // 获取当前用户ID
    const currentUserId = userStore.userInfo.id.toString();
    if (!currentUserId) {
      console.error('发送消息错误: 用户未登录');
      return {
        success: false,
        error: { message: '用户未登录' }
      };
    }
    
    // 生成临时消息ID
    const messageId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 构建WebSocket消息
    const message = {
      frameType: 0, // 数据帧
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      method: 'conversation.chat', // 必须匹配后端路由
      data: {
        conversationId: conversationId,
        chatType: chatType, // 确保是数字: 1=群聊, 2=单聊
        sendId: currentUserId,
        recvId: recvId,
        sendTime: Date.now(),
        msg: {
          msgId: messageId,
          mType: messageType, // 消息类型: 0=文本, 1=图片, 2=语音, 等
          content: content
        }
      }
    };
    
    console.log('发送聊天消息:', JSON.stringify(message, null, 2));
    
    // 直接视为发送成功，不等待响应
    wsClient.sendMessage(message);
    
    return {
      success: true,
      messageId
    };
  }
  
  return {
    // 状态
    connected,
    connecting,
    activeConversationId,
    conversations,
    loading,
    error,
    connectionState,
    
    // 计算属性
    getConversationList,
    getConversationById,
    getMessagesByConversationId,
    getCurrentConversation,
    getTotalUnreadCount,
    isUserOnline,
    
    // 方法
    setCurrentConversation,
    addOnlineUser,
    updateUserLastActive,
    getUserLastActiveTime,
    removeOnlineUser,
    setConversations,
    addConversation,
    removeConversation,
    updateConversationLastMessage,
    incrementUnreadCount,
    markConversationAsRead,
    resetConversationUnread,
    updateMessageCache,
    addMessageToCache,
    deleteMessage,
    recallMessage,
    updateMessageStatus,
    resendMessage,
    sendMessageToConversation,
    loadMoreMessages,
    createConversation,
    fetchConversations,
    on,
    off,
    ensureWebSocketAndSendMessage,
    sendChatMessage
  };
});