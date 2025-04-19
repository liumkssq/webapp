<template>
  <div class="footer-nav-wrapper">
    <van-tabbar v-model="active" @change="onChange" route>
      <van-tabbar-item name="home" icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item name="market" icon="shop-o" :to="{ name: 'ProductList' }">市场</van-tabbar-item>
      <van-tabbar-item name="publish" icon="add-o" to="/publish">发布</van-tabbar-item>
      <van-tabbar-item name="message" icon="chat-o" :to="{ name: 'ImConversationList' }" :badge="chatUnreadCount > 0 ? chatUnreadCount : ''">消息</van-tabbar-item>
      <van-tabbar-item name="notifications" icon="bell" to="/notifications" :badge="notificationUnreadCount > 0 ? notificationUnreadCount : ''">通知</van-tabbar-item>
      <van-tabbar-item name="mine" icon="user-circle-o" :to="{ name: 'Mine' }">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { getUnreadCount as getChatUnreadCount } from '@/api/im'; // 聊天未读数API
import { getUnreadCount as getNotificationUnreadCount } from '@/api/notification'; // 通知未读数API
import { useUserStore } from '@/store/user';
import { Tabbar as VanTabbar, TabbarItem as VanTabbarItem } from 'vant';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const chatUnreadCount = ref(0);
const notificationUnreadCount = ref(0);
let pollingTimer = null;
const active = ref('home'); // 当前激活的tab name

// 错误计数器
let chatErrorCount = 0;
let notificationErrorCount = 0;
const MAX_ERROR_COUNT = 3;

// 映射路由到 Tab Name
const routeNameToTabName = {
  'Home': 'home',
  'ProductList': 'market',
  'ArticleList': 'market',
  'LostFoundList': 'market',
  'Publish': 'publish',
  'PublishProduct': 'publish',
  'PublishLostFound': 'publish',
  'PublishArticle': 'publish',
  'ImConversations': 'message',
  'ImConversationList': 'message',
  'ConversationDetail': 'message',
  'ImConversationDetail': 'message',
  'Notifications': 'notifications',
  'Mine': 'mine',
  'UserProfile': 'mine',
  'UserSettings': 'mine',
  // ... 添加更多映射
};

// 根据当前路由设置激活的 Tab
const setActiveTab = () => {
  const currentRouteName = route.name;
  active.value = routeNameToTabName[currentRouteName] || 'home'; // 默认为 home
};

// Tab 切换时的处理 (如果不用 route 模式)
const onChange = (indexOrName) => {
  // 如果使用 route 模式，此函数可以为空或移除
  // console.log('Tab changed to:', indexOrName);
};

// 获取聊天未读消息数
const fetchChatUnreadCount = async () => {
  if (!userStore.isLoggedIn) {
    chatUnreadCount.value = 0;
    return;
  }
  
  try {
    const response = await getChatUnreadCount();
    if (response.code === 200) {
      // 重置错误计数
      chatErrorCount = 0;
      chatUnreadCount.value = response.data?.count || 0;
    } else {
      // 响应不成功，递增错误计数
      chatErrorCount++;
      console.warn(`获取聊天未读数响应失败 (${chatErrorCount}/${MAX_ERROR_COUNT}):`, response.message);
    }
  } catch (error) {
    chatErrorCount++;
    console.warn(`获取聊天未读数失败 (${chatErrorCount}/${MAX_ERROR_COUNT}):`, error);
    
    // 如果连续错误超过最大次数，延长轮询间隔或暂停轮询
    if (chatErrorCount >= MAX_ERROR_COUNT) {
      console.error('获取聊天未读数多次失败，暂停轮询');
      stopPolling();
      // 30秒后重试一次
      setTimeout(() => {
        chatErrorCount = 0;
        startPolling();
      }, 30000);
    }
  }
};

// 获取通知未读数
const fetchNotificationUnread = async () => {
  if (!userStore.isLoggedIn) {
    notificationUnreadCount.value = 0;
    return;
  }
  
  try {
    const response = await getNotificationUnreadCount();
    if (response.code === 200) {
      // 重置错误计数
      notificationErrorCount = 0;
      notificationUnreadCount.value = response.data?.count || 0;
    } else {
      // 响应不成功，递增错误计数
      notificationErrorCount++;
      console.warn(`获取通知未读数响应失败 (${notificationErrorCount}/${MAX_ERROR_COUNT}):`, response.message);
    }
  } catch (error) {
    notificationErrorCount++;
    console.warn(`获取通知未读数失败 (${notificationErrorCount}/${MAX_ERROR_COUNT}):`, error);
    
    // 如果连续错误超过最大次数，延长轮询间隔或暂停轮询
    if (notificationErrorCount >= MAX_ERROR_COUNT) {
      console.error('获取通知未读数多次失败，暂停轮询');
      stopPolling();
      // 30秒后重试一次
      setTimeout(() => {
        notificationErrorCount = 0;
        startPolling();
      }, 30000);
    }
  }
};

// 轮询未读消息
const startPolling = () => {
  stopPolling(); // Clear existing timer first
  // 先立即执行一次
  fetchChatUnreadCount();
  fetchNotificationUnread();
  
  // 每60秒获取一次未读消息数 (增加间隔减少请求)
  pollingTimer = setInterval(() => {
    fetchChatUnreadCount();
    fetchNotificationUnread();
  }, 60000);
};

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// 监听路由变化，更新激活的 Tab
watch(() => route.name, () => {
  setActiveTab();
});

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    fetchChatUnreadCount();
    fetchNotificationUnread();
    startPolling();
  } else {
    chatUnreadCount.value = 0;
    notificationUnreadCount.value = 0;
    stopPolling();
  }
});

// 组件挂载时初始化
onMounted(() => {
  setActiveTab(); // 设置初始激活状态
  if (userStore.isLoggedIn) {
    fetchChatUnreadCount();
    fetchNotificationUnread();
    startPolling();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  stopPolling();
});

</script>

<style scoped>
/* Keep existing styles, adjust if needed */
.footer-nav-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* van-tabbar has its own background and shadow */
}

/* Optional: Customize Tabbar styles */
:deep(.van-tabbar) {
  /* Example: height: 55px; */
}

:deep(.van-tabbar-item--active) {
  /* Example: color: var(--van-primary-color); */
}

:deep(.van-badge) {
  /* Fine-tune badge position and appearance */
  /* transform: translate(2px, -2px); */
}
</style>