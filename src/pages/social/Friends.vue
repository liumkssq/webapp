<template>
  <div class="friends-page">
    <!-- 头部导航 -->
    <header-nav title="好友" />
    
    <!-- 主要内容 -->
    <div class="content">
      <!-- 搜索框 -->
      <div class="search-bar">
        <van-search
          v-model="searchText"
          placeholder="搜索好友"
          shape="round"
          clearable
          @input="handleSearch"
        />
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          type="primary"
          plain
          round
          size="small"
          icon="plus"
          @click="goToAddFriend"
        >
          添加好友
        </van-button>
        
        <van-button
          type="primary"
          plain
          round
          size="small"
          icon="friends-o"
          @click="goToFriendRequests"
          :badge="friendRequestCount > 0 ? friendRequestCount : ''"
        >
          好友请求
        </van-button>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" color="#1989fa" />
        <p class="loading-text">加载中...</p>
      </div>
      
      <!-- 好友列表 -->
      <div v-else class="friends-list">
        <!-- 在线好友 -->
        <template v-if="onlineFriends.length > 0">
          <div class="section-title">
            <div>在线好友</div>
            <div class="section-count">{{ onlineFriends.length }}人</div>
          </div>
          
          <van-cell-group>
            <van-cell
              v-for="friend in onlineFriends"
              :key="friend.id"
              :title="friend.name || friend.nickname"
              clickable
              @click="showFriendActions(friend)"
            >
              <!-- 好友头像 -->
              <template #icon>
                <div class="friend-avatar">
                  <van-badge dot color="#07c160">
                    <van-image
                      round
                      width="40"
                      height="40"
                      :src="friend.avatar"
                      fit="cover"
                    >
                      <template #error>
                        <div class="avatar-fallback">{{ getInitials(friend.name || friend.nickname) }}</div>
                      </template>
                    </van-image>
                  </van-badge>
                </div>
              </template>
              
              <!-- 备注信息 -->
              <template #label>
                <div class="friend-remark" v-if="friend.remark">{{ friend.remark }}</div>
              </template>
              
              <!-- 操作按钮 -->
              <template #right-icon>
                <van-button
                  type="primary"
                  size="small"
                  icon="chat-o"
                  plain
                  round
                  @click.stop="startChat(friend.id)"
                >
                  聊天
                </van-button>
              </template>
            </van-cell>
          </van-cell-group>
        </template>
        
        <!-- 所有好友 -->
        <div class="section-title">
          <div>所有好友</div>
          <div class="section-count">{{ friends.length }}人</div>
        </div>
        
        <template v-if="friends.length > 0">
          <van-index-bar :index-list="indexList">
            <template v-for="group in groupedFriends" :key="group.letter">
              <van-index-anchor :index="group.letter" />
              <van-cell
                v-for="friend in group.friends"
                :key="friend.id"
                :title="friend.name || friend.nickname"
                clickable
                @click="showFriendActions(friend)"
              >
                <!-- 好友头像 -->
                <template #icon>
                  <div class="friend-avatar">
                    <van-badge :dot="isOnline(friend.id)" color="#07c160">
                      <van-image
                        round
                        width="40"
                        height="40"
                        :src="friend.avatar"
                        fit="cover"
                      >
                        <template #error>
                          <div class="avatar-fallback">{{ getInitials(friend.name || friend.nickname) }}</div>
                        </template>
                      </van-image>
                    </van-badge>
                  </div>
                </template>
                
                <!-- 备注信息 -->
                <template #label>
                  <div class="friend-remark" v-if="friend.remark">{{ friend.remark }}</div>
                </template>
                
                <!-- 操作按钮 -->
                <template #right-icon>
                  <van-button
                    type="primary"
                    size="small"
                    icon="chat-o"
                    plain
                    round
                    @click.stop="startChat(friend.id)"
                  >
                    聊天
                  </van-button>
                </template>
              </van-cell>
            </template>
          </van-index-bar>
        </template>
        
        <!-- 空状态 -->
        <div v-else class="empty-container">
          <van-empty
            image="search"
            description="暂无好友，快去添加吧"
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
      </div>
    </div>
    
    <!-- 好友操作弹窗 -->
    <van-action-sheet
      v-model:show="actionVisible"
      :actions="friendActions"
      cancel-text="取消"
      close-on-click-action
      @select="handleActionSelect"
    />
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup>
import { setRemark, deleteFriend, getFriendList, getFriendsOnlineStatus } from '@/api/social'
import { setUpUserConversation } from '@/api/im'
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import { useSocialStore } from '@/store/social'
import { Dialog, showNotify, showToast } from 'vant'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const socialStore = useSocialStore()

// 本地状态
const loading = ref(true)
const searchText = ref('')
const actionVisible = ref(false)
const currentFriend = ref(null)
const indexList = ref([]) // 索引列表
const onlineUserIds = ref([]) // 在线用户ID列表

// 从store获取数据
const friends = computed(() => {
  if (!searchText.value) {
    return socialStore.friends
  }
  
  // 过滤搜索结果
  return socialStore.friends.filter(friend => 
    (friend.name && friend.name.toLowerCase().includes(searchText.value.toLowerCase())) ||
    (friend.nickname && friend.nickname.toLowerCase().includes(searchText.value.toLowerCase())) ||
    (friend.remark && friend.remark.toLowerCase().includes(searchText.value.toLowerCase()))
  )
})

// 好友请求数量
const friendRequestCount = computed(() => socialStore.friendRequestCount)

// 获取在线好友列表
const onlineFriends = computed(() => {
  return friends.value.filter(friend => isOnline(friend.id))
})

// 按字母分组好友列表
const groupedFriends = computed(() => {
  const groups = {}
  
  friends.value.forEach(friend => {
    const name = friend.name || friend.nickname || ''
    let firstChar = name.charAt(0).toUpperCase()
    
    // 如果不是字母，归类到 '#'
    if (!/[A-Z]/.test(firstChar)) {
      firstChar = '#'
    }
    
    if (!groups[firstChar]) {
      groups[firstChar] = {
        letter: firstChar,
        friends: []
      }
    }
    
    groups[firstChar].friends.push(friend)
  })
  
  // 更新索引列表
  indexList.value = Object.keys(groups).sort()
  
  // 返回排序后的分组
  return Object.values(groups).sort((a, b) => {
    if (a.letter === '#') return 1
    if (b.letter === '#') return -1
    return a.letter.localeCompare(b.letter)
  })
})

// 好友操作列表
const friendActions = computed(() => {
  if (!currentFriend.value) return []
  
  return [
    { name: '发送消息', color: '#1989fa', icon: 'chat-o' },
    { name: '设置备注', icon: 'edit' },
    { name: '删除好友', color: '#ee0a24', icon: 'delete-o' }
  ]
})

// 检查好友是否在线
const isOnline = (userId) => {
  return onlineUserIds.value.includes(userId)
}

// 加载好友列表
const loadFriends = async () => {
  loading.value = true
  
  try {
    // 加载好友列表
    await socialStore.loadFriendList()
    
    // 加载好友请求
    await socialStore.loadFriendRequests()
    
    // 加载好友在线状态
    await loadOnlineStatus()
  } catch (error) {
    console.error('加载好友列表失败:', error)
    showToast('加载好友列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载好友在线状态
const loadOnlineStatus = async () => {
  try {
    const response = await getFriendsOnlineStatus()
    
    if (response.code === 200 && response.data) {
      onlineUserIds.value = response.data.onlineUserIds || []
    }
  } catch (error) {
    console.error('获取好友在线状态失败:', error)
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 获取名字首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 显示好友操作菜单
const showFriendActions = (friend) => {
  currentFriend.value = friend
  actionVisible.value = true
}

// 处理操作选择
const handleActionSelect = async (action) => {
  if (!currentFriend.value) return
  
  switch (action.name) {
    case '发送消息':
      startChat(currentFriend.value.id)
      break
      
    case '设置备注':
      setFriendRemark()
      break
      
    case '删除好友':
      confirmDeleteFriend()
      break
  }
}

// 开始聊天
const startChat = async (friendId) => {
  try {
    const response = await setUpUserConversation({
      targetUserId: friendId
    })
    
    if (response.code === 200 && response.data) {
      const conversationId = response.data.conversationId
      router.push(`/im/chat/${conversationId}`)
    } else {
      showToast(response.message || '创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    showToast('创建会话失败，请稍后重试')
  }
}

// 设置好友备注
const setFriendRemark = () => {
  Dialog.prompt({
    title: '设置备注',
    message: `为 ${currentFriend.value.name || currentFriend.value.nickname} 设置备注`,
    showCancelButton: true,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    defaultValue: currentFriend.value.remark || '',
  }).then(async ({ value }) => {
    try {
      const response = await setRemark({
        friendId: currentFriend.value.id,
        remark: value
      })
      
      if (response.code === 200) {
        showNotify({
          type: 'success',
          message: '设置备注成功'
        })
        
        // 更新本地数据
        await socialStore.loadFriendList()
      } else {
        showToast(response.message || '设置备注失败')
      }
    } catch (error) {
      console.error('设置备注失败:', error)
      showToast('设置备注失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 确认删除好友
const confirmDeleteFriend = () => {
  Dialog.confirm({
    title: '删除好友',
    message: `确定要删除好友"${currentFriend.value.name || currentFriend.value.nickname}"吗？`,
    confirmButtonText: '删除',
    confirmButtonColor: '#ee0a24',
  }).then(async () => {
    try {
      const response = await deleteFriend({
        friendId: currentFriend.value.id
      })
      
      if (response.code === 200) {
        showNotify({
          type: 'success',
          message: '删除好友成功'
        })
        
        // 更新本地数据
        await socialStore.loadFriendList()
      } else {
        showToast(response.message || '删除好友失败')
      }
    } catch (error) {
      console.error('删除好友失败:', error)
      showToast('删除好友失败，请稍后重试')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 跳转到添加好友页面
const goToAddFriend = () => {
  router.push('/social/add-friend')
}

// 跳转到好友请求页面
const goToFriendRequests = () => {
  router.push('/social/friend-requests')
}

// 初始化页面
onMounted(() => {
  // 加载好友列表
  loadFriends()
  
  // 定时刷新好友在线状态
  const intervalId = setInterval(loadOnlineStatus, 60000) // 每分钟刷新一次
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(intervalId)
  })
})
</script>

<style scoped>
.friends-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #f7f8fa;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  color: #969799;
  background-color: #f7f8fa;
}

.section-count {
  font-size: 12px;
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

.friend-avatar {
  margin-right: 12px;
}

.avatar-fallback {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1989fa;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-radius: 50%;
}

.friend-remark {
  font-size: 12px;
  color: #969799;
}
</style>