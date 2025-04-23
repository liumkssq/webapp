<template>
  <div 
    class="message-bubble" 
    :class="{ 
      'self': isSelf,
      'other': !isSelf
    }"
  >
    <!-- 头像 -->
    <van-image
      v-if="!isSelf"
      round
      width="40px"
      height="40px"
      :src="avatar"
      fit="cover"
      class="avatar"
      @click="$emit('click-avatar')"
    >
      <template #error>
        <div class="avatar-fallback">{{ getInitials(name) }}</div>
      </template>
    </van-image>
    
    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 发送者名称（在群聊中显示） -->
      <div v-if="!isSelf && showName" class="sender-name">{{ name }}</div>
      
      <div
        class="message-bubble-content"
        :class="{ 
          'text': type === 'text',
          'image': type === 'image',
          'file': type === 'file',
          'location': type === 'location',
          'voice': type === 'voice',
          'video': type === 'video'
        }"
      >
        <!-- 文本消息 -->
        <span v-if="type === 'text'" v-html="formatContent(content)"></span>
        
        <!-- 图片消息 -->
        <div v-else-if="type === 'image'" class="image-message">
          <van-image
            :src="content"
            :width="200"
            fit="cover"
            radius="4px"
            @click="$emit('preview-image', content)"
          >
            <template #loading>
              <div class="loading-container">
                <van-loading type="spinner" size="20" />
              </div>
            </template>
            <template #error>
              <div class="error-container">
                <van-icon name="photo-fail" size="24" />
                <span>加载失败</span>
              </div>
            </template>
          </van-image>
        </div>
        
        <!-- 文件消息 -->
        <div v-else-if="type === 'file'" class="file-message" @click="$emit('download-file', content, fileName)">
          <van-icon name="description" size="24px" class="file-icon" />
          <div class="file-info">
            <div class="file-name">{{ fileName || '文件' }}</div>
            <div class="file-size">{{ formatFileSize(fileSize) }}</div>
          </div>
          <van-icon name="down" size="18px" class="download-icon" />
        </div>
        
        <!-- 位置消息 -->
        <div v-else-if="type === 'location'" class="location-message" @click="$emit('view-location', content)">
          <van-icon name="location-o" size="24px" class="location-icon" />
          <span>{{ content }}</span>
        </div>
        
        <!-- 语音消息 -->
        <div v-else-if="type === 'voice'" class="voice-message" @click="$emit('play-voice', content)">
          <van-icon name="volume" size="18px" class="voice-icon" />
          <div class="voice-duration">{{ duration || '0' }}"</div>
        </div>
        
        <!-- 视频消息 -->
        <div v-else-if="type === 'video'" class="video-message" @click="$emit('play-video', content)">
          <div class="video-container">
            <van-image
              :src="poster || content"
              width="200"
              fit="cover"
              radius="4px"
            >
              <template #error>
                <div class="error-container">
                  <van-icon name="video-o" size="36" />
                </div>
              </template>
            </van-image>
            <div class="play-icon">
              <van-icon name="play-circle-o" size="36" />
            </div>
          </div>
        </div>
        
        <!-- 其他类型消息 -->
        <span v-else>[不支持的消息类型]</span>
      </div>
      
      <!-- 消息时间 -->
      <div class="message-time">{{ formatTime(timestamp) }}</div>
      
      <!-- 消息状态 -->
      <div class="message-status" v-if="isSelf">
        <van-icon v-if="status === 'sending'" name="more-o" class="sending" />
        <van-icon v-else-if="status === 'failed'" name="warning-o" class="failed" @click="$emit('resend')" />
        <div v-else-if="status === 'read'" class="read">已读</div>
      </div>
    </div>
    
    <!-- 发送者头像 (自己) -->
    <van-image
      v-if="isSelf"
      round
      width="40px"
      height="40px"
      :src="avatar"
      fit="cover"
      class="avatar"
      @click="$emit('click-avatar')"
    >
      <template #error>
        <div class="avatar-fallback">{{ getInitials(name) }}</div>
      </template>
    </van-image>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  isSelf: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  showName: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: [Number, String],
    default: () => Date.now()
  },
  status: {
    type: String,
    default: 'sent'
  },
  fileName: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  duration: {
    type: [Number, String],
    default: ''
  },
  poster: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'click-avatar', 
  'preview-image', 
  'download-file', 
  'view-location', 
  'play-voice', 
  'play-video', 
  'resend'
]);

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const messageTime = dayjs(timestamp);
  const now = dayjs();
  
  // 今天的消息，只显示时间
  if (messageTime.isSame(now, 'day')) {
    return messageTime.format('HH:mm');
  }
  
  // 昨天的消息
  if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天 ' + messageTime.format('HH:mm');
  }
  
  // 一周内的消息
  if (messageTime.isAfter(now.subtract(7, 'day'))) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[messageTime.day()] + ' ' + messageTime.format('HH:mm');
  }
  
  // 更早的消息
  return messageTime.format('MM-DD HH:mm');
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '未知大小';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let fileSize = size;
  let unitIndex = 0;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
};

// 获取姓名首字母
const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 格式化文本内容，处理链接和表情
const formatContent = (content) => {
  if (!content) return '';
  
  // 转义HTML特殊字符
  let formattedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // 将URL转为可点击链接
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  formattedContent = formattedContent.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  
  // 处理换行符
  formattedContent = formattedContent.replace(/\n/g, '<br>');
  
  // 这里可以添加表情处理逻辑
  
  return formattedContent;
};
</script>

<style scoped>
.message-bubble {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.message-bubble.self {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 8px;
  flex-shrink: 0;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #666;
  font-weight: bold;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-bubble.self .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
  padding-left: 4px;
}

.message-bubble-content {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  word-break: break-word;
  position: relative;
}

.message-bubble.other .message-bubble-content {
  background-color: #fff;
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border-top-left-radius: 0;
}

.message-bubble.self .message-bubble-content {
  background-color: #07c160;
  color: #fff;
  border-top-right-radius: 0;
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  margin-bottom: 2px;
}

.message-status {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.sending {
  color: #999;
}

.failed {
  color: #ee0a24;
}

.read {
  color: #999;
  font-size: 10px;
}

/* 图片消息样式 */
.message-bubble-content.image {
  padding: 4px;
  background-color: transparent !important;
  box-shadow: none !important;
}

.image-message {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 200px;
  background-color: #f5f5f5;
  border-radius: 8px;
  flex-direction: column;
  color: #999;
}

.error-container span {
  margin-top: 8px;
  font-size: 12px;
}

/* 文件消息样式 */
.message-bubble-content.file {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.file-icon {
  margin-right: 10px;
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-size {
  font-size: 12px;
  opacity: 0.8;
}

.download-icon {
  margin-left: 8px;
}

/* 位置消息样式 */
.message-bubble-content.location {
  display: flex;
  align-items: center;
}

.location-icon {
  margin-right: 8px;
}

/* 语音消息样式 */
.message-bubble-content.voice {
  display: flex;
  align-items: center;
  min-width: 80px;
}

.voice-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.voice-duration {
  font-size: 12px;
}

/* 视频消息样式 */
.message-bubble-content.video {
  padding: 4px;
  background-color: transparent !important;
  box-shadow: none !important;
}

.video-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 链接样式 */
:deep(a) {
  color: inherit;
  text-decoration: underline;
}
</style>