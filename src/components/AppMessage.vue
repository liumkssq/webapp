<script setup>
import { useMessageStore } from '@/store/message'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

// 使用消息Store
const messageStore = useMessageStore()
const { messages } = storeToRefs(messageStore)

// 获取各类消息图标
const getIcon = (type) => {
  switch (type) {
    case 'success':
      return 'checkmark-circle'
    case 'error':
      return 'close-circle'
    case 'warning':
      return 'warning'
    case 'info':
    default:
      return 'information-circle'
  }
}

// 获取各类消息颜色
const getColor = (type) => {
  switch (type) {
    case 'success':
      return 'var(--success-color)'
    case 'error':
      return 'var(--error-color)'
    case 'warning':
      return 'var(--warning-color)'
    case 'info':
    default:
      return 'var(--info-color)'
  }
}

// 关闭消息
const handleClose = (id) => {
  messageStore.closeMessage(id)
}
</script>

<template>
  <div class="app-message-container">
    <transition-group name="message-fade">
      <div
        v-for="message in messages"
        :key="message.id"
        v-show="message.visible"
        class="message-item"
        :class="[`message-${message.type}`]"
        @click="handleClose(message.id)"
      >
        <div class="message-icon">
          <svg-icon :name="getIcon(message.type)" :color="getColor(message.type)" size="20" />
        </div>
        <div class="message-content">{{ message.content }}</div>
        <div class="message-close" @click.stop="handleClose(message.id)">
          <svg-icon name="close" size="12" />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.app-message-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.message-item {
  width: 100%;
  min-height: 40px;
  margin-bottom: 10px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: slide-in var(--transition-normal);
}

.message-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-content {
  flex: 1;
  font-size: var(--font-size-callout);
  word-break: break-word;
}

.message-close {
  margin-left: 10px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.message-close:hover {
  opacity: 1;
}

.message-success {
  border-left: 3px solid var(--success-color);
}

.message-error {
  border-left: 3px solid var(--error-color);
}

.message-warning {
  border-left: 3px solid var(--warning-color);
}

.message-info {
  border-left: 3px solid var(--info-color);
}

/* 消息动画 */
.message-fade-enter-active {
  transition: all var(--transition-normal) ease-out;
}

.message-fade-leave-active {
  transition: all var(--transition-normal) ease-in;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes slide-in {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 媒体查询，小屏幕适配 */
@media (max-width: 480px) {
  .app-message-container {
    width: 90%;
  }
}
</style>