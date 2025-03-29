<template>
  <div class="chat-page">
    <!-- 头部导航 -->
    <header-navigation
      :title="targetUser.nickname || '聊天'"
      showBack
      @back="router.back()"
      rightIcon="more_vert"
      @rightClick="showActionMenu = true"
    />
    
    <!-- 聊天内容区域 -->
    <div class="chat-content" ref="chatContentRef">
      <!-- 加载更多按钮 -->
      <div v-if="hasMoreMessages && !loading" class="load-more" @click="loadMoreMessages">
        加载更多消息
      </div>
      
      <!-- 加载指示器 -->
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
      </div>
      
      <!-- 消息列表 -->
      <div class="message-list">
        <!-- 消息分组日期 -->
        <div v-for="(group, date) in groupedMessages" :key="date" class="message-group">
          <div class="date-divider">
            <span>{{ formatMessageDate(date) }}</span>
          </div>
          
          <!-- 消息项 -->
          <div
            v-for="message in group"
            :key="message.id"
            class="message-item"
            :class="{ 'self-message': message.fromUser.id === currentUserId }"
          >
            <!-- 头像 -->
            <div
              class="avatar"
              v-if="message.fromUser.id !== currentUserId"
              @click="viewUserProfile(message.fromUser.id)"
            >
              <img :src="message.fromUser.avatar" alt="头像" />
            </div>
            
            <!-- 消息内容 -->
            <div class="message-bubble" :class="'message-type-' + message.type">
              <!-- 文本消息 -->
              <p v-if="message.type === 'text'" class="message-text">{{ message.content }}</p>
              
              <!-- 图片消息 -->
              <div v-else-if="message.type === 'image'" class="message-image" @click="previewImage(message.content)">
                <img :src="message.content" alt="图片消息" />
              </div>
              
              <!-- 语音消息 -->
              <div v-else-if="message.type === 'voice'" class="message-voice" @click="playVoice(message.content)">
                <i class="material-icons">volume_up</i>
                <span>{{ message.duration }}''</span>
              </div>
              
              <!-- 商品卡片 -->
              <div v-else-if="message.type === 'product'" class="message-product" @click="viewProduct(message.content)">
                <div class="product-image">
                  <img :src="message.content.image" alt="商品图片" />
                </div>
                <div class="product-info">
                  <div class="product-title">{{ message.content.title }}</div>
                  <div class="product-price">¥{{ message.content.price }}</div>
                </div>
              </div>
            </div>
            
            <!-- 消息状态 -->
            <div class="message-status" v-if="message.fromUser.id === currentUserId">
              <span v-if="message.status === 'sending'">发送中...</span>
              <span v-else-if="message.status === 'failed'" class="status-failed">
                发送失败
                <i class="material-icons" @click="resendMessage(message)">refresh</i>
              </span>
            </div>
            
            <!-- 自己发送的消息显示头像在右侧 -->
            <div
              class="avatar"
              v-if="message.fromUser.id === currentUserId"
              @click="viewUserProfile(message.fromUser.id)"
            >
              <img :src="message.fromUser.avatar" alt="头像" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="chat-input-area">
      <!-- 功能按钮 -->
      <div class="input-functions">
        <i class="material-icons" @click="switchToVoiceInput">{{ isVoiceInput ? 'keyboard' : 'mic' }}</i>
      </div>
      
      <!-- 文本输入 -->
      <div v-if="!isVoiceInput" class="text-input">
        <input
          type="text"
          v-model="messageText"
          placeholder="输入消息..."
          @keyup.enter="sendTextMessage"
        />
      </div>
      
      <!-- 语音输入 -->
      <div v-else class="voice-input" @touchstart="startRecording" @touchend="stopRecording">
        <span>{{ isRecording ? '松开发送' : '按住说话' }}</span>
      </div>
      
      <!-- 更多功能 -->
      <div class="input-more">
        <i class="material-icons" @click="showFunctionPanel = !showFunctionPanel">add_circle_outline</i>
      </div>
      
      <!-- 发送按钮 -->
      <div class="send-button" v-if="messageText" @click="sendTextMessage">
        <i class="material-icons">send</i>
      </div>
    </div>
    
    <!-- 功能面板 -->
    <div class="function-panel" v-if="showFunctionPanel">
      <div class="function-list">
        <div class="function-item" @click="handleSelectImage">
          <div class="function-icon">
            <i class="material-icons">image</i>
          </div>
          <div class="function-name">图片</div>
        </div>
        
        <div class="function-item" @click="handleSelectProduct">
          <div class="function-icon">
            <i class="material-icons">shopping_cart</i>
          </div>
          <div class="function-name">商品</div>
        </div>
        
        <div class="function-item" @click="handleSelectLocation">
          <div class="function-icon">
            <i class="material-icons">location_on</i>
          </div>
          <div class="function-name">位置</div>
        </div>
      </div>
    </div>
    
    <!-- 操作菜单 -->
    <div class="action-menu" v-if="showActionMenu" @click="showActionMenu = false">
      <div class="menu-content" @click.stop>
        <div class="menu-item" @click="clearMessages">
          <i class="material-icons">delete_sweep</i>
          <span>清空聊天记录</span>
        </div>
        <div class="menu-item" @click="blockUser">
          <i class="material-icons">block</i>
          <span>屏蔽该用户</span>
        </div>
        <div class="menu-item" @click="reportUser">
          <i class="material-icons">report</i>
          <span>举报</span>
        </div>
      </div>
    </div>
    
    <!-- 图片选择输入 -->
    <input 
      type="file" 
      ref="imageInput" 
      accept="image/*" 
      style="display: none" 
      @change="handleImageSelected"
    />
    
    <!-- 图片预览 -->
    <div class="image-preview" v-if="previewImageUrl" @click="previewImageUrl = ''">
      <img :src="previewImageUrl" alt="预览图片" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import { useUserStore } from '../store/user'
import api from '../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 获取目标用户ID
const targetUserId = computed(() => route.params.id)

// 当前用户ID
const currentUserId = computed(() => userStore.userId)

// 状态
const targetUser = ref({})
const messages = ref([])
const messageText = ref('')
const loading = ref(false)
const hasMoreMessages = ref(true)
const page = ref(1)
const isVoiceInput = ref(false)
const isRecording = ref(false)
const showFunctionPanel = ref(false)
const showActionMenu = ref(false)
const previewImageUrl = ref('')
const chatContentRef = ref(null)
const imageInput = ref(null)

// 获取目标用户信息
const fetchTargetUser = async () => {
  try {
    const res = await api.user.getUserProfile(targetUserId.value)
    if (res.code === 200) {
      targetUser.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取聊天记录
const fetchMessages = async (reset = false) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (reset) {
      page.value = 1
      messages.value = []
    }
    
    const res = await api.chat.getChatHistory(targetUserId.value, page.value)
    if (res.code === 200) {
      const newMessages = res.data.list
      hasMoreMessages.value = newMessages.length >= 20
      
      // 添加消息
      if (reset) {
        messages.value = newMessages
      } else {
        messages.value = [...newMessages, ...messages.value]
      }
      
      // 标记为已读
      if (res.data.sessionId) {
        api.chat.markMessagesAsRead(res.data.sessionId)
      }
    }
  } catch (error) {
    console.error('获取聊天记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多消息
const loadMoreMessages = () => {
  if (hasMoreMessages.value && !loading.value) {
    page.value++
    fetchMessages()
  }
}

// 发送文本消息
const sendTextMessage = async () => {
  if (!messageText.value.trim()) return
  
  const content = messageText.value
  messageText.value = ''
  
  // 生成临时消息ID
  const tempId = 'temp_' + Date.now()
  
  // 添加临时消息
  const tempMessage = {
    id: tempId,
    type: 'text',
    content,
    fromUser: {
      id: currentUserId.value,
      avatar: userStore.currentUser.avatar,
      nickname: userStore.currentUser.nickname
    },
    time: new Date().toISOString(),
    status: 'sending'
  }
  
  messages.value.push(tempMessage)
  
  // 滚动到底部
  await scrollToBottom()
  
  try {
    const res = await api.chat.sendMessage(targetUserId.value, content)
    if (res.code === 200) {
      // 更新消息状态
      const index = messages.value.findIndex(msg => msg.id === tempId)
      if (index !== -1) {
        messages.value[index] = {
          ...messages.value[index],
          id: res.data.id,
          status: 'sent'
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    
    // 更新消息状态为失败
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index].status = 'failed'
    }
  }
}

// 重发消息
const resendMessage = async (message) => {
  const index = messages.value.findIndex(msg => msg.id === message.id)
  if (index !== -1) {
    messages.value[index].status = 'sending'
    
    try {
      const res = await api.chat.sendMessage(targetUserId.value, message.content, message.type)
      if (res.code === 200) {
        // 更新消息状态
        messages.value[index] = {
          ...messages.value[index],
          id: res.data.id,
          status: 'sent'
        }
      }
    } catch (error) {
      console.error('重发消息失败:', error)
      messages.value[index].status = 'failed'
    }
  }
}

// 切换到语音输入
const switchToVoiceInput = () => {
  isVoiceInput.value = !isVoiceInput.value
}

// 开始录音
const startRecording = () => {
  isRecording.value = true
  // 实际录音功能需要调用原生API或第三方库
  console.log('开始录音')
}

// 停止录音
const stopRecording = () => {
  if (!isRecording.value) return
  
  isRecording.value = false
  console.log('停止录音并发送')
  
  // 实际录音功能需要调用原生API或第三方库
  // 此处为模拟发送语音消息
  const tempId = 'temp_' + Date.now()
  
  // 添加临时消息
  const tempMessage = {
    id: tempId,
    type: 'voice',
    content: 'voice_url_placeholder',
    duration: Math.floor(Math.random() * 30) + 1, // 模拟1-30秒的语音
    fromUser: {
      id: currentUserId.value,
      avatar: userStore.currentUser.avatar,
      nickname: userStore.currentUser.nickname
    },
    time: new Date().toISOString(),
    status: 'sending'
  }
  
  messages.value.push(tempMessage)
  
  // 滚动到底部
  scrollToBottom()
}

// 选择图片
const handleSelectImage = () => {
  imageInput.value.click()
  showFunctionPanel.value = false
}

// 处理图片选择
const handleImageSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  
  // 验证文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  
  // 添加临时消息
  const tempId = 'temp_' + Date.now()
  
  // 创建临时URL
  const tempUrl = URL.createObjectURL(file)
  
  const tempMessage = {
    id: tempId,
    type: 'image',
    content: tempUrl,
    fromUser: {
      id: currentUserId.value,
      avatar: userStore.currentUser.avatar,
      nickname: userStore.currentUser.nickname
    },
    time: new Date().toISOString(),
    status: 'sending'
  }
  
  messages.value.push(tempMessage)
  
  // 滚动到底部
  await scrollToBottom()
  
  try {
    // 上传图片
    const res = await api.chat.uploadChatImage(file, progress => {
      console.log('上传进度:', progress)
    })
    
    if (res.code === 200) {
      // 发送图片消息
      const sendRes = await api.chat.sendMessage(targetUserId.value, res.data.url, 'image')
      
      // 更新消息状态
      const index = messages.value.findIndex(msg => msg.id === tempId)
      if (index !== -1) {
        messages.value[index] = {
          ...messages.value[index],
          id: sendRes.data.id,
          content: res.data.url,
          status: 'sent'
        }
      }
    }
  } catch (error) {
    console.error('发送图片失败:', error)
    
    // 更新消息状态为失败
    const index = messages.value.findIndex(msg => msg.id === tempId)
    if (index !== -1) {
      messages.value[index].status = 'failed'
    }
  } finally {
    // 清除文件选择
    event.target.value = ''
  }
}

// 选择商品
const handleSelectProduct = () => {
  showFunctionPanel.value = false
  router.push({
    path: '/product/select',
    query: { callback: `/chat/${targetUserId.value}` }
  })
}

// 选择位置
const handleSelectLocation = () => {
  showFunctionPanel.value = false
  router.push({
    path: '/location-picker',
    query: { callback: `/chat/${targetUserId.value}` }
  })
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url
}

// 播放语音
const playVoice = (url) => {
  // 实际语音播放功能需要调用原生API或第三方库
  console.log('播放语音:', url)
}

// 查看商品
const viewProduct = (product) => {
  router.push(`/product/detail/${product.id}`)
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 清空聊天记录
const clearMessages = async () => {
  if (confirm('确定要清空聊天记录吗？')) {
    try {
      await api.chat.deleteSession(targetUserId.value)
      messages.value = []
      showActionMenu.value = false
    } catch (error) {
      console.error('清空聊天记录失败:', error)
    }
  }
}

// 屏蔽用户
const blockUser = () => {
  alert('屏蔽功能开发中')
  showActionMenu.value = false
}

// 举报用户
const reportUser = () => {
  alert('举报功能开发中')
  showActionMenu.value = false
}

// 格式化消息日期
const formatMessageDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isToday = date.toDateString() === now.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  if (isToday) {
    return '今天'
  } else if (isYesterday) {
    return '昨天'
  } else {
    // 年月日格式
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 按日期分组消息
const groupedMessages = computed(() => {
  const groups = {}
  
  messages.value.forEach(message => {
    const date = new Date(message.time)
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    
    if (!groups[dateStr]) {
      groups[dateStr] = []
    }
    
    groups[dateStr].push(message)
  })
  
  return groups
})

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (chatContentRef.value) {
    chatContentRef.value.scrollTop = chatContentRef.value.scrollHeight
  }
}

// 处理路由参数中的商品或位置信息
const handleRouteQuery = () => {
  // 处理产品分享
  if (route.query.product) {
    try {
      const product = JSON.parse(route.query.product)
      sendProductMessage(product)
    } catch (e) {
      console.error('解析商品信息失败:', e)
    }
  }
  
  // 处理位置分享
  if (route.query.location) {
    try {
      const location = JSON.parse(route.query.location)
      sendLocationMessage(location)
    } catch (e) {
      console.error('解析位置信息失败:', e)
    }
  }
}

// 发送商品消息
const sendProductMessage = async (product) => {
  try {
    const res = await api.chat.sendMessage(
      targetUserId.value,
      JSON.stringify(product),
      'product'
    )
    
    if (res.code === 200) {
      // 刷新消息列表
      fetchMessages(true)
    }
  } catch (error) {
    console.error('发送商品消息失败:', error)
  }
}

// 发送位置消息
const sendLocationMessage = async (location) => {
  try {
    const res = await api.chat.sendMessage(
      targetUserId.value,
      JSON.stringify(location),
      'location'
    )
    
    if (res.code === 200) {
      // 刷新消息列表
      fetchMessages(true)
    }
  } catch (error) {
    console.error('发送位置消息失败:', error)
  }
}

// 监听消息变化，滚动到底部
watch(
  () => messages.value.length,
  () => {
    if (page.value === 1) {
      scrollToBottom()
    }
  }
)

onMounted(async () => {
  // 获取目标用户信息
  await fetchTargetUser()
  
  // 获取聊天记录
  await fetchMessages(true)
  
  // 处理路由参数
  handleRouteQuery()
  
  // 初始滚动到底部
  await scrollToBottom()
})

onUnmounted(() => {
  // 释放临时URL
  if (previewImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewImageUrl.value)
  }
  
  // 释放临时图片URL
  messages.value.forEach(message => {
    if (message.type === 'image' && message.content.startsWith('blob:')) {
      URL.revokeObjectURL(message.content)
    }
  })
})
</script>

<script>
export default {
  name: 'ChatPage'
}
</script>

<style scoped>
/* 样式将在后续阶段完善 */
</style>