<template>
  <div ref="messageListRef" class="message-list" @scroll="handleScroll">
    <!-- 加载更多指示器 -->
    <div v-if="loading" class="loading-more">
      <van-loading type="spinner" color="#1989fa" size="20" />
    </div>
    
    <!-- 没有更多消息提示 -->
    <div v-if="!hasMore && messages.length > 0" class="no-more-messages">
      没有更多消息了
    </div>
    
    <!-- 消息列表 -->
    <div class="messages-container">
      <!-- 分组日期 -->
      <template v-for="(group, date) in groupedMessages" :key="date">
        <div class="date-divider">
          <span>{{ formatDate(date) }}</span>
        </div>
        
        <!-- 单个消息项 -->
        <message-item
          v-for="message in group"
          :key="message.id"
          :message="message"
          :is-self="message.senderId === currentUserId"
          :current-user-id="currentUserId"
          @retry="handleRetry"
          @long-press="handleLongPress"
        />
      </template>
    </div>
    
    <!-- 空消息提示 -->
    <van-empty v-if="messages.length === 0" description="暂无消息" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import dayjs from 'dayjs'
import { showToast } from 'vant'
import MessageItem from './MessageItem.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: [Number, String],
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['loadMore', 'retry', 'delete', 'loadEarlier'])

const messageListRef = ref(null)
const isScrolledToBottom = ref(true)

// 按日期分组消息
const groupedMessages = computed(() => {
  const grouped = {}
  
  props.messages.forEach(message => {
    const date = dayjs(message.timestamp).format('YYYY-MM-DD')
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(message)
  })
  
  return grouped
})

// 格式化日期
const formatDate = (dateStr) => {
  const messageDate = dayjs(dateStr)
  const now = dayjs()
  
  if (messageDate.isSame(now, 'day')) {
    return '今天'
  } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (messageDate.isSame(now, 'year')) {
    return messageDate.format('MM月DD日')
  } else {
    return messageDate.format('YYYY年MM月DD日')
  }
}

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  if (!messageListRef.value) return
  
  nextTick(() => {
    const container = messageListRef.value
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  })
}

// 处理重试发送消息
const handleRetry = (message) => {
  emit('retry', message)
}

// 处理长按消息
const handleLongPress = (message) => {
  emit('delete', message)
}

// 处理滚动事件
const handleScroll = () => {
  if (!messageListRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = messageListRef.value
  
  // 检测是否滚动到底部
  isScrolledToBottom.value = scrollHeight - scrollTop - clientHeight < 20
  
  // 检测是否滚动到顶部以加载更多历史消息
  if (scrollTop < 50 && !props.loading && props.hasMore) {
    emit('loadEarlier')
  }
}

// 监听消息列表变化，自动滚动到底部
watch(() => props.messages, () => {
  if (isScrolledToBottom.value) {
    scrollToBottom()
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  scrollToBottom(false)
})

// 监听窗口大小变化，调整滚动位置
useEventListener(window, 'resize', () => {
  if (isScrolledToBottom.value) {
    scrollToBottom(false)
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom
})
</script>

<style scoped>
.message-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.no-more-messages {
  text-align: center;
  color: #8e8e93;
  font-size: 0.75rem;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.8rem 0;
  color: #8e8e93;
  font-size: 0.75rem;
}

.date-divider span {
  background-color: #f2f2f7;
  border-radius: 1rem;
  padding: 0.25rem 0.75rem;
}
</style> 