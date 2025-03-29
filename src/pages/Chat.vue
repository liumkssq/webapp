<template>
  <div class="chat-container">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">
        <div class="user-name">{{ chatTarget.nickname }}</div>
        <div class="online-status" v-if="chatTarget.online">在线</div>
        <div class="offline-status" v-else>离线</div>
      </div>
      <div class="more-btn" @click="showOptions">
        <i class="icon-more"></i>
      </div>
    </div>
    
    <!-- 聊天消息区域 -->
    <div class="message-area" ref="messageArea">
      <!-- 加载更多按钮 -->
      <div class="load-more" v-if="hasMoreMessages" @click="loadMoreMessages">
        <span>加载更多</span>
      </div>
      
      <!-- 消息列表 -->
      <div class="message-list">
        <div 
          v-for="message in messages" 
          :key="message.id" 
          class="message-item"
          :class="{ 'self-message': message.senderId === userId }"
        >
          <!-- 时间分割线 -->
          <div class="time-divider" v-if="shouldShowTimeDivider(message)">
            <span>{{ formatMessageTime(message.sendTime, true) }}</span>
          </div>
          
          <!-- 消息气泡 -->
          <div class="message-bubble-container">
            <!-- 头像 (仅显示对方的头像) -->
            <div class="avatar-container" v-if="message.senderId !== userId">
              <img :src="chatTarget.avatar" :alt="chatTarget.nickname" class="avatar">
            </div>
            
            <!-- 消息气泡 -->
            <div class="message-bubble">
              <!-- 文本消息 -->
              <div class="message-text" v-if="message.contentType === 'text'">
                {{ message.content }}
              </div>
              
              <!-- 图片消息 -->
              <div class="message-image" v-else-if="message.contentType === 'image'">
                <img :src="message.content" alt="图片" @click="previewImage(message.content)">
              </div>
              
              <!-- 文件消息 -->
              <div class="message-file" v-else-if="message.contentType === 'file'">
                <div class="file-icon">
                  <i class="icon-file"></i>
                </div>
                <div class="file-info">
                  <div class="file-name">{{ getFileName(message.content) }}</div>
                  <div class="file-size">{{ getFileSize(message) }}</div>
                </div>
                <div class="file-download">
                  <i class="icon-download"></i>
                </div>
              </div>
            </div>
            
            <!-- 消息状态 (仅显示自己发送的消息状态) -->
            <div class="message-status" v-if="message.senderId === userId">
              <span v-if="message.status === 'sent'">已发送</span>
              <span v-else-if="message.status === 'delivered'">已送达</span>
              <span v-else-if="message.status === 'read'">已读</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-toolbar">
        <div class="toolbar-btn emoji-btn" @click="toggleEmojiPanel">
          <i class="icon-emoji"></i>
        </div>
        <div class="toolbar-btn image-btn" @click="selectImage">
          <i class="icon-image"></i>
        </div>
        <div class="toolbar-btn file-btn" @click="selectFile">
          <i class="icon-file"></i>
        </div>
      </div>
      
      <div class="message-input-container">
        <textarea 
          ref="messageInput"
          v-model="messageContent" 
          class="message-input" 
          placeholder="输入消息..." 
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <div class="send-btn" :class="{ active: messageContent.trim() }" @click="sendMessage">
          <span>发送</span>
        </div>
      </div>
      
      <!-- 表情面板 -->
      <div class="emoji-panel" v-if="showEmojiPanel">
        <div class="emoji-list">
          <div 
            v-for="emoji in emojiList" 
            :key="emoji" 
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getMessages, sendMessage as sendMessageApi, markAsRead } from '@/api/chat'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 当前用户ID
const userId = computed(() => userStore.userId)

// 聊天对象信息
const chatTarget = ref({
  id: '',
  nickname: '',
  avatar: '',
  online: false
})

// 分页数据
const page = ref(1)
const pageSize = ref(20)
const totalMessages = ref(0)

// 消息列表
const messages = ref([])
const hasMoreMessages = computed(() => messages.value.length < totalMessages.value)

// 消息输入
const messageContent = ref('')
const messageInput = ref(null)
const messageArea = ref(null)

// 表情面板
const showEmojiPanel = ref(false)
const emojiList = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']

// 上一条显示时间的消息索引
let lastTimeMessageIndex = -1

// 初始化聊天
const initChat = async () => {
  const targetId = route.params.id
  if (!targetId) {
    router.push('/chat-list')
    return
  }
  
  chatTarget.value.id = targetId
  
  // 获取聊天对象信息
  await fetchChatTarget()
  
  // 加载消息
  await fetchMessages()
  
  // 标记消息为已读
  await markMessagesAsRead()
  
  // 滚动到底部
  scrollToBottom()
}

// 获取聊天对象信息
const fetchChatTarget = async () => {
  try {
    // TODO: 替换为真实API调用
    // 模拟获取聊天对象数据
    chatTarget.value = {
      id: route.params.id,
      nickname: '张三',
      avatar: 'https://via.placeholder.com/100',
      online: true
    }
  } catch (error) {
    console.error('获取聊天对象信息失败', error)
  }
}

// 获取聊天记录
const fetchMessages = async () => {
  try {
    const { data } = await getMessages(chatTarget.value.id, {
      page: page.value,
      size: pageSize.value
    })
    
    if (page.value === 1) {
      messages.value = data.list
    } else {
      messages.value = [...data.list, ...messages.value]
    }
    
    totalMessages.value = data.total
  } catch (error) {
    console.error('获取聊天记录失败', error)
  }
}

// 标记消息为已读
const markMessagesAsRead = async () => {
  try {
    await markAsRead(chatTarget.value.id)
  } catch (error) {
    console.error('标记消息为已读失败', error)
  }
}

// 加载更多消息
const loadMoreMessages = async () => {
  if (hasMoreMessages.value) {
    page.value++
    await fetchMessages()
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!messageContent.value.trim()) return
  
  try {
    const params = {
      sessionId: chatTarget.value.id,
      content: messageContent.value.trim(),
      contentType: 'text'
    }
    
    const { data } = await sendMessageApi(params)
    
    // 添加到消息列表
    messages.value.push(data)
    
    // 清空输入框
    messageContent.value = ''
    
    // 滚动到底部
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败', error)
  }
}

// 切换表情面板
const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
}

// 插入表情
const insertEmoji = (emoji) => {
  messageContent.value += emoji
  focusInput()
}

// 选择图片
const selectImage = () => {
  // TODO: 实现选择图片功能
  alert('图片发送功能开发中')
}

// 选择文件
const selectFile = () => {
  // TODO: 实现选择文件功能
  alert('文件发送功能开发中')
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 显示更多选项
const showOptions = () => {
  // TODO: 实现显示更多选项功能
  alert('更多功能开发中')
}

// 预览图片
const previewImage = (src) => {
  // TODO: 实现图片预览功能
  console.log('预览图片', src)
}

// 获取文件名
const getFileName = (fileUrl) => {
  return fileUrl.substring(fileUrl.lastIndexOf('/') + 1)
}

// 获取文件大小
const getFileSize = (message) => {
  return message.extras?.fileSize || '未知大小'
}

// 格式化消息时间
const formatMessageTime = (time, fullFormat = false) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  
  // 判断是否是今天
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
  
  // 判断是否是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.getDate() === yesterday.getDate() &&
                       date.getMonth() === yesterday.getMonth() &&
                       date.getFullYear() === yesterday.getFullYear()
  
  if (fullFormat) {
    if (isToday) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (isYesterday) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  } else {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}

// 判断是否需要显示时间分割线
const shouldShowTimeDivider = (message) => {
  const index = messages.value.findIndex(m => m.id === message.id)
  
  // 如果是第一条消息，显示时间
  if (index === 0) {
    lastTimeMessageIndex = index
    return true
  }
  
  // 如果与上一条消息的时间间隔超过5分钟，显示时间
  const currentTime = new Date(message.sendTime).getTime()
  const prevTime = new Date(messages.value[index - 1].sendTime).getTime()
  const timeGap = currentTime - prevTime
  
  if (timeGap > 5 * 60 * 1000) {
    lastTimeMessageIndex = index
    return true
  }
  
  return false
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageArea.value) {
      messageArea.value.scrollTop = messageArea.value.scrollHeight
    }
  })
}

// 聚焦输入框
const focusInput = () => {
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.focus()
    }
  })
}

// 发送消息
const sendMessage = () => {
  if (messageContent.value.trim()) {
    handleSendMessage()
  }
}

// 页面挂载时初始化
onMounted(() => {
  initChat()
})
</script>