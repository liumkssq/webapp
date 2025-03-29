<template>
  <div class="message-page">
    <!-- 头部导航 -->
    <header-navigation title="消息" />
    
    <!-- 消息类型切换 -->
    <div class="message-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'chat' }"
        @click="activeTab = 'chat'"
      >
        聊天消息
        <div v-if="unreadChatCount > 0" class="badge">{{ formatBadge(unreadChatCount) }}</div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'notification' }"
        @click="activeTab = 'notification'"
      >
        通知
        <div v-if="unreadNotificationCount > 0" class="badge">{{ formatBadge(unreadNotificationCount) }}</div>
      </div>
    </div>
    
    <!-- 聊天消息列表 -->
    <div v-if="activeTab === 'chat'" class="chat-list">
      <div v-if="chatSessions.length === 0" class="empty-state">
        <i class="material-icons">chat_bubble_outline</i>
        <p>暂无聊天消息</p>
        <button @click="router.push('/')">去浏览</button>
      </div>
      
      <div 
        v-for="session in chatSessions" 
        :key="session.id" 
        class="chat-item"
        :class="{ unread: session.unreadCount > 0 }"
        @click="navigateToChat(session.targetUser.id)"
      >
        <div class="avatar">
          <img :src="session.targetUser.avatar" alt="头像" />
          <div v-if="session.targetUser.online" class="online-indicator"></div>
        </div>
        
        <div class="chat-info">
          <div class="top-line">
            <div class="nickname">{{ session.targetUser.nickname }}</div>
            <div class="time">{{ formatTime(session.lastMessage.time) }}</div>
          </div>
          
          <div class="bottom-line">
            <div class="last-message">
              <span v-if="session.lastMessage.type === 'text'">{{ session.lastMessage.content }}</span>
              <span v-else-if="session.lastMessage.type === 'image'">[图片]</span>
              <span v-else-if="session.lastMessage.type === 'voice'">[语音]</span>
              <span v-else>[未知消息类型]</span>
            </div>
            
            <div v-if="session.unreadCount > 0" class="unread-count">
              {{ formatBadge(session.unreadCount) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通知列表 -->
    <div v-if="activeTab === 'notification'" class="notification-list">
      <div v-if="notifications.length === 0" class="empty-state">
        <i class="material-icons">notifications_none</i>
        <p>暂无通知</p>
      </div>
      
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="handleNotification(notification)"
      >
        <div class="notification-icon" :class="notification.type">
          <i class="material-icons">{{ getNotificationIcon(notification.type) }}</i>
        </div>
        
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-text">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.time) }}</div>
        </div>
        
        <div v-if="!notification.read" class="unread-indicator"></div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-navigation />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import FooterNavigation from '../components/common/FooterNavigation.vue'
import { useUserStore } from '../store/user'
import api from '../api'

const router = useRouter()
const userStore = useUserStore()

// 激活的标签页
const activeTab = ref('chat')

// 聊天会话列表
const chatSessions = ref([])

// 通知列表
const notifications = ref([])

// 未读消息数
const unreadChatCount = computed(() => {
  return chatSessions.value.reduce((total, session) => total + session.unreadCount, 0)
})

// 未读通知数
const unreadNotificationCount = computed(() => {
  return notifications.value.filter(notification => !notification.read).length
})

// 获取聊天会话列表
const fetchChatSessions = async () => {
  try {
    if (!userStore.isLoggedIn) return
    
    const res = await api.chat.getChatSessionList()
    if (res.code === 200) {
      chatSessions.value = res.data
      
      // 更新全局未读消息数
      userStore.updateUnreadMessageCount(unreadChatCount.value)
    }
  } catch (error) {
    console.error('获取聊天会话列表失败:', error)
  }
}

// 获取通知列表
const fetchNotifications = async () => {
  try {
    if (!userStore.isLoggedIn) return
    
    // 假设有通知API
    const res = await api.user.getNotifications()
    if (res.code === 200) {
      notifications.value = res.data
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
  }
}

// 处理通知点击
const handleNotification = async (notification) => {
  // 标记为已读
  if (!notification.read) {
    try {
      // 假设有标记通知已读的API
      await api.user.markNotificationAsRead(notification.id)
      notification.read = true
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }
  }
  
  // 根据通知类型处理跳转
  switch (notification.type) {
    case 'like':
    case 'comment':
      if (notification.targetType === 'article') {
        router.push(`/article/detail/${notification.targetId}`)
      } else if (notification.targetType === 'product') {
        router.push(`/product/detail/${notification.targetId}`)
      } else if (notification.targetType === 'lostFound') {
        router.push(`/lost-found/detail/${notification.targetId}`)
      }
      break
    case 'follow':
      router.push(`/user/${notification.fromUser.id}`)
      break
    case 'system':
      // 系统通知不跳转
      break
    default:
      break
  }
}

// 跳转到聊天页面
const navigateToChat = (userId) => {
  router.push(`/chat/conversation/${userId}`)
}

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return 'favorite'
    case 'comment':
      return 'comment'
    case 'follow':
      return 'person_add'
    case 'system':
      return 'info'
    default:
      return 'notifications'
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const messageDate = new Date(time)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 格式化时间
  const hours = messageDate.getHours().toString().padStart(2, '0')
  const minutes = messageDate.getMinutes().toString().padStart(2, '0')
  const timeString = `${hours}:${minutes}`
  
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
  
  if (messageDay.getTime() === today.getTime()) {
    return timeString
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `昨天 ${timeString}`
  } else {
    // 显示月日
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0')
    const day = messageDate.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 格式化徽章数字
const formatBadge = (count) => {
  if (count > 99) return '99+'
  return count
}

onMounted(() => {
  fetchChatSessions()
  fetchNotifications()
})
</script>

<script>
export default {
  name: 'MessagePage'
}
</script>

<style scoped>
/* 样式将在后续阶段完善 */
</style>