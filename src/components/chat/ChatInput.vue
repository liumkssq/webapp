<!-- 聊天输入组件 -->
<template>
  <div class="chat-input-container">
    <div class="chat-input-wrapper ios-style-input">
      <!-- 工具栏 -->
      <div class="toolbar border-top" v-if="showToolbar">
        <div 
          v-for="tool in tools" 
          :key="tool.type" 
          class="tool-item ripple-effect"
          @click="handleToolClick(tool.type)"
        >
          <i :class="['tool-icon', `icon-${tool.icon}`]"></i>
          <span class="tool-name">{{ tool.name }}</span>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <!-- 语音按钮 -->
        <div 
          class="voice-btn ripple-effect" 
          @touchstart="startVoiceRecord" 
          @touchend="endVoiceRecord" 
          @touchcancel="cancelVoiceRecord"
          v-if="showVoiceBtn"
        >
          <i class="icon-voice"></i>
          <span class="voice-text">按住说话</span>
        </div>
        
        <!-- 文本输入 -->
        <div class="text-input-container" v-else>
          <textarea
            ref="inputEl"
            v-model="messageText"
            :placeholder="placeholder"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @keydown.enter.prevent="sendTextMessage"
            @input="handleInput"
            rows="1"
            class="ios-style-textarea"
          ></textarea>
          
          <!-- 表情按钮 -->
          <div class="emoji-btn ripple-effect" @click="toggleEmoji">
            <i class="icon-emoji"></i>
          </div>
        </div>
        
        <!-- 更多功能按钮 -->
        <div 
          class="action-btn more-btn ripple-effect" 
          @click="toggleMore"
          v-if="!messageText.trim() && !showVoiceBtn"
        >
          <i class="icon-more"></i>
        </div>
        
        <!-- 发送按钮 -->
        <div 
          class="action-btn send-btn ripple-effect" 
          @click="sendTextMessage"
          v-else-if="!showVoiceBtn"
        >
          <i class="icon-send"></i>
        </div>
        
        <!-- 切换语音按钮 -->
        <div 
          class="action-btn toggle-voice-btn ripple-effect" 
          @click="toggleVoiceInput"
        >
          <i :class="['icon-toggle', showVoiceBtn ? 'icon-keyboard' : 'icon-voice']"></i>
        </div>
      </div>
      
      <!-- 表情面板 -->
      <div class="emoji-panel" v-if="showEmojiPanel">
        <div class="emoji-grid">
          <div 
            v-for="emoji in emojiList" 
            :key="emoji"
            class="emoji-item ripple-effect"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>
      
      <!-- 更多功能面板 -->
      <div class="more-panel" v-if="showMorePanel">
        <div class="more-grid">
          <div 
            v-for="action in moreActions" 
            :key="action.type" 
            class="more-item ripple-effect"
            @click="handleMoreAction(action.type)"
          >
            <div class="more-icon">
              <i :class="['icon-more-action', `icon-${action.icon}`]"></i>
            </div>
            <div class="more-name">{{ action.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 语音录制提示 -->
    <div class="voice-recording" v-if="isRecording">
      <div class="recording-icon">
        <i class="icon-recording"></i>
      </div>
      <div class="recording-text">
        {{ cancelRecording ? '松开手指，取消发送' : '手指上滑，取消发送' }}
      </div>
      <div class="recording-time">{{ recordingTime }}s</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store/user'
import { useIMStore } from '@/store/im'
import { sendTextMessage as apiSendTextMessage, sendImageMessage, sendVoiceMessage, sendFileMessage, sendLocationMessage } from '@/api/im'
import { uploadChatImage, uploadChatFile } from '@/api/im'

// 定义属性
const props = defineProps({
  // 会话ID
  conversationId: {
    type: String,
    required: true
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: '请输入消息...'
  },
  // 已禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits([
  'send',              // 发送消息事件
  'focus',             // 输入框聚焦事件
  'blur',              // 输入框失焦事件
  'input',             // 输入事件
  'panel-change',      // 面板变化事件
  'send-image',        // 发送图片事件
  'send-file',         // 发送文件事件
  'send-location'      // 发送位置事件
])

// 状态变量
const messageText = ref('')          // 消息文本
const showEmojiPanel = ref(false)    // 是否显示表情面板
const showMorePanel = ref(false)     // 是否显示更多面板
const showToolbar = ref(false)       // 是否显示工具栏
const showVoiceBtn = ref(false)      // 是否显示语音按钮
const isRecording = ref(false)       // 是否正在录音
const cancelRecording = ref(false)   // 是否取消录音
const recordingTime = ref(0)         // 录音时长
const recordingTimer = ref(null)     // 录音计时器
const inputEl = ref(null)            // 输入框元素

// Store
const userStore = useUserStore()
const imStore = useIMStore()

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '😍', '🥰', '😘', '😗', '😚', '😙', '😋',
  '😛', '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
  '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵'
]

// 工具栏
const tools = [
  { type: 'emoji', name: '表情', icon: 'emoji' },
  { type: 'image', name: '图片', icon: 'image' },
  { type: 'file', name: '文件', icon: 'file' },
  { type: 'location', name: '位置', icon: 'location' }
]

// 更多操作
const moreActions = [
  { type: 'image', name: '图片', icon: 'image' },
  { type: 'camera', name: '拍照', icon: 'camera' },
  { type: 'file', name: '文件', icon: 'file' },
  { type: 'location', name: '位置', icon: 'location' }
]

// 处理输入
const handleInput = () => {
  // 自动调整输入框高度
  if (inputEl.value) {
    inputEl.value.style.height = 'auto'
    inputEl.value.style.height = `${Math.min(inputEl.value.scrollHeight, 100)}px`
  }
  
  // 通知正在输入
  imStore.notifyTyping(props.conversationId)
  
  // 触发输入事件
  emit('input', messageText.value)
}

// 输入框聚焦
const onInputFocus = () => {
  // 关闭所有面板
  showEmojiPanel.value = false
  showMorePanel.value = false
  
  // 触发聚焦事件
  emit('focus')
}

// 输入框失焦
const onInputBlur = () => {
  emit('blur')
}

// 切换表情面板
const toggleEmoji = () => {
  showEmojiPanel.value = !showEmojiPanel.value
  showMorePanel.value = false
  
  // 通知面板变化
  emit('panel-change', showEmojiPanel.value ? 'emoji' : null)
  
  // 如果打开表情面板，让输入框失焦，避免键盘弹出
  if (showEmojiPanel.value && inputEl.value) {
    inputEl.value.blur()
  } else if (!showEmojiPanel.value && inputEl.value) {
    // 如果关闭表情面板，让输入框聚焦
    nextTick(() => {
      inputEl.value.focus()
    })
  }
}

// 切换更多面板
const toggleMore = () => {
  showMorePanel.value = !showMorePanel.value
  showEmojiPanel.value = false
  
  // 通知面板变化
  emit('panel-change', showMorePanel.value ? 'more' : null)
  
  // 如果打开更多面板，让输入框失焦，避免键盘弹出
  if (showMorePanel.value && inputEl.value) {
    inputEl.value.blur()
  }
}

// 切换语音输入
const toggleVoiceInput = () => {
  showVoiceBtn.value = !showVoiceBtn.value
  
  // 关闭所有面板
  showEmojiPanel.value = false
  showMorePanel.value = false
  
  // 通知面板变化
  emit('panel-change', showVoiceBtn.value ? 'voice' : null)
}

// 插入表情
const insertEmoji = (emoji) => {
  messageText.value += emoji
  
  // 触发输入事件
  emit('input', messageText.value)
}

// 处理工具点击
const handleToolClick = (type) => {
  switch (type) {
    case 'emoji':
      toggleEmoji()
      break
    case 'image':
      handleImageUpload()
      break
    case 'file':
      handleFileUpload()
      break
    case 'location':
      handleLocationSelect()
      break
  }
}

// 处理更多操作
const handleMoreAction = (type) => {
  switch (type) {
    case 'image':
      handleImageUpload()
      break
    case 'camera':
      handleCameraCapture()
      break
    case 'file':
      handleFileUpload()
      break
    case 'location':
      handleLocationSelect()
      break
  }
  
  // 关闭更多面板
  showMorePanel.value = false
}

// 开始语音录制
const startVoiceRecord = (event) => {
  if (props.disabled) return
  
  // 记录起始位置
  const startY = event.touches[0].clientY
  
  // 监听手指移动，判断是否上滑取消
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY
    // 上滑超过50px，标记为取消录音
    cancelRecording.value = (startY - currentY) > 50
  }
  
  // 添加移动事件监听
  document.addEventListener('touchmove', handleTouchMove)
  
  // 结束录音时移除监听
  const cleanup = () => {
    document.removeEventListener('touchmove', handleTouchMove)
  }
  
  // 添加一次性事件监听
  document.addEventListener('touchend', cleanup, { once: true })
  document.addEventListener('touchcancel', cleanup, { once: true })
  
  // 开始录音
  isRecording.value = true
  cancelRecording.value = false
  recordingTime.value = 0
  
  // 开始计时
  recordingTimer.value = setInterval(() => {
    recordingTime.value++
    
    // 最长录音1分钟
    if (recordingTime.value >= 60) {
      endVoiceRecord()
    }
  }, 1000)
  
  // TODO: 实际调用录音API
  console.log('开始录音')
}

// 结束语音录制
const endVoiceRecord = () => {
  if (!isRecording.value) return
  
  // 停止计时
  clearInterval(recordingTimer.value)
  
  // 如果上滑取消，则不发送
  if (cancelRecording.value) {
    cancelVoiceRecord()
    return
  }
  
  // 最短录音时间为1秒
  if (recordingTime.value < 1) {
    cancelVoiceRecord()
    // 可以提示录音时间太短
    console.log('录音时间太短')
    return
  }
  
  // 停止录音并发送
  isRecording.value = false
  
  // TODO: 实际获取录音文件并发送
  console.log('发送语音消息，时长：', recordingTime.value)
  
  // 模拟发送语音消息
  const audioUrl = 'data:audio/mp3;base64,dummy'
  sendVoiceMessage(props.conversationId, audioUrl, recordingTime.value, {
    userId: userStore.userId,
    userName: userStore.userInfo.nickname,
    userAvatar: userStore.userInfo.avatar
  })
    .then(response => {
      // 成功处理
      emit('send', response.data)
    })
    .catch(error => {
      console.error('发送语音消息失败', error)
    })
}

// 取消语音录制
const cancelVoiceRecord = () => {
  if (!isRecording.value) return
  
  // 停止计时
  clearInterval(recordingTimer.value)
  
  // 停止录音
  isRecording.value = false
  cancelRecording.value = false
  
  // TODO: 实际取消录音
  console.log('取消录音')
}

// 发送文本消息
const sendTextMessage = () => {
  if (props.disabled) return
  
  const text = messageText.value.trim()
  if (!text) return
  
  // 发送消息
  apiSendTextMessage(props.conversationId, text, {
    userId: userStore.userId,
    userName: userStore.userInfo.nickname,
    userAvatar: userStore.userInfo.avatar
  })
    .then(response => {
      // 清空输入框
      messageText.value = ''
      
      // 重置输入框高度
      if (inputEl.value) {
        inputEl.value.style.height = 'auto'
      }
      
      // 触发发送事件
      emit('send', response.data)
      
      // 关闭面板
      showEmojiPanel.value = false
      showMorePanel.value = false
    })
    .catch(error => {
      console.error('发送消息失败', error)
    })
}

// 处理图片上传
const handleImageUpload = () => {
  if (props.disabled) return
  
  // 创建文件选择器
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.multiple = false
  
  // 文件选择回调
  fileInput.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // 判断文件大小限制 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('图片大小不能超过10MB')
      return
    }
    
    // 上传图片
    const formData = new FormData()
    formData.append('file', file)
    
    // 关闭面板
    showEmojiPanel.value = false
    showMorePanel.value = false
    
    // 上传图片
    uploadChatImage(file)
      .then(response => {
        if (response.code === 200) {
          // 发送图片消息
          return sendImageMessage(props.conversationId, response.data.url, {
            userId: userStore.userId,
            userName: userStore.userInfo.nickname,
            userAvatar: userStore.userInfo.avatar
          })
        } else {
          throw new Error(response.message || '上传失败')
        }
      })
      .then(response => {
        // 触发发送事件
        emit('send-image', response.data)
      })
      .catch(error => {
        console.error('发送图片失败', error)
      })
  }
  
  // 触发文件选择
  fileInput.click()
}

// 处理相机拍照
const handleCameraCapture = () => {
  if (props.disabled) return
  
  // 创建文件选择器，指定使用相机
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.multiple = false
  fileInput.capture = 'camera' // 指定使用相机
  
  // 文件选择回调 (与handleImageUpload相同)
  fileInput.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // 判断文件大小限制 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('图片大小不能超过10MB')
      return
    }
    
    // 关闭面板
    showMorePanel.value = false
    
    // 上传图片
    uploadChatImage(file)
      .then(response => {
        if (response.code === 200) {
          // 发送图片消息
          return sendImageMessage(props.conversationId, response.data.url, {
            userId: userStore.userId,
            userName: userStore.userInfo.nickname,
            userAvatar: userStore.userInfo.avatar
          })
        } else {
          throw new Error(response.message || '上传失败')
        }
      })
      .then(response => {
        // 触发发送事件
        emit('send-image', response.data)
      })
      .catch(error => {
        console.error('发送图片失败', error)
      })
  }
  
  // 触发相机
  fileInput.click()
}

// 处理文件上传
const handleFileUpload = () => {
  if (props.disabled) return
  
  // 创建文件选择器
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.multiple = false
  
  // 文件选择回调
  fileInput.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // 判断文件大小限制 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      console.error('文件大小不能超过50MB')
      return
    }
    
    // 关闭面板
    showEmojiPanel.value = false
    showMorePanel.value = false
    
    // 上传文件
    uploadChatFile(file)
      .then(response => {
        if (response.code === 200) {
          // 准备文件信息
          const fileInfo = {
            name: file.name,
            size: formatFileSize(file.size),
            url: response.data.url
          }
          
          // 发送文件消息
          return sendFileMessage(props.conversationId, fileInfo, {
            userId: userStore.userId,
            userName: userStore.userInfo.nickname,
            userAvatar: userStore.userInfo.avatar
          })
        } else {
          throw new Error(response.message || '上传失败')
        }
      })
      .then(response => {
        // 触发发送事件
        emit('send-file', response.data)
      })
      .catch(error => {
        console.error('发送文件失败', error)
      })
  }
  
  // 触发文件选择
  fileInput.click()
}

// 处理位置选择
const handleLocationSelect = () => {
  if (props.disabled) return
  
  // 关闭面板
  showEmojiPanel.value = false
  showMorePanel.value = false
  
  // 触发位置选择事件，由外部组件处理
  emit('send-location')
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + 'B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + 'KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + 'MB'
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
  }
}

// 组件挂载
onMounted(() => {
  // 初始化
})

// 组件卸载前
onBeforeUnmount(() => {
  // 清理计时器
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
})

// 暴露方法给父组件
defineExpose({
  // 聚焦输入框
  focus() {
    if (inputEl.value) {
      inputEl.value.focus()
    }
  },
  // 清空输入框
  clear() {
    messageText.value = ''
  },
  // 关闭所有面板
  closeAllPanels() {
    showEmojiPanel.value = false
    showMorePanel.value = false
    showVoiceBtn.value = false
  }
})
</script>

<style scoped>
.chat-input-container {
  width: 100%;
  position: relative;
  z-index: 10;
}

.chat-input-wrapper {
  width: 100%;
  background-color: var(--ios-systemBackground);
  border-top: 1px solid var(--ios-separator);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.ios-style-input {
  padding: 8px 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 0;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 5px;
  border-radius: 8px;
}

.tool-icon {
  font-size: 24px;
  color: var(--ios-label);
  margin-bottom: 4px;
}

.tool-name {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
}

.input-area {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.voice-btn {
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ios-secondarySystemBackground);
  border-radius: 18px;
  margin-right: 8px;
  user-select: none;
  -webkit-touch-callout: none;
}

.voice-text {
  margin-left: 8px;
  color: var(--ios-secondaryLabel);
}

.text-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--ios-secondarySystemBackground);
  border-radius: 18px;
  margin-right: 8px;
  padding: 0 8px;
  min-height: 36px;
}

.ios-style-textarea {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  padding: 8px 0;
  font-size: 16px;
  line-height: 20px;
  min-height: 20px;
  max-height: 100px;
  color: var(--ios-label);
}

.emoji-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ios-tint);
}

.action-btn i {
  color: #fff;
  font-size: 18px;
}

.more-btn {
  background-color: var(--ios-secondarySystemBackground);
}

.more-btn i {
  color: var(--ios-label);
}

.emoji-panel {
  max-height: 200px;
  padding: 10px;
  background-color: var(--ios-secondarySystemBackground);
  border-top: 1px solid var(--ios-separator);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 24px;
  cursor: pointer;
  border-radius: 4px;
}

.more-panel {
  padding: 15px 10px;
  background-color: var(--ios-secondarySystemBackground);
  border-top: 1px solid var(--ios-separator);
}

.more-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.more-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.more-icon {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  background-color: var(--ios-tertiarySystemBackground);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}

.more-icon i {
  font-size: 28px;
  color: var(--ios-label);
}

.more-name {
  font-size: 12px;
  color: var(--ios-secondaryLabel);
}

.voice-recording {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.recording-icon {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.recording-icon i {
  font-size: 30px;
  color: #ff3b30;
  animation: pulse 1s infinite;
}

.recording-text {
  color: #fff;
  font-size: 14px;
  margin-bottom: 5px;
}

.recording-time {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  cursor: pointer;
}

.ripple-effect:active {
  opacity: 0.7;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
  background: transparent;
}
</style>