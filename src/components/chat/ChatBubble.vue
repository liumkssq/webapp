<!-- 聊天气泡组件 -->
<template>
  <div 
    :class="[
      'chat-bubble', 
      { 
        'self': isSelf,
        'other': !isSelf
      }
    ]"
  >
    <!-- 头像 -->
    <div class="avatar" v-if="!isSelf && showAvatar" @click="onAvatarClick">
      <img :src="message.senderAvatar || defaultAvatar" :alt="message.senderName">
    </div>
    
    <div class="bubble-container">
      <!-- 发送者名称 -->
      <div v-if="!isSelf && showName" class="sender-name">
        {{ message.senderName }}
      </div>
      
      <!-- 消息内容 - 始终显示为文本 -->
      <div class="bubble-content text-content">
        {{ message.content }}
      </div>
      
      <!-- 消息状态 -->
      <div class="message-status" v-if="isSelf">
        <span v-if="message.status === 'sending'">发送中...</span>
        <span v-else-if="message.status === 'failed'" class="failed">发送失败</span>
        <span v-else-if="message.isRead" class="read">已读</span>
        <span v-else class="sent">已发送</span>
      </div>
    </div>
    
    <!-- 头像 (自己的消息显示在右侧) -->
    <div class="avatar" v-if="isSelf && showAvatar">
      <img :src="message.senderAvatar || defaultAvatar" :alt="message.senderName">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 定义属性
const props = defineProps({
  // 消息对象
  message: {
    type: Object,
    required: true
  },
  // 是否显示头像
  showAvatar: {
    type: Boolean,
    default: true
  },
  // 是否显示发送者名称
  showName: {
    type: Boolean,
    default: true
  }
})

// 默认头像
const defaultAvatar = '/images/default-avatar.png';

// 事件
const emit = defineEmits([
  'avatar-click',
  'retry'
])

// 是否是自己发送的消息
const isSelf = computed(() => {
  return props.message.isSelf === true;
})

// 头像点击事件
const onAvatarClick = () => {
  if (!isSelf.value) {
    emit('avatar-click', props.message.senderId);
  }
}
</script>

<style scoped>
/* 聊天气泡组件 - 整体样式 */
.chat-bubble {
  display: flex;
  margin-bottom: 16px;
  position: relative;
  max-width: 100%;
}

/* 自己发送的消息样式 */
.chat-bubble.self {
  flex-direction: row-reverse; /* 自己的消息整体靠右显示 */
  justify-content: flex-start;
}

/* 对方发送的消息样式 */
.chat-bubble.other {
  flex-direction: row; /* 对方的消息整体靠左显示 */
  justify-content: flex-start;
}

/* 用户头像样式 */
.avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  margin: 0 8px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 气泡容器 */
.bubble-container {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

/* 自己的消息气泡容器对齐方式 */
.self .bubble-container {
  align-items: flex-end; /* 内容右对齐 */
}

/* 对方的消息气泡容器对齐方式 */
.other .bubble-container {
  align-items: flex-start; /* 内容左对齐 */
}

/* 发送者名称 */
.sender-name {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  padding-left: 12px;
}

/* 气泡内容样式 */
.bubble-content {
  padding: 10px 12px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
  color: #000000; /* 统一使用黑色字体 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

/* 自己发送的消息 */
.self .bubble-content {
  background-color: #4CAF50; /* 绿色背景 */
  border-bottom-right-radius: 4px;
}

/* 对方发送的消息 */
.other .bubble-content {
  background-color: #FFFFFF; /* 白色背景 */
  border-bottom-left-radius: 4px;
}

/* 系统消息 */
.system-message {
  text-align: center;
  background-color: rgba(0, 0, 0, 0.05);
  color: #666;
  padding: 6px 12px;
  border-radius: 16px;
  margin: 0 auto;
  max-width: 70%;
  font-size: 12px;
}

/* 消息状态 */
.message-status {
  font-size: 11px;
  color: #999;
  text-align: right;
  margin-top: 4px;
  padding-right: 4px;
}

.message-status .failed {
  color: #f44336;
}

.message-status .read {
  color: #2196F3;
}

.message-status .sent {
  color: #999;
}

/* 图片消息 */
.image-content img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

/* 文件消息 */
.file-content {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.file-icon {
  margin-right: 8px;
  font-size: 24px;
  color: #1E88E5;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.file-size {
  font-size: 12px;
  color: #666;
}

/* 位置消息 */
.location-content {
  display: flex;
  align-items: center;
}

.location-icon {
  margin-right: 8px;
  font-size: 24px;
  color: #E91E63;
}

.location-info {
  flex: 1;
}

.location-name {
  font-weight: 500;
}

.location-address {
  font-size: 12px;
  color: #666;
}

/* 语音消息 */
.audio-content {
  display: flex;
  align-items: center;
  min-width: 120px;
}

.audio-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #673AB7;
}

.audio-info {
  display: flex;
  flex-direction: column;
}

.audio-wave {
  height: 20px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  margin-top: 4px;
}

/* 撤回消息 */
.revoked-message {
  font-style: italic;
  color: #999;
}

/* 操作菜单 */
.action-menu {
  position: absolute;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 10;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.action-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.action-item:hover {
  background-color: #f5f5f5;
}

.action-item.delete {
  color: #f44336;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .bubble-container {
    max-width: 80%;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
  }
}
</style>