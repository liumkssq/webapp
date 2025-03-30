<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="新朋友"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
      fixed
      placeholder
    />
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchText"
        placeholder="搜索用户"
        shape="round"
        background="#f5f5f5"
        clearable
        @click="showAddFriend = true"
      />
    </div>
    
    <!-- 请求列表 -->
    <div class="request-list">
      <!-- 空状态 -->
      <div v-if="requests.length === 0" class="empty-state">
        <van-empty description="暂无好友申请" />
        <van-button type="primary" size="small" @click="showAddFriend = true">添加好友</van-button>
      </div>
      
      <!-- 列表内容 -->
      <van-list
        v-else
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div 
          v-for="request in requests" 
          :key="request.id" 
          class="request-item"
        >
          <div class="user-info" @click="viewUserProfile(request.userId)">
            <van-image
              round
              width="50"
              height="50"
              :src="request.avatar"
              fit="cover"
            >
              <template #error>
                <div class="avatar-fallback">{{ getInitials(request.name) }}</div>
              </template>
            </van-image>
            
            <div class="request-content">
              <div class="request-name">{{ request.name }}</div>
              <div class="request-message">{{ request.message }}</div>
              <div class="request-time">{{ formatTime(request.time) }}</div>
            </div>
          </div>
          
          <div class="request-actions">
            <!-- 待处理状态 -->
            <template v-if="request.status === 'pending'">
              <van-button 
                type="primary" 
                size="small" 
                @click="handleRequest(request.id, 'accept')"
                :loading="acceptingId === request.id"
              >
                接受
              </van-button>
              <van-button 
                plain 
                type="default" 
                size="small" 
                @click="handleRequest(request.id, 'reject')"
                :loading="rejectingId === request.id"
              >
                拒绝
              </van-button>
            </template>
            
            <!-- 已处理状态 -->
            <template v-else>
              <div class="status-tag" :class="request.status">
                {{ request.status === 'accepted' ? '已添加' : '已拒绝' }}
              </div>
            </template>
          </div>
        </div>
      </van-list>
    </div>
    
    <!-- 添加好友弹窗 -->
    <van-popup
      v-model:show="showAddFriend"
      round
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="popup-header">
        <div class="popup-title">添加好友</div>
        <van-icon name="cross" class="close-icon" @click="showAddFriend = false" />
      </div>
      
      <div class="popup-content">
        <van-search
          v-model="addFriendSearchText"
          placeholder="搜索用户名/ID"
          shape="round"
          clearable
          @search="searchUsers"
        />
        
        <div class="search-results">
          <van-empty v-if="searchResults.length === 0 && hasSearched" description="未找到用户" />
          <van-loading v-if="searching" size="24px" vertical>搜索中...</van-loading>
          
          <div v-if="!searching && searchResults.length > 0" class="user-list">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-item"
            >
              <van-image
                round
                width="50"
                height="50"
                :src="user.avatar"
                fit="cover"
                @click="viewUserProfile(user.id)"
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(user.name) }}</div>
                </template>
              </van-image>
              
              <div class="user-info" @click="viewUserProfile(user.id)">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-detail">{{ user.school }} · {{ user.department }}</div>
              </div>
              
              <van-button
                class="add-btn"
                size="small"
                :type="user.isFriend ? 'default' : 'primary'"
                :disabled="user.isFriend"
                @click="sendFriendRequest(user)"
              >
                {{ user.isFriend ? '已添加' : '添加' }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
    
    <!-- 发送好友申请弹窗 -->
    <van-dialog
      v-model:show="showSendRequestDialog"
      title="发送好友申请"
      show-cancel-button
      @confirm="confirmSendRequest"
    >
      <van-field
        v-model="requestMessage"
        type="textarea"
        placeholder="请输入验证信息"
        rows="3"
        autosize
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import { getFriendRequests, handleFriendRequest, searchUsers as apiSearchUsers, sendFriendRequest as apiSendFriendRequest } from '@/api/im'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// 配置dayjs
dayjs.extend(relativeTime)

const router = useRouter()
const searchText = ref('')
const addFriendSearchText = ref('')
const requests = ref([])
const finished = ref(false)
const page = ref(1)
const showAddFriend = ref(false)
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const showSendRequestDialog = ref(false)
const requestMessage = ref('')
const userToAdd = ref(null)
const acceptingId = ref(null)
const rejectingId = ref(null)

// 加载好友请求列表
const loadRequests = async () => {
  try {
    const response = await getFriendRequests()
    if (response.code === 200) {
      requests.value = response.data.list
      finished.value = true // 一次性加载完毕
    } else {
      showToast(response.message || '获取好友请求失败')
    }
  } catch (error) {
    console.error('获取好友请求失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 加载更多
const onLoad = () => {
  // 模拟分页，实际项目中应该调用API获取更多数据
  setTimeout(() => {
    finished.value = true
  }, 500)
}

// 处理好友请求
const handleRequest = async (requestId, action) => {
  if (action === 'accept') {
    acceptingId.value = requestId
  } else {
    rejectingId.value = requestId
  }
  
  try {
    const response = await handleFriendRequest({
      requestId,
      action
    })
    
    if (response.code === 200) {
      // 更新请求状态
      const index = requests.value.findIndex(req => req.id === requestId)
      if (index !== -1) {
        requests.value[index].status = action === 'accept' ? 'accepted' : 'rejected'
      }
      
      showSuccessToast(action === 'accept' ? '已添加好友' : '已拒绝申请')
    } else {
      showToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error('处理好友请求失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    acceptingId.value = null
    rejectingId.value = null
  }
}

// 搜索用户
const searchUsers = async () => {
  if (!addFriendSearchText.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  searching.value = true
  hasSearched.value = true
  
  try {
    const response = await apiSearchUsers(addFriendSearchText.value)
    if (response.code === 200) {
      searchResults.value = response.data.list
    } else {
      showToast(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    searching.value = false
  }
}

// 准备发送好友申请
const sendFriendRequest = (user) => {
  userToAdd.value = user
  requestMessage.value = `我是${localStorage.getItem('userName') || '新用户'}，请求添加您为好友`
  showSendRequestDialog.value = true
}

// 确认发送好友申请
const confirmSendRequest = async () => {
  if (!userToAdd.value) return
  
  const loading = showLoadingToast({
    message: '发送申请中...',
    forbidClick: true
  })
  
  try {
    const response = await apiSendFriendRequest({
      userId: userToAdd.value.id,
      message: requestMessage.value
    })
    
    if (response.code === 200) {
      showSuccessToast('好友申请已发送')
      
      // 更新搜索结果，防止重复发送申请
      const index = searchResults.value.findIndex(u => u.id === userToAdd.value.id)
      if (index !== -1) {
        searchResults.value[index].isFriend = true
      }
    } else {
      showToast(response.message || '发送申请失败')
    }
  } catch (error) {
    console.error('发送好友申请失败:', error)
    showToast('网络错误，请稍后重试')
  } finally {
    closeToast(loading)
    userToAdd.value = null
  }
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/im/user/${userId}`)
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = dayjs(time)
  const now = dayjs()
  
  if (date.isAfter(now.subtract(1, 'day'))) {
    // 1天内，显示相对时间
    return date.fromNow()
  } else if (date.isAfter(now.subtract(7, 'day'))) {
    // 7天内，显示星期几
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.day()]
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD')
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD')
  }
}

// 组件挂载时获取数据
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

.search-bar {
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #f5f5f5;
}

.request-list {
  flex: 1;
  overflow: auto;
  padding: 0.5rem 1rem;
}

.empty-state {
  height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.request-item {
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 0.8rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-info {
  display: flex;
  margin-bottom: 0.8rem;
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

.request-content {
  flex: 1;
  margin-left: 0.8rem;
}

.request-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.request-message {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.request-time {
  font-size: 0.8rem;
  color: #999;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}

.status-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-tag.accepted {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-tag.rejected {
  background-color: #f5f5f5;
  color: #9e9e9e;
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
}

.search-results {
  padding: 1rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-list {
  width: 100%;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.user-info {
  flex: 1;
  margin-left: 1rem;
  cursor: pointer;
}

.user-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.user-detail {
  font-size: 0.8rem;
  color: #888;
}

.add-btn {
  flex-shrink: 0;
}
</style>