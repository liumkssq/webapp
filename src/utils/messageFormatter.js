/**
 * 消息格式化工具
 * 用于处理IM消息的格式化、类型判断和展示
 */

/**
 * 消息类型枚举
 */
export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  LOCATION: 'location',
  AUDIO: 'audio',
  VIDEO: 'video',
  SYSTEM: 'system',
  NOTIFICATION: 'notification',
  RECALL: 'recall'
}

/**
 * 消息状态枚举
 */
export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
}

/**
 * 格式化消息时间
 * @param {string|number|Date} timestamp - 时间戳或日期对象
 * @param {boolean} [showDetail=false] - 是否显示详细时间
 * @returns {string} 格式化后的时间字符串
 */
export function formatMessageTime(timestamp, showDetail = false) {
  if (!timestamp) return ''
  
  const messageDate = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const now = new Date()
  
  // 判断时间是否有效
  if (isNaN(messageDate.getTime())) {
    return '时间未知'
  }
  
  // 获取日期部分
  const year = messageDate.getFullYear()
  const month = messageDate.getMonth() + 1
  const day = messageDate.getDate()
  const hours = messageDate.getHours()
  const minutes = messageDate.getMinutes()
  
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  const nowDay = now.getDate()
  
  // 格式化数字为两位
  const formatNumber = num => num.toString().padStart(2, '0')
  
  // 详细时间格式
  const timeStr = `${formatNumber(hours)}:${formatNumber(minutes)}`
  
  // 如果需要显示详细时间，则直接返回完整格式
  if (showDetail) {
    return `${year}-${formatNumber(month)}-${formatNumber(day)} ${timeStr}`
  }
  
  // 今天的消息只显示时间
  if (year === nowYear && month === nowMonth && day === nowDay) {
    return timeStr
  }
  
  // 昨天的消息显示"昨天+时间"
  const yesterday = new Date(now)
  yesterday.setDate(nowDay - 1)
  if (year === yesterday.getFullYear() && month === yesterday.getMonth() + 1 && day === yesterday.getDate()) {
    return `昨天 ${timeStr}`
  }
  
  // 一周内的消息显示"星期几+时间"
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const dayDiff = (now - messageDate) / (1000 * 60 * 60 * 24)
  if (dayDiff < 7) {
    return `星期${weekDays[messageDate.getDay()]} ${timeStr}`
  }
  
  // 今年的消息显示"月-日 时:分"
  if (year === nowYear) {
    return `${formatNumber(month)}-${formatNumber(day)} ${timeStr}`
  }
  
  // 其他时间显示完整日期
  return `${year}-${formatNumber(month)}-${formatNumber(day)} ${timeStr}`
}

/**
 * 判断是否需要显示时间分隔线
 * @param {Object} currentMsg - 当前消息
 * @param {Object} prevMsg - 上一条消息
 * @param {number} timeThreshold - 时间阈值（分钟），默认5分钟
 * @returns {boolean} 是否需要显示时间分隔线
 */
export function shouldShowTimeDivider(currentMsg, prevMsg, timeThreshold = 5) {
  if (!prevMsg || !currentMsg) return true
  
  const currentTime = new Date(currentMsg.createTime || currentMsg.timestamp).getTime()
  const prevTime = new Date(prevMsg.createTime || prevMsg.timestamp).getTime()
  
  // 时间差超过阈值（默认5分钟）则显示时间分隔线
  return (currentTime - prevTime) > timeThreshold * 60 * 1000
}

/**
 * 获取消息内容预览
 * @param {Object} message - 消息对象
 * @returns {string} 消息预览文本
 */
export function getMessagePreview(message) {
  if (!message) return ''
  
  switch (message.type) {
    case MessageType.TEXT:
      return message.content || ''
    case MessageType.IMAGE:
      return '[图片]'
    case MessageType.FILE:
      return '[文件]'
    case MessageType.LOCATION:
      return '[位置]'
    case MessageType.AUDIO:
      return '[语音]'
    case MessageType.VIDEO:
      return '[视频]'
    case MessageType.SYSTEM:
      return '[系统消息]'
    case MessageType.NOTIFICATION:
      return '[通知]'
    case MessageType.RECALL:
      return '对方撤回了一条消息'
    default:
      return '未知消息类型'
  }
}

/**
 * 生成唯一的消息ID
 * @returns {string} 唯一ID
 */
export function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * 创建新消息对象
 * @param {Object} options - 消息选项
 * @returns {Object} 新消息对象
 */
export function createMessage(options) {
  const {
    type = MessageType.TEXT,
    content = '',
    senderId,
    senderName,
    senderAvatar,
    receiverId,
    conversationId,
    extra = {}
  } = options
  
  return {
    id: generateMessageId(),
    type,
    content,
    senderId,
    senderName,
    senderAvatar,
    receiverId,
    conversationId,
    timestamp: Date.now(),
    status: MessageStatus.SENDING,
    isRead: false,
    isRevoked: false,
    extra
  }
}

/**
 * 判断消息是否来自自己
 * @param {Object} message - 消息对象
 * @param {number|string} userId - 当前用户ID
 * @returns {boolean} 是否是自己发送的消息
 */
export function isMessageFromSelf(message, userId) {
  return message && (message.senderId === userId || message.isSelf)
}