<template>
  <div class="notification-list-container">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多通知了"
      @load="loadMore"
      :error="error"
      error-text="加载失败，点击重试"
      :immediate-check="false" 
    >
      <NotificationItem
        v-for="item in notifications"
        :key="item.id"
        :notification="item"
        @click="handleItemClick"
        @mark-read="handleMarkSingleRead"
      />
    </van-list>
    <van-empty
      v-if="!loading && notifications.length === 0 && !error"
      description="暂无通知"
      image-size="80"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineProps, defineEmits, defineExpose } from 'vue';
import { useRouter } from 'vue-router';
import { List as VanList, Empty as VanEmpty, Loading as VanLoading, showToast } from 'vant';
import NotificationItem from './NotificationItem.vue';
import { getNotifications, markNotificationsAsRead, markAllNotificationsAsRead } from '@/api/notification';

const props = defineProps({
  type: {
    type: String,
    required: true // e.g., 'all', 'interaction', 'system'
  }
});

const router = useRouter();
const notifications = ref([]);
const loading = ref(false);
const finished = ref(false);
const error = ref(null);
const page = ref(1);
const limit = ref(15); // 每页加载数量

const emit = defineEmits(['update-counts']); // 定义事件

// 加载更多数据
const loadMore = async () => {
  if (loading.value || finished.value) return;
  
  loading.value = true;
  error.value = null;

  try {
    const params = {
      type: props.type,
      page: page.value,
      limit: limit.value
    };
    console.log(`[NotificationList-${props.type}] Loading page ${page.value}`);
    const response = await getNotifications(params);

    if (response.code === 200) {
      const newNotifications = response.data?.list || [];
      notifications.value.push(...newNotifications);
      console.log(`[NotificationList-${props.type}] Loaded ${newNotifications.length} items.`);
      
      // 更新分页状态
      page.value++;
      if (!response.data?.list || response.data.list.length < limit.value) {
        finished.value = true;
        console.log(`[NotificationList-${props.type}] Reached end.`);
      }
    } else {
      throw new Error(response.message || '加载通知失败');
    }
  } catch (err) {
    console.error(`[NotificationList-${props.type}] Failed to load notifications:`, err);
    error.value = err.message || '网络错误';
    // Vant List 会显示 error-text
  } finally {
    loading.value = false;
  }
};

// 重置并加载第一页
const resetAndLoad = () => {
  console.log(`[NotificationList-${props.type}] Resetting and loading first page.`);
  notifications.value = [];
  page.value = 1;
  finished.value = false;
  error.value = null;
  loading.value = false; // Ensure loading is false before initial load if needed
  // Use nextTick if immediate-check=false causes issues
  // nextTick(() => {
     loadMore();
  // });
};

// 处理单个通知点击
const handleItemClick = async (notification) => {
  console.log('Notification clicked:', notification);
  // 先标记为已读 (如果未读)
  if (!notification.isRead) {
     await handleMarkSingleRead(notification.id, false); // Don't show toast on click-read
  }
  
  // 执行跳转
  if (notification.targetUrl) {
    if (notification.targetUrl.startsWith('/')) {
        router.push(notification.targetUrl);
    } else {
        // Handle external links if necessary
        window.location.href = notification.targetUrl;
    }
  } else {
    console.warn('Notification has no targetUrl for navigation.');
  }
};

// 处理单个标记已读 (由Item组件触发或点击时调用)
const handleMarkSingleRead = async (notificationId, showFeedback = true) => {
   const notificationIndex = notifications.value.findIndex(n => n.id === notificationId);
   if (notificationIndex === -1 || notifications.value[notificationIndex].isRead) {
     return; // Already read or not found
   }

   try {
    const response = await markNotificationsAsRead({ ids: [notificationId] });
    if (response.code === 200) {
      // 更新本地状态
      notifications.value[notificationIndex].isRead = true;
       if (showFeedback) {
            showToast('已标记为已读');
       }
       emit('update-counts'); // 通知父组件更新计数
    } else {
       throw new Error(response.message || '标记已读失败');
    }
   } catch (err) {
       console.error('Failed to mark notification as read:', err);
       if (showFeedback) {
           showToast(err.message || '标记已读时出错');
       }
   }
};

// 暴露给父组件调用的方法: 标记此列表所有项为已读
const markAllRead = async () => {
  console.log(`[NotificationList-${props.type}] Marking all as read.`);
  const unreadIds = notifications.value.filter(n => !n.isRead).map(n => n.id);
  if (unreadIds.length === 0) {
    // Don't show toast if triggered silently, maybe return a status?
    // showToast('没有未读通知');
    return true; // Indicate nothing to mark, but not an error
  }
  
  try {
    // Use the specific API for the current type if needed, or the general one
    const response = await markAllNotificationsAsRead({ type: props.type }); 
    if (response.code === 200) {
      // 更新本地所有项状态
      notifications.value = notifications.value.map(n => ({ ...n, isRead: true }));
      showToast('全部标记成功');
      emit('update-counts'); // 通知父组件更新计数
      return true; // Indicate success
    } else {
      throw new Error(response.message || '全部标记失败');
    }
  } catch (err) {
    console.error('Failed to mark all as read:', err);
    showToast(err.message || '全部标记时出错');
    return false; // Indicate failure
  }
};

// 监听类型变化，重新加载
watch(() => props.type, (newType, oldType) => {
  if (newType !== oldType) {
    resetAndLoad();
  }
});

// 组件挂载时加载第一页
onMounted(() => {
  resetAndLoad();
});

// 暴露方法给父组件
defineExpose({
  markAllRead,
  refresh: resetAndLoad // Provide a refresh method
});

</script>

<style scoped>
.notification-list-container {
  min-height: 200px; /* Ensure container has height for empty/loading states */
  position: relative; /* Needed if using absolute positioning inside */
}

/* Add styles for loading/error states if needed */
</style> 