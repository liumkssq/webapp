<template>
  <!-- 这是一个包装组件，实际使用Vant的Toast功能 -->
</template>

<script setup>
import { showToast, showSuccessToast, showFailToast, showLoadingToast } from 'vant'

// 定义方法
const show = (message, type = 'default', duration = 2000) => {
  switch (type) {
    case 'success':
      showSuccessToast({
        message,
        duration
      })
      break
    case 'error':
      showFailToast({
        message,
        duration
      })
      break
    case 'loading':
      showLoadingToast({
        message,
        duration
      })
      break
    default:
      showToast({
        message,
        duration
      })
  }
}

// 暴露方法给父组件
defineExpose({
  show
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