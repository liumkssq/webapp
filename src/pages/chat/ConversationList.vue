<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="消息"
      fixed
      placeholder
      right-text="新建"
      @click-right="onClickRight"
    />
    
    <!-- 会话列表 -->
    <conversation-list class="conversation-list" />
    
    <!-- 新建会话弹窗 -->
    <van-popup
      v-model:show="showNewConversation"
      round
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="popup-header">
        <div class="popup-title">新建会话</div>
        <van-icon name="cross" class="close-icon" @click="showNewConversation = false" />
      </div>
      
      <div class="popup-content">
        <van-search
          v-model="searchText"
          placeholder="搜索用户"
          shape="round"
          clearable
          @search="searchUsers"
        />
        
        <div class="search-results">
          <van-empty v-if="searchResults.length === 0" description="暂无结果" />
          
          <div v-else class="user-list">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-item"
              @click="createConversation(user)"
            >
              <van-image
                round
                width="2.5rem"
                height="2.5rem"
                :src="user.avatar"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(user.name) }}</div>
                </template>
              </van-image>
              
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-status">{{ user.status === 'online' ? '在线' : '离线' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import ConversationList from '@/components/im/ConversationList.vue'
import { useUserStore } from '@/store/user'
import { useIMStore } from '@/store/im'
import { getConversations, setUpUserConversation } from '@/api/im'

const router = useRouter()
const userStore = useUserStore()
const imStore = useIMStore()
const showNewConversation = ref(false)
const searchText = ref('')
const searchResults = ref([])
const loading = ref(false)

// 点击右侧按钮
const onClickRight = () => {
  showNewConversation.value = true
  searchResults.value = []
  searchText.value = ''
}

// 搜索用户
const searchUsers = async () => {
  if (!searchText.value.trim()) {
    searchResults.value = []
    return
  }
  
  loading.value = true
  try {
    // 模拟API请求搜索用户
    // 实际项目中应该调用用户搜索API
    setTimeout(() => {
      searchResults.value = [
        {
          id: 2,
          name: '张三',
          avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=user1',
          status: 'online'
        },
        {
          id: 3,
          name: '李四',
          avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=user2',
          status: 'offline'
        },
        {
          id: 4,
          name: '王五',
          avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=user3',
          status: 'online'
        }
      ].filter(user => user.name.includes(searchText.value))
      
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('搜索用户失败:', error)
    showToast('搜索失败，请重试')
    loading.value = false
  }
}

// 创建新会话
const createConversation = async (user) => {
  loading.value = true
  try {
    const response = await setUpUserConversation({
      sendId: userStore.currentUser.id,
      recvId: user.id,
      ChatType: 1 // 单聊
    })
    
    if (response.code === 200) {
      showNewConversation.value = false
      
      // 导航到会话详情页
      router.push({
        path: `/chat/conversation/${response.data.conversationId}`,
        query: { name: user.name }
      })
    } else {
      showToast(response.message || '创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    showToast('创建会话失败，请重试')
  } finally {
    loading.value = false
  }
}

// 初始化WebSocket连接
const initWebSocket = () => {
  if (userStore.isLoggedIn) {
    imStore.initWebSocket(userStore.currentUser.id)
  }
}

// 组件挂载时初始化WebSocket
onMounted(() => {
  initWebSocket()
})

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0)
}

// 监听WebSocket连接状态变化
watch(() => imStore.connected, (connected) => {
  if (connected) {
    console.log('WebSocket已连接')
  } else {
    console.log('WebSocket已断开')
  }
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.conversation-list {
  flex: 1;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 1rem;
  font-weight: bold;
}

.close-icon {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 1.2rem;
}

.popup-content {
  height: calc(100% - 3.5rem);
  overflow-y: auto;
  padding: 0 0 1rem 0;
}

.search-results {
  padding: 0 1rem;
}

.user-list {
  margin-top: 1rem;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
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
  font-size: 1rem;
}

.user-info {
  margin-left: 0.75rem;
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.user-status {
  font-size: 0.8rem;
  color: #8e8e93;
}
</style> 