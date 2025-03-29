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
      >
        <template #error>
          <div class="avatar-fallback">{{ getInitials(message.senderName || '?') }}</div>
        </template>
      </van-image>
    </div>
    
    <!-- 消息内容 -->
    <div class="message-content" :class="contentClass">
      <!-- 文本消息 -->
      <div v-if="message.type === 'text'" class="text-content">
        {{ message.content }}
      </div>
      
      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="image-content">
        <van-image
          :src="message.content"
          fit="cover"
          :width="imageSize.width"
          :height="imageSize.height"
          radius="0.5rem"
          @click="handleImageClick"
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
      <div v-else-if="message.type === 'voice'" class="voice-content" @click="playVoice">
        <van-icon :name="isPlaying ? 'volume' : 'volume-o'" size="1.3rem" />
        <div class="voice-duration">{{ message.duration }}″</div>
        <div class="voice-waves">
          <span v-for="n in 3" :key="n" class="wave" :class="{ active: isPlaying }"></span>
        </div>
      </div>
      
      <!-- 其他类型消息 -->
      <div v-else class="unknown-content">
        未知消息类型
      </div>
      
      <!-- 发送状态 (仅显示在自己发送的消息上) -->
      <div v-if="isSelf" class="message-status">
        <van-loading v-if="message.status === 'sending'" type="spinner" size="12" />
        <van-icon v-else-if="message.status === 'failed'" name="warning-o" size="12" color="#ff3b30" />
        <van-icon v-else-if="message.isRead" name="checked" size="12" color="#34c759" />
        <van-icon v-else name="checked" size="12" color="#8e8e93" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { showImagePreview } from 'vant'

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

const emit = defineEmits(['retry', 'longPress'])

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
  'content-received': !props.isSelf
}))

// 获取姓名首字母作为头像占位
const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0)
}

// 图片大小计算
const imageSize = computed(() => {
  const defaultSize = { width: '10rem', height: '15rem' }
  if (props.message.type !== 'image') return defaultSize
  
  // 可以根据图片的实际尺寸进行计算
  // 这里简化处理，使用固定尺寸
  return defaultSize
})

// 点击图片查看大图
const handleImageClick = () => {
  showImagePreview({
    images: [props.message.content],
    closeable: true
  })
}

// 语音播放相关
const isPlaying = ref(false)
const audio = ref(null)

// 播放语音
const playVoice = () => {
  if (props.message.type !== 'voice') return
  
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

// 组件卸载时停止播放
watch(() => props.message.id, () => {
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