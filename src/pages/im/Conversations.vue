<template>
  <div class="conversations-page ios-style">
    <!-- 头部导航 -->
    <header-nav title="会话列表">
      <template #right>
        <div class="header-actions">
          <van-icon name="search" size="1.5rem" @click="router.push('/search')" />
          <van-icon name="plus" size="1.5rem" @click="toggleNewChatOptions" />
        </div>
      </template>
    </header-nav>
    
    <!-- 新建聊天选项 -->
    <van-popup v-model:show="showNewChatOptions" position="bottom" round :style="{ height: '30%' }">
      <div class="new-chat-options">
        <div class="option-item" @click="navigateToContactList">
          <van-icon name="friends-o" size="24" />
          <span>选择联系人</span>
        </div>
        <div class="option-item" @click="navigateToGroups">
          <van-icon name="wechat" size="24" />
          <span>选择群聊</span>
        </div>
        <div class="option-item" @click="navigateToFriendRequests">
          <van-badge :content="newFriendRequestsCount || ''" :show-zero="false">
            <van-icon name="add-o" size="24" />
          </van-badge>
          <span>添加好友</span>
        </div>
      </div>
    </van-popup>

    <!-- 消息类型切换 -->
    <div class="message-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'chat' }"
        @click="activeTab = 'chat'"
      >
        聊天消息
        <div v-if="unreadChatCount > 0" class="badge">{{ formatBadge(unreadChatCount) }}</div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'notification' }"
        @click="activeTab = 'notification'"
      >
        通知
        <div v-if="unreadNotificationCount > 0" class="badge">{{ formatBadge(unreadNotificationCount) }}</div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="activeTab === 'chat'">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="- 没有更多会话 -"
          @load="loadMore"
        >
          <!-- 空状态 -->
          <van-empty 
            v-if="conversations.length === 0 && !loading"
            description="暂无会话记录"
            image="chat"
          >
            <template #bottom>
              <van-button round type="primary" size="small" @click="navigateToContactList">开始聊天</van-button>
            </template>
          </van-empty>
          
          <!-- 会话列表 -->
          <div v-else class="conversation-list-container">
            <div 
              v-for="(conversation, index) in conversations" 
              :key="conversation.id"
              class="conversation-item"
              :class="{ unread: conversation.unreadCount > 0 }"
              @click="navigateToChat(conversation)"
              @touchstart="touchStart($event, index)"
              @touchmove="touchMove($event, index)"
              @touchend="touchEnd(index)"
            >
              <!-- 侧滑操作区域 -->
              <div class="swipe-actions" :style="{ transform: `translateX(${swipeOffset[index] || 0}px)` }">
                <div 
                  class="action mark-read" 
                  @click.stop="markAsRead(conversation)"
                  v-if="conversation.unreadCount > 0"
                >
                  标为已读
                </div>
                <div 
                  class="action delete" 
                  @click.stop="deleteConversation(conversation)"
                >
                  删除
                </div>
              </div>
              
              <!-- 会话内容 -->
              <div class="chat-content" :style="{ transform: `translateX(${swipeOffset[index] || 0}px)` }">
                <!-- 头像 -->
                <van-image
                  round
                  width="3rem"
                  height="3rem"
                  :src="conversation.targetInfo?.avatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(conversation.targetInfo?.name) }}</div>
                  </template>
                </van-image>
                
                <!-- 会话信息 -->
                <div class="chat-info">
                  <div class="top-line">
                    <div class="nickname">{{ conversation.targetInfo?.name }}</div>
                    <div class="time">{{ formatTime(conversation.lastMessage?.timestamp) }}</div>
                  </div>
                  
                  <div class="bottom-line">
                    <div class="last-message">
                      <span v-if="conversation.lastMessage">
                        <span v-if="conversation.lastMessage.type === 'text'">
                          {{ truncateText(conversation.lastMessage.content) }}
                        </span>
                        <span v-else-if="conversation.lastMessage.type === 'image'">
                          [图片]
                        </span>
                        <span v-else-if="conversation.lastMessage.type === 'voice'">
                          [语音消息 {{ conversation.lastMessage.duration }}″]
                        </span>
                        <span v-else-if="conversation.lastMessage.type === 'location'">
                          [位置共享]
                        </span>
                        <span v-else>
                          [未知类型消息]
                        </span>
                      </span>
                      <span v-else class="no-message">暂无消息</span>
                    </div>
                    
                    <div v-if="conversation.unreadCount > 0" class="unread-count">
                      {{ formatBadge(conversation.unreadCount) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 通知列表 -->
    <div v-if="activeTab === 'notification'" class="notification-list">
      <van-empty 
        v-if="notifications.length === 0" 
        description="暂无通知" 
        image="comment-o"
      />
      
      <div 
        v-else
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="handleNotification(notification)"
      >
        <div class="notification-icon" :class="notification.type">
          <van-icon :name="getNotificationIcon(notification.type)" size="20" />
        </div>
        
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-text">{{ notification.content }}</div>
          <div class="notification-time">{{ formatTime(notification.time) }}</div>
        </div>
        
        <div v-if="!notification.read" class="unread-indicator"></div>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
// 不再需要 EmptyState 组件，改用 van-empty
import { useUserStore } from '@/store/user'
import { useIMStore } from '@/store/im'
import { getConversationList, markMessageRead, deleteSession, getFriendRequests } from '@/api/im'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const imStore = useIMStore()

// 激活的标签页
const activeTab = ref('chat')

// 会话列表相关状态
const conversations = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = ref(20)

// 新建聊天相关状态
const showNewChatOptions = ref(false)
const newFriendRequestsCount = ref(0)

// 通知列表
const notifications = ref([])

// 侧滑相关状态
const swipeOffset = ref({})
const touchStartX = ref(0)
const currentSwipeIndex = ref(null)
const swipeThreshold = 80 // 触发操作的阈值
const maxSwipeOffset = 150 // 最大侧滑距离

// 获取未读消息总数
const unreadChatCount = computed(() => {
  return conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
})

// 未读通知数
const unreadNotificationCount = computed(() => {
  return notifications.value.filter(notification => !notification.read).length
})

// 监听未读消息总数变化，更新标题栏
watch(unreadChatCount, (count) => {
  document.title = count > 0 ? `(${count}) 消息 - ${import.meta.env.VITE_APP_TITLE || 'IM App'}` : (import.meta.env.VITE_APP_TITLE || 'IM App')
})

// 切换新建聊天选项面板
const toggleNewChatOptions = () => {
  showNewChatOptions.value = !showNewChatOptions.value
}

// 导航到联系人列表
const navigateToContactList = () => {
  showNewChatOptions.value = false
  router.push('/im/contacts')
}

// 导航到群聊列表
const navigateToGroups = () => {
  showNewChatOptions.value = false
  router.push('/im/groups')
}

// 导航到好友申请列表
const navigateToFriendRequests = () => {
  showNewChatOptions.value = false
  router.push('/im/friend-requests')
}

// 导航到聊天界面
const navigateToChat = (conversation) => {
  console.log('点击会话导航:', conversation);
  
  // 确保targetId存在
  if (!conversation.targetId && !conversation.id) {
    showToast('会话信息不完整');
    return;
  }
  
  // 构建targetId，确保是字符串类型
  const targetId = String(conversation.targetId || conversation.id);
  const type = conversation.type || 'private';
  
  // 直接使用window.location而不是router
  const chatUrl = type === 'group' 
    ? `/im/group/${targetId}` 
    : `/im/chat/${targetId}`;
  
  const queryParams = new URLSearchParams({
    name: conversation.targetInfo?.name || '聊天',
    t: Date.now() // 添加时间戳防止缓存
  }).toString();
  
  const fullUrl = `${chatUrl}?${queryParams}`;
  console.log('导航到URL:', fullUrl);
  
  // 使用window.location直接跳转
  window.location.href = fullUrl;
}

// 加载会话列表
const fetchConversations = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1
    finished.value = false
  }
  
  if (finished.value) return
  
  try {
    loading.value = true
    
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    
    const response = await getConversationList(params)
    
    if (response.code === 200) {
      // 从conversationList对象转换为数组形式
      const conversationMap = response.data?.conversationList || {}
      const newConversations = Object.entries(conversationMap).map(([id, conv]) => {
        return {
          id,
          targetId: conv.targetId,
          type: conv.chatType === 1 ? 'private' : 'group',
          unreadCount: conv.unread || 0,
          lastMessage: {
            content: '...',
            time: Date.now()
          },
          targetInfo: {
            id: conv.targetId,
            name: `用户${conv.targetId}`, // 实际应该从用户服务获取用户信息
            avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=user${conv.targetId}`
          }
        }
      })
      
      if (isRefresh) {
        conversations.value = newConversations
      } else {
        conversations.value = [...conversations.value, ...newConversations]
      }
      
      // 由于没有分页信息，我们根据返回的会话数量判断是否还有更多
      finished.value = newConversations.length < pageSize.value
      
      if (newConversations.length > 0) {
        page.value++
      }
    } else {
      showToast('获取会话列表失败')
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    showToast('网络错误，请重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载更多会话
const loadMore = () => {
  fetchConversations()
}

// 下拉刷新
const onRefresh = () => {
  fetchConversations(true)
}

// 获取好友申请数量
const fetchFriendRequests = async () => {
  try {
    const response = await getFriendRequests({ status: 'pending' })
    if (response.code === 200) {
      newFriendRequestsCount.value = response.data.list.length
    }
  } catch (error) {
    console.error('获取好友申请数量失败:', error)
  }
}

// 获取通知列表
const fetchNotifications = async () => {
  try {
    if (!userStore.isLoggedIn) return
    
    // 模拟通知数据
    notifications.value = [
      {
        id: 1,
        type: 'like',
        title: '点赞通知',
        content: '用户张三点赞了你的帖子《校园二手交易平台使用指南》',
        time: '2023-04-18 14:30:00',
        read: false,
        targetType: 'article',
        targetId: 101,
        fromUser: { id: 2, name: '张三' }
      },
      {
        id: 2,
        type: 'comment',
        title: '评论通知',
        content: '用户李四评论了你的帖子《寻找丢失的学生卡》：我在食堂看到过',
        time: '2023-04-17 10:20:00',
        read: true,
        targetType: 'lostFound',
        targetId: 102,
        fromUser: { id: 3, name: '李四' }
      },
      {
        id: 3,
        type: 'system',
        title: '系统通知',
        content: '你发布的商品《二手笔记本电脑》已通过审核',
        time: '2023-04-16 09:15:00',
        read: false,
        targetType: 'product',
        targetId: 103
      }
    ]
  } catch (error) {
    console.error('获取通知列表失败:', error)
  }
}

// 处理通知点击
const handleNotification = (notification) => {
  // 标记为已读
  if (!notification.read) {
    notification.read = true
  }
  
  // 根据通知类型处理跳转
  switch (notification.type) {
    case 'like':
    case 'comment':
      if (notification.targetType === 'article') {
        router.push(`/article/detail/${notification.targetId}`)
      } else if (notification.targetType === 'product') {
        router.push(`/product/detail/${notification.targetId}`)
      } else if (notification.targetType === 'lostFound') {
        router.push(`/lost-found/detail/${notification.targetId}`)
      }
      break
    case 'follow':
      router.push(`/user/${notification.fromUser.id}`)
      break
    case 'system':
      // 系统通知不跳转
      break
    default:
      break
  }
}

// 获取通知图标
const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return 'like-o'
    case 'comment':
      return 'comment-o'
    case 'follow':
      return 'friends-o'
    case 'system':
      return 'info-o'
    default:
      return 'bell'
  }
}

// 标记会话为已读
const markAsRead = async (conversation) => {
  try {
    await markMessageRead({
      conversationId: conversation.id,
      messageId: conversation.lastMessage?.id
    })
    
    // 更新本地数据
    const index = conversations.value.findIndex(c => c.id === conversation.id)
    if (index !== -1) {
      conversations.value[index].unreadCount = 0
    }
    
    resetSwipe()
    // 更新未读数
    const count = conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
    document.title = count > 0 ? `(${count}) 消息 - ${import.meta.env.VITE_APP_TITLE || 'IM App'}` : (import.meta.env.VITE_APP_TITLE || 'IM App')
  } catch (error) {
    console.error('标记已读失败:', error)
    showToast('操作失败，请重试')
  }
}

// 删除会话
const deleteConversation = (conversation) => {
  showDialog({
    title: '删除会话',
    message: '确定要删除此会话吗？聊天记录将不会被删除',
    showCancelButton: true,
  }).then(async () => {
    try {
      await deleteSession({ conversationId: conversation.id })
      
      // 更新本地数据
      conversations.value = conversations.value.filter(c => c.id !== conversation.id)
      
      resetSwipe()
      // 更新未读数
      const count = conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
      document.title = count > 0 ? `(${count}) 消息 - ${import.meta.env.VITE_APP_TITLE || 'IM App'}` : (import.meta.env.VITE_APP_TITLE || 'IM App')
    } catch (error) {
      console.error('删除会话失败:', error)
      showToast('操作失败，请重试')
    }
  }).catch(() => {
    // 取消删除，重置侧滑状态
    resetSwipe()
  })
}

// 侧滑相关方法
const touchStart = (event, index) => {
  touchStartX.value = event.touches[0].clientX
  currentSwipeIndex.value = index
  
  // 重置其他项的侧滑状态
  Object.keys(swipeOffset.value).forEach(key => {
    if (parseInt(key) !== index) {
      swipeOffset.value[key] = 0
    }
  })
}

const touchMove = (event, index) => {
  if (currentSwipeIndex.value !== index) return
  
  const currentX = event.touches[0].clientX
  const diff = currentX - touchStartX.value
  
  // 仅允许左滑（负值）
  if (diff < 0) {
    // 限制最大滑动距离
    const offset = Math.max(diff, -maxSwipeOffset)
    swipeOffset.value[index] = offset
  } else {
    // 右滑归位
    swipeOffset.value[index] = 0
  }
}

const touchEnd = (index) => {
  if (currentSwipeIndex.value !== index) return
  
  const offset = swipeOffset.value[index] || 0
  
  // 如果滑动距离超过阈值，则固定在最大滑动距离
  if (Math.abs(offset) > swipeThreshold) {
    swipeOffset.value[index] = -maxSwipeOffset
  } else {
    // 否则回弹
    swipeOffset.value[index] = 0
  }
  
  currentSwipeIndex.value = null
}

// 重置所有侧滑状态
const resetSwipe = () => {
  Object.keys(swipeOffset.value).forEach(key => {
    swipeOffset.value[key] = 0
  })
}

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  // 处理中文字符，取第一个字
  const firstChar = name.charAt(0)
  return firstChar.toUpperCase()
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = dayjs(time)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    // 今天，显示时间
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    // 昨天
    return '昨天'
  } else if (date.isSame(now, 'year')) {
    // 今年，显示月日
    return date.format('MM-DD')
  } else {
    // 往年，显示年月日
    return date.format('YYYY-MM-DD')
  }
}

// 截断文本
const truncateText = (text) => {
  if (!text) return ''
  return text.length > 20 ? text.substring(0, 20) + '...' : text
}

// 格式化徽章数字
const formatBadge = (count) => {
  if (count > 99) return '99+'
  return count
}

onMounted(() => {
  fetchConversations()
  fetchFriendRequests()
  fetchNotifications()
})
</script>

<style scoped>
.conversations-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--van-background);
}

.ios-style {
  --van-radius-md: 8px;
  --item-active-color: #f0f9ff;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.message-tabs {
  display: flex;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
  position: sticky;
  top: 46px;
  z-index: 10;
}

.tab-item {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  color: var(--van-gray-6);
}

.tab-item.active {
  color: var(--van-primary-color);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: var(--van-primary-color);
  border-radius: 2px;
}

.badge {
  position: absolute;
  top: 5px;
  right: 25%;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  color: #fff;
  background-color: var(--van-danger-color);
  border-radius: 8px;
}

.new-chat-options {
  padding: 20px 16px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  font-size: 16px;
}

.option-item span {
  margin-left: 12px;
}

.conversation-list-container {
  padding: 0 16px;
}

.conversation-item {
  position: relative;
  overflow: hidden;
}

.chat-content {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--van-border-color);
  background-color: #fff;
  transition: transform 0.3s ease;
}

.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  transform: translateX(0);
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 100%;
  color: #fff;
  font-size: 14px;
}

.action.mark-read {
  background-color: var(--van-blue);
}

.action.delete {
  background-color: var(--van-danger-color);
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--van-primary-color);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.chat-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.top-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.nickname {
  font-size: 16px;
  font-weight: 500;
  color: var(--van-text-color);
}

.time {
  font-size: 12px;
  color: var(--van-gray-5);
}

.bottom-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  font-size: 14px;
  color: var(--van-gray-6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-message {
  font-style: italic;
  color: var(--van-gray-5);
}

.unread-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  color: #fff;
  background-color: var(--van-danger-color);
  border-radius: 9px;
}

.unread {
  background-color: var(--item-active-color);
}

/* 通知样式 */
.notification-list {
  flex: 1;
  padding: 0 16px;
  overflow-y: auto;
  padding-bottom: 50px;
}

.notification-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--van-border-color);
  background-color: #fff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.notification-icon.like {
  background-color: #ffebee;
  color: #f44336;
}

.notification-icon.comment {
  background-color: #e3f2fd;
  color: #2196f3;
}

.notification-icon.follow {
  background-color: #e8f5e9;
  color: #4caf50;
}

.notification-icon.system {
  background-color: #fffde7;
  color: #ffc107;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--van-text-color);
}

.notification-text {
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--van-gray-7);
}

.notification-time {
  font-size: 12px;
  color: var(--van-gray-5);
}

.unread-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: var(--van-danger-color);
  margin-left: 8px;
  align-self: flex-start;
  margin-top: 8px;
}
</style>