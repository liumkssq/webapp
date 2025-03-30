/**
 * WebSocket连接管理工具
 * 负责管理WebSocket连接，处理消息发送、接收和断线重连
 * 参考 LumenIM 项目实现
 */

import { useUserStore } from '@/store/user'
import { useIMStore } from '@/store/im'
import { LRUCache } from 'lru-cache'

// 消息缓存，避免重复处理
const messageCache = new LRUCache({
  max: 10000,
  ttl: 3 * 60 * 1000 // 过期时间3分钟
})

/**
 * WebSocket客户端封装
 * 提供自动重连、心跳检测和消息缓存功能
 */
export class WebSocketClient {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.url - WebSocket服务器URL
   * @param {Object} [options.params] - 连接参数，会被转换成URL参数
   * @param {Function} [options.onOpen] - 连接成功回调
   * @param {Function} [options.onClose] - 连接关闭回调
   * @param {Function} [options.onError] - 错误回调
   * @param {Function} [options.onMessage] - 消息回调
   * @param {boolean} [options.autoReconnect=true] - 是否自动重连
   * @param {number} [options.reconnectInterval=2000] - 重连间隔（毫秒）
   * @param {number} [options.maxReconnectAttempts=10] - 最大重连次数，-1表示无限重连
   * @param {boolean} [options.debug=false] - 是否开启调试日志
   */
  constructor(options) {
    this.url = options.url;
    this.params = options.params || {};
    this.onOpen = options.onOpen || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onError = options.onError || (() => {});
    this.onMessage = options.onMessage || (() => {});
    
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 2000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.debug = options.debug || false;
    
    this.ws = null;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.isConnected = false;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 30000; // 30秒发送一次心跳
    this.lastMessageTime = 0;
  }
  
  /**
   * 生成完整的WebSocket URL，包含参数
   * @returns {string} 完整的WebSocket URL
   * @private
   */
  _buildUrl() {
    const url = new URL(this.url);
    
    // 添加参数
    Object.keys(this.params).forEach(key => {
      url.searchParams.append(key, this.params[key]);
    });
    
    return url.toString();
  }
  
  /**
   * 建立WebSocket连接
   * @returns {Promise<void>} 连接结果
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected) {
        this._log('已经连接，无需重新建立连接');
        resolve();
        return;
      }
      
      try {
        const url = this._buildUrl();
        this._log(`正在连接WebSocket: ${url}`);
        
        this.ws = new WebSocket(url);
        
        // 设置二进制类型
        this.ws.binaryType = 'arraybuffer';
        
        // 连接成功
        this.ws.onopen = (event) => {
          this._log('WebSocket连接成功');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 处理消息队列
          this._processMessageQueue();
          
          // 启动心跳
          this._startHeartbeat();
          
          // 调用回调
          this.onOpen(event);
          
          resolve();
        };
        
        // 接收消息
        this.ws.onmessage = (event) => {
          this.lastMessageTime = Date.now();
          
          // 解析消息
          let message = event.data;
          
          try {
            // 如果是心跳应答，不传递给业务层
            if (message === 'pong') {
              this._log('收到心跳响应: pong');
              return;
            }
            
            // 调用回调
            this.onMessage(message);
          } catch (error) {
            this._log('处理消息出错', error);
          }
        };
        
        // 连接关闭
        this.ws.onclose = (event) => {
          this._log(`WebSocket连接关闭: code=${event.code}, reason=${event.reason}`);
          this.isConnected = false;
          
          // 清除心跳定时器
          this._stopHeartbeat();
          
          // 调用回调
          this.onClose(event);
          
          // 自动重连
          if (this.autoReconnect && !this.reconnecting) {
            this._reconnect();
          }
        };
        
        // 连接错误
        this.ws.onerror = (error) => {
          this._log('WebSocket连接错误', error);
          
          // 调用回调
          this.onError(error);
          
          reject(error);
        };
      } catch (error) {
        this._log('创建WebSocket连接失败', error);
        
        // 调用回调
        this.onError(error);
        
        reject(error);
      }
    });
  }
  
  /**
   * 重连WebSocket
   * @private
   */
  _reconnect() {
    if (this.reconnecting) return;
    
    this.reconnecting = true;
    
    // 超过最大重连次数
    if (this.maxReconnectAttempts !== -1 && this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._log(`超过最大重连次数(${this.maxReconnectAttempts})，不再重连`);
      this.reconnecting = false;
      return;
    }
    
    // 指数退避，重连间隔随着重连次数增加而增加
    const delay = Math.min(
      30000, // 最大30秒
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts)
    );
    
    this._log(`${delay}ms后将尝试第${this.reconnectAttempts + 1}次重连...`);
    
    setTimeout(() => {
      if (this.ws) {
        // 确保旧的连接已关闭
        try {
          this.ws.close();
        } catch (e) {
          // 忽略错误
        }
      }
      
      this.reconnectAttempts++;
      
      this.connect()
        .then(() => {
          this._log('重连成功');
          this.reconnecting = false;
        })
        .catch(() => {
          this._log('重连失败');
          this.reconnecting = false;
          this._reconnect();
        });
    }, delay);
  }
  
  /**
   * 启动心跳检测
   * @private
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    
    this.lastMessageTime = Date.now();
    
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected) {
        this._stopHeartbeat();
        return;
      }
      
      // 发送心跳
      this.send('ping');
      this._log('发送心跳: ping');
      
      // 检查是否长时间没有收到消息
      const now = Date.now();
      if (now - this.lastMessageTime > this.heartbeatInterval * 2) {
        this._log('长时间没有收到消息，断开重连');
        this.disconnect();
        this._reconnect();
      }
    }, this.heartbeatInterval);
  }
  
  /**
   * 停止心跳检测
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * 发送消息
   * @param {string|Object} message - 要发送的消息
   * @returns {boolean} 是否发送成功
   */
  send(message) {
    if (!message) return false;
    
    // 将对象转换为JSON字符串
    let data = typeof message === 'object' ? JSON.stringify(message) : message;
    
    // 如果连接已建立，直接发送
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
        return true;
      } catch (error) {
        this._log('发送消息出错', error);
        this.messageQueue.push(data);
        return false;
      }
    } else {
      // 如果连接未建立，加入队列
      this._log('连接未建立，消息加入队列');
      this.messageQueue.push(data);
      
      // 尝试建立连接
      if (!this.isConnected && !this.reconnecting) {
        this.connect().catch(() => {
          this._log('自动建立连接失败');
        });
      }
      
      return false;
    }
  }
  
  /**
   * 处理消息队列
   * @private
   */
  _processMessageQueue() {
    if (this.messageQueue.length === 0) return;
    
    this._log(`处理消息队列，共${this.messageQueue.length}条消息`);
    
    // 复制队列并清空原队列
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    // 发送队列中的消息
    queue.forEach(message => {
      try {
        this.ws.send(message);
      } catch (error) {
        this._log('发送队列消息出错', error);
        this.messageQueue.push(message);
      }
    });
  }
  
  /**
   * 断开WebSocket连接
   * @returns {Promise<void>} 断开结果
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.ws) {
        resolve();
        return;
      }
      
      // 停止心跳
      this._stopHeartbeat();
      
      this.isConnected = false;
      this.autoReconnect = false; // 禁止自动重连
      
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.onclose = () => {
            this._log('主动断开WebSocket连接');
            resolve();
          };
          
          this.ws.close();
        } else {
          resolve();
        }
      } catch (error) {
        this._log('断开WebSocket连接出错', error);
        resolve();
      } finally {
        this.ws = null;
      }
    });
  }
  
  /**
   * 日志输出
   * @param {string} message - 日志消息
   * @param {any} [data] - 额外数据
   * @private
   */
  _log(message, data) {
    if (!this.debug) return;
    
    const time = new Date().toISOString();
    const prefix = `[WebSocket ${time}]`;
    
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
}

/**
 * 默认的WebSocket实例
 */
let defaultInstance = null;

/**
 * 获取默认的WebSocket实例
 * @returns {WebSocketClient|null} WebSocket实例
 */
export function getWebSocketClient() {
  return defaultInstance;
}

/**
 * 设置默认的WebSocket实例
 * @param {WebSocketClient} instance - WebSocket实例
 */
export function setWebSocketClient(instance) {
  defaultInstance = instance;
}

/**
 * 创建WebSocket客户端
 * @param {Object} options - 配置选项
 * @returns {WebSocketClient} WebSocket客户端实例
 */
export function createWebSocketClient(options) {
  const client = new WebSocketClient(options);
  setWebSocketClient(client);
  return client;
}