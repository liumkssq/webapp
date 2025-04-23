<!-- 聊天气泡组件 -->
<template>
  <div 
    :class="[
      'chat-bubble', 
      { 
        'self': isSelf,
        'other': !isSelf,
        'system': message.type === 'system',
        'revoked': message.isRevoked,
        [`type-${message.type}`]: true
      }
    ]"
  >
    <!-- 系统消息 -->
    <div v-if="message.type === 'system'" class="system-message">
      {{ message.content }}
    </div>
    
    <!-- 用户消息 -->
    <template v-else>
      <!-- 头像 -->
      <div class="avatar" v-if="!isSelf && showAvatar" @click="onAvatarClick">
        <img :src="message.senderAvatar" :alt="message.senderName">
      </div>
      
      <div class="bubble-container">
        <!-- 发送者名称 -->
        <div v-if="!isSelf && showName" class="sender-name">
          {{ message.senderName }}
        </div>
        
        <!-- 消息内容 -->
        <div 
          class="bubble-content" 
          @long-press="handleLongPress"
          @click="handleContentClick"
        >
          <!-- 撤回消息 -->
          <div v-if="message.isRevoked" class="revoked-message">
            {{ isSelf ? '你撤回了一条消息' : '对方撤回了一条消息' }}
          </div>
          
          <!-- 文本消息 -->
          <div v-else-if="message.type === 'text'" class="text-content">
            {{ message.content }}
          </div>
          
          <!-- 图片消息 -->
          <div v-else-if="message.type === 'image'" class="image-content">
            <img 
              :src="message.content" 
              :alt="message.senderName" 
              @click.stop="previewImage"
              @load="onImageLoad"
            >
          </div>
          
          <!-- 语音消息 -->
          <div v-else-if="message.type === 'audio'" class="audio-content" @click.stop="playAudio">
            <div class="audio-icon">
              <i class="icon-audio"></i>
            </div>
            <div class="audio-info">
              <span>{{ formatAudioDuration(message.extra?.duration) }}</span>
              <div class="audio-wave"></div>
            </div>
          </div>
          
          <!-- 文件消息 -->
          <div v-else-if="message.type === 'file'" class="file-content" @click.stop="previewFile">
            <div class="file-icon">
              <i class="icon-file"></i>
            </div>
            <div class="file-info">
              <div class="file-name">{{ fileInfo.name }}</div>
              <div class="file-size">{{ fileInfo.size }}</div>
            </div>
          </div>
          
          <!-- 位置消息 -->
          <div v-else-if="message.type === 'location'" class="location-content" @click.stop="viewLocation">
            <div class="location-icon">
              <i class="icon-location"></i>
            </div>
            <div class="location-info">
              <div class="location-name">{{ locationInfo.name }}</div>
              <div class="location-address">{{ locationInfo.address }}</div>
            </div>
          </div>
          
          <!-- 未知类型消息 -->
          <div v-else class="unknown-content">
            无法显示的消息类型
          </div>
        </div>
        
        <!-- 消息状态 -->
        <div class="message-status" v-if="isSelf">
          <span v-if="message.status === 'sending'">发送中...</span>
          <span v-else-if="message.status === 'failed'" class="failed">发送失败</span>
          <span v-else-if="message.isRead" class="read">已读</span>
          <span v-else class="sent">已发送</span>
        </div>
      </div>
      
      <!-- 头像 (自己的消息显示在右侧) -->
      <div class="avatar" v-if="isSelf && showAvatar">
        <img :src="message.senderAvatar" :alt="message.senderName">
      </div>
    </template>
    
    <!-- 长按菜单 -->
    <div class="action-menu" v-if="showActionMenu" @click.stop>
      <div class="action-item" @click="copyMessage" v-if="message.type === 'text' && !message.isRevoked">
        复制
      </div>
      <div class="action-item" @click="forwardMessage" v-if="!message.isRevoked">
        转发
      </div>
      <div class="action-item" @click="recallMessage" v-if="isSelf && !message.isRevoked && canRecall">
        撤回
      </div>
      <div class="action-item delete" @click="deleteMessage">
        删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { deleteMessage as apiDeleteMessage, recallMessageById } from '@/api/im'
import { useUserStore } from '@/store/user'
import { computed, onMounted, ref } from 'vue'

// 定义属性
const props = defineProps({
  // 消息对象
  message: {
    type: Object,
    required: true
  },
  // 是否显示头像
  showAvatar: {
    type: Boolean,
    default: true
  },
  // 是否显示发送者名称
  showName: {
    type: Boolean,
    default: true
  }
})

// 定义事件
const emit = defineEmits([
  'avatar-click',      // 头像点击事件
  'image-preview',     // 图片预览事件
  'file-preview',      // 文件预览事件
  'location-view',     // 位置查看事件
  'retry',             // 重试发送事件
  'forward',           // 转发事件
  'delete',            // 删除事件
  'recall'             // 撤回事件
])

// 用户仓库
const userStore = useUserStore()

// 是否是自己发送的消息
const isSelf = computed(() => {
  return (props.message.senderId === userStore.userId) || (props.message.isSelf === true)
})

// 是否显示操作菜单
const showActionMenu = ref(false)

// 文件信息
const fileInfo = computed(() => {
  if (props.message.type !== 'file') return {}
  
  try {
    return typeof props.message.content === 'string'
      ? JSON.parse(props.message.content)
      : props.message.content
  } catch (e) {
    return { name: '未知文件', size: '未知大小' }
  }
})

// 位置信息
const locationInfo = computed(() => {
  if (props.message.type !== 'location') return {}
  
  try {
    return typeof props.message.content === 'string'
      ? JSON.parse(props.message.content)
      : props.message.content
  } catch (e) {
    return { name: '未知位置', address: '未知地址' }
  }
})

// 是否可以撤回消息（10分钟内的消息）
const canRecall = computed(() => {
  if (!props.message.timestamp) return false
  
  const messageTime = new Date(props.message.timestamp).getTime()
  const now = Date.now()
  
  // 10分钟内的消息可以撤回
  return (now - messageTime) < 10 * 60 * 1000
})

// 格式化语音时长
const formatAudioDuration = (duration) => {
  if (!duration) return '0:00'
  
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 处理长按事件
const handleLongPress = () => {
  showActionMenu.value = true
  
  // 点击其他地方关闭菜单
  const closeMenu = (e) => {
    showActionMenu.value = false
    document.removeEventListener('click', closeMenu)
  }
  
  // 延迟添加点击事件，避免立即关闭
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 10)
}

// 处理内容点击
const handleContentClick = () => {
  // 如果发送失败，显示重试选项
  if (props.message.status === 'failed') {
    emit('retry', props.message)
  }
}

// 头像点击事件
const onAvatarClick = () => {
  if (!isSelf.value) {
    emit('avatar-click', props.message.senderId)
  }
}

// 图片加载完成事件
const onImageLoad = (event) => {
  // 可以在这里处理图片加载完成后的逻辑，如显示加载动画等
}

// 预览图片
const previewImage = () => {
  emit('image-preview', props.message.content)
}

// 播放语音
const playAudio = () => {
  // 语音播放逻辑
  const audio = new Audio(props.message.content)
  audio.play()
}

// 预览文件
const previewFile = () => {
  emit('file-preview', fileInfo.value)
}

// 查看位置
const viewLocation = () => {
  emit('location-view', locationInfo.value)
}

// 复制消息
const copyMessage = () => {
  if (props.message.type !== 'text' || props.message.isRevoked) return
  
  navigator.clipboard.writeText(props.message.content)
    .then(() => {
      // 可以显示一个提示
      console.log('文本已复制')
    })
    .catch(err => {
      console.error('复制失败', err)
    })
  
  showActionMenu.value = false
}

// 转发消息
const forwardMessage = () => {
  if (props.message.isRevoked) return
  
  emit('forward', props.message)
  showActionMenu.value = false
}

// 撤回消息
const recallMessage = async () => {
  if (!isSelf.value || props.message.isRevoked || !canRecall.value) return
  
  try {
    await recallMessageById(props.message.id, props.message.conversationId)
    emit('recall', props.message)
  } catch (error) {
    console.error('撤回消息失败', error)
  }
  
  showActionMenu.value = false
}

// 删除消息
const deleteMessage = async () => {
  try {
    await apiDeleteMessage(props.message.id)
    emit('delete', props.message)
  } catch (error) {
    console.error('删除消息失败', error)
  }
  
  showActionMenu.value = false
}

// 组件挂载
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
/* 聊天气泡组件 - 整体样式 */
.chat-bubble {
  display: flex;
  margin-bottom: 16px;
  position: relative;
  max-width: 100%;
}

/* 自己发送的消息样式 */
.chat-bubble.self {
  flex-direction: row-reverse; /* 自己的消息整体靠右显示 */
  justify-content: flex-start;
}

/* 对方发送的消息样式 */
.chat-bubble.other {
  flex-direction: row; /* 对方的消息整体靠左显示 */
  justify-content: flex-start;
}

/* 用户头像样式 */
.avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  margin: 0 8px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 气泡容器 */
.bubble-container {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

/* 自己的消息气泡容器对齐方式 */
.self .bubble-container {
  align-items: flex-end; /* 内容右对齐 */
}

/* 对方的消息气泡容器对齐方式 */
.other .bubble-container {
  align-items: flex-start; /* 内容左对齐 */
}

/* 发送者名称 */
.sender-name {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  padding-left: 12px;
}

/* 气泡内容样式 */
.bubble-content {
  padding: 10px 12px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
  color: #000000; /* 统一使用黑色字体 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

/* 自己发送的消息 */
.self .bubble-content {
  background-color: #4CAF50; /* 绿色背景 */
  border-bottom-right-radius: 4px;
}

/* 对方发送的消息 */
.other .bubble-content {
  background-color: #FFFFFF; /* 白色背景 */
  border-bottom-left-radius: 4px;
}

/* 系统消息 */
.system-message {
  text-align: center;
  background-color: rgba(0, 0, 0, 0.05);
  color: #666;
  padding: 6px 12px;
  border-radius: 16px;
  margin: 0 auto;
  max-width: 70%;
  font-size: 12px;
}

/* 消息状态 */
.message-status {
  font-size: 11px;
  color: #999;
  text-align: right;
  margin-top: 4px;
  padding-right: 4px;
}

.message-status .failed {
  color: #f44336;
}

.message-status .read {
  color: #2196F3;
}

.message-status .sent {
  color: #999;
}

/* 图片消息 */
.image-content img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

/* 文件消息 */
.file-content {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.file-icon {
  margin-right: 8px;
  font-size: 24px;
  color: #1E88E5;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.file-size {
  font-size: 12px;
  color: #666;
}

/* 位置消息 */
.location-content {
  display: flex;
  align-items: center;
}

.location-icon {
  margin-right: 8px;
  font-size: 24px;
  color: #E91E63;
}

.location-info {
  flex: 1;
}

.location-name {
  font-weight: 500;
}

.location-address {
  font-size: 12px;
  color: #666;
}

/* 语音消息 */
.audio-content {
  display: flex;
  align-items: center;
  min-width: 120px;
}

.audio-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #673AB7;
}

.audio-info {
  display: flex;
  flex-direction: column;
}

.audio-wave {
  height: 20px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  margin-top: 4px;
}

/* 撤回消息 */
.revoked-message {
  font-style: italic;
  color: #999;
}

/* 操作菜单 */
.action-menu {
  position: absolute;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 10;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.action-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.action-item:hover {
  background-color: #f5f5f5;
}

.action-item.delete {
  color: #f44336;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .bubble-container {
    max-width: 80%;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
  }
}
</style>