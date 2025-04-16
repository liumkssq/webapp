<template>
  <div
    class="notification-item"
    :class="{ unread: !notification.isRead }"
    @click="handleClick"
  >
    <div class="icon-area">
      <van-badge :dot="!notification.isRead" :offset="[-5, 5]">
        <van-image
          v-if="notification.sender?.avatar"
          :src="notification.sender.avatar || defaultAvatar"
          width="40"
          height="40"
          round
          fit="cover"
          class="sender-avatar"
          @error="onImageError"
        />
        <div v-else class="type-icon-wrapper">
           <van-icon :name="notificationIcon" size="24" />
        </div>
      </van-badge>
    </div>
    <div class="content-area">
      <div class="title-time">
        <span class="title">{{ notification.title || '系统通知' }}</span>
        <span class="time">{{ formattedTime }}</span>
      </div>
      <div class="content">{{ notification.content || '暂无内容' }}</div>
    </div>
    <!-- Optional: Mark read button -->
    <!-- <van-button v-if="!notification.isRead" size="mini" @click.stop="markRead">标记已读</van-button> -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Image as VanImage, Icon as VanIcon, Badge as VanBadge } from 'vant';
import { formatDistanceToNowStrict } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DEFAULT_AVATAR } from '@/utils/defaultImages';

const props = defineProps({
  notification: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const emit = defineEmits(['click', 'mark-read']);

const router = useRouter();
const defaultAvatar = DEFAULT_AVATAR;

// 根据通知类型获取图标
const notificationIcon = computed(() => {
  const type = props.notification.type;
  const subType = props.notification.subType;
  switch (type) {
    case 'interaction':
      if (subType === 'comment') return 'chat-o';
      if (subType === 'like') return 'like-o'; // 使用 like-o 表示点赞
      if (subType === 'follow') return 'friends-o';
      if (subType === 'mention') return 'at';
      return 'chat-o'; // Default for interaction
    case 'transaction':
      return 'records';
    case 'lostfound':
      return 'location-o';
    case 'system':
      return 'volume-o';
    default:
      return 'bell';
  }
});

// 格式化时间
const formattedTime = computed(() => {
  if (!props.notification.createdAt) return '';
  try {
    return formatDistanceToNowStrict(new Date(props.notification.createdAt), {
      addSuffix: true,
      locale: zhCN
    });
  } catch (e) {
    console.error('Error formatting notification time:', e);
    return '';
  }
});

// 处理点击事件
const handleClick = () => {
  // 先触发标记已读 (如果需要)
  if (!props.notification.isRead) {
    emit('mark-read', props.notification.id);
  }
  // 再触发点击事件，用于可能的跳转
  emit('click', props.notification);
};

const onImageError = (event) => {
  event.target.src = defaultAvatar;
};

// 如果需要单独的标记已读按钮
// const markRead = () => {
//   emit('mark-read', props.notification.id);
// };
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f7f8fa;
}

.notification-item.unread {
  background-color: #fff; /* Slightly different background for unread, or keep same */
  /* Optional: Add a stronger visual cue like a left border */
  /* border-left: 3px solid var(--van-primary-color); */
}

.icon-area {
  margin-right: 12px;
  position: relative; /* For badge positioning */
}

.sender-avatar {
  /* Styles for avatar */
}

.type-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #646566;
}

/* Adjust badge position if needed */
:deep(.van-badge--dot) {
  /* Example: top: 0; right: 0; */
}

.content-area {
  flex: 1;
  min-width: 0; /* Prevent overflow */
}

.title-time {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%; /* Limit title width */
}

.time {
  font-size: 12px;
  color: #969799;
  white-space: nowrap;
}

.content {
  font-size: 13px;
  color: #646566;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.notification-item.unread .title,
.notification-item.unread .content {
 /* Optional: Make unread text bolder or darker */
 /* font-weight: 500; */
 /* color: #323233; */
}

</style>
