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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 导航项配置
const navItems = [
  { name: '首页', path: '/', icon: 'icon-home' },
  { name: '市场', path: '/product/list', icon: 'icon-shop' },
  { name: '发布', path: '/publish', icon: 'icon-publish' },
  { name: '消息', path: '/message', icon: 'icon-message' },
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
  if (path === '/message' && [
    '/message', 
    '/chat'
  ].some(p => route.path.startsWith(p))) {
    return true
  }
  if (path === '/user/profile' && [
    '/user', 
    '/settings'
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
  
  if (path === '/message' && !userStore.isLoggedIn) {
    router.push('/login?redirect=/message')
    return
  }
  
  router.push(path)
}
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
</style>