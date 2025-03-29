<template>
  <div class="chat-conversation-page">
    <!-- 头部导航 -->
    <HeaderNavigation 
      :title="conversation.user?.name || '聊天'" 
      showBack 
      @back="handleBack"
      :rightIcon="showInfo ? 'close' : 'info_outline'"
      @rightClick="toggleUserInfo"
    />
    
    <!-- 聊天界面布局 -->
    <div class="chat-layout" :class="{ 'show-info': showInfo }">
      <!-- 聊天区域 -->
      <div class="chat-area">
        <!-- 聊天消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div class="messages-container">
            <!-- 加载更多 -->
            <div v-if="hasMoreMessages" class="load-more" @click="loadMoreMessages">
              <span v-if="!loadingMore">加载更多消息</span>
              <div v-else class="loading-spinner"></div>
            </div>
            
            <!-- 消息列表 -->
            <template v-if="messages.length">
              <div 
                v-for="(message, index) in messages" 
                :key="message.id"
                class="message-item"
                :class="{ 
                  'self-message': message.senderId === currentUserId,
                  'other-message': message.senderId !== currentUserId,
                  'has-time-divider': showTimeDivider(message, index)
                }"
              >
                <!-- 时间分割线 -->
                <div v-if="showTimeDivider(message, index)" class="time-divider">
                  {{ formatMessageTime(message.createTime, 'divider') }}
                </div>
                
                <!-- 消息内容 -->
                <div class="message-container">
                  <!-- 头像 -->
                  <div 
                    v-if="message.senderId !== currentUserId" 
                    class="message-avatar"
                    @click="viewUserProfile(conversation.userId)"
                  >
                    <img :src="conversation.user?.avatar" alt="avatar" />
                  </div>
                  
                  <!-- 消息气泡 -->
                  <div class="message-bubble" :class="`message-type-${message.type}`">
                    <!-- 文本消息 -->
                    <template v-if="message.type === 'text'">
                      <div class="message-text">{{ message.content }}</div>
                    </template>
                    
                    <!-- 图片消息 -->
                    <template v-else-if="message.type === 'image'">
                      <div class="message-image" @click="previewImage(message.content)">
                        <img :src="message.content" alt="image" />
                      </div>
                    </template>
                    
                    <!-- 文件消息 -->
                    <template v-else-if="message.type === 'file'">
                      <div class="message-file" @click="downloadFile(message.fileUrl)">
                        <div class="file-icon">
                          <i class="material-icons">insert_drive_file</i>
                        </div>
                        <div class="file-info">
                          <div class="file-name">{{ message.content }}</div>
                          <div class="file-size">{{ formatFileSize(message.fileSize * 1024 * 1024) }}</div>
                        </div>
                        <div class="file-action">
                          <i class="material-icons">file_download</i>
                        </div>
                      </div>
                    </template>
                  </div>
                  
                  <!-- 已读标记 -->
                  <div 
                    v-if="message.senderId === currentUserId" 
                    class="message-status"
                  >
                    <span>{{ message.isRead ? '已读' : '未读' }}</span>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 无消息时的提示 -->
            <div v-else class="empty-message">
              <div class="empty-icon">
                <i class="material-icons">chat</i>
              </div>
              <div class="empty-text">暂无消息，开始聊天吧</div>
            </div>
            
            <!-- 底部占位 -->
            <div class="message-list-bottom" ref="messageListBottomRef"></div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="tool-item" @click="showEmojiPicker = !showEmojiPicker">
              <i class="material-icons">emoji_emotions</i>
            </div>
            <div class="tool-item" @click="handleUploadImage">
              <input 
                type="file" 
                ref="imageFileRef" 
                accept="image/*" 
                class="file-input" 
                @change="handleImageSelected"
              />
              <i class="material-icons">image</i>
            </div>
            <div class="tool-item" @click="handleUploadFile">
              <input 
                type="file" 
                ref="fileRef" 
                class="file-input" 
                @change="handleFileSelected"
              />
              <i class="material-icons">attach_file</i>
            </div>
          </div>
          
          <!-- 消息输入框 -->
          <div class="message-input-container">
            <textarea 
              v-model="messageText" 
              class="message-input" 
              placeholder="输入消息..." 
              @keydown.enter.exact.prevent="sendTextMessage"
              ref="inputRef"
            ></textarea>
            <div class="send-button" :class="{ active: messageText.trim() }" @click="sendTextMessage">
              <i class="material-icons">send</i>
            </div>
          </div>
          
          <!-- 表情选择器 -->
          <div v-if="showEmojiPicker" class="emoji-picker">
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
      
      <!-- 用户信息侧边栏 -->
      <div v-if="showInfo" class="user-info-sidebar">
        <div class="sidebar-header">
          <h3>聊天信息</h3>
        </div>
        
        <div class="user-profile">
          <div class="user-avatar" @click="viewUserProfile(conversation.userId)">
            <img :src="conversation.user?.avatar" alt="avatar" />
          </div>
          <div class="user-name">{{ conversation.user?.name }}</div>
          <div class="user-school">{{ conversation.user?.school }}</div>
        </div>
        
        <div class="action-buttons">
          <div class="action-button" @click="viewUserProfile(conversation.userId)">
            <i class="material-icons">person</i>
            <span>查看主页</span>
          </div>
          <div class="action-button danger" @click="showDeleteConfirm = true">
            <i class="material-icons">delete</i>
            <span>删除聊天</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览 -->
    <div v-if="showImagePreview" class="image-preview" @click="closeImagePreview">
      <div class="preview-header">
        <div class="close-button" @click.stop="closeImagePreview">
          <i class="material-icons">close</i>
        </div>
      </div>
      <div class="preview-content">
        <img :src="previewImageUrl" alt="preview" />
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="delete-confirm">
      <div class="confirm-dialog">
        <div class="confirm-title">删除聊天</div>
        <div class="confirm-message">确定要删除这个聊天吗？聊天记录将无法恢复。</div>
        <div class="confirm-buttons">
          <button class="cancel-button" @click="showDeleteConfirm = false">取消</button>
          <button class="delete-button" @click="deleteConversation">删除</button>
        </div>
      </div>
    </div>
    
    <!-- 消息提示 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderNavigation from '../components/common/HeaderNavigation.vue'
import Toast from '../components/common/Toast.vue'
import { 
  getConversationDetail, 
  sendMessage, 
  markConversationAsRead, 
  deleteConversation as apiDeleteConversation,
  uploadChatImage,
  uploadChatFile
} from '../api/chat'
import { useUserStore } from '../store/user'

// 路由和状态
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.currentUser?.id || 0)

// 组件引用
const toast = ref(null)
const messageListRef = ref(null)
const messageListBottomRef = ref(null)
const inputRef = ref(null)
const imageFileRef = ref(null)
const fileRef = ref(null)

// 会话数据
const conversation = ref({})
const messages = ref([])
const hasMoreMessages = ref(false)
const loadingMore = ref(false)

// 输入状态
const messageText = ref('')
const showEmojiPicker = ref(false)
const emojiList = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👌', '✌️', '🤞', '🤘', '🤙']

// 界面状态
const showInfo = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const showDeleteConfirm = ref(false)

// 轮询定时器
let pollTimer = null

// 获取会话详情
const fetchConversation = async () => {
  try {
    const userId = route.query.userId
    if (!userId) {
      router.replace('/chat')
      return
    }
    
    const res = await getConversationDetail(userId)
    if (res.data) {
      conversation.value = res.data
      messages.value = res.data.messages || []
      
      // 默认滚动到底部
      scrollToBottom()
    }
  } catch (error) {
    console.error('获取会话详情失败:', error)
    toast.value.show('获取会话详情失败', 'error')
  }
}

// 标记会话为已读
const markAsRead = async () => {
  try {
    if (conversation.value.id) {
      await markConversationAsRead(conversation.value.id)
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 加载更多消息
const loadMoreMessages = async () => {
  // 在实际应用中，这里应该实现加载历史消息的逻辑
  // 由于mock数据中已经包含了所有消息，这里模拟一个加载中状态
  loadingMore.value = true
  
  setTimeout(() => {
    loadingMore.value = false
    hasMoreMessages.value = false
    toast.value.show('没有更多消息了', 'info')
  }, 1000)
}

// 发送文本消息
const sendTextMessage = async () => {
  const text = messageText.value.trim()
  if (!text) return
  
  try {
    const res = await sendMessage(conversation.value.userId, {
      content: text,
      type: 'text'
    })
    
    if (res.data) {
      messages.value.push(res.data)
      messageText.value = ''
      showEmojiPicker.value = false
      
      // 滚动到底部
      scrollToBottom()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    toast.value.show('发送失败，请重试', 'error')
  }
}

// 选择图片
const handleUploadImage = () => {
  imageFileRef.value.click()
}

// 图片选择后处理
const handleImageSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('image', file)
    
    // 显示上传中提示
    toast.value.show('图片上传中...', 'info')
    
    // 上传图片
    const res = await uploadChatImage(formData)
    
    if (res.data?.url) {
      // 发送图片消息
      const imageRes = await sendMessage(conversation.value.userId, {
        content: res.data.url,
        type: 'image'
      })
      
      if (imageRes.data) {
        messages.value.push(imageRes.data)
        
        // 滚动到底部
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    toast.value.show('图片上传失败', 'error')
  } finally {
    // 清除文件选择
    imageFileRef.value.value = ''
  }
}

// 选择文件
const handleUploadFile = () => {
  fileRef.value.click()
}

// 文件选择后处理
const handleFileSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', file)
    
    // 显示上传中提示
    toast.value.show('文件上传中...', 'info')
    
    // 上传文件
    const res = await uploadChatFile(formData)
    
    if (res.data) {
      // 发送文件消息
      const fileRes = await sendMessage(conversation.value.userId, {
        content: res.data.fileName,
        type: 'file'
      })
      
      if (fileRes.data) {
        // 添加文件信息
        fileRes.data.fileUrl = res.data.url
        fileRes.data.fileSize = res.data.fileSize
        
        messages.value.push(fileRes.data)
        
        // 滚动到底部
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    toast.value.show('文件上传失败', 'error')
  } finally {
    // 清除文件选择
    fileRef.value.value = ''
  }
}

// 插入表情
const insertEmoji = (emoji) => {
  messageText.value += emoji
  focusInput()
}

// 聚焦输入框
const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
}

// 下载文件
const downloadFile = (url) => {
  // 在实际应用中，这里会实现下载文件的逻辑
  window.open(url, '_blank')
}

// 查看用户资料
const viewUserProfile = (userId) => {
  router.push(`/user/profile?id=${userId}`)
}

// 切换用户信息侧边栏
const toggleUserInfo = () => {
  showInfo.value = !showInfo.value
}

// 删除会话
const deleteConversation = async () => {
  try {
    if (!conversation.value.id) return
    
    await apiDeleteConversation(conversation.value.id)
    showDeleteConfirm.value = false
    toast.value.show('聊天已删除', 'success')
    
    // 返回聊天列表
    router.replace('/chat')
  } catch (error) {
    console.error('删除会话失败:', error)
    toast.value.show('删除失败', 'error')
  }
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 格式化消息时间
const formatMessageTime = (time, type = 'message') => {
  if (!time) return ''
  
  const messageDate = new Date(time)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 格式化时间
  const hours = messageDate.getHours().toString().padStart(2, '0')
  const minutes = messageDate.getMinutes().toString().padStart(2, '0')
  const timeString = `${hours}:${minutes}`
  
  if (type === 'message') {
    // 消息内时间只显示时:分
    return timeString
  } else {
    // 分割线时间根据日期显示不同格式
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
    
    if (messageDay.getTime() === today.getTime()) {
      return `今天 ${timeString}`
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return `昨天 ${timeString}`
    } else {
      // 显示完整日期
      const year = messageDate.getFullYear()
      const month = (messageDate.getMonth() + 1).toString().padStart(2, '0')
      const day = messageDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${timeString}`
    }
  }
}

// 判断是否显示时间分割线
const showTimeDivider = (message, index) => {
  if (index === 0) return true
  
  const currentTime = new Date(message.createTime)
  const prevTime = new Date(messages.value[index - 1].createTime)
  
  // 如果时间差超过10分钟，显示分割线
  return (currentTime - prevTime) > 10 * 60 * 1000
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListBottomRef.value) {
      messageListBottomRef.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

// 轮询新消息
const startPolling = () => {
  // 每5秒查询一次新消息
  pollTimer = setInterval(async () => {
    if (!conversation.value.userId) return
    
    try {
      const res = await getConversationDetail(conversation.value.userId)
      if (res.data && res.data.messages) {
        // 检查是否有新消息
        if (res.data.messages.length > messages.value.length) {
          // 获取新消息
          const newMessages = res.data.messages.slice(messages.value.length)
          
          // 添加新消息
          messages.value = [...messages.value, ...newMessages]
          
          // 如果新消息不是自己发的，则滚动到底部
          if (newMessages.some(msg => msg.senderId !== currentUserId.value)) {
            scrollToBottom()
          }
        }
      }
    } catch (error) {
      console.error('获取新消息失败:', error)
    }
  }, 5000)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 页面聚焦时标记为已读
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    markAsRead()
  }
}

// 监听消息变化
watch(messages, () => {
  // 检查是否有未读消息
  const hasUnread = messages.value.some(msg => 
    msg.receiverId === currentUserId.value && !msg.isRead
  )
  
  // 如果有未读消息，标记为已读
  if (hasUnread) {
    markAsRead()
  }
}, { deep: true })

onMounted(async () => {
  await fetchConversation()
  markAsRead()
  startPolling()
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.chat-conversation-page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-layout {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  transition: width 0.3s ease;
}

.user-info-sidebar {
  position: absolute;
  top: 0;
  right: -300px;
  width: 300px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 10;
}

.chat-layout.show-info .user-info-sidebar {
  right: 0;
}

.show-info .chat-area {
  width: calc(100% - 300px);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 15px;
}

.messages-container {
  display: flex;
  flex-direction: column;
}

.message-item {
  margin-bottom: 15px;
  position: relative;
}

.time-divider {
  text-align: center;
  margin: 10px 0;
  font-size: 0.8rem;
  color: #999;
  position: relative;
}

.time-divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background-color: #e0e0e0;
  z-index: -1;
}

.time-divider span {
  background-color: #f5f5f5;
  padding: 0 10px;
}

.message-container {
  display: flex;
  align-items: flex-end;
}

.self-message .message-container {
  flex-direction: row-reverse;
}

.message-avatar {
  margin-right: 8px;
  cursor: pointer;
}

.self-message .message-avatar {
  margin-right: 0;
  margin-left: 8px;
}

.message-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 16px;
  position: relative;
}

.other-message .message-bubble {
  background-color: #fff;
  border-top-left-radius: 4px;
}

.self-message .message-bubble {
  background-color: #dcf8c6;
  border-top-right-radius: 4px;
}

.message-type-text {
  word-break: break-word;
}

.message-type-image {
  padding: 2px;
}

.message-image {
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
}

.message-image img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.message-file {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.file-icon {
  margin-right: 8px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2px;
}

.file-size {
  font-size: 0.8rem;
  color: #666;
}

.file-action {
  margin-left: 8px;
}

.message-status {
  font-size: 0.7rem;
  color: #999;
  margin-top: 2px;
  text-align: right;
}

.input-area {
  padding: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  position: relative;
}

.toolbar {
  display: flex;
  padding: 5px 0;
}

.tool-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  cursor: pointer;
  border-radius: 50%;
}

.tool-item:hover {
  background-color: #e0e0e0;
}

.file-input {
  display: none;
}

.message-input-container {
  display: flex;
  background-color: #fff;
  border-radius: 20px;
  padding: 8px 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  max-height: 100px;
  font-size: 1rem;
  font-family: inherit;
  background-color: transparent;
}

.send-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #aaa;
  cursor: default;
}

.send-button.active {
  color: #1e88e5;
  cursor: pointer;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  height: 200px;
  background-color: #fff;
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  overflow-y: auto;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.emoji-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
}

.emoji-item:hover {
  background-color: #f0f0f0;
  border-radius: 4px;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.load-more {
  text-align: center;
  color: #666;
  padding: 10px 0;
  cursor: pointer;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1e88e5;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.user-profile .user-avatar {
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
  cursor: pointer;
}

.user-profile .user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-profile .user-name {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.user-profile .user-school {
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  padding: 15px;
}

.action-button {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

.action-button:hover {
  background-color: #f5f5f5;
}

.action-button i {
  margin-right: 10px;
}

.action-button.danger {
  color: #f44336;
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.preview-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
}

.close-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content img {
  max-width: 90%;
  max-height: 80%;
  object-fit: contain;
}

.delete-confirm {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog {
  width: 300px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.confirm-title {
  padding: 15px;
  font-size: 1.1rem;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-message {
  padding: 20px 15px;
  color: #666;
}

.confirm-buttons {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.confirm-buttons button {
  flex: 1;
  padding: 12px 0;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  background-color: transparent;
}

.confirm-buttons .cancel-button {
  color: #333;
}

.confirm-buttons .delete-button {
  color: #f44336;
  font-weight: 500;
}
</style>