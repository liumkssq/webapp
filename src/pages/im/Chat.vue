<!-- 聊天页面 -->
<template>
  <div class="chat-page">
    <!-- 头部导航 -->
    <header class="chat-header">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
        </div>
      <div class="title">
        <h1>{{ chatTitle }}</h1>
        <div class="subtitle" v-if="showSubtitle">
          {{ isOnline ? '在线' : lastActiveText }}
        </div>
          </div>
      <div class="more-btn" @click="showChatOptions">
        <i class="icon-more-vertical"></i>
        </div>
    </header>
    
    <!-- 消息列表 -->
    <div 
      class="message-list" 
      ref="messageListEl"
      @scroll="handleScroll"
    >
      <!-- 加载更多提示 -->
      <div class="loading-more" v-if="loading.more">
        <div class="loading-spinner"></div>
        <span>加载更多消息...</span>
              </div>
      
      <!-- 没有更多消息提示 -->
      <div class="no-more-messages" v-if="!hasMoreMessages && messages.length > 0">
        没有更多消息了
              </div>
              
      <!-- 消息为空提示 -->
      <div class="empty-message" v-if="!loading.messages && messages.length === 0">
        <div class="empty-icon">
          <i class="icon-chat-empty"></i>
        </div>
        <div class="empty-text">暂无消息，开始聊天吧</div>
              </div>
              
      <!-- 消息列表 -->
      <template v-for="(message, index) in messages" :key="message.id">
        <!-- 时间分割线 -->
        <div 
          class="time-divider" 
          v-if="shouldShowTime(message, messages[index - 1])"
        >
          {{ formatTime(message.timestamp) }}
              </div>
              
        <!-- 消息气泡 -->
        <ChatBubble
          :message="message"
          :show-avatar="true"
          :show-name="conversation?.type === 'group'"
          @avatar-click="viewUserProfile"
          @image-preview="previewImage"
          @file-preview="previewFile"
          @location-view="viewLocation"
          @retry="retryMessage"
          @forward="forwardMessage"
          @delete="deleteMessage"
          @recall="recallMessage"
        />
      </template>
      
      <!-- 对方正在输入提示 -->
      <div class="typing-indicator" v-if="isTyping">
        {{ typingName }} 正在输入...
              </div>
              
      <!-- 底部空白填充，确保内容不被输入框遮挡 -->
      <div class="bottom-spacer"></div>
              </div>
              
    <!-- 聊天输入框 -->
    <ChatInput
      ref="chatInputEl"
      :conversation-id="conversationId"
      :placeholder="inputPlaceholder"
      :disabled="inputDisabled"
      @send="onMessageSent"
      @focus="onInputFocus"
      @blur="onInputBlur"
      @panel-change="onPanelChange"
      @send-image="onImageSent"
      @send-file="onFileSent"
      @send-location="selectLocation"
    />
    
    <!-- 图片预览 -->
    <div class="image-preview" v-if="showImagePreview" @click="closeImagePreview">
      <div class="preview-image">
        <img :src="previewImageUrl" alt="图片预览">
                </div>
      <div class="preview-close">
        <i class="icon-close"></i>
              </div>
              </div>
              
    <!-- 聊天选项菜单 -->
    <div class="chat-options" v-if="showOptions">
      <div class="options-overlay" @click="showOptions = false"></div>
      <div class="options-panel">
        <div 
          v-for="option in chatOptions" 
          :key="option.id" 
          class="option-item"
          @click="handleOptionClick(option.id)"
        >
          {{ option.name }}
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useIMStore } from '@/store/im'
import { formatMessageTime, shouldShowTimeDivider, isMessageFromSelf } from '@/utils/messageFormatter'
import ChatBubble from '@/components/chat/ChatBubble.vue'
import ChatInput from '@/components/im/ChatInput.vue'
import { 
  getConversationDetail, 
  getUserDetail, 
  getMessageHistory, 
  clearMessages, 
  markAsRead, 
  sendTextMessage, 
  sendImageMessage, 
  uploadChatImage, 
  recallMessageById,
  sendTypingStatus,
  getChatInitData,
  parseImageContent
} from '@/api/im'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const userStore = useUserStore()
const imStore = useIMStore()

// Props
const props = defineProps({
  conversationType: {
    type: String,
    default: 'private'
  },
  targetId: {
    type: [Number, String],
    required: true
  }
})

// 引用元素
const messageListEl = ref(null)
const chatInputEl = ref(null)

// 状态变量
// 会话ID格式：private_123 或 group_123
const conversationId = computed(() => `${props.conversationType}_${props.targetId}`)
const conversation = ref(null)
const targetUser = ref(null)
const messages = ref([])
const loading = ref({
  conversation: false,
  messages: false,
  more: false,
  sending: false
})
const hasMoreMessages = ref(true)
const lastScrollHeight = ref(0)
const lastScrollTop = ref(0)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const showOptions = ref(false)
const isScrolling = ref(false)
const scrollDebounceTimer = ref(null)
const isTyping = ref(false)
const typingName = ref('')
const typingTimer = ref(null)
const typingUsers = ref({})

// 计算属性
const chatTitle = computed(() => {
  if (!conversation.value) return '聊天'
  if (conversation.value.type === 'group') {
    return conversation.value.name || '群聊'
  } else {
    return targetUser.value?.nickname || targetUser.value?.name || conversation.value.targetName || '聊天'
  }
})

const showSubtitle = computed(() => {
  return conversation.value?.type === 'private' && targetUser.value
})

const isOnline = computed(() => {
  if (!targetUser.value || !conversation.value?.type === 'private') return false
  return imStore.isUserOnline(targetUser.value.id)
})

const lastActiveText = computed(() => {
  if (!targetUser.value) return ''
  if (!targetUser.value.lastActive) return '离线'
  
  // 计算最后活跃时间
  const lastActive = new Date(targetUser.value.lastActive)
  const now = new Date()
  const diff = Math.floor((now - lastActive) / 1000)
  
  if (diff < 60) {
    return '刚刚活跃'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前活跃`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前活跃`
  } else {
    return formatMessageTime(lastActive)
  }
})

const inputPlaceholder = computed(() => {
  if (loading.value.conversation) return '加载中...'
  return conversation.value?.type === 'group' ? '发送群消息...' : '发送消息...'
})

const inputDisabled = computed(() => {
  return loading.value.conversation || !conversation.value
})

// 聊天选项
const chatOptions = computed(() => {
  const baseOptions = [
    { id: 'clear', name: '清空聊天记录' }
  ]
  
  if (conversation.value?.type === 'private') {
    baseOptions.push({ id: 'profile', name: '查看资料' })
  } else if (conversation.value?.type === 'group') {
    baseOptions.push({ id: 'members', name: '查看群成员' })
    baseOptions.push({ id: 'leave', name: '退出群聊' })
  }
  
  baseOptions.push({ id: 'delete', name: '删除会话' })
  
  return baseOptions
})

// 格式化消息时间
const formatTime = (timestamp) => {
  return formatMessageTime(timestamp, true)
}

// 判断是否显示时间分割线
const shouldShowTime = (currentMsg, prevMsg) => {
  if (!prevMsg) return true
  return shouldShowTimeDivider(currentMsg, prevMsg, 5)
}

// 滚动到底部
const scrollToBottom = (smooth = false) => {
  nextTick(() => {
    if (!messageListEl.value) return
    
    const scrollOptions = smooth ? { behavior: 'smooth' } : undefined
    messageListEl.value.scrollTo({
      top: messageListEl.value.scrollHeight,
      ...scrollOptions
    })
  })
}

// 处理滚动事件
const handleScroll = () => {
  if (!messageListEl.value) return
  
  // 如果滚动到顶部，加载更多消息
  if (messageListEl.value.scrollTop < 50) {
    loadMoreMessages()
  }
  
  // 防抖处理滚动事件
  if (scrollDebounceTimer.value) {
    clearTimeout(scrollDebounceTimer.value)
  }
  
  isScrolling.value = true
  
  scrollDebounceTimer.value = setTimeout(() => {
    isScrolling.value = false
  }, 100)
}

// 加载更多消息
const loadMoreMessages = async () => {
  if (loading.value.more || !hasMoreMessages.value) return
  
  loading.value.more = true
  
  try {
    // 记录滚动位置
    lastScrollHeight.value = messageListEl.value?.scrollHeight || 0
    lastScrollTop.value = messageListEl.value?.scrollTop || 0
    
    // 使用新的IM store API加载更多消息
    const result = await imStore.loadMoreMessages(conversationId.value)
    
    if (result) {
      messages.value = result.messages || []
      hasMoreMessages.value = result.hasMore
      
      // 下一个渲染周期后恢复滚动位置
  nextTick(() => {
        if (messageListEl.value) {
          const newScrollHeight = messageListEl.value.scrollHeight
          messageListEl.value.scrollTop = lastScrollTop.value + (newScrollHeight - lastScrollHeight.value)
        }
      })
    }
  } catch (error) {
    console.error('加载更多消息失败', error)
  } finally {
    loading.value.more = false
  }
}

// 加载会话数据
const loadConversation = async () => {
  loading.value.conversation = true
  try {
    console.log(`正在加载会话数据，ID: ${conversationId.value}, 类型: ${props.conversationType}, 目标ID: ${props.targetId}`)
    
    // 如果是群聊并且ID是g1，使用mock数据
    if (props.conversationType === 'group' && props.targetId === 'g1') {
      console.log('使用mock群聊数据')
      // 使用模拟数据
      conversation.value = {
        id: conversationId.value,
        type: 'group',
        targetId: props.targetId,
        targetName: route.query.name || '校园交流群',
        unreadCount: 0,
        memberCount: 42,
        members: Array(10).fill().map((_, i) => ({
          id: 1000 + i,
          name: `用户${1000 + i}`,
          avatar: ''
        }))
      }
      
      // 加载消息
      loadMessages(true)
    } else {
      // 正常API请求
      const res = await getConversationDetail({ 
        conversationId: conversationId.value 
      })
      
      if (res.code === 200) {
        conversation.value = res.data
        
        // 如果是私聊，加载对方资料
        if (props.conversationType === 'private') {
          loadUserDetail()
        }
        
        // 加载消息
        loadMessages(true)
        
        // 标记为已读
        markRead()
      } else {
        console.error('获取会话详情失败:', res.message)
      }
    }
  } catch (error) {
    console.error('加载会话数据出错:', error)
  } finally {
    loading.value.conversation = false
  }
}

// 加载消息历史
const loadMessages = async (initial = false) => {
  if (initial) {
    loading.value.messages = true
  } else if (loading.value.more) {
    return
  } else {
    loading.value.more = true
  }
  
  try {
    // 模拟群聊数据
    if (props.conversationType === 'group' && props.targetId === 'g1') {
      console.log('加载mock群聊消息')
      await simulateMockMessagesLoading(initial)
      return
    }
    
    // 确定起始时间
    let startTime = null
    if (!initial && messages.value.length > 0) {
      startTime = messages.value[0].timestamp
    }
    
    const res = await getMessageHistory({
      conversationId: conversationId.value,
      count: 20,
      startSendTime: startTime
    })
    
    if (res.code === 200) {
      const newMessages = res.data.map(formatMessage)
      
      if (initial) {
        messages.value = newMessages
      } else {
        messages.value = [...newMessages, ...messages.value]
      }
      
      // 如果返回的消息数量少于请求数量，说明没有更多了
      hasMoreMessages.value = newMessages.length >= 20
    } else {
      console.error('获取消息历史失败:', res.message)
    }
  } catch (error) {
    console.error('加载消息历史出错:', error)
  } finally {
    if (initial) {
      loading.value.messages = false
    } else {
      loading.value.more = false
    }
    
    // 如果是初始加载，滚动到底部
    if (initial) {
      scrollToBottom()
    }
  }
}

// 模拟加载群聊消息
const simulateMockMessagesLoading = async (initial) => {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // 生成随机模拟消息
  const mockMessages = []
  const messageCount = initial ? 20 : 10
  const users = [
    { id: 1001, name: '李明', avatar: '' },
    { id: 1002, name: '张华', avatar: '' },
    { id: 1003, name: '王芳', avatar: '' },
    { id: 1004, name: '赵强', avatar: '' },
    { id: 1005, name: '刘洋', avatar: '' },
    { id: userStore.userInfo.id, name: userStore.userInfo.nickname || '我', avatar: userStore.userInfo.avatar }
  ]
  
  const messageTypes = ['text', 'text', 'text', 'text', 'text', 'image']
  const now = new Date()
  
  for (let i = 0; i < messageCount; i++) {
    const userIndex = Math.floor(Math.random() * users.length)
    const user = users[userIndex]
    const isSelf = user.id === userStore.userInfo.id
    
    // 随机选择消息类型
    const type = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    
    // 随机生成消息内容
    let content = ''
    if (type === 'text') {
      const texts = [
        '大家有谁知道图书馆今天开门吗？',
        '明天的活动取消了吗？',
        '有人要一起去上课吗？',
        '谁有数学作业的答案啊？',
        '下课后我们去踢球吧！',
        '食堂今天的菜真不错',
        '谁有这本书的电子版？',
        '考试推迟到下周了',
        '我找到了一个不错的学习资料',
        '今天的课真是太难了'
      ]
      content = texts[Math.floor(Math.random() * texts.length)]
    } else if (type === 'image') {
      const imageUrls = [
        'https://picsum.photos/300/200',
        'https://picsum.photos/300/300',
        'https://picsum.photos/400/300'
      ]
      content = imageUrls[Math.floor(Math.random() * imageUrls.length)]
    }
    
    // 创建消息对象
    const message = {
      id: `mock_${Date.now()}_${i}`,
      conversationId: conversationId.value,
      type,
      content,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      timestamp: new Date(now - (initial ? (messageCount - i) * 300000 : (60000000 + i * 300000))).toISOString(),
      status: 'sent',
      isRead: true,
      isRevoked: false,
      isSelf
    }
    
    mockMessages.push(message)
  }
  
  // 更新消息列表
  if (initial) {
    messages.value = mockMessages
  } else {
    messages.value = [...mockMessages, ...messages.value]
  }
  
  // 如果是初始加载，则滚动到底部
  if (initial) {
    hasMoreMessages.value = true
    scrollToBottom()
  } else {
    // 假设只有50条历史消息
    hasMoreMessages.value = messages.value.length < 50
  }
  
  if (initial) {
    loading.value.messages = false
  } else {
    loading.value.more = false
  }
}

// 获取会话详情
const fetchConversation = async () => {
  loading.value.conversation = true
  
  try {
    // 从imStore的会话列表中查找会话
    const conv = imStore.conversations.find(c => c.id === conversationId.value)
    
    if (conv) {
      conversation.value = conv
      
      // 如果是私聊，获取目标用户信息
      if (conv.type === 'private') {
        fetchTargetUser(conv.targetId)
      }
    } else {
      // 如果不存在，则通过API获取
      const response = await getConversationDetail(conversationId.value)
      if (response.code === 200) {
        conversation.value = response.data
        
        // 如果是私聊，获取目标用户信息
        if (response.data.type === 'private') {
          fetchTargetUser(response.data.targetId)
        }
      }
    }
  } catch (error) {
    console.error('获取会话详情失败', error)
  } finally {
    loading.value.conversation = false
  }
}

// 获取目标用户信息
const fetchTargetUser = async (userId) => {
  try {
    const response = await getUserDetail(userId)
    if (response.code === 200) {
      targetUser.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 重试发送消息
const retryMessage = (message) => {
  imStore.resendMessage(message)
}

// 转发消息
const forwardMessage = (message) => {
  // 实现转发逻辑
  console.log('转发消息', message)
  
  // 可以跳转到选择联系人页面
  router.push({
    path: '/im/forward',
    query: {
      messageId: message.id,
      conversationId: conversationId.value
    }
  })
}

// 删除消息
const deleteMessage = (message) => {
  // 从消息列表中删除
  const index = messages.value.findIndex(m => m.id === message.id)
    if (index !== -1) {
    messages.value.splice(index, 1)
  }
}

// 撤回消息
const recallMessage = async (message) => {
  try {
    const result = await recallMessageById(message.id, conversationId.value)
    if (result.code === 200) {
      // 消息已通过WebSocket事件在store中更新
    }
  } catch (error) {
    console.error('撤回消息失败', error)
  }
}

// 查看用户资料
const viewUserProfile = () => {
  if (props.conversationType === 'private') {
    router.push(`/im/user/${props.targetId}`)
  }
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = parseImageContent(url)
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}

// 预览文件
const previewFile = (file) => {
  // 文件预览逻辑
  console.log('预览文件', file)
}

// 查看位置
const viewLocation = (location) => {
  // 查看位置逻辑
  console.log('查看位置', location)
}

// 选择位置
const selectLocation = () => {
  // 实现位置选择逻辑
  console.log('位置选择功能待实现')
}

// 显示聊天选项
const showChatOptions = () => {
  showOptions.value = true
}

// 处理选项点击
const handleOptionClick = async (optionId) => {
  showOptions.value = false
  
  switch (optionId) {
    case 'clear':
      await clearChatHistory()
      break
    case 'profile':
      viewUserProfile()
      break
    case 'members':
      viewGroupMembers()
      break
    case 'leave':
      leaveGroup()
      break
    case 'delete':
      deleteConversation()
      break
  }
}

// 清空聊天记录
const clearChatHistory = async () => {
  try {
    // 调用API清空聊天记录
    await clearMessages(conversationId.value)
    
    // 清空本地消息缓存
    messages.value = []
  } catch (error) {
    console.error('清空聊天记录失败', error)
  }
}

// 发送消息
const onMessageSent = async (content, type = 'text') => {
  if (!content || !conversation.value) return
  
  // 创建消息对象
  const message = {
    id: `local_${Date.now()}`,
    conversationId: conversationId.value,
    type,
    content,
    senderId: userStore.userInfo.id,
    senderName: userStore.userInfo.nickname || userStore.userInfo.username,
    senderAvatar: userStore.userInfo.avatar,
    timestamp: new Date().toISOString(),
    status: 'sending',
    isSelf: true
  }
  
  // 添加到消息列表
  messages.value.push(message)
  
  // 滚动到底部
  scrollToBottom()
  
  // 如果是模拟群聊，直接更新状态
  if (props.conversationType === 'group' && props.targetId === 'g1') {
    // 延迟模拟发送过程
    setTimeout(() => {
      // 更新消息状态为已发送
      const msgIndex = messages.value.findIndex(m => m.id === message.id)
      if (msgIndex > -1) {
        messages.value[msgIndex].status = 'sent'
      }
    }, 500)
    return
  }
  
  try {
    loading.value.sending = true
    
    // 根据消息类型发送
    let result
    if (type === 'text') {
      result = await sendTextMessage({
        conversationId: conversationId.value,
        receiverId: props.targetId,
        content
      })
    } else if (type === 'image') {
      result = await sendImageMessage({
        conversationId: conversationId.value,
        receiverId: props.targetId,
        imageUrl: content
      })
    }
    
    if (result && result.code === 200) {
      // 更新消息状态
      const msgIndex = messages.value.findIndex(m => m.id === message.id)
      if (msgIndex > -1) {
        messages.value[msgIndex] = {
          ...messages.value[msgIndex],
          id: result.data.messageId || messages.value[msgIndex].id,
          status: 'sent'
        }
      }
    } else {
      handleMessageError(message.id)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    handleMessageError(message.id)
  } finally {
    loading.value.sending = false
  }
}

// 图片发送事件
const onImageSent = async (file) => {
  if (!file || !conversation.value) return
  
  try {
    loading.value.sending = true
    
    // 上传图片
    const response = await uploadChatImage(file)
    
    if (response.code === 200) {
      const imageUrl = response.data.url
      
      // 通过imStore发送图片消息
      const currentUserId = userStore.userId
      await imStore.sendMessageToConversation({
        conversationId: conversationId.value,
        type: 'image',
        content: imageUrl,
        senderId: currentUserId,
        senderName: userStore.userInfo?.nickname || userStore.userInfo?.username || '我',
        senderAvatar: userStore.userInfo?.avatar,
        timestamp: new Date().toISOString()
      })
      
      scrollToBottom(true)
    }
  } catch (error) {
    console.error('发送图片失败', error)
  } finally {
    loading.value.sending = false
  }
}

// 文件发送事件
const onFileSent = async (file) => {
  // 类似于图片发送，实现文件上传和发送逻辑
  console.log('文件发送功能待实现', file)
}

// 输入框聚焦事件
const onInputFocus = () => {
  // 输入框获得焦点时滚动到底部
  scrollToBottom()
}

// 输入框失焦事件
const onInputBlur = () => {
  // 输入框失去焦点时的处理
}

// 面板变化事件
const onPanelChange = (isVisible) => {
  // 处理面板显示状态变化
  if (isVisible) {
    scrollToBottom()
  }
}

// 设置正在输入状态
const setTypingState = () => {
  isTyping.value = true
  
  // 5秒后自动清除状态
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
  }
  
  typingTimer.value = setTimeout(() => {
    isTyping.value = false
  }, 5000)
}

// 注册WebSocket事件监听
const registerWebSocketEvents = () => {
  // 监听新消息
  imStore.on('new_message', handleNewMessage)
  
  // 监听消息撤回
  imStore.on('message_recall', handleMessageRecall)
  
  // 监听输入状态
  imStore.on('typing', handleTyping)
}

const unregisterWebSocketEvents = () => {
  imStore.off('new_message', handleNewMessage)
  imStore.off('message_recall', handleMessageRecall)
  imStore.off('typing', handleTyping)
}

const handleNewMessage = (message) => {
  // 只处理当前会话的消息
  if (message.conversationId !== conversationId.value) return
  
  // 如果消息不在列表中，添加到列表
  if (!messages.value.find(m => m.id === message.id)) {
    messages.value.push(message)
  }
  
  // 如果没有正在滚动，滚动到底部
  if (!isScrolling.value) {
    scrollToBottom(true)
  }
  
  // 标记为已读
  markConversationRead()
}

const handleMessageRecall = (data) => {
  // 只处理当前会话的消息
  if (data.conversationId !== conversationId.value) return
  
  // 查找并更新消息状态
  const message = messages.value.find(m => m.id === data.messageId)
  if (message) {
    message.isRevoked = true
    message.content = ''
  }
}

const handleTyping = (data) => {
  // 只处理当前会话的输入状态
  if (data.conversationId !== conversationId.value) return
  
  // 更新输入状态
  typingUsers.value = {
    ...typingUsers.value,
    [data.userId]: data.timestamp
  }
  
  updateTypingStatus()
  
  // 设置定时器，3秒后再次检查状态
  if (typingTimer.value) clearTimeout(typingTimer.value)
  typingTimer.value = setTimeout(updateTypingStatus, 3000)
}

// 标记为已读
const markConversationRead = () => {
  if (!conversation.value) return
  imStore.readConversation(conversationId.value)
}

// 更新正在输入状态
const updateTypingStatus = () => {
  if (!typingUsers.value || Object.keys(typingUsers.value).length === 0) {
    isTyping.value = false
    return
  }
  
  // 过滤掉3秒前的输入状态
  const now = Date.now()
  const activeUsers = Object.entries(typingUsers.value)
    .filter(([userId, timestamp]) => now - timestamp < 3000)
    
  if (activeUsers.length === 0) {
    isTyping.value = false
    return
  }
  
  isTyping.value = true
  
  // 获取正在输入的用户名
  // 如果是私聊，始终显示对方的名字
  if (props.conversationType === 'private') {
    typingName.value = targetUser.value?.nickname || '对方'
  } 
  // 如果是群聊，显示第一个正在输入的用户名
  else if (activeUsers.length === 1) {
    const [userId] = activeUsers[0]
    const member = conversation.value?.members?.find(m => m.id === parseInt(userId))
    typingName.value = member?.nickname || '有人'
  } 
  // 如果多人输入，显示数量
  else {
    typingName.value = `${activeUsers.length}人`
  }
}

// 页面方法
const goBack = () => {
  router.back()
}

// 初始化聊天
const initChat = async () => {
  try {
    // 设置当前会话
    const conv = imStore.conversations.find(c => c.id === conversationId.value)
    if (conv) {
      conversation.value = conv
      imStore.setCurrentConversation(conv)
    }

    // 获取会话详情
    await fetchConversation()
    
    // 加载消息
    await fetchMessages()
    
    // 标记为已读
    if (conversation.value) {
      imStore.readConversation(conversationId.value)
    }
  } catch (error) {
    console.error('初始化聊天失败', error)
  }
}

const viewGroupMembers = () => {
  if (props.conversationType === 'group') {
    router.push(`/im/group/${props.targetId}/members`)
  }
}

const leaveGroup = () => {
  // 离开群组的逻辑
  console.log('离开群组功能待实现')
}

const deleteConversation = () => {
  // 删除会话的逻辑
  imStore.deleteConversation(conversationId.value)
  router.push('/im/conversations')
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    conversationId.value = newId
    initChat()
    fetchMessages()
  }
})

// 监听消息列表变化
watch(() => imStore.messageCache[conversationId.value], (newMessages) => {
  if (newMessages) {
    messages.value = newMessages
    // 只有在用户未主动滚动时自动滚动到底部
    if (!isScrolling.value) {
      scrollToBottom()
    }
  }
}, { deep: true })

// 生命周期钩子
onMounted(async () => {
  console.log('Chat组件已挂载', props)
  // 加载会话数据
  await loadConversation()
  
  // 注册WebSocket消息监听
  setupMessageListeners()
  
  // 添加滚动事件监听器
  if (messageListEl.value) {
    messageListEl.value.addEventListener('scroll', handleScroll)
  }
})

onBeforeUnmount(() => {
  // 清理定时器和事件监听
  if (scrollDebounceTimer.value) clearTimeout(scrollDebounceTimer.value)
  if (typingTimer.value) clearTimeout(typingTimer.value)
  
  // 取消注册WebSocket事件
  unregisterWebSocketEvents()
  
  // 重置当前会话
  imStore.setCurrentConversation(null)
})

// 设置消息监听器
const setupMessageListeners = () => {
  console.log('设置WebSocket消息监听')
  
  // 在真实环境中应该监听WebSocket消息
  // 这里仅为mock环境添加一个模拟的新消息接收功能
  if (props.conversationType === 'group' && props.targetId === 'g1') {
    // 每30秒可能收到一条新消息
    const timer = setInterval(() => {
      if (Math.random() > 0.7) { // 30%的概率
        console.log('模拟接收新消息')
        const users = [
          { id: 1001, name: '李明', avatar: '' },
          { id: 1002, name: '张华', avatar: '' },
          { id: 1003, name: '王芳', avatar: '' },
          { id: 1004, name: '赵强', avatar: '' }
        ]
        
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const texts = [
          '刚刚在图书馆看到你了',
          '谁有明天的课表?',
          '食堂排队的好长啊',
          '今晚有人一起去自习吗?',
          '明天是不是要交作业啊?'
        ]
        
        const newMessage = {
          id: `mock_${Date.now()}`,
          conversationId: conversationId.value,
          type: 'text',
          content: texts[Math.floor(Math.random() * texts.length)],
          senderId: randomUser.id,
          senderName: randomUser.name,
          senderAvatar: randomUser.avatar,
          timestamp: new Date().toISOString(),
          status: 'sent',
          isRead: true,
          isRevoked: false,
          isSelf: false
        }
        
        // 添加新消息
        messages.value.push(newMessage)
        
        // 滚动到底部
        nextTick(() => {
          scrollToBottom()
        })
      }
    }, 30000)
    
    // 组件卸载时清除定时器
    onBeforeUnmount(() => {
      clearInterval(timer)
    })
  }
}

// 格式化消息对象
const formatMessage = (msg) => {
  return {
    ...msg,
    isSelf: isMessageFromSelf(msg, userStore.userInfo.id)
  }
}

// 处理消息错误
const handleMessageError = (messageId) => {
  const msgIndex = messages.value.findIndex(m => m.id === messageId)
  if (msgIndex > -1) {
    messages.value[msgIndex] = {
      ...messages.value[msgIndex],
      status: 'failed'
    }
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--ios-systemBackground);
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  height: 50px;
  background-color: var(--ios-systemBackground);
  border-bottom: 1px solid var(--ios-separator);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn,
.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.back-btn:active,
.more-btn:active {
  opacity: 0.7;
}

.title {
  flex: 1;
  text-align: center;
  margin: 0 10px;
}

.title h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ios-label);
}

.subtitle {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
  margin-top: 2px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px;
  position: relative;
}

.loading-more, 
.no-more-messages {
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  color: var(--ios-tertiaryLabel);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--ios-tertiarySystemFill);
  border-top-color: var(--ios-tint);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: var(--ios-tertiaryLabel);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.time-divider {
  text-align: center;
  margin: 15px 0;
  font-size: 12px;
  color: var(--ios-tertiaryLabel);
}

.typing-indicator {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.bottom-spacer {
  height: 70px; /* 根据输入框高度调整 */
  width: 100%;
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
}

.preview-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.chat-options {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

.options-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.options-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--ios-systemBackground);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  overflow: hidden;
}

.option-item {
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: var(--ios-label);
  border-bottom: 1px solid var(--ios-separator);
}

.option-item:last-child {
  margin-bottom: 10px;
  color: var(--ios-destructive);
}

.option-item:active {
  background-color: var(--ios-secondarySystemBackground);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 