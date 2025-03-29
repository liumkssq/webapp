<template>
  <div class="upload-dialog">
    <div class="dialog-container">
      <!-- 标题 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <div class="close-button" @click="handleClose">
          <i class="material-icons">close</i>
        </div>
      </div>
      
      <!-- 内容 -->
      <div class="dialog-content">
        <!-- 图片预览 -->
        <div v-if="previewUrl" class="preview-container">
          <img 
            :src="previewUrl" 
            alt="预览" 
            class="preview-image"
            :style="previewStyle"
          />
        </div>
        
        <!-- 拖拽提示框 -->
        <div 
          v-else
          class="upload-area"
          :class="{ 'drag-over': isDragging }"
          @click="triggerFileInput"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <div class="upload-icon">
            <i class="material-icons">cloud_upload</i>
          </div>
          <div class="upload-text">点击或拖拽图片到此处上传</div>
          <div class="upload-hint">{{ acceptMessage }}</div>
        </div>
        
        <!-- 提示信息 -->
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <!-- 隐藏的文件输入 -->
        <input 
          type="file" 
          ref="fileInput" 
          class="file-input" 
          :accept="accept" 
          @change="handleFileChange"
        />
      </div>
      
      <!-- 操作按钮 -->
      <div class="dialog-footer">
        <button 
          class="cancel-button" 
          @click="handleClose"
        >
          取消
        </button>
        <button 
          class="upload-button" 
          :class="{ 'disabled': !selectedFile }" 
          :disabled="!selectedFile"
          @click="handleUpload"
        >
          上传
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // 对话框标题
  title: {
    type: String,
    default: '上传图片'
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: 'image/*'
  },
  // 最大文件大小（单位：MB）
  maxSize: {
    type: Number,
    default: 5
  },
  // 裁剪比例
  aspectRatio: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'upload'])

// 状态
const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref('')
const error = ref('')
const isDragging = ref(false)

// 接受类型提示
const acceptMessage = computed(() => {
  if (props.accept === 'image/*') {
    return `支持 JPG、PNG、GIF 格式，最大 ${props.maxSize}MB`
  }
  return `文件大小不超过 ${props.maxSize}MB`
})

// 预览样式
const previewStyle = computed(() => {
  if (!props.aspectRatio) return {}
  
  return {
    aspectRatio: props.aspectRatio
  }
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 文件选择处理
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndPreview(file)
  }
}

// 拖拽处理
const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndPreview(file)
  }
}

// 验证并预览文件
const validateAndPreview = (file) => {
  // 重置错误
  error.value = ''
  
  // 验证文件类型
  if (props.accept !== '*' && !file.type.match(props.accept.replace('*', '.*'))) {
    error.value = '文件类型不支持'
    return
  }
  
  // 验证文件大小
  if (file.size > props.maxSize * 1024 * 1024) {
    error.value = `文件大小不能超过 ${props.maxSize}MB`
    return
  }
  
  // 预览图片
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    // 非图片文件不显示预览
    previewUrl.value = ''
  }
  
  selectedFile.value = file
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 上传文件
const handleUpload = () => {
  if (!selectedFile.value) return
  
  emit('upload', selectedFile.value)
}
</script>

<style scoped>
.upload-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  width: 90%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
}

.close-button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.dialog-content {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover, .upload-area.drag-over {
  border-color: #1e88e5;
  background-color: rgba(30, 136, 229, 0.05);
}

.upload-icon {
  margin-bottom: 15px;
}

.upload-icon i {
  font-size: 48px;
  color: #ccc;
}

.upload-text {
  font-size: 1rem;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 0.8rem;
  color: #999;
}

.preview-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.error-message {
  margin-top: 10px;
  color: #f44336;
  font-size: 0.9rem;
  text-align: center;
}

.file-input {
  display: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px;
  border-top: 1px solid #f0f0f0;
}

.cancel-button, .upload-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  margin-left: 10px;
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
}

.upload-button {
  background-color: #1e88e5;
  color: white;
}

.upload-button.disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.upload-button:not(.disabled):hover {
  background-color: #1976d2;
}
</style>