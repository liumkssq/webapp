<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast" :class="toastTypeClass">
      <div v-if="icon" class="toast-icon">
        <i class="material-icons">{{ icon }}</i>
      </div>
      <div class="toast-content">
        {{ message }}
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'

// 消息类型和对应图标
const typeIconMap = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info'
}

// 状态
const visible = ref(false)
const message = ref('')
const type = ref('info')
const timeout = ref(3000)
let timer = null

// 计算类型相关样式
const toastTypeClass = computed(() => {
  return `toast-type-${type.value}`
})

// 计算图标
const icon = computed(() => {
  return typeIconMap[type.value]
})

// 显示toast
const show = (msg, toastType = 'info', duration = 3000) => {
  // 清除之前的定时器
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  
  // 更新状态
  message.value = msg
  type.value = toastType in typeIconMap ? toastType : 'info'
  timeout.value = duration
  visible.value = true
  
  // 设置自动隐藏
  if (duration > 0) {
    timer = setTimeout(() => {
      hide()
    }, duration)
  }
}

// 隐藏toast
const hide = () => {
  visible.value = false
}

// 暴露方法
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 180px;
  max-width: 80%;
  padding: 10px 15px;
  background-color: rgba(50, 50, 50, 0.9);
  color: white;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
}

.toast-icon {
  margin-right: 10px;
}

.toast-content {
  font-size: 0.9rem;
}

/* 类型样式 */
.toast-type-success {
  background-color: rgba(76, 175, 80, 0.9);
}

.toast-type-error {
  background-color: rgba(244, 67, 54, 0.9);
}

.toast-type-warning {
  background-color: rgba(255, 152, 0, 0.9);
}

.toast-type-info {
  background-color: rgba(33, 150, 243, 0.9);
}

/* 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>