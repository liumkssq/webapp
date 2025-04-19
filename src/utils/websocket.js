// WebSocket客户端工具类
import { formatChatMessage, formatMarkReadMessage, wsActions } from '@/api/im'
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
    // 直接返回固定地址，不添加任何参数
    return 'ws://127.0.0.1:10090/ws';
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
   * 连接WebSocket服务器
   */
  function connect() {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    setConnectionState(ConnectionState.CONNECTING);
    
    const url = getServerUrl();
    
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    
    console.log('准备连接WebSocket:', url);

    try {
      // 正确创建WebSocket连接，使用token作为protocol
      if (token) {
        console.log('使用token作为Sec-WebSocket-Protocol头');
        // WebSocket构造函数第二个参数是protocols，可以是字符串或字符串数组
        ws = new WebSocket(url, token);
      } else {
        console.log('未找到token，建立无协议WebSocket连接');
        ws = new WebSocket(url);
      }

      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onerror = handleError;
      ws.onclose = handleClose;
    } catch (error) {
      console.error('WebSocket连接错误:', error);
      handleError(error);
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
   * 处理WebSocket连接成功事件
   */
  function handleOpen() {
    console.log('WebSocket已连接');
    setConnectionState(ConnectionState.CONNECTED);
    reconnectAttempts = 0;
    startHeartbeat();
    
    // 广播通知监听器
    listeners.forEach(listener => {
      if (typeof listener.onOpen === 'function') {
        listener.onOpen();
      }
    });
    
    // 连接成功后发送上线消息
    sendOnlineMessage();
  }
  
  /**
   * 处理WebSocket收到消息事件
   */
  function handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('收到WebSocket消息:', message);
      
      // 处理心跳响应
      if (message.frameType === FrameType.HEARTBEAT) {
        waitingForPong = false;
        return;
      }
      
      // 处理确认帧
      if (message.frameType === FrameType.ACK && message.id) {
        const callback = messageCallbacks[message.id];
        if (callback) {
          callback(message);
          delete messageCallbacks[message.id];
        }
      }
      
      // 处理错误帧
      if (message.frameType === FrameType.ERROR) {
        console.error('WebSocket错误:', message);
        listeners.forEach(listener => {
          if (typeof listener.onError === 'function') {
            listener.onError(message);
          }
        });
        return;
      }
      
      // 处理业务消息
      if (message.frameType === FrameType.DATA || message.frameType === FrameType.NO_ACK) {
        // 接收到服务器推送的消息
        if (message.method === wsActions.PUSH) {
          handlePushMessage(message.data);
        }
        
        // 通知所有监听器
        listeners.forEach(listener => {
          if (typeof listener.onMessage === 'function') {
            listener.onMessage(message);
          }
        });
        
        // 处理旧式消息处理器 - 向下兼容
        if (message.method && messageHandlers[message.method]) {
          messageHandlers[message.method](message);
        }
        
        // 对需要确认的消息发送ACK
        if (message.frameType === FrameType.DATA && message.id) {
          sendAck(message.id);
        }
      }
    } catch (error) {
      console.error('解析WebSocket消息错误:', error, event.data);
    }
  }
  
  /**
   * 处理WebSocket错误事件
   */
  function handleError(event) {
    console.error('WebSocket错误:', event);
    listeners.forEach(listener => {
      if (typeof listener.onError === 'function') {
        listener.onError(event);
      }
    });
  }
  
  /**
   * 处理WebSocket关闭事件
   */
  function handleClose(event) {
    console.log('WebSocket已关闭, 代码:', event.code, '原因:', event.reason);
    
    stopHeartbeat();
    
    // 通知所有监听器
    listeners.forEach(listener => {
      if (typeof listener.onClose === 'function') {
        listener.onClose(event);
      }
    });
    
    // 如果不是正常关闭，则尝试重连
    if (event.code !== 1000) {
      reconnect();
    } else {
      setConnectionState(ConnectionState.DISCONNECTED);
    }
  }
  
  /**
   * 注册消息监听器
   */
  function addListener(listener) {
    if (!listeners.includes(listener)) {
      listeners.push(listener);
    }
  }
  
  /**
   * 移除消息监听器
   */
  function removeListener(listener) {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * 发送消息
   */
  function sendMessage(frameType, method, data, callback) {
    if (!isConnected()) {
      console.error('WebSocket未连接，无法发送消息');
      return null;
    }

    const messageId = getRandomId();
    const message = {
      frameType,
      id: messageId,
      method,
      data
    };

    try {
      ws.send(JSON.stringify(message));
      
      // 如果是需要确认的消息，注册回调函数
      if (frameType === FrameType.DATA && callback) {
        messageCallbacks[messageId] = callback;
      }
      
      return messageId;
    } catch (error) {
      console.error('发送WebSocket消息错误:', error);
      return null;
    }
  }
  
  /**
   * 发送确认帧(ACK)
   */
  function sendAck(messageId) {
    const message = {
      frameType: FrameType.ACK,
      id: messageId
    };
    
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('发送ACK错误:', error);
    }
  }
  
  /**
   * 发送心跳包
   */
  function sendHeartbeat() {
    if (!isConnected()) {
      return;
    }
    
    const message = {
      frameType: FrameType.HEARTBEAT,
      id: getRandomId()
    };
    
    try {
      ws.send(JSON.stringify(message));
      waitingForPong = true;
      
      // 设置超时检测
      setTimeout(() => {
        if (waitingForPong) {
          console.error('心跳包超时未响应，准备重连');
          ws.close(4000, 'Heartbeat timeout');
        }
      }, PONG_TIMEOUT);
    } catch (error) {
      console.error('发送心跳包错误:', error);
    }
  }
  
  /**
   * 开启心跳检测
   */
  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }
  
  /**
   * 停止心跳检测
   */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }
  
  /**
   * 关闭WebSocket连接
   */
  function close() {
    stopHeartbeat();
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (ws) {
      ws.close(1000, 'Normal closure');
      ws = null;
    }
    
    setConnectionState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * 检查WebSocket是否已连接
   */
  function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * 发送上线消息
   */
  function sendOnlineMessage() {
    const userStore = useUserStore();
    const userId = userStore.getUserId;
    
    sendMessage(FrameType.DATA, wsActions.USER_ONLINE, { userId }, response => {
      console.log('用户上线消息已确认:', response);
    });
  }
  
  /**
   * 处理服务器推送的消息
   */
  function handlePushMessage(message) {
    // 处理聊天消息
    if (message && message.type === 'chatMessage') {
      handleChatMessage(message.data);
    }
  }
  
  /**
   * 处理推送的聊天消息
   */
  function handleChatMessage(messageData) {
    const messageStore = useMessageStore();
    const conversationStore = useConversationStore();
    
    if (messageData) {
      // 更新消息存储
      messageStore.addMessage(messageData.conversationId, messageData);
      
      // 更新会话的最后一条消息
      conversationStore.updateConversationLastMessage(
        messageData.conversationId, 
        messageData
      );
    }
  }
  
  /**
   * 发送聊天消息
   */
  function sendChatMessage(data, callback) {
    const formattedData = formatChatMessage(data);
    return sendMessage(FrameType.DATA, wsActions.CONVERSATION_CHAT, formattedData, callback);
  }
  
  /**
   * 标记消息已读
   */
  function markMessageRead(data, callback) {
    const formattedData = formatMarkReadMessage(data);
    return sendMessage(FrameType.DATA, wsActions.CONVERSATION_MARK_CHAT, formattedData, callback);
  }
  
  /**
   * 添加消息处理函数 (向下兼容旧API)
   * @param {string} method 消息类型
   * @param {Function} handler 处理函数
   */
  function addMessageHandler(method, handler) {
    console.warn('addMessageHandler方法已废弃，请使用addListener代替');
    if (typeof handler === 'function') {
      messageHandlers[method] = handler;
    }
  }
  
  /**
   * 移除消息处理函数 (向下兼容旧API)
   * @param {string} method 消息类型
   */
  function removeMessageHandler(method) {
    console.warn('removeMessageHandler方法已废弃，请使用removeListener代替');
    if (messageHandlers[method]) {
      delete messageHandlers[method];
    }
  }
  
  // 返回客户端接口
  return {
    connect,
    close,
    addListener,
    removeListener,
    sendChatMessage,
    markMessageRead,
    isConnected: isConnected,
    // 向下兼容的方法
    addMessageHandler,
    removeMessageHandler
  };
}

// 导出一个已经初始化好的实例，别名为wsClient
export const wsClient = getWsClient();

