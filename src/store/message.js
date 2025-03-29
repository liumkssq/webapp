import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessageStore = defineStore('message', () => {
  // 消息队列
  const messages = ref([])
  
  // 消息ID计数器
  let idCounter = 0
  
  /**
   * 显示消息
   * @param {Object} messageConfig 消息配置
   * @param {string} messageConfig.type 消息类型 'success' | 'error' | 'warning' | 'info'
   * @param {string} messageConfig.content 消息内容
   * @param {number} messageConfig.duration 显示时长(ms)，默认3000ms，设为0则不自动关闭
   * @param {Function} messageConfig.onClose 关闭回调
   * @returns {number} 消息ID
   */
  const showMessage = (messageConfig) => {
    const id = idCounter++
    const { type = 'info', content, duration = 3000, onClose } = messageConfig
    
    // 创建消息对象
    const message = {
      id,
      type,
      content,
      duration,
      onClose,
      visible: true,
      timer: null
    }
    
    // 添加到消息队列
    messages.value.push(message)
    
    // 设置自动关闭
    if (duration > 0) {
      message.timer = setTimeout(() => {
        closeMessage(id)
      }, duration)
    }
    
    return id
  }
  
  /**
   * 关闭指定消息
   * @param {number} id 消息ID
   */
  const closeMessage = (id) => {
    const index = messages.value.findIndex(msg => msg.id === id)
    
    if (index !== -1) {
      const message = messages.value[index]
      
      // 清除计时器
      if (message.timer) {
        clearTimeout(message.timer)
      }
      
      // 标记为不可见
      message.visible = false
      
      // 调用关闭回调
      if (typeof message.onClose === 'function') {
        message.onClose()
      }
      
      // 延迟移除元素，留出动画时间
      setTimeout(() => {
        const removeIndex = messages.value.findIndex(msg => msg.id === id)
        if (removeIndex !== -1) {
          messages.value.splice(removeIndex, 1)
        }
      }, 300)
    }
  }
  
  /**
   * 关闭所有消息
   */
  const closeAllMessages = () => {
    messages.value.forEach(message => {
      if (message.timer) {
        clearTimeout(message.timer)
      }
      
      // 调用关闭回调
      if (typeof message.onClose === 'function') {
        message.onClose()
      }
    })
    
    // 清空消息队列
    messages.value = []
  }
  
  /**
   * 显示成功消息
   * @param {string} content 消息内容
   * @param {number} duration 显示时长
   * @returns {number} 消息ID
   */
  const showSuccess = (content, duration = 3000) => {
    return showMessage({
      type: 'success',
      content,
      duration
    })
  }
  
  /**
   * 显示错误消息
   * @param {string} content 消息内容
   * @param {number} duration 显示时长
   * @returns {number} 消息ID
   */
  const showError = (content, duration = 4000) => {
    return showMessage({
      type: 'error',
      content,
      duration
    })
  }
  
  /**
   * 显示警告消息
   * @param {string} content 消息内容
   * @param {number} duration 显示时长
   * @returns {number} 消息ID
   */
  const showWarning = (content, duration = 3000) => {
    return showMessage({
      type: 'warning',
      content,
      duration
    })
  }
  
  /**
   * 显示信息消息
   * @param {string} content 消息内容
   * @param {number} duration 显示时长
   * @returns {number} 消息ID
   */
  const showInfo = (content, duration = 3000) => {
    return showMessage({
      type: 'info',
      content,
      duration
    })
  }
  
  return {
    messages,
    showMessage,
    closeMessage,
    closeAllMessages,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})