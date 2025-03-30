<template>
  <div class="friend-item" @click="$emit('click')" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <div class="avatar">
      <van-image
        round
        width="2.8rem"
        height="2.8rem"
        :src="friend.user.avatar"
        fit="cover"
      >
        <template #error>
          <div class="avatar-fallback">{{ getInitials(displayName) }}</div>
        </template>
      </van-image>
      <div v-if="isOnline" class="status-dot online"></div>
      <div v-else class="status-dot offline"></div>
    </div>
    
    <div class="info">
      <div class="name">{{ displayName }}</div>
      <div class="status">{{ statusText }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  friend: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'long-press'])

// 显示名称（优先显示备注）
const displayName = computed(() => {
  return props.friend.remark || props.friend.user.name
})

// 是否在线
const isOnline = computed(() => {
  return props.friend.user.status === 'online'
})

// 状态文本
const statusText = computed(() => {
  const status = props.friend.user.status
  
  if (status === 'online') {
    return '在线'
  } else if (status === 'away') {
    return '离开'
  } else {
    // 离线状态，显示最后在线时间
    return `最后在线: ${formatLastSeen(props.friend.user.lastSeen)}`
  }
})

// 格式化最后在线时间
const formatLastSeen = (timestamp) => {
  if (!timestamp) return '未知'
  
  const now = new Date()
  const lastSeen = new Date(timestamp)
  const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60))
  
  if (diffMinutes < 1) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    return `${hours}小时前`
  } else {
    const days = Math.floor(diffMinutes / 1440)
    if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      // 格式化日期，只显示月日
      return lastSeen.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  }
}

// 获取姓名缩写
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 长按相关
const touchTimer = ref(null)
const touchDuration = 800 // 长按触发时间（毫秒）

const onTouchStart = () => {
  touchTimer.value = setTimeout(() => {
    emit('long-press')
  }, touchDuration)
}

const onTouchEnd = () => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value)
    touchTimer.value = null
  }
}
</script>

<style scoped>
.friend-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.friend-item:active {
  background-color: #f2f2f2;
}

.avatar {
  position: relative;
  margin-right: 0.75rem;
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

.status-dot {
  position: absolute;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: 2px solid #fff;
  bottom: 0;
  right: 0;
}

.status-dot.online {
  background-color: #4cd964;
}

.status-dot.offline {
  background-color: #8e8e93;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 500;
  color: #000;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  font-size: 0.8rem;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 