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
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { recallMessageById, deleteMessage as apiDeleteMessage } from '@/api/im'
import { formatMessageTime } from '@/utils/messageFormatter'

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