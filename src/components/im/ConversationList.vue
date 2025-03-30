<template>
  <div class="conversation-list">
    <div class="search-bar">
      <van-search
        v-model="searchText"
        placeholder="搜索"
        shape="round"
        background="#f5f5f5"
        clearable
      />
    </div>
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-empty v-if="filteredConversations.length === 0" description="暂无会话" />
      <div v-else class="conversation-items">
        <conversation-list-item
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          :conversation="conversation"
          @click="handleConversationClick(conversation)"
        />
      </div>
    </van-pull-refresh>
    
    <van-overlay :show="loading" z-index="1000">
      <div class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getConversationList } from '@/api/im'
import ConversationListItem from './ConversationListItem.vue'

const router = useRouter()
const conversations = ref([])
const loading = ref(false)
const refreshing = ref(false)
const searchText = ref('')

// 根据搜索文本过滤会话
const filteredConversations = computed(() => {
  if (!searchText.value) return conversations.value
  
  const keyword = searchText.value.toLowerCase()
  return conversations.value.filter(conversation => {
    const username = conversation.targetInfo?.name?.toLowerCase() || ''
    // 搜索用户名
    if (username.includes(keyword)) return true
    
    // 搜索最后一条消息
    if (conversation.lastMessage && 
        conversation.lastMessage.type === 'text' && 
        conversation.lastMessage.content.toLowerCase().includes(keyword)) {
      return true
    }
    
    return false
  })
})

// 加载会话列表
const loadConversations = async () => {
  loading.value = true
  try {
    const response = await getConversationList()
    if (response.code === 200) {
      conversations.value = response.data
    } else {
      showToast(response.message || '获取会话列表失败')
    }
  } catch (error) {
    console.error('获取会话列表出错：', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 刷新处理
const onRefresh = () => {
  loadConversations()
}

// 点击会话项处理
const handleConversationClick = (conversation) => {
  router.push({
    path: `/chat/conversation/${conversation.id}`,
    query: { name: conversation.targetInfo?.name || '会话' }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.conversation-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.search-bar {
  padding: 0.5rem 0;
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.conversation-items {
  background-color: #fff;
  border-radius: 0.5rem 0.5rem 0 0;
  overflow: hidden;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.van-pull-refresh) {
  flex: 1;
  overflow: auto;
}

:deep(.van-pull-refresh__track) {
  min-height: 100%;
}

:deep(.van-empty) {
  padding: 5rem 0;
}
</style> 