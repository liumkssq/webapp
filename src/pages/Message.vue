<template>
  <div class="message-page">
    <!-- 头部导航 -->
    <header-nav title="消息" />
    
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
import HeaderNav from '../components/HeaderNav.vue'
import FooterNavigation from '../components/FooterNav.vue'
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
  return chatSessions.value.reduce((total, session) => total + (session.unreadCount || 0), 0)
})

// 未读通知数
const unreadNotificationCount = computed(() => {
  return notifications.value.filter(notification => !notification.read).length
})

// 获取聊天会话列表
const fetchChatSessions = async () => {
  try {
    if (!userStore.isLoggedIn) {
      // 如果没有登录，使用模拟数据
      userStore.setLoggedIn(true)
    }
    
    // 重定向到新的IM消息系统
    router.replace('/im/message')
    return
    
    const res = await api.chat.getChatSessionList()
    if (res.code === 200) {
      // 转换数据结构以适配模板
      chatSessions.value = res.data.map(session => ({
        id: session.id,
        targetUser: {
          id: session.userId,
          nickname: session.user.name,
          avatar: session.user.avatar,
          online: Math.random() > 0.5 // 随机在线状态
        },
        lastMessage: {
          type: session.lastMessage?.type || 'text',
          content: session.lastMessage?.content || '',
          time: session.lastMessage?.createTime || new Date().toISOString()
        },
        unreadCount: session.unreadCount || 0
      }))
      
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
.message-page {
  padding-bottom: 50px;
}

.message-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  font-size: 15px;
  position: relative;
  color: #666;
}

.tab-item.active {
  color: #1989fa;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #1989fa;
}

.badge {
  position: absolute;
  top: 5px;
  right: 50%;
  margin-right: -50px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
  text-align: center;
  border-radius: 8px;
  background-color: #ff4d4f;
  color: white;
  padding: 0 4px;
}

.chat-list, .notification-list {
  background-color: #f7f8fa;
}

.chat-item {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.chat-item.unread {
  background-color: #f0f9ff;
}

.avatar {
  position: relative;
  width: 45px;
  height: 45px;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #52c41a;
  border: 2px solid #fff;
}

.chat-info {
  flex: 1;
  overflow: hidden;
}

.top-line, .bottom-line {
  display: flex;
  justify-content: space-between;
}

.nickname {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #999;
}

.last-message {
  color: #666;
  font-size: 13px;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-count {
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  text-align: center;
  border-radius: 9px;
  background-color: #ff4d4f;
  color: white;
  padding: 0 5px;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.notification-icon.like {
  background-color: #ff4d4f;
}

.notification-icon.comment {
  background-color: #1890ff;
}

.notification-icon.follow {
  background-color: #52c41a;
}

.notification-icon.system {
  background-color: #faad14;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.notification-text {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff4d4f;
  margin-left: 8px;
  align-self: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty-state i {
  font-size: 60px;
  margin-bottom: 16px;
  color: #ccc;
}

.empty-state button {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  background-color: #1989fa;
  color: white;
  border-radius: 4px;
}
</style>