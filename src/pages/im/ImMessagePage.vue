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
      <!-- 集成联系人和会话 -->
      <div class="contact-shortcuts">
        <div class="shortcut" @click="router.push('/im/contacts')">
          <van-icon name="friends-o" size="24" />
          <span>联系人</span>
        </div>
        <div class="shortcut" @click="router.push('/im/groups')">
          <van-icon name="wechat" size="24" />
          <span>群聊</span>
        </div>
        <div class="shortcut" @click="router.push('/im/friend-requests')">
          <van-badge :content="newRequestsCount || ''" :show-zero="false">
            <van-icon name="add-o" size="24" />
          </van-badge>
          <span>新朋友</span>
        </div>
      </div>
      
      <div v-if="chatSessions.length === 0" class="empty-state">
        <van-empty description="暂无聊天消息" />
        <van-button type="primary" size="small" @click="router.push('/im/contacts')">添加好友</van-button>
      </div>
      
      <div 
        v-for="session in chatSessions" 
        :key="session.id" 
        class="chat-item"
        :class="{ unread: session.unreadCount > 0 }"
        @click="navigateToChat(session)"
      >
        <van-image
          round
          width="3rem"
          height="3rem"
          :src="session.targetUser.avatar"
          fit="cover"
        >
          <template #error>
            <div class="avatar-fallback">{{ getInitials(session.targetUser.name) }}</div>
          </template>
        </van-image>
        
        <div class="chat-info">
          <div class="top-line">
            <div class="nickname">{{ session.targetUser.name }}</div>
            <div class="time">{{ formatTime(session.lastMessage?.timestamp) }}</div>
          </div>
          
          <div class="bottom-line">
            <div class="last-message">
              <span v-if="session.lastMessage">
                <span v-if="session.lastMessage.type === 'text'">
                  {{ truncateText(session.lastMessage.content) }}
                </span>
                <span v-else-if="session.lastMessage.type === 'image'">
                  [图片]
                </span>
                <span v-else-if="session.lastMessage.type === 'voice'">
                  [语音消息 {{ session.lastMessage.duration }}″]
                </span>
                <span v-else>
                  [未知类型消息]
                </span>
              </span>
              <span v-else class="no-message">暂无消息</span>
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
        <van-empty description="暂无通知" />
      </div>
      
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="handleNotification(notification)"
      >
        <div class="notification-icon" :class="notification.type">
          <van-icon :name="getNotificationIcon(notification.type)" size="20" />
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
    <footer-nav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import { useUserStore } from '@/store/user'
import { getConversationList } from '@/api/im'
import { getFriendRequests } from '@/api/im'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

// 激活的标签页
const activeTab = ref('chat')

// 聊天会话列表
const chatSessions = ref([])

// 通知列表
const notifications = ref([])

// 好友请求数量
const newRequestsCount = ref(0)

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
      // 开发阶段可以设置为已登录状态
      userStore.setLoggedIn(true)
    }
    
    const res = await getConversationList()
    if (res.code === 200) {
      chatSessions.value = res.data
    }
  } catch (error) {
    console.error('获取聊天会话列表失败:', error)
  }
}

// 获取好友申请数量
const fetchFriendRequests = async () => {
  try {
    const response = await getFriendRequests({ status: 'pending' })
    if (response.code === 200) {
      newRequestsCount.value = response.data.list.length
    }
  } catch (error) {
    console.error('获取好友申请数量失败:', error)
  }
}

// 获取通知列表
const fetchNotifications = async () => {
  try {
    if (!userStore.isLoggedIn) return
    
    // 模拟通知数据
    notifications.value = [
      {
        id: 1,
        type: 'like',
        title: '点赞通知',
        content: '用户张三点赞了你的帖子《校园二手交易平台使用指南》',
        time: '2023-04-18 14:30:00',
        read: false,
        targetType: 'article',
        targetId: 101,
        fromUser: { id: 2, name: '张三' }
      },
      {
        id: 2,
        type: 'comment',
        title: '评论通知',
        content: '用户李四评论了你的帖子《寻找丢失的学生卡》：我在食堂看到过',
        time: '2023-04-17 10:20:00',
        read: true,
        targetType: 'lostFound',
        targetId: 102,
        fromUser: { id: 3, name: '李四' }
      },
      {
        id: 3,
        type: 'system',
        title: '系统通知',
        content: '你发布的商品《二手笔记本电脑》已通过审核',
        time: '2023-04-16 09:15:00',
        read: false,
        targetType: 'product',
        targetId: 103
      }
    ]
  } catch (error) {
    console.error('获取通知列表失败:', error)
  }
}

// 处理通知点击
const handleNotification = (notification) => {
  // 标记为已读
  if (!notification.read) {
    notification.read = true
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
const navigateToChat = (session) => {
  // 根据路由配置，使用im目录下的聊天路由
  if (session.type === 'group') {
    router.push(`/im/group/${session.targetId}?name=${encodeURIComponent(session.targetInfo.name)}`)
  } else {
    router.push(`/im/chat/${session.targetId}?name=${encodeURIComponent(session.targetInfo.name)}`)
  }
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return 'like-o'
    case 'comment':
      return 'comment-o'
    case 'follow':
      return 'friends-o'
    case 'system':
      return 'info-o'
    default:
      return 'bell'
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = dayjs(time)
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

// 格式化徽章数字
const formatBadge = (count) => {
  if (count > 99) return '99+'
  return count
}

onMounted(() => {
  fetchChatSessions()
  fetchNotifications()
  fetchFriendRequests()
})
</script>