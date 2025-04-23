// 消息状态管理
import { getChatLog, markAsRead, parseImageContent, sendTextMessage } from '@/api/im'
import { defineStore } from 'pinia'
import { showNotify, showToast } from 'vant'

export const useMessageStore = defineStore('message', {
  state: () => ({
    // 消息缓存, 以会话ID为键, 消息数组为值
    messages: {},
    // 加载状态
    loading: {},
    // 是否还有更多消息可加载
    hasMore: {},
    // 最早的消息时间, 用于分页加载
    earliestTimes: {}
  }),
  
  getters: {
    /**
     * 获取指定会话的消息列表
     * @param {string} conversationId 会话ID
     * @returns {Array} 消息列表
     */
    getMessagesById: (state) => (conversationId) => {
      return state.messages[conversationId] || []
    },
    
    /**
     * 获取指定会话的加载状态
     * @param {string} conversationId 会话ID
     * @returns {boolean} 是否加载中
     */
    isLoading: (state) => (conversationId) => {
      return !!state.loading[conversationId]
    },
    
    /**
     * 是否还有更多历史消息可加载
     * @param {string} conversationId 会话ID
     * @returns {boolean} 是否还有更多
     */
    canLoadMoreMessages: (state) => (conversationId) => {
      return !!state.hasMore[conversationId]
    }
  },
  
  actions: {
    /**
     * 显示成功消息
     * @param {string} message 消息内容
     * @param {Object} options 额外选项
     */
    showSuccess(message, options = {}) {
      showNotify({
        type: 'success',
        message: message,
        duration: options.duration || 3000,
        position: 'top',
        ...options
      });
    },
    
    /**
     * 显示错误消息
     * @param {string} message 消息内容
     * @param {Object} options 额外选项
     */
    showError(message, options = {}) {
      showNotify({
        type: 'danger',
        message: message,
        duration: options.duration || 4000,
        position: 'top',
        ...options
      });
    },
    
    /**
     * 显示普通提示
     * @param {string} message 消息内容
     * @param {Object} options 额外选项
     */
    showInfo(message, options = {}) {
      showToast({
        message: message,
        position: 'middle',
        duration: options.duration || 2000,
        ...options
      });
    },
    
    /**
     * 加载聊天记录
     * @param {Object} options 加载选项
     * @param {string} options.conversationId 会话ID
     * @param {number} options.count 消息数量, 默认20
     * @param {boolean} options.refresh 是否刷新
     * @returns {Promise<Array>} 消息列表
     */
    async loadMessages({ conversationId, count = 20, refresh = false }) {
      if (!conversationId) {
        console.error('加载消息失败: 缺少conversationId');
        return [];
      }
      
      // 设置加载状态
      this.loading[conversationId] = true;
      
      try {
        // 确定开始时间和结束时间
        let endTime = Date.now();
        let startTime = 0; // 默认加载所有历史消息
        
        // 如果不是刷新，且有最早的消息时间记录，则从最早的消息时间开始加载更早的消息
        if (!refresh && this.earliestTimes[conversationId]) {
          endTime = this.earliestTimes[conversationId];
        }
        
        console.log('加载聊天记录:', {
          conversationId,
          startSendTime: startTime,
          endSendTime: endTime,
          count
        });
        
        const response = await getChatLog({
          conversationId,
          startSendTime: startTime,
          endSendTime: endTime,
          count
        });
        
        if (response.code === 200 && response.data) {
          let newMessages = [];
          
          // 确保response.data.List存在且是数组
          if (response.data.List && Array.isArray(response.data.List)) {
            newMessages = response.data.List.map(msg => ({
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.sendId,
              receiverId: msg.recvId,
              type: msg.msgType,
              content: msg.msgContent,
              chatType: msg.chatType,
              timestamp: msg.SendTime,
              status: 'received',
              readRecords: msg.readRecords ? JSON.parse(msg.readRecords) : {}
            }));
          }
          
          // 记录最早的消息时间，如果有新消息的话
          if (newMessages.length > 0) {
            const earliestMessage = newMessages[newMessages.length - 1];
            this.earliestTimes[conversationId] = earliestMessage.timestamp;
          }
          
          // 更新是否还有更多消息可加载
          this.hasMore[conversationId] = newMessages.length >= count;
          
          // 确保消息按时间排序（从新到旧）
          newMessages.sort((a, b) => b.timestamp - a.timestamp);
          
          // 处理消息并更新存储
          if (refresh) {
            // 刷新模式: 替换现有消息
            this.messages[conversationId] = newMessages;
          } else {
            // 加载更多模式: 追加到现有消息
            const existingMessages = this.messages[conversationId] || [];
            
            // 创建一个新的消息集合，避免重复
            const messageMap = new Map();
            
            // 添加现有消息
            existingMessages.forEach(msg => {
              messageMap.set(msg.id, msg);
            });
            
            // 添加新消息，避免重复
            newMessages.forEach(msg => {
              if (!messageMap.has(msg.id)) {
                messageMap.set(msg.id, msg);
              }
            });
            
            // 转换回数组并按时间排序
            const mergedMessages = Array.from(messageMap.values());
            mergedMessages.sort((a, b) => b.timestamp - a.timestamp);
            
            this.messages[conversationId] = mergedMessages;
          }
          
          return this.messages[conversationId];
        } else {
          console.error('加载消息失败:', response.message || '未知错误');
          return this.messages[conversationId] || [];
        }
      } catch (error) {
        console.error('加载消息出错:', error);
        return this.messages[conversationId] || [];
      } finally {
        this.loading[conversationId] = false;
      }
    },
    
    /**
     * 处理消息格式
     * @param {Array} messages 原始消息列表
     * @returns {Array} 处理后的消息列表
     */
    processMessages(messages) {
      return messages.map(msg => {
        // 处理不同类型的消息内容
        let processedContent = msg.content;
        
        if (msg.messageType === 1) { // 图片消息
          processedContent = parseImageContent(msg.content)
        }
        
        return {
          ...msg,
          content: processedContent
        }
      })
    },
    
    /**
     * 发送文本消息
     * @param {Object} messageData 消息数据
     * @returns {Promise} 发送结果
     */
    async sendTextMessage(messageData) {
      try {
        // 先添加到本地消息列表(乐观更新)
        const tempMessage = {
          id: `temp_${Date.now()}`,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          messageType: 0, // 文本消息
          sendTime: Date.now(),
          status: 'sending' // 发送中状态
        }
        
        this.addMessage(tempMessage)
        
        // 调用API发送消息
        const response = await sendTextMessage(messageData)
        
        if (response.code === 200) {
          // 更新消息状态为发送成功
          this.updateMessageStatus(tempMessage.id, 'sent', response.data.messageId)
          return response.data
        } else {
          // 更新消息状态为发送失败
          this.updateMessageStatus(tempMessage.id, 'failed')
          throw new Error(response.message || '发送消息失败')
        }
      } catch (error) {
        console.error('发送消息出错:', error)
        throw error
      }
    },
    
    /**
     * 添加消息到存储
     * @param {Object} message 消息对象
     */
    addMessage(message) {
      const { conversationId } = message
      
      if (!conversationId) {
        console.error('添加消息失败: 缺少conversationId')
        return
      }
      
      // 确保消息数组已初始化
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = []
      }
      
      // 添加消息
      this.messages[conversationId].unshift(message)
    },
    
    /**
     * 更新消息状态
     * @param {string} tempId 临时消息ID
     * @param {string} status 消息状态
     * @param {string} newId 新消息ID
     */
    updateMessageStatus(tempId, status, newId = null) {
      // 遍历所有会话
      Object.keys(this.messages).forEach(conversationId => {
        const messages = this.messages[conversationId]
        const index = messages.findIndex(msg => msg.id === tempId)
        
        if (index !== -1) {
          // 更新消息状态
          const updatedMessage = {
            ...messages[index],
            status
          }
          
          // 更新消息ID
          if (newId) {
            updatedMessage.id = newId
          }
          
          // 更新消息数组
          this.messages[conversationId][index] = updatedMessage
        }
      })
    },
    
    /**
     * 标记消息为已读
     * @param {string} conversationId 会话ID
     * @param {Array<string>} messageIds 消息ID列表
     */
    markMessagesAsRead(conversationId, messageIds) {
      if (!conversationId || !messageIds || messageIds.length === 0) {
        return
      }
      
      // 本地更新消息状态
      const messages = this.messages[conversationId] || []
      
      this.messages[conversationId] = messages.map(msg => {
        if (messageIds.includes(msg.id)) {
          return { ...msg, isRead: true }
        }
        return msg
      })
      
      // 调用API标记已读(后台任务)
      markAsRead(conversationId).catch(error => {
        console.error('标记消息已读失败:', error)
      })
    },
    
    /**
     * 删除消息
     * @param {string} conversationId 会话ID
     * @param {string} messageId 消息ID
     */
    deleteMessage(conversationId, messageId) {
      if (!conversationId || !messageId) {
        return
      }
      
      const messages = this.messages[conversationId] || []
      this.messages[conversationId] = messages.filter(msg => msg.id !== messageId)
    },
    
    /**
     * 清空指定会话的消息
     * @param {string} conversationId 会话ID
     */
    clearMessages(conversationId) {
      if (conversationId) {
        this.messages[conversationId] = []
      }
    },
    
    /**
     * 重置状态
     */
    resetState() {
      this.messages = {}
      this.loading = {}
      this.hasMore = {}
      this.earliestTimes = {}
    }
  }
})