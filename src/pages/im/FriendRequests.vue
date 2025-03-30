<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="新朋友"
      left-arrow
      fixed
      placeholder
      @click-left="onClickLeft"
    />
    
    <!-- 好友申请列表 -->
    <div class="request-list">
      <!-- 下拉刷新 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 空状态 -->
          <van-empty v-if="requests.length === 0 && !loading" description="暂无好友申请" />
          
          <!-- 申请列表项 -->
          <div v-for="request in requests" :key="request.id" class="request-item">
            <div class="request-info">
              <van-image
                round
                width="50"
                height="50"
                :src="request.userAvatar"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(request.userName) }}</div>
                </template>
              </van-image>
              
              <div class="user-info">
                <div class="user-name">{{ request.userName }}</div>
                <div class="request-message">{{ request.message }}</div>
                <div class="request-time">{{ formatTime(request.createTime) }}</div>
              </div>
            </div>
            
            <div class="request-actions">
              <!-- 待处理状态 -->
              <template v-if="request.status === 'pending'">
                <van-button
                  class="action-btn"
                  type="primary"
                  size="small"
                  @click="handleRequest(request.id, 'accept')"
                >
                  接受
                </van-button>
                <van-button
                  class="action-btn"
                  size="small"
                  @click="handleRequest(request.id, 'reject')"
                >
                  拒绝
                </van-button>
              </template>
              
              <!-- 已处理状态 -->
              <div v-else class="status-text" :class="request.status">
                {{ request.status === 'accepted' ? '已接受' : '已拒绝' }}
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { getFriendRequests, handleFriendRequest } from '@/api/im'
import dayjs from '@/utils/dayjs'

const router = useRouter()
const requests = ref([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const page = ref(1)
const pageSize = 20

// 导航返回
const onClickLeft = () => {
  router.back()
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = dayjs(timestamp)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    // 今天，显示时间
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    // 昨天
    return '昨天 ' + date.format('HH:mm')
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD HH:mm')
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD')
  }
}

// 加载好友请求列表
const loadRequests = async (isRefresh = false) => {
  if (refreshing.value || (loading.value && !isRefresh)) return
  
  try {
    const response = await getFriendRequests({
      page: isRefresh ? 1 : page.value,
      pageSize
    })
    
    if (response.code === 200) {
      const { list, total } = response.data
      
      if (isRefresh) {
        requests.value = list
        page.value = 1
      } else {
        requests.value = [...requests.value, ...list]
        page.value += 1
      }
      
      // 判断是否加载完成
      finished.value = requests.value.length >= total
    } else {
      showToast(response.message || '获取好友申请列表失败')
    }
  } catch (error) {
    console.error('获取好友申请列表失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  finished.value = false
  loadRequests(true)
}

// 加载更多
const onLoad = () => {
  loadRequests()
}

// 处理好友申请
const handleRequest = async (requestId, action) => {
  const loading = showLoadingToast({
    message: action === 'accept' ? '接受申请中...' : '拒绝申请中...',
    forbidClick: true
  })
  
  try {
    const response = await handleFriendRequest(requestId, { action })
    
    if (response.code === 200) {
      // 更新本地状态
      const index = requests.value.findIndex(req => req.id === requestId)
      if (index !== -1) {
        requests.value[index].status = action === 'accept' ? 'accepted' : 'rejected'
      }
      
      showSuccessToast(action === 'accept' ? '已添加为好友' : '已拒绝申请')
    } else {
      showToast(response.message || '处理申请失败')
    }
  } catch (error) {
    console.error('处理好友申请失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadRequests()
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.request-list {
  flex: 1;
  overflow: hidden;
}

.request-item {
  background-color: #ffffff;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
}

.request-info {
  display: flex;
  margin-bottom: 0.5rem;
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

.user-info {
  flex: 1;
  margin-left: 1rem;
}

.user-name {
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.request-message {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.request-time {
  font-size: 0.8rem;
  color: #999;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.action-btn {
  margin-left: 0.5rem;
}

.status-text {
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-text.accepted {
  color: #4cd964;
}

.status-text.rejected {
  color: #999;
}
</style>