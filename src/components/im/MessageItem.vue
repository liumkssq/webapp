<template>
  <div class="message-item" :class="messageClass">
    <!-- 头像 (仅显示在收到的消息上) -->
    <div v-if="!isSelf" class="avatar">
      <van-image
        round
        width="2.5rem"
        height="2.5rem"
        :src="message.avatar || defaultAvatar"
        fit="cover"
        @click="onAvatarClick"
      >
        <template #error>
          <div class="avatar-fallback">{{ getInitials(message.senderName || '?') }}</div>
        </template>
      </van-image>
    </div>
    
    <!-- 消息内容 -->
    <div 
      class="message-content" 
      :class="contentClass"
      @click="onContentClick"
      @longpress="onLongPress"
    >
      <!-- 撤回消息提示 -->
      <div v-if="message.isRevoked" class="revoked-message">
        {{ message.revokeTip || (isSelf ? '你撤回了一条消息' : '对方撤回了一条消息') }}
      </div>
      
      <!-- 正在输入状态 -->
      <div v-else-if="message.isTyping" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <!-- 文本消息 -->
      <div v-else-if="message.type === 'text'" class="text-content">
        {{ message.content }}
      </div>
      
      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="image-content">
        <van-image
          :src="getImageUrl(message.content)"
          fit="cover"
          :width="imageSize.width"
          :height="imageSize.height"
          radius="0.5rem"
          @click.stop="handleImageClick"
        >
          <template #loading>
            <van-loading type="spinner" size="20" />
          </template>
          <template #error>
            <div class="image-error">
              <van-icon name="photo-fail" size="24" />
              <span>加载失败</span>
            </div>
          </template>
        </van-image>
      </div>
      
      <!-- 语音消息 -->
      <div v-else-if="message.type === 'audio' || message.type === 'voice'" class="voice-content" @click.stop="playVoice">
        <van-icon :name="isPlaying ? 'volume' : 'volume-o'" size="1.3rem" />
        <div class="voice-duration">{{ getDuration(message) }}″</div>
        <div class="voice-waves">
          <span v-for="n in 3" :key="n" class="wave" :class="{ active: isPlaying }"></span>
        </div>
      </div>
      
      <!-- 位置消息 -->
      <div v-else-if="message.type === 'location'" class="location-content" @click.stop="viewLocation">
        <div class="location-title">{{ getLocationTitle(message.content) }}</div>
        <div class="location-address">{{ getLocationAddress(message.content) }}</div>
        <div class="location-icon">
          <van-icon name="location-o" size="1.2rem" />
        </div>
      </div>
      
      <!-- 文件消息 -->
      <div v-else-if="message.type === 'file'" class="file-content" @click.stop="openFile">
        <div class="file-icon">
          <van-icon name="description" size="1.8rem" />
        </div>
        <div class="file-info">
          <div class="file-name">{{ getFileName(message.content) }}</div>
          <div class="file-size">{{ getFileSize(message.content) }}</div>
        </div>
      </div>
      
      <!-- 其他类型消息 -->
      <div v-else class="unknown-content">
        未知消息类型
      </div>
      
      <!-- 发送状态 (仅显示在自己发送的消息上) -->
      <div v-if="isSelf && !message.isTyping && !message.isRevoked" class="message-status">
        <van-loading v-if="message.status === 'sending'" type="spinner" size="12" />
        <van-icon v-else-if="message.status === 'failed'" name="warning-o" size="12" color="#ff3b30" @click.stop="onRetry" />
        <van-icon v-else-if="message.isRead" name="checked" size="12" color="#34c759" />
        <van-icon v-else name="checked" size="12" color="#8e8e93" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { showImagePreview, showActionSheet } from 'vant'
import { parseImageContent, parseFileContent, parseLocationContent } from '@/api/im'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isSelf: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['retry', 'longPress', 'avatarClick', 'viewProfile', 'delete', 'forward', 'copy', 'recall'])

// 默认头像
const defaultAvatar = 'https://api.dicebear.com/6.x/avataaars/svg?seed=fallback'

// 消息样式类
const messageClass = computed(() => ({
  'message-sent': props.isSelf,
  'message-received': !props.isSelf
}))

// 内容样式类
const contentClass = computed(() => ({
  'content-sent': props.isSelf,
  'content-received': !props.isSelf,
  'content-revoked': props.message.isRevoked,
  'content-typing': props.message.isTyping
}))

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0)
}

// 图片大小计算
const imageSize = computed(() => {
  const defaultSize = { width: '10rem', height: 'auto' }
  if (!['image'].includes(props.message.type)) return defaultSize
  
  // 可以根据图片的实际尺寸进行计算
  // 这里简化处理，使用固定尺寸
  return defaultSize
})

// 获取图片URL
const getImageUrl = (content) => {
  return parseImageContent(content)
}

// 获取语音时长
const getDuration = (message) => {
  if (message.extra && message.extra.duration) {
    return message.extra.duration
  }
  return '0'
}

// 获取位置信息
const getLocationTitle = (content) => {
  try {
    const location = parseLocationContent(content)
    return location.title || '位置信息'
  } catch (e) {
    return '位置信息'
  }
}

const getLocationAddress = (content) => {
  try {
    const location = parseLocationContent(content)
    return location.address || '未知地址'
  } catch (e) {
    return '未知地址'
  }
}

// 获取文件信息
const getFileName = (content) => {
  try {
    const file = parseFileContent(content)
    return file.name || '未知文件'
  } catch (e) {
    return '未知文件'
  }
}

const getFileSize = (content) => {
  try {
    const file = parseFileContent(content)
    if (!file.size) return ''
    
    const size = parseInt(file.size)
    if (isNaN(size)) return ''
    
    if (size < 1024) {
      return `${size}B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)}KB`
    } else {
      return `${(size / 1024 / 1024).toFixed(1)}MB`
    }
  } catch (e) {
    return ''
  }
}

// 点击图片查看大图
const handleImageClick = () => {
  showImagePreview({
    images: [getImageUrl(props.message.content)],
    closeable: true
  })
}

// 语音播放相关
const isPlaying = ref(false)
const audio = ref(null)

// 播放语音
const playVoice = () => {
  if (!['audio', 'voice'].includes(props.message.type)) return
  
  if (!audio.value) {
    audio.value = new Audio(props.message.content)
    audio.value.addEventListener('ended', () => {
      isPlaying.value = false
    })
  }
  
  if (isPlaying.value) {
    audio.value.pause()
    isPlaying.value = false
  } else {
    audio.value.play().catch(err => {
      console.error('播放语音失败:', err)
      isPlaying.value = false
    })
    isPlaying.value = true
  }
}

// 查看位置
const viewLocation = () => {
  try {
    const location = parseLocationContent(props.message.content)
    // 打开地图查看位置
    console.log('查看位置', location)
    // 这里应该跳转到地图页面
  } catch (e) {
    console.error('解析位置信息失败', e)
  }
}

// 打开文件
const openFile = () => {
  try {
    const file = parseFileContent(props.message.content)
    // 打开文件
    window.open(file.url, '_blank')
  } catch (e) {
    console.error('解析文件信息失败', e)
  }
}

// 点击头像
const onAvatarClick = () => {
  emit('avatarClick', props.message.senderId)
}

// 点击消息内容
const onContentClick = () => {
  // 普通点击暂不处理
}

// 长按消息
const onLongPress = () => {
  // 如果是撤回或正在输入的消息，不允许操作
  if (props.message.isRevoked || props.message.isTyping) return
  
  const actions = []
  
  // 文本消息可以复制
  if (props.message.type === 'text') {
    actions.push({ name: '复制', color: '#1989fa' })
  }
  
  // 自己发送的消息可以撤回（一般有时间限制，这里简化处理）
  if (props.isSelf && ['text', 'image', 'audio', 'voice', 'location', 'file'].includes(props.message.type)) {
    actions.push({ name: '撤回', color: '#ff3b30' })
  }
  
  // 任何消息都可以转发
  actions.push({ name: '转发' })
  
  // 自己的消息发送失败时可以重试
  if (props.isSelf && props.message.status === 'failed') {
    actions.push({ name: '重新发送', color: '#1989fa' })
  }
  
  // 任何消息都可以删除
  actions.push({ name: '删除', color: '#ff3b30' })
  
  // 显示操作菜单
  showActionSheet({
    actions,
    cancel: '取消',
    closeOnClickAction: true,
    closeOnClickOverlay: true,
    onSelect: (action) => {
      switch(action.name) {
        case '复制':
          navigator.clipboard.writeText(props.message.content)
            .then(() => {
              // 复制成功
            })
            .catch(err => {
              console.error('复制失败', err)
            })
          break
        case '撤回':
          emit('recall', props.message)
          break
        case '转发':
          emit('forward', props.message)
          break
        case '重新发送':
          emit('retry', props.message)
          break
        case '删除':
          emit('delete', props.message)
          break
      }
    }
  })
}

// 重试发送失败的消息
const onRetry = () => {
  if (props.message.status === 'failed') {
    emit('retry', props.message)
  }
}

// 组件卸载时停止播放
onBeforeUnmount(() => {
  if (audio.value && isPlaying.value) {
    audio.value.pause()
    isPlaying.value = false
  }
})
</script>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 1rem;
  width: 100%;
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.avatar {
  margin-right: 0.5rem;
  align-self: flex-end;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e1e1e1;
  color: #666;
  font-weight: bold;
  font-size: 1rem;
}

.message-content {
  max-width: 70%;
  padding: 0.6rem 0.8rem;
  border-radius: 1.2rem;
  position: relative;
  word-break: break-word;
}

.content-sent {
  background-color: #007aff;
  color: white;
  border-bottom-right-radius: 0.3rem;
}

.content-received {
  background-color: #f0f0f0;
  color: #000;
  border-bottom-left-radius: 0.3rem;
}

.content-revoked, .content-typing {
  background-color: #f0f0f0;
  color: #8e8e93;
  font-style: italic;
  padding: 0.4rem 0.8rem;
}

.content-sent.content-revoked, .content-sent.content-typing {
  background-color: rgba(0, 122, 255, 0.2);
}

.text-content {
  line-height: 1.4;
}

.image-content {
  overflow: hidden;
  max-width: 100%;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 10rem;
  height: 8rem;
  background-color: #f8f8f8;
  color: #8e8e93;
  font-size: 0.8rem;
}

.voice-content {
  display: flex;
  align-items: center;
  min-width: 4rem;
  padding: 0 0.3rem;
  cursor: pointer;
}

.voice-duration {
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

.voice-waves {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.wave {
  display: inline-block;
  width: 3px;
  height: 7px;
  margin: 0 2px;
  background-color: currentColor;
  border-radius: 1px;
  opacity: 0.5;
}

.wave:nth-child(2) {
  height: 10px;
}

.wave:nth-child(3) {
  height: 14px;
}

.wave.active {
  animation: wave 1s infinite ease;
}

.wave.active:nth-child(2) {
  animation-delay: 0.2s;
}

.wave.active:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1.2);
    opacity: 1;
  }
}

.location-content {
  min-width: 10rem;
  padding: 0.3rem;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  position: relative;
}

.location-title {
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.location-address {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-right: 1.5rem;
}

.location-icon {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.file-content {
  display: flex;
  align-items: center;
  min-width: 10rem;
  padding: 0.5rem;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
}

.file-icon {
  margin-right: 0.8rem;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12rem;
}

.file-size {
  font-size: 0.8rem;
  opacity: 0.8;
}

.revoked-message {
  font-size: 0.9rem;
}

.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.5rem;
  width: 3rem;
}

.typing-indicator span {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.1rem;
  background-color: currentColor;
  border-radius: 50%;
  opacity: 0.6;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.5rem);
  }
}

.unknown-content {
  font-style: italic;
  color: #8e8e93;
}

.message-status {
  position: absolute;
  bottom: -1rem;
  right: 0.5rem;
  font-size: 0.6rem;
  color: #8e8e93;
}
</style> 