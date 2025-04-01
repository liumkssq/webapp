<template>
  <div class="footer-nav">
    <div 
      v-for="item in navItems" 
      :key="item.path" 
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="navigateTo(item.path)"
    >
      <div class="nav-icon">
        <i :class="item.icon"></i>
      </div>
      <div class="nav-name">{{ item.name }}</div>
      
      <!-- 未读消息提示 -->
      <div v-if="item.path === '/im/conversations' && unreadCount > 0" class="badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUnreadCount } from '@/api/im'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const unreadCount = ref(0)
let pollingTimer = null

// 导航项配置
const navItems = [
  { name: '首页', path: '/', icon: 'icon-home' },
  { name: '市场', path: '/product/list', icon: 'icon-shop' },
  { name: '发布', path: '/publish', icon: 'icon-publish' },
  { name: '消息', path: '/im/conversations', icon: 'icon-message' },
  { name: '我的', path: '/user/profile', icon: 'icon-user' }
]

// 判断导航项是否激活
const isActive = (path) => {
  if (path === '/' && route.path === '/') {
    return true
  }
  if (path === '/product/list' && [
    '/product/list', 
    '/product/detail', 
    '/article/list', 
    '/article/detail', 
    '/lost-found/list', 
    '/lost-found/detail'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  if (path === '/im/conversations' && [
    '/message', 
    '/chat',
    '/im'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  if (path === '/user/profile' && [
    '/user', 
    '/settings'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  if (path === '/publish' && [
    '/publish'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  if (path === '/search' && [
    '/search'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  return route.path === path
}

// 导航到指定路径
const navigateTo = (path) => {
  if (path === '/user/profile' && !userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (path === '/publish' && !userStore.isLoggedIn) {
    router.push('/login?redirect=/publish')
    return
  }
  
  if (path === '/im/conversations' && !userStore.isLoggedIn) {
    router.push('/login?redirect=/im/conversations')
    return
  }
  
  router.push(path)
}

// 获取未读消息数
const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) {
    unreadCount.value = 0
    return
  }
  
  try {
    const response = await getUnreadCount()
    if (response.code === 200) {
      unreadCount.value = response.data
    }
  } catch (error) {
    console.error('获取未读消息数失败:', error)
  }
}

// 轮询未读消息
const startPolling = () => {
  // 每30秒获取一次未读消息数
  pollingTimer = setInterval(fetchUnreadCount, 30000)
}

// 组件挂载时初始化
onMounted(() => {
  fetchUnreadCount()
  startPolling()
})

// 组件卸载时清理
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
.footer-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  background-color: #ffffff;
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
  font-size: 12px;
  padding: 8px 0;
  position: relative;
}

.nav-item.active {
  color: #007aff;
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.nav-name {
  font-size: 11px;
}

.badge {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(12px);
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #ff3b30;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>