<template>
  <div class="notification-list">
    <!-- 无通知提示 -->
    <div class="empty-notification" v-if="notifications.length === 0 && !loading">
      <i class="icon-notification-empty"></i>
      <p>暂无通知</p>
    </div>
    
    <!-- 通知列表 -->
    <div v-for="(notification, index) in notifications" :key="notification.id" class="notification-container">
      <!-- 日期分组标题 -->
      <div 
        class="date-header" 
        v-if="index === 0 || shouldGroupByDate(notifications[index-1].createTime, notification.createTime)"
      >
        {{ formatDateHeader(notification.createTime) }}
      </div>
      
      <!-- 通知项 -->
      <SwipeListItem
        :itemId="notification.id"
        itemType="notification"
        :actions="['delete', 'mark']"
        :favorited="notification.isRead"
        @delete="handleDeleteNotification"
        @favorite="handleToggleRead"
      >
        <div 
          class="notification-item" 
          :class="{ 'unread': !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <!-- 图标 -->
          <div class="notification-icon" :class="getIconClass(notification.type)">
            <i :class="getIconName(notification.type)"></i>
          </div>
          
          <!-- 内容 -->
          <div class="notification-content">
            <!-- 标题 -->
            <div class="notification-title">
              {{ notification.title }}
            </div>
            
            <!-- 描述 -->
            <div class="notification-desc" v-if="notification.content">
              {{ notification.content }}
            </div>
            
            <!-- 时间 -->
            <div class="notification-time">
              {{ formatTime(notification.createTime) }}
            </div>
          </div>
          
          <!-- 未读标记 -->
          <div class="unread-dot" v-if="!notification.isRead"></div>
        </div>
      </SwipeListItem>
    </div>
    
    <!-- 加载更多 -->
    <div class="load-more" v-if="hasMore" @click="loadMore">
      <div class="loading-spinner" v-if="loading"></div>
      <span v-else>加载更多</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SwipeListItem from '../SwipeListItem.vue';
import { markNotificationRead, deleteNotification } from '@/api/notification';

const props = defineProps({
  // 通知列表
  notifications: {
    type: Array,
    default: () => []
  },
  // 是否有更多通知
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

const emit = defineEmits(['load-more', 'notification-click', 'delete', 'mark-read']);

// 处理通知点击
const handleNotificationClick = (notification) => {
  if (!notification.isRead) {
    handleToggleRead({
      itemId: notification.id,
      value: true
    });
  }
  emit('notification-click', notification);
};

// 处理删除通知
const handleDeleteNotification = (data) => {
  emit('delete', data.itemId);
};

// 处理切换已读状态
const handleToggleRead = (data) => {
  emit('mark-read', {
    id: data.itemId,
    isRead: data.value
  });
};

// 加载更多通知
const loadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('load-more');
  }
};

// 获取通知图标类名
const getIconClass = (type) => {
  const typeMap = {
    'system': 'system-icon',
    'follow': 'follow-icon',
    'like': 'like-icon',
    'comment': 'comment-icon',
    'message': 'message-icon',
    'mention': 'mention-icon'
  };
  return typeMap[type] || 'default-icon';
};

// 获取通知图标名称
const getIconName = (type) => {
  const typeMap = {
    'system': 'icon-system',
    'follow': 'icon-user-plus',
    'like': 'icon-heart',
    'comment': 'icon-comment',
    'message': 'icon-message',
    'mention': 'icon-at'
  };
  return typeMap[type] || 'icon-notification';
};

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  
  // 计算时间差（毫秒）
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟显示"刚刚"
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时显示"x分钟前"
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  
  // 小于24小时显示"x小时前"
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }
  
  // 小于7天显示"x天前"
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }
  
  // 今年内显示"月-日"
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  // 其他显示"年-月-日"
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 判断是否需要按日期分组
const shouldGroupByDate = (prevTime, currTime) => {
  const prev = new Date(prevTime);
  const curr = new Date(currTime);
  
  // 如果日期不同，需要分组
  return prev.toDateString() !== curr.toDateString();
};

// 格式化日期头部
const formatDateHeader = (time) => {
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
  
  // 本周内显示"周几"
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayDiff = Math.floor((now - date) / (24 * 60 * 60 * 1000));
  if (dayDiff < 7) {
    return weekdays[date.getDay()];
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
.notification-list {
  padding: var(--spacing-md);
}

.notification-container {
  margin-bottom: var(--spacing-sm);
}

.date-header {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) 0;
  margin-top: var(--spacing-md);
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-md);
  background-color: var(--surface);
  border-radius: var(--radius-md);
  position: relative;
  transition: background-color 0.2s;
}

.unread {
  background-color: var(--surface-highlight);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.notification-icon i {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.system-icon {
  background-color: var(--blue-light);
}

.system-icon i {
  color: var(--blue);
}

.follow-icon {
  background-color: var(--green-light);
}

.follow-icon i {
  color: var(--green);
}

.like-icon {
  background-color: var(--red-light);
}

.like-icon i {
  color: var(--red);
}

.comment-icon {
  background-color: var(--purple-light);
}

.comment-icon i {
  color: var(--purple);
}

.message-icon {
  background-color: var(--primary-light-color);
}

.message-icon i {
  color: var(--primary-color);
}

.mention-icon {
  background-color: var(--orange-light);
}

.mention-icon i {
  color: var(--orange);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.unread .notification-title {
  font-weight: 600;
}

.notification-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.unread-dot {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
}

.empty-notification {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  padding: var(--spacing-xl) 0;
}

.empty-notification i {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
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
</style> 