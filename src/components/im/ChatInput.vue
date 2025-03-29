<template>
  <div class="chat-input">
    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 语音/文本切换按钮 -->
      <van-button
        class="voice-button"
        :class="{ active: inputMode === 'voice' }"
        icon="service-o"
        size="small"
        round
        @click="toggleInputMode"
      />
      
      <!-- 文本输入框 -->
      <div v-show="inputMode === 'text'" class="text-input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="textMessage"
          class="text-input"
          :placeholder="placeholder"
          :rows="textareaRows"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.enter.prevent="onKeyEnter"
          @input="adjustTextareaHeight"
        ></textarea>
      </div>
      
      <!-- 语音输入按钮 -->
      <div v-show="inputMode === 'voice'" class="voice-input-wrapper">
        <van-button
          class="voice-record-button"
          :loading="recording"
          loading-text="松开发送"
          @touchstart.prevent="startRecording"
          @touchend="stopRecording"
          @touchcancel="cancelRecording"
        >
          {{ recording ? '松开发送' : '按住说话' }}
        </van-button>
      </div>
      
      <!-- 发送按钮 -->
      <van-button
        v-if="inputMode === 'text' && textMessage.trim()"
        class="send-button"
        type="primary"
        size="small"
        round
        @click="sendTextMessage"
      >
        发送
      </van-button>
      
      <!-- 更多功能按钮 -->
      <van-button
        v-else-if="inputMode === 'text'"
        class="more-button"
        icon="add-o"
        size="small"
        round
        @click="showMoreActions = !showMoreActions"
      />
    </div>
    
    <!-- 扩展功能面板 -->
    <div v-show="showMoreActions" class="more-actions">
      <div class="action-grid">
        <div class="action-item" @click="chooseImage">
          <div class="action-icon">
            <van-icon name="photo-o" size="1.5rem" color="#2c2c2c" />
          </div>
          <div class="action-name">图片</div>
        </div>
        <div class="action-item" @click="chooseLocation">
          <div class="action-icon">
            <van-icon name="location-o" size="1.5rem" color="#2c2c2c" />
          </div>
          <div class="action-name">位置</div>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <van-icon name="gift-o" size="1.5rem" color="#2c2c2c" />
          </div>
          <div class="action-name">商品</div>
        </div>
        <div class="action-item">
          <div class="action-icon">
            <van-icon name="like-o" size="1.5rem" color="#2c2c2c" />
          </div>
          <div class="action-name">表情</div>
        </div>
      </div>
    </div>
    
    <!-- 文件选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  placeholder: {
    type: String,
    default: '输入消息...'
  },
  loadingImage: {
    type: Boolean,
    default: false
  },
  loadingVoice: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-text', 'send-image', 'send-voice', 'send-location'])

// 输入相关的状态
const inputMode = ref('text') // 'text' 或 'voice'
const textMessage = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)
const showMoreActions = ref(false)

// 文本输入框的行数
const textareaRows = computed(() => {
  const lineCount = (textMessage.value.match(/\n/g) || []).length + 1
  return Math.min(Math.max(lineCount, 1), 4) // 最小1行，最大4行
})

// 语音录制相关状态
const recording = ref(false)
const recordingStart = ref(0)
const recordingTimer = ref(null)

// 切换输入模式
const toggleInputMode = () => {
  inputMode.value = inputMode.value === 'text' ? 'voice' : 'text'
  showMoreActions.value = false
}

// 发送文本消息
const sendTextMessage = () => {
  const message = textMessage.value.trim()
  if (!message) return
  
  emit('send-text', message)
  textMessage.value = ''
  adjustTextareaHeight()
}

// 开始录音
const startRecording = () => {
  recording.value = true
  recordingStart.value = Date.now()
  
  // 模拟录音状态
  // 实际项目中需要调用录音API
  showToast('开始录音，松开发送')
}

// 停止录音并发送
const stopRecording = () => {
  if (!recording.value) return
  
  const duration = Math.floor((Date.now() - recordingStart.value) / 1000)
  recording.value = false
  
  if (duration < 1) {
    showToast('录音时间太短')
    return
  }
  
  // 模拟发送语音消息
  // 实际项目中需要处理录音文件
  emit('send-voice', {
    duration,
    file: null // 实际项目中应该是录音文件
  })
}

// 取消录音
const cancelRecording = () => {
  recording.value = false
  showToast('取消录音')
}

// 选择图片
const chooseImage = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 处理文件选择
const handleFileSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  // 验证文件类型和大小
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    return
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    showToast('图片大小不能超过10MB')
    return
  }
  
  emit('send-image', file)
  
  // 重置文件输入，以便可以再次选择同一文件
  event.target.value = ''
  showMoreActions.value = false
}

// 选择位置
const chooseLocation = () => {
  // 模拟选择位置
  // 实际项目中需要调用地图API
  emit('send-location')
  showMoreActions.value = false
}

// 调整文本输入框高度
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return
  
  nextTick(() => {
    const textarea = textareaRef.value
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`
  })
}

// 焦点相关处理
const onFocus = () => {
  showMoreActions.value = false
}

const onBlur = () => {
  // 可以在这里处理失去焦点时的逻辑
}

// 处理回车键
const onKeyEnter = (event) => {
  // 如果按下了shift键，允许换行
  if (event.shiftKey) {
    return true
  }
  
  // 否则发送消息
  sendTextMessage()
}

// 监听文本变化，调整输入框高度
watch(textMessage, adjustTextareaHeight)

// 组件挂载时的初始化
onMounted(() => {
  adjustTextareaHeight()
})
</script>

<style scoped>
.chat-input {
  border-top: 1px solid #e5e5e5;
  background-color: #f5f5f5;
  padding: 0.5rem;
}

.input-container {
  display: flex;
  align-items: center;
}

.voice-button,
.more-button,
.send-button {
  flex-shrink: 0;
  height: 2.2rem;
  width: 2.2rem;
  padding: 0;
  margin: 0 0.3rem;
}

.voice-button.active {
  background-color: #e5e5e5;
  color: #1989fa;
}

.text-input-wrapper {
  flex: 1;
  margin: 0 0.2rem;
  background-color: #fff;
  border-radius: 1.1rem;
  overflow: hidden;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 0.5rem 0.8rem;
  font-size: 0.9rem;
  line-height: 1.3;
  max-height: 100px;
}

.voice-input-wrapper {
  flex: 1;
  margin: 0 0.2rem;
}

.voice-record-button {
  width: 100%;
  height: 2.2rem;
  font-size: 0.9rem;
  background-color: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 1.1rem;
  color: #333;
  padding: 0 1rem;
}

.send-button {
  width: auto;
  padding: 0 0.8rem;
}

.more-actions {
  padding: 1rem 0;
  background-color: #f5f5f5;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 0 0.5rem;
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
  border-radius: 0.8rem;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.3rem;
}

.action-name {
  font-size: 0.75rem;
  color: #666;
}
</style> 