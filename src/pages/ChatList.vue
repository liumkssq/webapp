<template>
  <div class="chat-list-container">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">消息</div>
      <div class="add-btn" @click="goToAddFriend">
        <i class="icon-add"></i>
      </div>
    </div>
    
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-bar">
        <i class="icon-search"></i>
        <input type="text" v-model="searchKeyword" placeholder="搜索消息" class="search-input" @input="handleSearch">
        <i class="icon-clear" v-if="searchKeyword" @click="clearSearch"></i>
      </div>
    </div>
    
    <!-- 会话列表 -->
    <div class="session-list">
      <div 
        v-for="session in filteredSessions" 
        :key="session.id" 
        class="session-item" 
        @click="goToChat(session.id)"
      >
        <!-- 头像和未读消息数 -->
        <div class="session-avatar-container">
          <img :src="session.user.avatar" :alt="session.user.nickname" class="session-avatar">
          <div class="unread-badge" v-if="session.unreadCount > 0">
            {{ session.unreadCount > 99 ? '99+' : session.unreadCount }}
          </div>
          <div class="online-indicator" v-if="session.user.online"></div>
        </div>
        
        <!-- 会话信息 -->
        <div class="session-info">
          <div class="session-header">
            <div class="session-name">{{ session.user.nickname }}</div>
            <div class="message-time">{{ formatTime(session.lastMessage?.sendTime) }}</div>
          </div>
          
          <div class="session-message">
            <div class="message-preview" v-if="session.lastMessage">
              <!-- 根据消息类型显示不同的预览 -->
              <span v-if="session.lastMessage.contentType === 'text'">
                {{ session.lastMessage.content }}
              </span>
              <span v-else-if="session.lastMessage.contentType === 'image'">
                [图片]
              </span>
              <span v-else-if="session.lastMessage.contentType === 'file'">
                [文件]
              </span>
              <span v-else>
                [未知消息类型]
              </span>
            </div>
            <div class="no-message" v-else>
              暂无消息
            </div>
          </div>
        </div>
        
        <!-- 右滑删除 -->
        <div class="session-actions">
          <div class="action-btn delete-btn" @click.stop="deleteSession(session.id)">
            删除
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无会话提示 -->
    <div class="no-sessions" v-if="filteredSessions.length === 0">
      <div class="empty-icon">
        <i class="icon-empty"></i>
      </div>
      <div class="empty-text">
        {{ searchKeyword ? '没有找到匹配的消息' : '暂无聊天记录' }}
      </div>
      <button class="start-chat-btn" v-if="!searchKeyword" @click="goToAddFriend">
        开始聊天
      </button>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="goToPath('/home')">
        <div class="nav-icon">首页</div>
        <div class="nav-name">首页</div>
      </div>
      <div class="nav-item" @click="goToPath('/discovery')">
        <div class="nav-icon">发现</div>
        <div class="nav-name">发现</div>
      </div>
      <div class="nav-item" @click="goToPath('/publish')">
        <div class="nav-icon">发布</div>
        <div class="nav-name">发布</div>
      </div>
      <div class="nav-item active">
        <div class="nav-icon">消息</div>
        <div class="nav-name">消息</div>
      </div>
      <div class="nav-item" @click="goToPath('/user/' + userId)">
        <div class="nav-icon">我的</div>
        <div class="nav-name">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getChatSessions, deleteSession as deleteSessionApi } from '@/api/chat'

const router = useRouter()
const userStore = useUserStore()

// 获取用户ID
const userId = computed(() => userStore.userId || '1')

// 会话列表数据
const sessions = ref([])
const searchKeyword = ref('')

// 搜索过滤后的会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value) {
    return sessions.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return sessions.value.filter(session => {
    // 搜索用户名
    if (session.user.nickname.toLowerCase().includes(keyword)) {
      return true
    }
    
    // 搜索最后一条消息内容（仅搜索文本消息）
    if (session.lastMessage && 
        session.lastMessage.contentType === 'text' && 
        session.lastMessage.content.toLowerCase().includes(keyword)) {
      return true
    }
    
    return false
  })
})

// 定时刷新会话列表
let refreshInterval = null

// 获取会话列表
const fetchSessions = async () => {
  try {
    const { data } = await getChatSessions()
    sessions.value = data
  } catch (error) {
    console.error('获取会话列表失败', error)
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 清除搜索关键词
const clearSearch = () => {
  searchKeyword.value = ''
}

// 前往聊天页面
const goToChat = (sessionId) => {
  router.push(`/chat/${sessionId}`)
}

// 前往添加好友页面
const goToAddFriend = () => {
  router.push('/add-friend')
}

// 删除会话
const deleteSession = async (sessionId) => {
  try {
    await deleteSessionApi(sessionId)
    
    // 刷新会话列表
    await fetchSessions()
  } catch (error) {
    console.error('删除会话失败', error)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化消息时间
const formatTime = (time) => {
  if (!time) return ''
  
  const messageDate = new Date(time)
  const now = new Date()
  
  // 今天的消息只显示时间
  if (messageDate.toDateString() === now.toDateString()) {
    return `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 昨天的消息显示"昨天"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  // 今年内的消息显示月份和日期
  if (messageDate.getFullYear() === now.getFullYear()) {
    return `${(messageDate.getMonth() + 1).toString().padStart(2, '0')}-${messageDate.getDate().toString().padStart(2, '0')}`
  }
  
  // 往年的消息显示年份
  return `${messageDate.getFullYear()}`
}

// 跳转到指定路径
const goToPath = (path) => {
  router.push(path)
}

// 页面挂载时获取数据并启动定时刷新
onMounted(() => {
  fetchSessions()
  
  // 每30秒刷新一次会话列表
  refreshInterval = setInterval(() => {
    fetchSessions()
  }, 30000)
})

// 页面卸载时清除定时器
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>