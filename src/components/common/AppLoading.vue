<script setup>
import { defineProps } from 'vue'

defineProps({
  // 加载提示文本
  text: {
    type: String,
    default: '加载中...'
  },
  // 加载图标尺寸
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 是否全屏显示
  fullscreen: {
    type: Boolean,
    default: false
  },
  // 透明背景
  transparent: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div 
    class="app-loading" 
    :class="{
      'fullscreen': fullscreen,
      'transparent': transparent,
      [`size-${size}`]: true
    }"
  >
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
    <div class="loading-text" v-if="text">{{ text }}</div>
  </div>
</template>

<style scoped>
.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 8px;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.9);
}

.transparent {
  background-color: transparent;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--primary-color, #007aff);
  border-left-color: var(--primary-color, #007aff);
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-color, #333);
}

/* 尺寸变体 */
.size-small .spinner {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.size-medium .spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.size-large .spinner {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.size-small .loading-text {
  font-size: 12px;
}

.size-medium .loading-text {
  font-size: 14px;
}

.size-large .loading-text {
  font-size: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>