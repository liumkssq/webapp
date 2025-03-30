<template>
  <div class="chat-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="chatTitle"
      left-arrow
      fixed
      :border="false"
      @click-left="goBack"
      @click-right="showActions"
    >
      <template #right>
        <van-icon name="ellipsis" size="18" />
      </template>
    </van-nav-bar>
    
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <template v-if="loading">
        <div class="loading-container">
          <van-loading type="spinner" color="#1989fa" />
        </div>
      </template>
      
      <template v-else-if="messages.length === 0">
        <div class="empty-container">
          <van-empty description="暂无消息" />
        </div>
      </template>
      
      <template v-else>
        <div class="load-more" v-if="hasMore" @click="loadMoreMessages">
          <div v-if="loadingMore" class="loading-more">
            <van-loading type="spinner" size="16" color="#969799" />
            <span>加载中...</span>
          </div>
          <span v-else>点击加载更多</span>
        </div>
        
        <!-- 消息时间分组 -->
        <div v-for="(group, date) in messageGroups" :key="date" class="message-group">
          <div class="date-divider">
            <span>{{ formatDate(date) }}</span>
          </div>
          
          <!-- 消息气泡 -->
          <div
            v-for="message in group"
            :key="message.id"
            class="message-item"
            :class="{ 'message-self': message.senderId === currentUserId }"
          >
            <!-- 头像 - 非自己发送的消息 -->
            <template v-if="message.senderId !== currentUserId">
              <div class="avatar-container" @click="viewProfile(message.senderId)">
                <van-image
                  round
                  width="2.5rem"
                  height="2.5rem"
                  :src="message.senderAvatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(message.senderName) }}</div>
                  </template>
                </van-image>
              </div>
            </template>
            
            <div class="message-content" :class="{ 'self-content': message.senderId === currentUserId }">
              <!-- 发送者名称 - 群聊中他人发送的消息 -->
              <div v-if="isGroupChat && message.senderId !== currentUserId" class="sender-name">
                {{ message.senderName }}
              </div>
              
              <!-- 撤回提示 -->
              <div v-if="message.isRecalled" class="recalled-message">
                <span v-if="message.senderId === currentUserId">你撤回了一条消息</span>
                <span v-else>{{ message.senderName }}撤回了一条消息</span>
              </div>
              
              <!-- 文本消息 -->
              <div
                v-else-if="message.type === 'text'"
                class="text-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                {{ message.content }}
              </div>
              
              <!-- 图片消息 -->
              <div
                v-else-if="message.type === 'image'"
                class="image-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-image
                  :src="message.content.url"
                  :width="calculateImageSize(message.content).width"
                  :height="calculateImageSize(message.content).height"
                  radius="4px"
                  @click="previewImage(message.content.url)"
                />
              </div>
              
              <!-- 语音消息 -->
              <div
                v-else-if="message.type === 'voice'"
                class="voice-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @click="playVoice(message.content)"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-icon name="volume-o" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                <span>{{ message.content.duration }}''</span>
                <span v-if="playingVoiceId === message.id" class="playing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
              
              <!-- 文件消息 -->
              <div
                v-else-if="message.type === 'file'"
                class="file-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-icon name="description" size="24" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                <div class="file-info">
                  <div class="file-name">{{ getFileName(message.content.url) }}</div>
                  <div class="file-action">点击下载</div>
                </div>
              </div>
              
              <!-- 位置消息 -->
              <div
                v-else-if="message.type === 'location'"
                class="location-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <van-icon name="location-o" size="16" :color="message.senderId === currentUserId ? '#fff' : '#1989fa'" />
                <span>位置信息</span>
              </div>
              
              <!-- 视频消息 -->
              <div
                v-else-if="message.type === 'video'"
                class="video-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
                @contextmenu.prevent="showMessageActions(message, $event)"
              >
                <div class="video-container">
                  <video controls :src="message.content.url" width="200"></video>
                </div>
              </div>
              
              <!-- 未知类型 -->
              <div
                v-else
                class="unknown-message"
                :class="{ 'self-message': message.senderId === currentUserId }"
              >
                [未知消息类型]
              </div>
              
              <!-- 发送状态 - 自己发送的消息 -->
              <div v-if="message.senderId === currentUserId" class="message-status">
                <van-icon v-if="message.status === 'sending'" name="more-o" />
                <van-icon v-else-if="message.status === 'failed'" name="warning-o" color="#ee0a24" @click="resendMessage(message)" />
              </div>
            </div>
            
            <!-- 头像 - 自己发送的消息 -->
            <template v-if="message.senderId === currentUserId">
              <div class="avatar-container" @click="viewProfile(message.senderId)">
                <van-image
                  round
                  width="2.5rem"
                  height="2.5rem"
                  :src="message.senderAvatar"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-fallback">{{ getInitials(message.senderName) }}</div>
                  </template>
                </van-image>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-bar">
        <div class="input-actions">
          <van-icon name="smile-o" size="24" color="#969799" @click="toggleEmojiPanel" />
        </div>
        
        <div class="input-box">
          <van-field
            v-model="inputText"
            type="textarea"
            placeholder="输入消息..."
            autosize
            class="message-input"
            @keypress.enter.prevent="sendTextMessage"
          />
        </div>
        
        <div class="input-actions">
          <van-icon name="add-o" size="24" color="#969799" @click="toggleMorePanel" />
        </div>
      </div>
      
      <!-- 表情面板 -->
      <div v-show="showEmojiPanel" class="emoji-panel">
        <div class="emoji-grid">
          <div
            v-for="emoji in emojis"
            :key="emoji"
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>
      
      <!-- 更多功能面板 -->
      <div v-show="showMorePanel" class="more-panel">
        <div class="action-grid">
          <div class="action-item" @click="chooseImage">
            <div class="action-icon">
              <van-icon name="photo-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">图片</div>
          </div>
          
          <div class="action-item" @click="captureVoice">
            <div class="action-icon">
              <van-icon name="volume-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">语音</div>
          </div>
          
          <div class="action-item" @click="chooseFile">
            <div class="action-icon">
              <van-icon name="description" size="24" color="#1989fa" />
            </div>
            <div class="action-name">文件</div>
          </div>
          
          <div class="action-item" @click="shareLocation">
            <div class="action-icon">
              <van-icon name="location-o" size="24" color="#1989fa" />
            </div>
            <div class="action-name">位置</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 消息操作菜单 -->
    <van-action-sheet
      v-model:show="showMessageMenu"
      :actions="messageActions"
      cancel-text="取消"
      close-on-click-action
      @select="onMessageActionSelect"
    />
    
    <!-- 聊天操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="chatActions"
      cancel-text="取消"
      close-on-click-action
      @select="onChatActionSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import dayjs from 'dayjs'
import { 
  getMessages, 
  sendMessage, 
  recallMessage, 
  getConversationDetail 
} from '@/api/im'

const route = useRoute()
const router = useRouter()

// 获取路由参数
const conversationType = route.params.type // private 或 group
const targetId = parseInt(route.params.id)

// 当前用户信息
const currentUserId = 1 // 假设当前用户ID为1
const isGroupChat = computed(() => conversationType === 'group')

// DOM引用
const messageListRef = ref(null)

// 状态变量
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const conversation = ref(null)
const messages = ref([])
const inputText = ref('')
const showEmojiPanel = ref(false)
const showMorePanel = ref(false)
const showMessageMenu = ref(false)
const showActionSheet = ref(false)
const selectedMessage = ref(null)
const playingVoiceId = ref(null)
const audioPlayer = ref(null)

// 计算属性 - 聊天标题
const chatTitle = computed(() => {
  if (!conversation.value) return '聊天';
  return conversation.value.targetInfo?.name || '';
})

// 计算属性 - 按日期分组的消息
const messageGroups = computed(() => {
  const groups = {};
  
  messages.value.forEach(message => {
    const date = dayjs(message.timestamp).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
})

// 消息操作菜单
const messageActions = computed(() => {
  if (!selectedMessage.value) return [];
  
  const msg = selectedMessage.value;
  const actions = [];
  
  // 复制选项（仅文本消息）
  if (msg.type === 'text') {
    actions.push({ name: '复制', color: '#1989fa' });
  }
  
  // 转发选项
  actions.push({ name: '转发', color: '#1989fa' });
  
  // 撤回选项（自己发的且在2分钟内）
  if (msg.senderId === currentUserId && 
      dayjs().diff(dayjs(msg.timestamp), 'minute') < 2 && 
      !msg.isRecalled) {
    actions.push({ name: '撤回', color: '#ee0a24' });
  }
  
  return actions;
})

// 聊天操作菜单
const chatActions = computed(() => {
  const actions = [];
  
  if (isGroupChat.value) {
    actions.push({ name: '查看群信息', color: '#1989fa' });
  } else {
    actions.push({ name: '查看资料', color: '#1989fa' });
  }
  
  actions.push({ name: '清空聊天记录', color: '#ee0a24' });
  
  return actions;
})

// 表情列表
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧'
]

// 获取会话详情
const fetchConversationDetail = async () => {
  try {
    const { data } = await getConversationDetail(conversationType, targetId)
    conversation.value = data
  } catch (error) {
    console.error('获取会话详情失败:', error)
    showToast('获取会话详情失败')
  }
}

// 获取消息列表
const fetchMessages = async (lastMessageId = null) => {
  if (!lastMessageId) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  
  try {
    const { data } = await getMessages({
      conversationType,
      targetId,
      lastMessageId,
      pageSize: 20
    })
    
    if (!lastMessageId) {
      messages.value = data.list || []
    } else {
      messages.value = [...data.list, ...messages.value]
    }
    
    hasMore.value = data.hasMore
  } catch (error) {
    console.error('获取消息失败:', error)
    showToast('获取消息失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多消息
const loadMoreMessages = () => {
  if (loadingMore.value || !hasMore.value) return
  
  const oldestMessage = messages.value[0]
  if (oldestMessage) {
    fetchMessages(oldestMessage.id)
  }
}

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (messageListRef.value) {
      const scrollOptions = smooth ? { behavior: 'smooth' } : {}
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 发送文本消息
const sendTextMessage = async () => {
  if (!inputText.value.trim()) return
  
  // 创建临时消息
  const tempId = `temp_${Date.now()}`
  const tempMessage = {
    id: tempId,
    conversationType,
    targetId,
    senderId: currentUserId,
    senderName: '我',
    senderAvatar: '', // 使用当前用户头像
    type: 'text',
    content: inputText.value,
    timestamp: new Date().toISOString(),
    status: 'sending',
    isRecalled: false
  }
  
  // 先添加到列表
  messages.value.push(tempMessage)
  scrollToBottom()
  
  // 清空输入框
  const messageText = inputText.value
  inputText.value = ''
  
  try {
    const { data } = await sendMessage({
      conversationType,
      targetId,
      messageType: 'text',
      content: messageText
    })
    
    // 更新消息状态
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index] = data
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 更新为发送失败状态
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index].status = 'failed'
    }
  }
}

// 重发消息
const resendMessage = async (message) => {
  const index = messages.value.findIndex(msg => msg.id === message.id)
  if (index === -1) return
  
  // 更新为发送中状态
  messages.value[index].status = 'sending'
  
  try {
    const { data } = await sendMessage({
      conversationType,
      targetId,
      messageType: message.type,
      content: message.content
    })
    
    // 更新消息
    messages.value[index] = data
  } catch (error) {
    console.error('重发消息失败:', error)
    
    // 更新为发送失败状态
    messages.value[index].status = 'failed'
  }
}

// 撤回消息
const recallMessageAction = async (message) => {
  if (message.isRecalled) return
  
  try {
    const loadingToast = showLoadingToast({
      message: '撤回中...',
      forbidClick: true
    })
    
    await recallMessage(message.id)
    
    // 更新消息状态
    const index = messages.value.findIndex(msg => msg.id === message.id)
    if (index !== -1) {
      messages.value[index].isRecalled = true
    }
    
    closeToast(loadingToast)
  } catch (error) {
    console.error('撤回消息失败:', error)
    showToast('撤回失败')
  }
}

// 插入表情
const insertEmoji = (emoji) => {
  inputText.value += emoji
}

// 切换表情面板
const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
  if (showEmojiPanel.value) {
    showMorePanel.value = false
  }
}

// 切换更多功能面板
const toggleMorePanel = () => {
  showMorePanel.value = !showMorePanel.value
  if (showMorePanel.value) {
    showEmojiPanel.value = false
  }
}

// 选择图片
const chooseImage = () => {
  showToast('该功能开发中...')
}

// 录制语音
const captureVoice = () => {
  showToast('该功能开发中...')
}

// 选择文件
const chooseFile = () => {
  showToast('该功能开发中...')
}

// 分享位置
const shareLocation = () => {
  showToast('该功能开发中...')
}

// 播放语音
const playVoice = (voice) => {
  if (!voice || !voice.url) return
  
  // 如果已有正在播放的音频，先停止
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value = null
    playingVoiceId.value = null
  }
  
  // 创建新的音频播放器
  const audio = new Audio(voice.url)
  audioPlayer.value = audio
  
  audio.onplaying = () => {
    playingVoiceId.value = selectedMessage.value?.id
  }
  
  audio.onended = () => {
    playingVoiceId.value = null
    audioPlayer.value = null
  }
  
  audio.play().catch(error => {
    console.error('播放语音失败:', error)
    showToast('播放语音失败')
    playingVoiceId.value = null
    audioPlayer.value = null
  })
}

// 预览图片
const previewImage = (url) => {
  // 在这里调用 Vant 的图片预览组件
  showToast('图片预览功能开发中...')
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = dayjs(dateStr)
  const now = dayjs()
  
  if (date.isSame(now, 'day')) {
    return '今天'
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (date.isAfter(now.subtract(7, 'day'))) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.day()]
  } else if (date.isSame(now, 'year')) {
    return date.format('MM月DD日')
  } else {
    return date.format('YYYY年MM月DD日')
  }
}

// 获取文件名
const getFileName = (url) => {
  if (!url) return '未知文件'
  
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 获取姓名首字母
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 计算图片尺寸
const calculateImageSize = (image) => {
  // 假设有一个最大宽度，可以根据实际设备宽度调整
  const maxWidth = 200
  const maxHeight = 300
  
  // 如果有实际尺寸信息，可以根据比例计算
  // 这里简单返回固定尺寸
  return { width: 150, height: 200 }
}

// 显示消息操作菜单
const showMessageActions = (message, event) => {
  selectedMessage.value = message
  showMessageMenu.value = true
}

// 处理消息操作菜单选择
const onMessageActionSelect = (action) => {
  if (!selectedMessage.value) return
  
  const message = selectedMessage.value
  
  if (action.name === '复制') {
    if (message.type === 'text') {
      navigator.clipboard.writeText(message.content)
        .then(() => showToast('已复制到剪贴板'))
        .catch(() => showToast('复制失败'))
    }
  } else if (action.name === '转发') {
    showToast('转发功能开发中...')
  } else if (action.name === '撤回') {
    recallMessageAction(message)
  }
  
  selectedMessage.value = null
}

// 显示聊天操作菜单
const showActions = () => {
  showActionSheet.value = true
}

// 处理聊天操作菜单选择
const onChatActionSelect = (action) => {
  if (action.name === '查看群信息') {
    router.push(`/im/group-detail/${targetId}`)
  } else if (action.name === '查看资料') {
    router.push(`/user/profile/${targetId}`)
  } else if (action.name === '清空聊天记录') {
    showToast('清空聊天记录功能开发中...')
  }
}

// 查看用户资料
const viewProfile = (userId) => {
  if (userId === currentUserId) return
  router.push(`/user/profile/${userId}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 监听消息变化，滚动到底部
watch(() => messages.value.length, (newVal, oldVal) => {
  if (newVal > oldVal && !loadingMore.value) {
    scrollToBottom()
  }
})

// 生命周期钩子
onMounted(async () => {
  await fetchConversationDetail()
  await fetchMessages()
  scrollToBottom(false)
})

onBeforeUnmount(() => {
  // 清理音频播放器
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value = null
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  margin-top: 46px; /* NavBar 高度 */
  margin-bottom: 50px; /* 输入区域高度 */
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.load-more {
  text-align: center;
  color: #969799;
  font-size: 0.875rem;
  padding: 0.5rem;
  cursor: pointer;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-more span {
  margin-left: 0.5rem;
}

.date-divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.date-divider span {
  background-color: #f2f3f5;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: #969799;
  border-radius: 1rem;
}

.message-item {
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.message-self {
  flex-direction: row-reverse;
}

.avatar-container {
  margin: 0 0.5rem;
  flex-shrink: 0;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f2f3f5;
  color: #969799;
  font-weight: bold;
  border-radius: 50%;
}

.message-content {
  max-width: 70%;
}

.self-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 0.75rem;
  color: #969799;
  margin-bottom: 0.25rem;
}

.recalled-message {
  padding: 0.5rem;
  background-color: #f2f3f5;
  color: #969799;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: center;
}

.text-message {
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  word-break: break-word;
  line-height: 1.4;
}

.self-message {
  background-color: #1989fa;
  color: #fff;
}

.image-message {
  display: inline-block;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: #fff;
}

.voice-message {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  min-width: 4rem;
}

.voice-message .van-icon {
  margin-right: 0.5rem;
}

.playing-animation {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.playing-animation span {
  display: inline-block;
  width: 3px;
  height: 3px;
  margin: 0 1px;
  background-color: currentColor;
  border-radius: 50%;
  animation: play 1.2s ease infinite;
}

.playing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes play {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(2);
  }
}

.file-message {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
  width: 12rem;
}

.file-info {
  margin-left: 0.5rem;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-action {
  font-size: 0.75rem;
  color: #969799;
  margin-top: 0.25rem;
}

.location-message,
.video-message,
.unknown-message {
  padding: 0.5rem 0.75rem;
  background-color: #fff;
  border-radius: 0.25rem;
}

.message-status {
  margin-left: 0.5rem;
  color: #969799;
  font-size: 0.75rem;
  align-self: center;
}

.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #f2f3f5;
  z-index: 10;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-top: 1px solid #ebedf0;
}

.input-actions {
  padding: 0 0.5rem;
}

.input-box {
  flex: 1;
}

.message-input {
  background-color: #fff;
  border-radius: 1.25rem;
}

.emoji-panel,
.more-panel {
  background-color: #fff;
  height: 14rem;
  padding: 1rem;
  border-top: 1px solid #ebedf0;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
}

.emoji-item {
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.action-icon {
  width: 3rem;
  height: 3rem;
  background-color: #f7f8fa;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
}

.action-name {
  font-size: 0.75rem;
  color: #646566;
}
</style> 