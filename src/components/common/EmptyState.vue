<template>
  <div class="empty-state" :class="{ 'is-small': small }">
    <div class="empty-icon">
      <i class="material-icons">{{ icon }}</i>
    </div>
    <div class="empty-text">{{ text }}</div>
    <div v-if="subText" class="empty-sub-text">{{ subText }}</div>
    <div v-if="actionText" class="empty-action" @click="$emit('action')">
      {{ actionText }}
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 显示的文本
  text: {
    type: String,
    default: '暂无数据'
  },
  // 副文本
  subText: {
    type: String,
    default: ''
  },
  // 图标
  icon: {
    type: String,
    default: 'inbox'
  },
  // 操作文本
  actionText: {
    type: String,
    default: ''
  },
  // 是否为小尺寸
  small: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state.is-small {
  padding: 20px;
}

.empty-icon {
  margin-bottom: 15px;
}

.empty-icon i {
  font-size: 60px;
  color: #ccc;
}

.empty-state.is-small .empty-icon i {
  font-size: 40px;
}

.empty-text {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 8px;
}

.empty-state.is-small .empty-text {
  font-size: 0.9rem;
}

.empty-sub-text {
  font-size: 0.9rem;
  color: #999;
  margin-bottom: 15px;
}

.empty-state.is-small .empty-sub-text {
  font-size: 0.8rem;
}

.empty-action {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #1e88e5;
  cursor: pointer;
}

.empty-action:hover {
  background-color: #e0e0e0;
}
</style>