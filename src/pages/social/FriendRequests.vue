<template>
  <div class="friend-requests-page">
    <!-- 头部导航 -->
    <header-nav title="好友请求" />
    
    <!-- 主要内容 -->
    <div class="content">
      <!-- 切换标签 -->
      <van-tabs v-model:active="activeTab" swipeable>
        <!-- 收到的请求 -->
        <van-tab title="收到的请求" name="received">
          <div class="tab-content">
            <!-- 加载状态 -->
            <div v-if="loading.received" class="loading-container">
              <van-loading type="spinner" color="#1989fa" />
              <p class="loading-text">加载中...</p>
            </div>
            
            <!-- 请求列表 -->
            <div v-else>
              <van-list 
                v-model:loading="loading.receivedMore"
                :finished="receivedFinished"
                finished-text="暂无更多请求"
                @load="loadMoreReceived"
              >
                <van-cell-group v-if="receivedRequests.length > 0">
                  <van-cell
                    v-for="request in receivedRequests"
                    :key="request.id"
                    class="request-cell"
                  >
                    <template #title>
                      <div class="request-header">
                        <!-- 用户头像 -->
                        <van-image
                          round
                          width="50"
                          height="50"
                          :src="request.senderAvatar"
                          fit="cover"
                          @click="viewUserProfile(request.senderId)"
                        >
                          <template #error>
                            <div class="avatar-fallback">{{ getInitials(request.senderName) }}</div>
                          </template>
                        </van-image>
                        
                        <!-- 用户信息 -->
                        <div class="request-info">
                          <div class="request-name" @click="viewUserProfile(request.senderId)">
                            {{ request.senderName }}
                          </div>
                          <div class="request-message" v-if="request.message">
                            {{ request.message }}
                          </div>
                          <div class="request-time">
                            {{ formatTime(request.createdAt) }}
                          </div>
                        </div>
                      </div>
                    </template>
                    
                    <!-- 操作按钮 -->
                    <template #right-icon>
                      <div class="request-actions" v-if="request.status === 'pending'">
                        <van-button
                          round
                          type="success"
                          size="small"
                          class="action-button"
                          @click="handleRequest(request.id, 'accept')"
                        >
                          接受
                        </van-button>
                        
                        <van-button
                          round
                          type="default"
                          size="small"
                          class="action-button"
                          @click="handleRequest(request.id, 'reject')"
                        >
                          拒绝
                        </van-button>
                      </div>
                      <div class="request-status" v-else>
                        {{ getStatusText(request.status) }}
                      </div>
                    </template>
                  </van-cell>
                </van-cell-group>
                
                <!-- 空状态 -->
                <div v-else-if="!loading.receivedMore" class="empty-container">
                  <van-empty
                    image="search"
                    description="暂无收到的好友请求"
                  />
                </div>
              </van-list>
            </div>
          </div>
        </van-tab>
        
        <!-- 发送的请求 -->
        <van-tab title="发送的请求" name="sent">
          <div class="tab-content">
            <!-- 加载状态 -->
            <div v-if="loading.sent" class="loading-container">
              <van-loading type="spinner" color="#1989fa" />
              <p class="loading-text">加载中...</p>
            </div>
            
            <!-- 请求列表 -->
            <div v-else>
              <van-list
                v-model:loading="loading.sentMore"
                :finished="sentFinished"
                finished-text="暂无更多请求"
                @load="loadMoreSent"
              >
                <van-cell-group v-if="sentRequests.length > 0">
                  <van-cell
                    v-for="request in sentRequests"
                    :key="request.id"
                    class="request-cell"
                  >
                    <template #title>
                      <div class="request-header">
                        <!-- 用户头像 -->
                        <van-image
                          round
                          width="50"
                          height="50"
                          :src="request.receiverAvatar"
                          fit="cover"
                          @click="viewUserProfile(request.receiverId)"
                        >
                          <template #error>
                            <div class="avatar-fallback">{{ getInitials(request.receiverName) }}</div>
                          </template>
                        </van-image>
                        
                        <!-- 用户信息 -->
                        <div class="request-info">
                          <div class="request-name" @click="viewUserProfile(request.receiverId)">
                            {{ request.receiverName }}
                          </div>
                          <div class="request-message" v-if="request.message">
                            {{ request.message }}
                          </div>
                          <div class="request-time">
                            {{ formatTime(request.createdAt) }}
                          </div>
                        </div>
                      </div>
                    </template>
                    
                    <!-- 状态与操作按钮 -->
                    <template #right-icon>
                      <div class="request-status-container">
                        <div class="request-status">
                          {{ getStatusText(request.status) }}
                        </div>
                        
                        <van-button
                          v-if="request.status === 'pending'"
                          round
                          type="danger"
                          size="small"
                          class="action-button"
                          @click="cancelFriendRequest(request.id)"
                        >
                          撤回
                        </van-button>
                      </div>
                    </template>
                  </van-cell>
                </van-cell-group>
                
                <!-- 空状态 -->
                <div v-else-if="!loading.sentMore" class="empty-container">
                  <van-empty
                    image="search"
                    description="暂无发送的好友请求"
                  >
                    <template #bottom>
                      <van-button
                        round
                        type="primary"
                        size="small"
                        @click="goToAddFriend"
                      >
                        添加好友
                      </van-button>
                    </template>
                  </van-empty>
                </div>
              </van-list>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup>
import { 
  getFriendRequests, 
  getSentFriendRequests, 
  handleFriendRequest, 
  cancelFriendRequest as cancelRequest 
} from '@/api/social'
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { useSocialStore } from '@/store/social'
import { showNotify, showToast } from 'vant'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const router = useRouter()
const socialStore = useSocialStore()

// 本地状态
const activeTab = ref('received')
const receivedRequests = ref([])
const sentRequests = ref([])
const receivedPage = ref(1)
const sentPage = ref(1)
const pageSize = 20
const receivedFinished = ref(false)
const sentFinished = ref(false)

// 加载状态
const loading = reactive({
  received: true,
  sent: true,
  receivedMore: false,
  sentMore: false
})

// 加载收到的好友请求
const loadReceivedRequests = async (reset = false) => {
  if (reset) {
    receivedPage.value = 1
    receivedFinished.value = false
    loading.received = true
  }
  
  try {
    const response = await getFriendRequests({
      page: receivedPage.value,
      limit: pageSize
    })
    
    if (response.code === 200) {
      const { items, total } = response.data
      
      if (reset) {
        receivedRequests.value = items || []
      } else {
        receivedRequests.value = [...receivedRequests.value, ...(items || [])]
      }
      
      // 更新加载状态
      receivedPage.value++
      receivedFinished.value = receivedRequests.value.length >= total
      
      // 更新Store中的请求数量
      const pendingCount = receivedRequests.value.filter(req => req.status === 'pending').length
      socialStore.setFriendRequestCount(pendingCount)
    } else {
      showToast(response.message || '加载好友请求失败')
    }
  } catch (error) {
    console.error('加载好友请求失败:', error)
    showToast('加载好友请求失败，请稍后重试')
  } finally {
    loading.received = false
    loading.receivedMore = false
  }
}

// 加载发送的好友请求
const loadSentRequests = async (reset = false) => {
  if (reset) {
    sentPage.value = 1
    sentFinished.value = false
    loading.sent = true
  }
  
  try {
    const response = await getSentFriendRequests({
      page: sentPage.value,
      limit: pageSize
    })
    
    if (response.code === 200) {
      const { items, total } = response.data
      
      if (reset) {
        sentRequests.value = items || []
      } else {
        sentRequests.value = [...sentRequests.value, ...(items || [])]
      }
      
      // 更新加载状态
      sentPage.value++
      sentFinished.value = sentRequests.value.length >= total
    } else {
      showToast(response.message || '加载发送的好友请求失败')
    }
  } catch (error) {
    console.error('加载发送的好友请求失败:', error)
    showToast('加载发送的好友请求失败，请稍后重试')
  } finally {
    loading.sent = false
    loading.sentMore = false
  }
}

// 加载更多收到的请求
const loadMoreReceived = () => {
  if (receivedFinished.value) return
  
  loading.receivedMore = true
  loadReceivedRequests()
}

// 加载更多发送的请求
const loadMoreSent = () => {
  if (sentFinished.value) return
  
  loading.sentMore = true
  loadSentRequests()
}

// 处理好友请求
const handleRequest = async (requestId, action) => {
  try {
    const response = await handleFriendRequest({
      requestId,
      action // 'accept' 或 'reject'
    })
    
    if (response.code === 200) {
      // 更新本地状态
      const index = receivedRequests.value.findIndex(req => req.id === requestId)
      
      if (index !== -1) {
        receivedRequests.value[index].status = action === 'accept' ? 'accepted' : 'rejected'
      }
      
      // 显示通知
      showNotify({
        type: 'success',
        message: action === 'accept' ? '已接受好友请求' : '已拒绝好友请求'
      })
      
      // 更新Store中的请求数量和好友列表
      if (action === 'accept') {
        await socialStore.loadFriendList()
      }
      
      const pendingCount = receivedRequests.value.filter(req => req.status === 'pending').length
      socialStore.setFriendRequestCount(pendingCount)
    } else {
      showToast(response.message || '处理好友请求失败')
    }
  } catch (error) {
    console.error('处理好友请求失败:', error)
    showToast('处理好友请求失败，请稍后重试')
  }
}

// 撤回好友请求
const cancelFriendRequest = async (requestId) => {
  try {
    const response = await cancelRequest({
      requestId
    })
    
    if (response.code === 200) {
      // 更新本地状态
      const index = sentRequests.value.findIndex(req => req.id === requestId)
      
      if (index !== -1) {
        sentRequests.value[index].status = 'canceled'
      }
      
      showNotify({
        type: 'success',
        message: '已撤回好友请求'
      })
    } else {
      showToast(response.message || '撤回好友请求失败')
    }
  } catch (error) {
    console.error('撤回好友请求失败:', error)
    showToast('撤回好友请求失败，请稍后重试')
  }
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/user/profile/${userId}`)
}

// 跳转到添加好友页面
const goToAddFriend = () => {
  router.push('/social/add-friend')
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: zhCN
  })
}

// 获取用户名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 获取请求状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '等待验证'
    case 'accepted':
      return '已接受'
    case 'rejected':
      return '已拒绝'
    case 'canceled':
      return '已撤回'
    default:
      return '未知状态'
  }
}

// 初始化页面
onMounted(() => {
  // 加载收到的好友请求
  loadReceivedRequests(true)
  
  // 加载发送的好友请求
  loadSentRequests(true)
})
</script>

<style scoped>
.friend-requests-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.content {
  flex: 1;
  overflow: hidden;
  padding-bottom: 60px;
}

.tab-content {
  height: calc(100vh - 144px);
  overflow-y: auto;
  padding-bottom: 20px;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
  padding: 20px 0;
}

.loading-text {
  margin-top: 12px;
  color: #969799;
  font-size: 14px;
}

.request-cell {
  padding: 12px 16px;
}

.request-header {
  display: flex;
  align-items: center;
}

.request-info {
  margin-left: 12px;
  flex: 1;
}

.request-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.request-message {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.request-time {
  font-size: 12px;
  color: #969799;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.request-status-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.request-status {
  font-size: 14px;
  color: #969799;
}

.action-button {
  min-width: 64px;
}

.avatar-fallback {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: white;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50%;
}
</style>