<template>
  <div 
    class="group-item"
    @click="handleClick"
  >
    <div class="avatar-container">
      <van-badge 
        :content="unreadCount > 0 ? unreadCount : ''" 
        :max="99"
        :show-zero="false"
      >
        <van-image
          round
          fit="cover"
          width="3rem"
          height="3rem"
          :src="group.avatar"
        >
          <template #error>
            <div class="avatar-fallback">
              <van-icon name="friends-o" size="1.5rem" />
            </div>
          </template>
        </van-image>
      </van-badge>
    </div>
    
    <div class="group-info">
      <div class="group-top-row">
        <div class="group-name text-ellipsis">{{ group.name }}</div>
        <div class="group-time">{{ formatTime(group.lastActiveTime) }}</div>
      </div>
      
      <div class="group-bottom-row">
        <div class="last-message text-ellipsis">
          <template v-if="group.lastMessage">
            <span v-if="group.lastMessage.type === 'text'">{{ group.lastMessage.content }}</span>
            <span v-else-if="group.lastMessage.type === 'image'">[图片]</span>
            <span v-else-if="group.lastMessage.type === 'voice'">[语音]</span>
            <span v-else-if="group.lastMessage.type === 'file'">[文件]</span>
            <span v-else-if="group.lastMessage.type === 'location'">[位置]</span>
            <span v-else-if="group.lastMessage.type === 'video'">[视频]</span>
            <span v-else>[未知消息类型]</span>
          </template>
          <span v-else class="no-message">暂无消息</span>
        </div>
        
        <div class="message-status">
          <van-icon v-if="group.isMuted" name="volume-mute" class="mute-icon" />
          <div v-if="group.isSticky" class="sticky-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  group: {
    type: Object,
    required: true,
    default: () => ({
      id: 0,
      name: '',
      avatar: '',
      lastMessage: null,
      lastActiveTime: Date.now(),
      unreadCount: 0,
      memberCount: 0,
      isMuted: false,
      isSticky: false
    })
  }
})

const emit = defineEmits(['click'])

// 未读消息数
const unreadCount = computed(() => {
  if (props.group.isMuted) return 0 // 如果已设置静音，不显示未读数量
  return props.group.unreadCount || 0
})

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const messageTime = dayjs(timestamp)
  const now = dayjs()
  
  // 今天的消息，显示时间
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm')
  }
  
  // 昨天的消息
  if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  }
  
  // 一周内的消息，显示星期几
  if (messageTime.isAfter(now.subtract(7, 'day'))) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[messageTime.day()]
  }
  
  // 一周以上的消息，显示日期
  return messageTime.format('MM-DD')
}

// 处理点击事件
const handleClick = () => {
  emit('click', props.group.id)
}
</script>

<style scoped>
.group-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:active {
  background-color: #f5f5f5;
}

.avatar-container {
  position: relative;
  margin-right: 0.75rem;
}

.avatar-fallback {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 3rem;
  height: 3rem;
  background-color: #f2f2f2;
  color: #909399;
  border-radius: 50%;
}

.group-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.group-top-row, .group-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-name {
  font-size: 1rem;
  font-weight: 500;
  color: #303133;
  max-width: 70%;
}

.group-time {
  font-size: 0.75rem;
  color: #909399;
}

.group-bottom-row {
  margin-top: 0.25rem;
}

.last-message {
  font-size: 0.85rem;
  color: #606266;
  max-width: 70%;
}

.no-message {
  color: #c0c4cc;
  font-style: italic;
}

.message-status {
  display: flex;
  align-items: center;
}

.mute-icon {
  font-size: 1rem;
  color: #909399;
  margin-left: 0.5rem;
}

.sticky-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #ff9900;
  margin-left: 0.5rem;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 