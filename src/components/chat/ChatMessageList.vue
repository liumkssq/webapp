<template>
  <div class="chat-message-list">
    <div class="message-date-divider" v-if="messages.length > 0">
      {{ formatDateDivider(messages[0].createTime) }}
    </div>
    
    <div v-for="(message, index) in messages" :key="message.id" class="message-container">
      <!-- 日期分割线 -->
      <div 
        class="message-date-divider" 
        v-if="index > 0 && shouldShowDateDivider(messages[index-1].createTime, message.createTime)"
      >
        {{ formatDateDivider(message.createTime) }}
      </div>
      
      <!-- 消息项 -->
      <SwipeListItem
        :itemId="message.id"
        itemType="message"
        :actions="getAvailableActions(message)"
        @delete="handleDeleteMessage"
      >
        <div 
          class="message-item" 
          :class="{ 
            'self-message': message.senderId === currentUserId,
            'other-message': message.senderId !== currentUserId 
          }"
        >
          <!-- 对方头像 -->
          <div 
            class="message-avatar" 
            v-if="message.senderId !== currentUserId"
            @click="handleUserClick(message.senderId)"
          >
            <img :src="message.senderAvatar || defaultAvatar" :alt="message.senderName">
          </div>
          
          <!-- 消息内容 -->
          <div class="message-content">
            <!-- 文本消息 -->
            <div class="message-bubble text-message" v-if="message.type === 'text'">
              {{ message.content }}
            </div>
            
            <!-- 图片消息 -->
            <div class="message-bubble image-message" v-else-if="message.type === 'image'" @click="previewImage(message.content)">
              <img :src="message.content" alt="图片消息">
            </div>
            
            <!-- 文件消息 -->
            <div class="message-bubble file-message" v-else-if="message.type === 'file'" @click="downloadFile(message)">
              <div class="file-icon">
                <i class="icon-file"></i>
              </div>
              <div class="file-info">
                <div class="file-name">{{ message.content }}</div>
                <div class="file-size" v-if="message.fileSize">{{ formatFileSize(message.fileSize) }}</div>
              </div>
            </div>
            
            <!-- 发送状态 -->
            <div class="message-status" v-if="message.senderId === currentUserId">
              <i class="icon-check" v-if="message.isRead"></i>
              <i class="icon-clock" v-else-if="message.status === 'sending'"></i>
              <i class="icon-error" v-else-if="message.status === 'failed'"></i>
            </div>
          </div>
          
          <!-- 自己的头像 -->
          <div 
            class="message-avatar" 
            v-if="message.senderId === currentUserId"
          >
            <img :src="currentUserAvatar || defaultAvatar" alt="我">
          </div>
        </div>
      </SwipeListItem>
    </div>
    
    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore" @click="loadMore">
      <div class="loading-spinner" v-if="loading"></div>
      <span v-else>加载更多</span>
    </div>
    
    <!-- 无消息提示 -->
    <div class="empty-message" v-if="messages.length === 0 && !loading">
      <i class="icon-chat-empty"></i>
      <p>暂无消息，快发送第一条消息吧</p>
    </div>
    
    <!-- 图片预览 -->
    <div class="image-preview" v-if="showImagePreview" @click="closePreview">
      <img :src="previewImageUrl" alt="图片预览">
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SwipeListItem from '../SwipeListItem.vue';

const props = defineProps({
  // 消息列表
  messages: {
    type: Array,
    default: () => []
  },
  // 当前用户ID
  currentUserId: {
    type: [String, Number],
    required: true
  },
  // 当前用户头像
  currentUserAvatar: {
    type: String,
    default: ''
  },
  // 是否有更多消息
  hasMore: {
    type: Boolean,
    default: false
  },
  // 是否正在加载
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['load-more', 'delete-message', 'user-click']);

// 默认头像
const defaultAvatar = '/images/default-avatar.png';

// 图片预览状态
const showImagePreview = ref(false);
const previewImageUrl = ref('');

// 获取可用操作
const getAvailableActions = (message) => {
  // 如果是自己发送的消息，可以删除和撤回
  if (message.senderId === props.currentUserId) {
    return ['delete'];
  }
  // 如果是对方发送的消息，可以删除和转发
  return ['delete'];
};

// 处理删除消息
const handleDeleteMessage = (data) => {
  emit('delete-message', data);
};

// 预览图片
const previewImage = (url) => {
  previewImageUrl.value = url;
  showImagePreview.value = true;
};

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false;
};

// 下载文件
const downloadFile = (message) => {
  if (message.fileUrl) {
    window.open(message.fileUrl);
  }
};

// 处理用户点击
const handleUserClick = (userId) => {
  emit('user-click', userId);
};

// 加载更多消息
const loadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('load-more');
  }
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else {
    return (size / (1024 * 1024)).toFixed(1) + 'MB';
  }
};

// 判断是否需要显示日期分割线
const shouldShowDateDivider = (prevTime, currTime) => {
  const prev = new Date(prevTime);
  const curr = new Date(currTime);
  
  // 如果日期不同，显示分割线
  return prev.toDateString() !== curr.toDateString();
};

// 格式化日期分割线文本
const formatDateDivider = (time) => {
  const date = new Date(time);
  const now = new Date();
  
  // 当天显示"今天"
  if (date.toDateString() === now.toDateString()) {
    return '今天';
  }
  
  // 昨天显示"昨天"
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // 今年内显示"月-日"
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  // 其他显示"年-月-日"
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
</script>

<style scoped>
.chat-message-list {
  padding: var(--spacing-md);
}

.message-container {
  margin-bottom: var(--spacing-md);
}

.message-date-divider {
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  margin: var(--spacing-md) 0;
  position: relative;
}

.message-date-divider::before,
.message-date-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 20%;
  height: 0.5px;
  background-color: var(--separator-color);
}

.message-date-divider::before {
  left: 10%;
}

.message-date-divider::after {
  right: 10%;
}

.message-item {
  display: flex;
  align-items: flex-start;
}

.self-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  max-width: 70%;
  margin: 0 var(--spacing-sm);
  position: relative;
}

.message-bubble {
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  word-break: break-word;
}

.self-message .message-bubble {
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  border-top-right-radius: 0;
}

.other-message .message-bubble {
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border-top-left-radius: 0;
}

.image-message {
  padding: 0;
  overflow: hidden;
}

.image-message img {
  display: block;
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.file-message {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: var(--spacing-sm);
  font-size: var(--font-size-xl);
}

.file-info {
  flex: 1;
}

.file-name {
  font-size: var(--font-size-sm);
  margin-bottom: 4px;
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.message-status {
  position: absolute;
  bottom: -16px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.self-message .message-status {
  right: 0;
}

.load-more {
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-md) 0;
  cursor: pointer;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--separator-color);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  padding: var(--spacing-xl) 0;
}

.empty-message i {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
}
</style> 