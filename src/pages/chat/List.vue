<template>
  <div class="chat-list-page">
    <!-- 头部导航 -->
    <HeaderNavigation title="消息" />
    
    <!-- 搜索栏 -->
    <div class="search-container">
      <div class="search-bar">
        <i class="material-icons search-icon">search</i>
        <input 
          type="text" 
          class="search-input" 
          placeholder="搜索用户或消息" 
          v-model="searchQuery"
          @input="handleSearch"
        />
        <i 
          v-if="searchQuery" 
          class="material-icons clear-icon" 
          @click="clearSearch"
        >clear</i>
      </div>
    </div>
    
    <!-- 会话列表 -->
    <div class="conversation-list">
      <!-- 无会话提示 -->
      <EmptyState 
        v-if="filteredConversations.length === 0" 
        text="暂无消息" 
        subText="去发现更多校友吧"
        icon="message"
      />
      
      <!-- 会话列表项 -->
      <div 
        v-for="conversation in filteredConversations" 
        :key="conversation.id"
        class="conversation-item"
        :class="{ 'unread': conversation.unreadCount > 0 }"
        @click="navigateToConversation(conversation.userId)"
      >
        <!-- 头像和未读标记 -->
        <div class="avatar-container">
          <div class="avatar">
            <img :src="conversation.user.avatar" alt="avatar" />
          </div>
          <div v-if="conversation.unreadCount > 0" class="unread-badge">
            {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
          </div>
        </div>
        
        <!-- 会话信息 -->
        <div class="conversation-info">
          <div class="conversation-header">
            <div class="user-name">{{ conversation.user.name }}</div>
            <div class="time">{{ formatTime(conversation.updateTime) }}</div>
          </div>
          
          <div class="last-message">
            <!-- 根据消息类型显示不同内容 -->
            <template v-if="conversation.lastMessage">
              <template v-if="conversation.lastMessage.type === 'text'">
                <span>{{ conversation.lastMessage.content }}</span>
              </template>
              <template v-else-if="conversation.lastMessage.type === 'image'">
                <i class="material-icons message-type-icon">photo</i>
                <span>图片</span>
              </template>
              <template v-else-if="conversation.lastMessage.type === 'file'">
                <i class="material-icons message-type-icon">insert_drive_file</i>
                <span>文件: {{ conversation.lastMessage.content }}</span>
              </template>
            </template>
            <template v-else>
              <span class="empty-message">暂无消息</span>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <FooterNavigation />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import EmptyState from '../components/common/EmptyState.vue'
import FooterNavigation from '../components/common/FooterNavigation.vue'
import { getConversationList, getUnreadMessageCount } from '../api/chat'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

// 会话数据
const conversations = ref([])
const searchQuery = ref('')

// 轮询定时器
let pollTimer = null

// 过滤后的会话列表
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  
  const query = searchQuery.value.toLowerCase()
  return conversations.value.filter(conversation => 
    conversation.user.name.toLowerCase().includes(query) ||
    (conversation.lastMessage && 
     conversation.lastMessage.type === 'text' && 
     conversation.lastMessage.content.toLowerCase().includes(query))
  )
})

// 获取会话列表
const fetchConversations = async () => {
  try {
    // 检查用户是否登录
    if (!userStore.isLoggedIn) {
      return
    }
    
    const res = await getConversationList()
    if (res.data) {
      conversations.value = res.data
      
      // 更新未读消息数量
      updateUnreadCount()
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  }
}

// 更新未读消息数量
const updateUnreadCount = async () => {
  try {
    const res = await getUnreadMessageCount()
    if (res.data) {
      userStore.updateUnreadMessageCount(res.data.count)
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  // 只需要依赖 computed 属性即可，无需实现
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
}

// 跳转到会话详情
const navigateToConversation = (userId) => {
  router.push(`/chat/conversation?userId=${userId}`)
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
    return `昨天`
  } else {
    // 显示月日
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0')
    const day = messageDate.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 启动轮询
const startPolling = () => {
  // 每10秒更新一次会话列表
  pollTimer = setInterval(fetchConversations, 10000)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 页面获取焦点时更新数据
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchConversations()
  }
}

onMounted(() => {
  fetchConversations()
  startPolling()
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.chat-list-page {
  min-height: 100vh;
  padding-bottom: 60px;
  background-color: #f5f5f5;
}

.search-container {
  padding: 10px 15px;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-bar {
  position: relative;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
}

.search-icon {
  color: #888;
  font-size: 1.2rem;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background-color: transparent;
  font-size: 0.9rem;
}

.clear-icon {
  color: #888;
  cursor: pointer;
}

.conversation-list {
  background-color: #fff;
}

.conversation-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
}

.conversation-item.unread {
  background-color: #f9f9f9;
}

.conversation-item:active {
  background-color: #f0f0f0;
}

.avatar-container {
  position: relative;
  margin-right: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background-color: #f44336;
  color: white;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-info {
  flex: 1;
  overflow: hidden;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.user-name {
  font-weight: 500;
  font-size: 1rem;
}

.unread .user-name {
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 0.8rem;
  color: #999;
}

.last-message {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.unread .last-message {
  color: #333;
}

.message-type-icon {
  font-size: 1.1rem;
  margin-right: 5px;
  color: #888;
}

.empty-message {
  color: #999;
  font-style: italic;
}
</style>