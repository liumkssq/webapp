// WebSocket客户端工具类
import { wsActions } from '@/api/im'
import { useConversationStore } from '@/store/conversation'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'
import { getRandomId } from '@/utils/common'

// WebSocket帧类型
export const FrameType = {
  DATA: 0,      // 数据帧
  HEARTBEAT: 1, // 心跳帧
  ACK: 2,       // 确认帧
  NO_ACK: 3,    // 无需确认帧
  ERROR: 9      // 错误帧
}

// WebSocket连接状态
export const ConnectionState = {
  CONNECTING: 0,
  CONNECTED: 1,
  RECONNECTING: 2,
  DISCONNECTED: 3
}

// 声明并初始化变量，用于存储单例
let wsClientInstance = null;

/**
 * 获取WebSocket客户端单例
 * @returns {Object} WebSocket客户端实例
 */
export function getWsClient() {
  if (!wsClientInstance) {
    wsClientInstance = createWebSocketClient();
  }
  return wsClientInstance;
}

// 导出实例，方便直接使用
export const wsClient = getWsClient();

/**
 * 创建WebSocket客户端实例
 * @returns {Object} WebSocket客户端实例
 */
function createWebSocketClient() {
  // WebSocket实例
  let ws = null;
  
  // 计时器
  let heartbeatTimer = null;
  let reconnectTimer = null;
  
  // 状态变量
  let messageCallbacks = {};
  let listeners = [];
  // 向下兼容旧消息处理方式
  let messageHandlers = {};
  let connectionState = ConnectionState.DISCONNECTED;
  let waitingForPong = false;
  let reconnectAttempts = 0;
  
  // 配置参数
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;
  const HEARTBEAT_INTERVAL = 15000;
  const PONG_TIMEOUT = 10000;
  
  /**
   * 获取WebSocket服务器URL
   */
  function getServerUrl() {
    // 优先使用环境变量中的WebSocket URL
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    
    // 回退到默认地址
    return 'ws://127.0.0.1:10090/ws';
  }
  
  /**
   * 获取认证Token
   * @returns {string|null} 认证Token或null
   */
  function getAuthToken() {
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        console.warn('未找到认证Token，无法进行WebSocket认证');
        return null;
      }
      
      // 清除引号和空格
      token = token.replace(/['"]/g, '').trim();
      
      // 请确保Token有效
      if (token.length < 10) {
        console.warn('Token似乎无效（长度过短）:', token);
        return null;
      }
      
      console.log('获取到有效Token:', token.substring(0, 15) + '...');
      return token;
    } catch (error) {
      console.error('获取Token时发生错误:', error);
      return null;
    }
  }
  
  /**
   * 设置连接状态并触发状态变更事件
   */
  function setConnectionState(state) {
    if (connectionState !== state) {
      connectionState = state;
      listeners.forEach(listener => {
        if (typeof listener.onStateChange === 'function') {
          listener.onStateChange(state);
        }
      });
    }
  }
  
  /**
   * 建立WebSocket连接
   * @returns {Promise<boolean>} 连接成功返回true，失败返回false
   */
  async function connect() {
    // 防止重复连接
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已经连接，无需重新连接');
      return true;
    }
    
    // 获取认证Token
    const token = getAuthToken();
    if (!token) {
      console.error('无法连接WebSocket: 缺少有效的认证Token');
      setConnectionState(ConnectionState.DISCONNECTED);
      _notifyListeners('error', { code: 'AUTH_ERROR', message: '认证失败：未找到有效Token' });
      return false;
    }
    
    try {
      console.log(`正在连接WebSocket服务器: ${getServerUrl()}, 使用token认证`);
      // 使用token作为Sec-WebSocket-Protocol (子协议)
      // 这是WebSocket规范中推荐的认证方式
      ws = new WebSocket(getServerUrl(), [token]);
      
      return new Promise((resolve) => {
        // 连接成功
        ws.onopen = () => {
          console.log('WebSocket连接成功');
          setConnectionState(ConnectionState.CONNECTED);
          // 发送上线消息
          sendOnlineMessage();
          resolve(true);
        };
        
        // 连接错误
        ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          setConnectionState(ConnectionState.DISCONNECTED);
          
          // 通知所有监听器
          listeners.forEach(listener => {
            if (typeof listener.onError === 'function') {
              listener.onError(error);
            }
          });
          
          resolve(false);
        };
        
        // 连接关闭
        ws.onclose = (event) => {
          console.log(`WebSocket连接关闭: 代码=${event.code}, 原因=${event.reason || '未知原因'}`);
          setConnectionState(ConnectionState.DISCONNECTED);
          
          // 通知所有监听器
          listeners.forEach(listener => {
            if (typeof listener.onClose === 'function') {
              listener.onClose(event);
      }
          });
          
          // 如果不是正常关闭，则尝试重连
          if (event.code !== 1000) {
            // 1006表示异常关闭，可能是认证问题
            if (event.code === 1006) {
              console.warn('WebSocket异常关闭，可能是认证问题，尝试重新获取token...');
              // 尝试刷新token或通知用户重新登录
            }
            reconnect();
          }
        };
        
        // 接收消息
        ws.onmessage = (event) => {
          try {
            _handleMessage(event.data);
          } catch (error) {
            console.error('处理WebSocket消息出错:', error);
          }
        };
        
        // 设置连接超时
        setTimeout(() => {
          if (ws && ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket连接超时');
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('创建WebSocket连接时出错:', error);
      setConnectionState(ConnectionState.DISCONNECTED);
      _notifyListeners('error', { code: 'CONNECTION_ERROR', message: '连接错误: ' + error.message });
      return false;
    }
  }
  
  /**
   * 重新连接
   */
  function reconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('WebSocket重连已达最大尝试次数');
      setConnectionState(ConnectionState.DISCONNECTED);
      return;
    }

    setConnectionState(ConnectionState.RECONNECTING);
    reconnectAttempts++;
    
    const backoffTime = RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts - 1);
    console.log(`WebSocket尝试第${reconnectAttempts}次重连，将在${backoffTime}ms后...`);

    reconnectTimer = setTimeout(() => {
      connect();
    }, backoffTime);
  }
  
  /**
   * 处理WebSocket收到消息事件
   */
  function _handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('收到WebSocket消息:', message);
      
      // 直接处理标准消息格式（content字段在顶层）
      if (message.msgId && message.conversationId && message.content) {
        // 这是已经格式正确的消息，直接处理
        handlePushMessage(message);
        return;
      }
      
      // 处理仅包含formId和data的消息格式（直接推送消息）
      if (message.formId && message.data) {
        // 简化，直接查找Content字段（不区分大小写）
        const content = message.data.Content || message.data.content;
        if (content) {
          // 构建一个标准消息格式
          const pushMessage = {
            msgId: message.data.MsgId || message.data.msgId,
            conversationId: message.data.ConversationId || message.data.conversationId,
            chatType: message.data.ChatType || message.data.chatType,
            mType: message.data.MType || message.data.mType,
            content: content, // 提取的内容
            sendTime: message.data.SendTime || message.data.sendTime,
            contentType: 0 // 设为聊天消息类型
          };
          
          // 调用处理push消息的函数
          handlePushMessage(pushMessage);
        }
        
        // 通知所有监听器（保持原有逻辑）
        listeners.forEach(listener => {
          if (typeof listener.onMessage === 'function') {
            listener.onMessage(message);
          }
        });
        
        return;
      }
      
      // 处理错误消息
      if (message.data && typeof message.data === 'string' && message.data.includes('不具备访问权限')) {
        console.error('WebSocket认证失败:', message.data);
        // 通知认证失败
        listeners.forEach(listener => {
          if (typeof listener.onError === 'function') {
            listener.onError(new Error(`认证失败: ${message.data}`));
          }
        });
        
        // 关闭连接，触发重新登录流程
        if (ws) {
          ws.close(3000, '认证失败');
        }
        return;
      }
      
      // 处理心跳响应
      if (message.method === 'pong') {
        handlePong();
        return;
      }
      
      // 处理回调
      if (message.id && messageCallbacks[message.id]) {
        // 调用回调并移除
        const callback = messageCallbacks[message.id];
        delete messageCallbacks[message.id];
          callback(message);
        
        // 如果是响应消息，不需要继续处理
        if (message.reply === true) {
          return;
        }
      }
      
      // 处理不同类型的消息
      if (message.method) {
        // 分发消息到特定处理器
        dispatchMessageByMethod(message);
      } else if (message.type) {
        // 兼容旧版API使用type而非method的情况
        dispatchMessageByType(message);
      } else {
        console.warn('收到未知格式的消息，无法处理:', message);
        }
        
        // 通知所有监听器
        listeners.forEach(listener => {
          if (typeof listener.onMessage === 'function') {
            listener.onMessage(message);
          }
        });
    } catch (error) {
      console.error('解析或处理WebSocket消息错误:', error, data);
    }
  }
  
  /**
   * 按method分发消息到对应处理器
   */
  function dispatchMessageByMethod(message) {
    const method = message.method;
    
    // 常见的消息类型处理
    switch (method) {
      case 'conversation.chat':
        // 接收到聊天消息
        handleChatMessage(message);
        break;
        
      case 'conversation.mark_chat':
        // 处理已读回执
        handleReadReceipt(message);
        break;
        
      case 'user.online':
        // 用户上线通知
        handleUserOnline(message);
        break;
        
      case 'user.offline':
        // 用户离线通知
        handleUserOffline(message);
        break;
        
      case 'conversation.typing':
        // 正在输入状态
        handleTypingStatus(message);
        break;
        
      case 'conversation.recall':
        // 消息撤回
        handleMessageRecall(message);
        break;
        
      case 'error':
        // 错误消息
        handleErrorMessage(message);
        break;
        
      default:
        console.log(`未处理的消息类型: ${method}`, message);
        // 尝试将消息分发到注册的处理器
        if (messageHandlers[method] && typeof messageHandlers[method] === 'function') {
          messageHandlers[method](message);
        }
    }
  }
  
  /**
   * 发送消息到WebSocket服务器
   */
  function sendMessage(message, callback) {
    // 确保WebSocket已连接
    if (!isConnected()) {
      console.warn('WebSocket未连接，尝试重新连接');
      
      // 存储消息以便连接后发送
      const msg = message;
      
      // 尝试连接
      connect()
        .then(() => {
          console.log('WebSocket重连成功，继续发送消息');
          // 连接成功后发送消息
          _sendMessageInternal(msg, callback);
        })
        .catch(error => {
          console.error('WebSocket重连失败:', error);
          // 通知发送失败
          if (callback) {
            callback({
              error: {
                code: 'CONNECTION_ERROR',
                message: '消息发送失败: 无法连接到服务器'
              }
            });
          }
        });
      
      return;
    }
    
    return _sendMessageInternal(message, callback);
  }
  
  /**
   * 内部发送消息实现
   */
  function _sendMessageInternal(message, callback) {
    try {
      // 确保message是对象
      let messageObj = message;
      if (typeof message === 'string') {
        try {
          messageObj = JSON.parse(message);
        } catch (e) {
          // 不是JSON字符串，可能是普通字符串消息
          messageObj = { content: message };
        }
      }
      
      // 确保有ID
      if (!messageObj.id) {
        messageObj.id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      }
      
      // 确保有method
      if (!messageObj.method && !messageObj.type) {
        console.warn('消息缺少method字段', messageObj);
        messageObj.method = 'message.send'; // 默认消息方法
      }
      
      // 存储回调
      if (callback) {
        messageCallbacks[messageObj.id] = callback;
        
        // 设置超时处理
        setTimeout(() => {
          if (messageCallbacks[messageObj.id]) {
            console.warn(`消息 ${messageObj.id} 超时未收到响应`);
            messageCallbacks[messageObj.id]({
              error: {
                code: 'TIMEOUT',
                message: '服务器响应超时'
              }
            });
            delete messageCallbacks[messageObj.id];
          }
        }, 15000); // 15秒超时
      }
      
      // 发送消息
      const messageJson = JSON.stringify(messageObj);
      console.log(`发送WebSocket消息 [${messageObj.id}]: ${messageJson.length > 200 ? messageJson.substring(0, 200) + '...' : messageJson}`);
      ws.send(messageJson);
      
      return messageObj.id; // 返回消息ID用于跟踪
    } catch (error) {
      console.error('发送消息出错:', error);
      
      // 通知发送失败
      if (callback) {
        callback({
          error: {
            code: 'SEND_ERROR',
            message: error.message || '发送消息失败'
          }
        });
      }
      
      return null;
    }
  }
  
  /**
   * 发送确认消息
   */
  function sendAck(messageId) {
    if (!isConnected() || !messageId) {
      return;
    }
    
    // 构建ACK消息
    const ackMessage = {
      frameType: FrameType.ACK,
      id: messageId
    };
    
    try {
      ws.send(JSON.stringify(ackMessage));
    } catch (error) {
      console.error('发送ACK消息错误:', error);
    }
  }
  
  /**
   * 发送心跳包
   */
  function sendHeartbeat() {
    if (!isConnected()) {
      return;
    }
    
    // 如果上一个心跳没有收到响应，可能连接已断开
    if (waitingForPong) {
      console.warn('未收到上一次心跳响应，可能连接已断开');
      ws.close(4000, '心跳超时'); // 4000为自定义关闭代码
      return;
    }
    
    // 发送心跳包
    const heartbeatMessage = {
      frameType: FrameType.HEARTBEAT,
      id: getRandomId()
    };
    
    try {
      waitingForPong = true;
      ws.send(JSON.stringify(heartbeatMessage));
      
      // 设置心跳响应超时
      setTimeout(() => {
        if (waitingForPong) {
          console.warn('心跳响应超时');
          ws.close(4001, '心跳响应超时'); // 4001为自定义关闭代码
        }
      }, PONG_TIMEOUT);
    } catch (error) {
      console.error('发送心跳包错误:', error);
    }
  }
  
  /**
   * 启动心跳机制
   */
  function startHeartbeat() {
    stopHeartbeat(); // 确保先停止之前的心跳
    
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }
  
  /**
   * 停止心跳机制
   */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    waitingForPong = false;
  }
  
  /**
   * 检查WebSocket是否已连接
   */
  function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN && connectionState === ConnectionState.CONNECTED;
  }
  
  /**
   * 发送上线消息
   */
  function sendOnlineMessage() {
    if (!isConnected()) {
      console.warn('WebSocket未连接，无法发送上线消息');
      return;
    }
    
    // 获取用户信息
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      console.warn('用户未登录，不发送上线消息');
      return;
    }
    
    console.log('准备发送上线消息');
    
    try {
    // 构建上线消息
    const onlineMessage = {
      frameType: FrameType.DATA,
        id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      method: wsActions.USER_ONLINE,
      data: {
        userId: userStore.userId,
        device: navigator.userAgent,
        status: 'online',
        timestamp: Date.now()
      }
    };
    
      console.log('发送上线消息:', onlineMessage);
      
      // 发送上线消息
      sendMessage(onlineMessage, (response) => {
        console.log('上线消息响应:', response);
        
        if (response.error) {
          console.error('上线消息发送失败:', response.error);
        } else {
          console.log('上线消息发送成功');
        }
      });
    } catch (error) {
      console.error('发送上线消息错误:', error);
    }
  }
  
  /**
   * 处理服务器推送的消息
   */
  function handlePushMessage(message) {
    if (!message) return;
    
    const conversationStore = useConversationStore();
    const messageStore = useMessageStore();
    
    console.log('处理PUSH消息:', message);
    
    // 确保必要字段存在
    const msgId = message.msgId || message.MsgId;
    const conversationId = message.conversationId || message.ConversationId;
    const sendId = message.sendId || message.SendId || '1'; // 默认系统ID
    const recvId = message.recvId || message.RecvId || '';
    const content = message.content || message.Content || '';
    const mType = message.mType !== undefined ? message.mType : (message.MType !== undefined ? message.MType : 0);
    const sendTime = message.sendTime || message.SendTime || Date.now();
    const contentType = message.contentType !== undefined ? message.contentType : 0;
    
    // 处理消息类型
    switch (contentType) {
      case 0: // 聊天消息
        // 格式化并存储消息
        const formattedMessage = {
          id: msgId,
          conversationId: conversationId,
          senderId: sendId,
          receiverId: recvId,
          type: mType,
          content: content,
          timestamp: sendTime,
          status: 'received'
        };
        
        // 向下兼容原有逻辑
        messageStore.addMessage(formattedMessage);
        
        // 更新会话最后一条消息
        conversationStore.updateConversation({
          id: conversationId,
          lastMessage: formattedMessage,
          unreadCount: conversation => (conversation.unreadCount || 0) + 1,
          lastActiveTime: sendTime
        });
        break;
        
      case 1: // 已读回执
        if (message.msgIds && message.msgIds.length > 0) {
          // 更新消息状态为已读
          messageStore.updateMessageStatus(message.msgIds, 'read');
        }
        break;
        
      default:
        console.warn('未知的消息类型:', contentType);
        break;
    }
  }
  
  /**
   * 发送聊天消息
   * @param {Object} data 消息数据
   * @param {Function} callback 回调函数
   */
  function sendChatMessage(data, callback) {
    console.log('WebSocket sendChatMessage 被调用:', data);
    
    if (!isConnected()) {
      console.error('发送消息失败：WebSocket未连接');
      if (callback) callback({ error: 'WebSocket未连接' });
      
      // 尝试重新连接
      connect().then(() => {
        console.log('WebSocket重连成功，重新发送消息');
        // 重连成功后再次尝试发送
        setTimeout(() => sendChatMessage(data, callback), 1000);
      }).catch(err => {
        console.error('WebSocket重连失败:', err);
      });
      
      return null;
    }
    
    if (!data.conversationId || !data.recvId) {
      console.error('发送消息失败：缺少必要参数');
      if (callback) callback({ error: '缺少必要参数' });
      return null;
    }
    
    // 获取用户信息
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      console.error('发送消息失败：用户未登录');
      if (callback) callback({ error: '用户未登录' });
      return null;
    }
    
    // 如果已经是完整消息格式，直接发送
    if (data.frameType !== undefined && data.method !== undefined) {
      // 为conversation.chat方法不等待响应
      if (data.method === wsActions.CONVERSATION_CHAT) {
        // 发送消息但不等待响应
        ws.send(JSON.stringify(data));
        
        // 立即返回成功
        if (callback) {
          callback({ success: true });
        }
        
        // 本地更新消息状态
        const messageStore = useMessageStore();
        const msgId = data.data?.msg?.msgId;
        if (msgId) {
          messageStore.updateMessageStatus([msgId], 'sent');
        }
        
        return data.id;
      }
      
      return sendMessage(data, callback);
    }
    
    // 使用conversation.chat方法发送消息
    const messageData = {
      conversationId: data.conversationId,
      chatType: data.chatType || 2, // 默认为单聊
      sendId: userStore.userId.toString(),
      recvId: data.recvId.toString(),
      sendTime: Date.now(),
      msg: {
        msgId: data.msgId || `msg_${getRandomId()}`,
        mType: data.type || 0, // 默认为文本
        content: data.content
      }
    };
    
    // 构建WebSocket消息
    const wsMessage = {
      frameType: FrameType.DATA,
      id: getRandomId(),
      method: wsActions.CONVERSATION_CHAT,
      data: messageData
    };
    
    // 直接发送消息，不等待响应
    ws.send(JSON.stringify(wsMessage));
    
    // 立即返回成功
    if (callback) {
      callback({ success: true });
    }
    
    // 本地更新消息状态
    const messageStore = useMessageStore();
    messageStore.updateMessageStatus([messageData.msg.msgId], 'sent');
    
    return wsMessage.id;
  }
  
  /**
   * 标记消息已读
   * @param {Object} data 标记已读数据
   * @param {Function} callback 回调函数
   */
  function markMessageRead(data, callback) {
    if (!data.conversationId) {
      console.error('标记已读失败：缺少必要参数');
      if (callback) callback({ error: '缺少必要参数' });
      return null;
    }
    
    // 获取用户信息
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      console.error('标记已读失败：用户未登录');
      if (callback) callback({ error: '用户未登录' });
      return null;
    }
    
    // 使用conversation.markChat方法标记已读
    const markReadData = {
      chatType: data.chatType || 2, // 默认为单聊
      conversationId: data.conversationId,
      recvId: data.recvId || userStore.userId.toString(),
      msgIds: data.msgIds || [] // 如果不指定消息ID，则标记该会话所有消息为已读
    };
    
    // 发送WebSocket消息
    return sendMessage(FrameType.DATA, wsActions.CONVERSATION_MARK_CHAT, markReadData, callback);
  }
  
  /**
   * 注册消息处理器（旧式接口，向下兼容）
   */
  function addMessageHandler(method, handler) {
    if (method && typeof handler === 'function') {
      messageHandlers[method] = handler;
    }
  }
  
  /**
   * 移除消息处理器（旧式接口，向下兼容）
   */
  function removeMessageHandler(method) {
    if (method && messageHandlers[method]) {
      delete messageHandlers[method];
    }
  }
  
  // 返回公共接口
  return {
    // 连接管理
    connect,
    close: () => {
      if (ws) {
        ws.close();
      }
    },
    reconnect,
    isConnected,
    
    // 消息发送
    sendMessage,
    sendChatMessage,
    markMessageRead,
    
    // 事件监听
    addListener: (listener) => {
      listeners.push(listener);
      return () => removeListener(listener);
    },
    removeListener: (listener) => {
      const index = listeners.findIndex(l => l === listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    },
    
    // 旧式消息处理器（向下兼容）
    addMessageHandler,
    removeMessageHandler,
    
    // 获取当前状态
    getState: () => connectionState
  };
}

