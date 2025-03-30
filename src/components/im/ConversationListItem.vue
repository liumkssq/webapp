<template>
  <div class="conversation-list-item" @click="handleClick">
    <div class="avatar">
      <van-image
        round
        width="3rem"
        height="3rem"
        :src="conversation.targetInfo?.avatar"
        fit="cover"
      >
        <template #error>
          <div class="avatar-fallback">
            {{ getInitials(conversation.targetInfo?.name) }}
          </div>
        </template>
      </van-image>
      <div v-if="isOnline" class="online-indicator"></div>
    </div>
    
    <div class="content">
      <div class="top-row">
        <div class="username">{{ conversation.targetInfo?.name }}</div>
        <div class="time">{{ formatTime(conversation.lastMessage?.timestamp) }}</div>
      </div>
      
      <div class="bottom-row">
        <div class="message-preview">
          <span v-if="conversation.lastMessage">
            <span v-if="conversation.lastMessage.type === 'text'">
              {{ truncateText(conversation.lastMessage.content) }}
            </span>
            <span v-else-if="conversation.lastMessage.type === 'image'">
              [图片]
            </span>
            <span v-else-if="conversation.lastMessage.type === 'voice'">
              [语音消息 {{ conversation.lastMessage.duration }}″]
            </span>
            <span v-else>
              [未知类型消息]
            </span>
          </span>
          <span v-else class="no-message">暂无消息</span>
        </div>
        
        <div v-if="conversation.unreadCount > 0" class="unread-badge">
          {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from '@/utils/dayjs'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = dayjs(timestamp)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    // 今天，显示时间
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    // 昨天
    return '昨天'
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD')
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD')
  }
}

// 截断文本
const truncateText = (text) => {
  if (!text) return ''
  return text.length > 20 ? text.substring(0, 20) + '...' : text
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0)
}

// 是否在线
const isOnline = computed(() => {
  return props.conversation.targetInfo?.onlineStatus === 'online'
})

// 点击处理
const handleClick = () => {
  emit('click', props.conversation)
}
</script>

<style scoped>
.conversation-list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #ffffff;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.conversation-list-item:active {
  background-color: #f2f2f2;
}

.avatar {
  position: relative;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e1e1e1;
  color: #666;
  font-weight: bold;
  font-size: 1.2rem;
}

.online-indicator {
  position: absolute;
  width: 0.6rem;
  height: 0.6rem;
  background-color: #4cd964;
  border-radius: 50%;
  border: 2px solid #fff;
  bottom: 0;
  right: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.top-row, .bottom-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.username {
  font-weight: 500;
  color: #000;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  color: #8e8e93;
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.message-preview {
  color: #8e8e93;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.no-message {
  font-style: italic;
  opacity: 0.6;
}

.unread-badge {
  background-color: #ff3b30;
  color: white;
  border-radius: 1rem;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.3rem;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  flex-shrink: 0;
}
</style> 