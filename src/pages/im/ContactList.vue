<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="联系人"
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
        @search="onSearch"
      />
    </div>
    
    <!-- 主要内容 -->
    <div class="contact-content">
      <!-- 功能区域 -->
      <div class="feature-section">
        <van-cell-group inset>
          <van-cell title="新朋友" is-link to="/im/friend-requests" center>
            <template #icon>
              <van-badge :content="newRequestsCount || ''" :show-zero="false">
                <van-icon name="friends-o" size="24" class="cell-icon" />
              </van-badge>
            </template>
            <template #right-icon>
              <div v-if="newRequestsCount > 0" class="new-request-tip">{{newRequestsCount}}个新请求</div>
              <van-icon name="arrow" />
            </template>
          </van-cell>
          <van-cell title="我的群聊" is-link to="/im/groups" center>
            <template #icon>
              <van-icon name="wechat" size="24" class="cell-icon" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
      
      <!-- 好友列表 -->
      <div class="friend-list">
        <van-index-bar :sticky-offset-top="80">
          <div v-for="(friends, initial) in groupedFriends" :key="initial">
            <van-index-anchor :index="initial" />
            <van-cell
              v-for="friend in friends"
              :key="friend.id"
              center
              @click="handleFriendClick(friend)"
            >
              <template #icon>
                <van-image
                  round
                  width="40"
                  height="40"
                  :src="friend.avatar"
                  fit="cover"
                  class="avatar-image"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(friend.name) }}</div>
                  </template>
                </van-image>
              </template>
              <template #title>
                <span class="friend-name">{{ friend.name }}</span>
              </template>
              <template #right-icon>
                <div class="status-indicator" :class="{ 'online': friend.status === 'online' }"></div>
              </template>
            </van-cell>
          </div>
        </van-index-bar>
      </div>
      
      <!-- 添加好友按钮 -->
      <van-fab
        class="add-friend-btn"
        icon="plus"
        color="#007aff"
        @click="showAddFriend = true"
      />
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
              >
                <template #error>
                  <div class="avatar-fallback">{{ getInitials(user.name) }}</div>
                </template>
              </van-image>
              
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-id">ID: {{ user.id }}</div>
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
  </div>
</template>

<script setup>
import { searchUsers as apiSearchUsers, sendFriendRequest as apiSendFriendRequest, getFriendList, getFriendRequests } from '@/api/im'
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchText = ref('')
const addFriendSearchText = ref('')
const friends = ref([])
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const showAddFriend = ref(false)
const newRequestsCount = ref(0)
const friendRequests = ref([])

// 处理user_id格式问题的函数
const parseUserId = (userId) => {
  // 检查是否是Unicode控制字符
  if (typeof userId === 'string' && userId.length === 1 && userId.charCodeAt(0) < 32) {
    // 转换为数字ID
    return userId.charCodeAt(0);
  }
  
  // 如果已经是数字或其他格式，直接返回
  return userId;
}

// 新增：加载好友申请列表
const loadFriendRequests = async () => {
  try {
    const response = await getFriendRequests();
    console.log('好友申请响应:', response);
    
    if (response.code === 200 && response.data && response.data.list) {
      // 处理user_id格式
      friendRequests.value = response.data.list.map(request => ({
        ...request,
        userId: parseUserId(request.user_id), // 转换ID格式
        message: request.req_msg,
        status: request.handle_result === 0 ? 'pending' : 
                request.handle_result === 1 ? 'accepted' : 'rejected'
      }));
      
      // 更新待处理的好友请求数量
      newRequestsCount.value = friendRequests.value.filter(req => req.status === 'pending').length;
      console.log('处理后的好友申请列表:', friendRequests.value);
    } else {
      console.error('获取好友申请列表失败:', response);
    }
  } catch (error) {
    console.error('加载好友申请列表失败:', error);
  }
}

// 分组好友列表（按首字母）
const groupedFriends = computed(() => {
  const grouped = {}
  
  // 过滤好友列表
  const filteredFriends = friends.value.filter(friend => 
    !searchText.value || friend.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
  
  // 按首字母分组
  filteredFriends.forEach(friend => {
    const initial = getInitial(friend.name)
    if (!grouped[initial]) {
      grouped[initial] = []
    }
    grouped[initial].push(friend)
  })
  
  // 对每个分组内的好友进行排序
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => a.name.localeCompare(b.name))
  })
  
  return grouped
})

// 获取首字母
const getInitial = (name) => {
  if (!name) return '#'
  const first = name.charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 搜索好友
const onSearch = () => {
  // 搜索框内的搜索只过滤现有好友列表，不请求API
  console.log('搜索好友：', searchText.value)
}

// 点击好友
const handleFriendClick = (friend) => {
  router.push(`/im/chat/${friend.id}?name=${encodeURIComponent(friend.name)}`)
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
      // 标记已经是好友的用户
      const friendIds = new Set(friends.value.map(f => f.id))
      searchResults.value = response.data.map(user => ({
        ...user,
        isFriend: friendIds.has(user.id)
      }))
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

// 发送好友申请
const sendFriendRequest = async (user) => {
  const loading = showLoadingToast({
    message: '发送申请中...',
    forbidClick: true
  })
  
  try {
    // 确保发送正确格式的数据
    const response = await apiSendFriendRequest({
      user_uid: user.id.toString(), // 确保ID是字符串格式
      req_msg: `我是${localStorage.getItem('userName') || '新用户'}，请求添加您为好友`,
      req_time: Date.now() // 使用当前时间戳
    })
    
    if (response.code === 200) {
      showSuccessToast('好友申请已发送')
      // 更新搜索结果，防止重复发送申请
      const index = searchResults.value.findIndex(u => u.id === user.id)
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
  }
}

// 加载好友列表
const loadFriends = async () => {
  try {
    const response = await getFriendList()
    if (response.code === 200) {
      friends.value = response.data
    } else {
      showToast(response.message || '获取好友列表失败')
    }
  } catch (error) {
    console.error('获取好友列表失败:', error)
    showToast('网络错误，请稍后重试')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('ContactList组件已挂载');
  loadFriends();
  loadFriendRequests(); // 新增：加载好友申请列表
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
  padding: 0.5rem 0;
  position: sticky;
  top: 46px;
  z-index: 10;
  background-color: #f5f5f5;
}

.contact-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.feature-section {
  margin-bottom: 0.5rem;
}

.cell-icon {
  margin-right: 0.5rem;
  color: #007aff;
}

.friend-list {
  background-color: #ffffff;
  border-radius: 8px 8px 0 0;
}

.avatar-image {
  margin-right: 0.75rem;
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

.friend-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #cccccc;
}

.status-indicator.online {
  background-color: #4cd964;
}

.add-friend-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 99;
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
}

.user-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.user-id {
  font-size: 0.8rem;
  color: #888;
}

.add-btn {
  flex-shrink: 0;
}

.new-request-tip {
  margin-right: 0.5rem;
  font-size: 0.8rem;
  color: #ff5722;
  font-weight: 500;
}
</style>