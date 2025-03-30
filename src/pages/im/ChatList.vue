<template>
  <div class="chat-list-page">
    <van-nav-bar
      title="消息"
      fixed
      :border="false"
    >
      <template #right>
        <van-icon name="plus" size="18" @click="showActionSheet = true" />
      </template>
    </van-nav-bar>
    
    <div class="content">
      <!-- 搜索框 -->
      <div class="search-container">
        <van-search
          v-model="searchText"
          placeholder="搜索"
          shape="round"
          background="transparent"
          @focus="goToSearch"
        />
      </div>
      
      <!-- 会话列表 -->
      <div class="conversation-list">
        <van-empty v-if="loading" description="加载中...">
          <template #image>
            <van-loading type="spinner" size="36" />
          </template>
        </van-empty>
        
        <van-empty 
          v-else-if="conversations.length === 0" 
          description="暂无会话" 
          image="search"
        />
        
        <template v-else>
          <!-- 置顶会话 -->
          <template v-if="stickyConversations.length > 0">
            <div class="sticky-section">
              <van-swipe-cell
                v-for="item in stickyConversations"
                :key="item.id"
                :before-close="(position, done) => beforeClose(position, done, item)"
              >
                <template #right>
                  <div class="delete-button" @click.stop="handleDeleteConversation(item)">
                    删除
                  </div>
                </template>
                
                <div class="conversation-item sticky" @click="goToConversation(item)">
                  <div 
                    v-if="item.type === 'private'"
                    class="conversation-avatar"
                  >
                    <van-badge :content="item.unreadCount > 0 && !item.isMuted ? item.unreadCount : ''" :max="99">
                      <van-image
                        round
                        width="3rem"
                        height="3rem"
                        :src="item.targetInfo.avatar"
                        fit="cover"
                      >
                        <template #error>
                          <div class="avatar-fallback">{{ getInitials(item.targetInfo.name) }}</div>
                        </template>
                      </van-image>
                    </van-badge>
                    <div v-if="onlineStatus[item.targetInfo.id]" :class="['online-status', onlineStatus[item.targetInfo.id]]"></div>
                  </div>
                  
                  <div
                    v-else
                    class="conversation-avatar"
                  >
                    <van-badge :content="item.unreadCount > 0 && !item.isMuted ? item.unreadCount : ''" :max="99">
                      <van-image
                        round
                        width="3rem"
                        height="3rem"
                        :src="item.targetInfo.avatar || groupAvatarFallback"
                        fit="cover"
                      >
                        <template #error>
                          <div class="avatar-fallback">
                            <van-icon name="friends-o" size="1.5rem" />
                          </div>
                        </template>
                      </van-image>
                    </van-badge>
                  </div>
                  
                  <div class="conversation-content">
                    <div class="conversation-header">
                      <span class="name">{{ item.targetInfo.name }}</span>
                      <span class="time">{{ formatTime(item.lastActiveTime) }}</span>
                    </div>
                    
                    <div class="conversation-footer">
                      <div class="message">
                        <span v-if="item.lastMessage">
                          <template v-if="item.type === 'group' && item.lastMessage.senderId !== currentUserId">
                            <span class="sender-name">{{ item.lastMessage.senderName }}: </span>
                          </template>
                          <template v-if="item.lastMessage.type === 'text'">
                            {{ item.lastMessage.content }}
                          </template>
                          <template v-else-if="item.lastMessage.type === 'image'">
                            [图片]
                          </template>
                          <template v-else-if="item.lastMessage.type === 'voice'">
                            [语音]
                          </template>
                          <template v-else-if="item.lastMessage.type === 'file'">
                            [文件]
                          </template>
                          <template v-else-if="item.lastMessage.type === 'location'">
                            [位置]
                          </template>
                          <template v-else-if="item.lastMessage.type === 'video'">
                            [视频]
                          </template>
                          <template v-else>
                            [未知消息]
                          </template>
                        </span>
                        <span v-else class="no-message">暂无消息</span>
                      </div>
                      
                      <div class="status-icons">
                        <van-icon v-if="item.isMuted" name="volume-mute" class="status-icon mute" />
                        <div class="sticky-indicator"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </van-swipe-cell>
            </div>
            
            <div class="divider" v-if="normalConversations.length > 0"></div>
          </template>
          
          <!-- 普通会话 -->
          <van-swipe-cell
            v-for="item in normalConversations"
            :key="item.id"
            :before-close="(position, done) => beforeClose(position, done, item)"
          >
            <template #right>
              <div class="delete-button" @click.stop="handleDeleteConversation(item)">
                删除
              </div>
            </template>
            
            <div class="conversation-item" @click="goToConversation(item)">
              <div 
                v-if="item.type === 'private'"
                class="conversation-avatar"
              >
                <van-badge :content="item.unreadCount > 0 && !item.isMuted ? item.unreadCount : ''" :max="99">
                  <van-image
                    round
                    width="3rem"
                    height="3rem"
                    :src="item.targetInfo.avatar"
                    fit="cover"
                  >
                    <template #error>
                      <div class="avatar-fallback">{{ getInitials(item.targetInfo.name) }}</div>
                    </template>
                  </van-image>
                </van-badge>
                <div v-if="onlineStatus[item.targetInfo.id]" :class="['online-status', onlineStatus[item.targetInfo.id]]"></div>
              </div>
              
              <div
                v-else
                class="conversation-avatar"
              >
                <van-badge :content="item.unreadCount > 0 && !item.isMuted ? item.unreadCount : ''" :max="99">
                  <van-image
                    round
                    width="3rem"
                    height="3rem"
                    :src="item.targetInfo.avatar || groupAvatarFallback"
                    fit="cover"
                  >
                    <template #error>
                      <div class="avatar-fallback">
                        <van-icon name="friends-o" size="1.5rem" />
                      </div>
                    </template>
                  </van-image>
                </van-badge>
              </div>
              
              <div class="conversation-content">
                <div class="conversation-header">
                  <span class="name">{{ item.targetInfo.name }}</span>
                  <span class="time">{{ formatTime(item.lastActiveTime) }}</span>
                </div>
                
                <div class="conversation-footer">
                  <div class="message">
                    <span v-if="item.lastMessage">
                      <template v-if="item.type === 'group' && item.lastMessage.senderId !== currentUserId">
                        <span class="sender-name">{{ item.lastMessage.senderName }}: </span>
                      </template>
                      <template v-if="item.lastMessage.type === 'text'">
                        {{ item.lastMessage.content }}
                      </template>
                      <template v-else-if="item.lastMessage.type === 'image'">
                        [图片]
                      </template>
                      <template v-else-if="item.lastMessage.type === 'voice'">
                        [语音]
                      </template>
                      <template v-else-if="item.lastMessage.type === 'file'">
                        [文件]
                      </template>
                      <template v-else-if="item.lastMessage.type === 'location'">
                        [位置]
                      </template>
                      <template v-else-if="item.lastMessage.type === 'video'">
                        [视频]
                      </template>
                      <template v-else>
                        [未知消息]
                      </template>
                    </span>
                    <span v-else class="no-message">暂无消息</span>
                  </div>
                  
                  <div class="status-icons">
                    <van-icon v-if="item.isMuted" name="volume-mute" class="status-icon mute" />
                  </div>
                </div>
              </div>
            </div>
          </van-swipe-cell>
        </template>
      </div>
    </div>
    
    <!-- 操作菜单 -->
    <van-action-sheet 
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      @select="onActionSelect"
    />
    
    <!-- 长按菜单 -->
    <van-action-sheet 
      v-model:show="showContextMenu"
      :actions="contextMenuActions"
      cancel-text="取消"
      close-on-click-action
      @select="onContextMenuSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, showLoadingToast, showToast, closeToast } from 'vant'
import dayjs from 'dayjs'
import { 
  getConversationList, 
  deleteConversationByType,
  setConversationSticky, 
  setConversationMuted, 
  getUserOnlineStatus 
} from '@/api/im'

const router = useRouter()

// 当前用户信息
const currentUserId = 1 // 假设当前用户ID为1

// 状态变量
const loading = ref(true)
const conversations = ref([])
const searchText = ref('')
const showActionSheet = ref(false)
const showContextMenu = ref(false)
const selectedConversation = ref(null)
const onlineStatus = ref({})
const onlineStatusTimer = ref(null)
const groupAvatarFallback = 'https://img01.yzcdn.cn/vant/cat.jpeg'

// 操作菜单
const actions = [
  { name: '新建群聊', icon: 'friends-o' },
  { name: '添加好友', icon: 'contact' }
]

// 上下文菜单（长按会话项）
const contextMenuActions = computed(() => {
  if (!selectedConversation.value) return []
  
  const item = selectedConversation.value
  return [
    { name: item.isSticky ? '取消置顶' : '置顶', color: item.isSticky ? '#323233' : '#1989fa' },
    { name: item.isMuted ? '取消免打扰' : '消息免打扰', color: item.isMuted ? '#323233' : '#1989fa' },
    { name: '删除会话', color: '#ee0a24' }
  ]
})

// 分为置顶会话和普通会话
const stickyConversations = computed(() => {
  return conversations.value.filter(item => item.isSticky)
})

const normalConversations = computed(() => {
  return conversations.value.filter(item => !item.isSticky)
})

// 获取会话列表
const fetchConversations = async () => {
  loading.value = true
  try {
    const { data } = await getConversationList()
    conversations.value = data || []
    
    // 获取在线状态
    updateOnlineStatus()
  } catch (error) {
    console.error('获取会话列表失败:', error)
    showToast('获取会话列表失败')
  } finally {
    loading.value = false
  }
}

// 更新在线状态
const updateOnlineStatus = async () => {
  const privateConversations = conversations.value.filter(conv => conv.type === 'private')
  if (privateConversations.length === 0) return
  
  const userIds = privateConversations.map(conv => conv.targetInfo.id)
  
  try {
    const { data } = await getUserOnlineStatus(userIds)
    onlineStatus.value = data || {}
  } catch (error) {
    console.error('获取在线状态失败:', error)
  }
}

// 处理滑动删除前确认
const beforeClose = (position, done, item) => {
  if (position === 'right') {
    Dialog.confirm({
      title: '删除提示',
      message: '确定要删除这个会话吗？',
      beforeClose: (action, _, done) => {
        if (action === 'confirm') {
          deleteConversationByType(item.type, item.targetId)
            .then(() => {
              done()
            })
            .catch(() => {
              done(false)
            })
        } else {
          done()
        }
      }
    })
  } else {
    done()
  }
}

// 删除会话
const handleDeleteConversation = async (item) => {
  if (!item) return
  
  try {
    const loadingToast = showLoadingToast({
      message: '删除中...',
      forbidClick: true
    })
    
    await deleteConversationByType(item.type, item.targetId)
    conversations.value = conversations.value.filter(conv => conv.id !== item.id)
    
    closeToast(loadingToast)
    showToast('删除成功')
  } catch (error) {
    console.error('删除会话失败:', error)
    showToast('删除失败')
  }
}

// 获取姓名首字母
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const messageTime = dayjs(timestamp)
  const now = dayjs()
  
  // 今天的消息，显示时间
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm')
  }
  
  // 昨天的消息
  if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  }
  
  // 一周内的消息，显示星期几
  if (messageTime.isAfter(now.subtract(7, 'day'))) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[messageTime.day()]
  }
  
  // 一周以上的消息，显示日期
  return messageTime.format('MM-DD')
}

// 跳转到会话
const goToConversation = (item) => {
  if (item.type === 'private') {
    router.push(`/im/chat/${item.type}/${item.targetId}`)
  } else {
    router.push(`/im/chat/${item.type}/${item.targetId}`)
  }
}

// 跳转到搜索页
const goToSearch = () => {
  router.push('/im/search')
}

// 处理操作菜单选择
const onActionSelect = (action) => {
  if (action.name === '新建群聊') {
    router.push('/im/create-group')
  } else if (action.name === '添加好友') {
    router.push('/im/add-friend')
  }
}

// 长按会话显示上下文菜单
const showConversationContextMenu = (item) => {
  selectedConversation.value = item
  showContextMenu.value = true
}

// 处理上下文菜单选择
const onContextMenuSelect = async (action) => {
  if (!selectedConversation.value) return
  
  const item = selectedConversation.value
  
  if (action.name === '置顶' || action.name === '取消置顶') {
    try {
      await setConversationSticky(item.type, item.targetId, !item.isSticky)
      // 更新本地状态
      const index = conversations.value.findIndex(conv => conv.id === item.id)
      if (index !== -1) {
        conversations.value[index].isSticky = !item.isSticky
      }
    } catch (error) {
      console.error('设置置顶状态失败:', error)
      showToast('操作失败')
    }
  } else if (action.name === '消息免打扰' || action.name === '取消免打扰') {
    try {
      await setConversationMuted(item.type, item.targetId, !item.isMuted)
      // 更新本地状态
      const index = conversations.value.findIndex(conv => conv.id === item.id)
      if (index !== -1) {
        conversations.value[index].isMuted = !item.isMuted
      }
    } catch (error) {
      console.error('设置免打扰状态失败:', error)
      showToast('操作失败')
    }
  } else if (action.name === '删除会话') {
    handleDeleteConversation(item)
  }
  
  selectedConversation.value = null
}

// 生命周期钩子
onMounted(() => {
  fetchConversations()
  
  // 定时更新在线状态
  onlineStatusTimer.value = setInterval(() => {
    if (conversations.value.length > 0) {
      updateOnlineStatus()
    }
  }, 30000) // 每30秒更新一次
})

onBeforeUnmount(() => {
  if (onlineStatusTimer.value) {
    clearInterval(onlineStatusTimer.value)
    onlineStatusTimer.value = null
  }
})
</script>

<style scoped>
.chat-list-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  background-color: #f7f8fa;
}

.content {
  margin-top: 46px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.search-container {
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f7f8fa;
}

.conversation-list {
  padding-bottom: 50px; /* 为底部留出空间 */
}

.conversation-item {
  display: flex;
  padding: 0.75rem 1rem;
  background-color: #fff;
  position: relative;
}

.conversation-item.sticky {
  background-color: #f8f8f8;
}

.conversation-avatar {
  position: relative;
  margin-right: 0.75rem;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  color: #909399;
  border-radius: 50%;
  font-weight: bold;
}

.online-status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  border: 2px solid #fff;
}

.online-status.online {
  background-color: #07c160;
}

.online-status.busy {
  background-color: #ff9900;
}

.online-status.offline {
  background-color: #c8c9cc;
}

.conversation-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.name {
  font-weight: 500;
  font-size: 1rem;
  color: #323233;
}

.time {
  font-size: 0.75rem;
  color: #969799;
}

.conversation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message {
  color: #646566;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
}

.no-message {
  color: #c8c9cc;
  font-style: italic;
}

.sender-name {
  color: #1989fa;
  font-weight: 500;
}

.status-icons {
  display: flex;
  align-items: center;
}

.status-icon {
  margin-left: 0.5rem;
  color: #969799;
}

.mute {
  font-size: 1.125rem;
}

.sticky-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #ff9900;
  margin-left: 0.5rem;
}

.divider {
  height: 8px;
  background-color: #f7f8fa;
}

.delete-button {
  height: 100%;
  width: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ee0a24;
  color: #fff;
}
</style> 