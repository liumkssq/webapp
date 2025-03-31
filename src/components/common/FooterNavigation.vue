<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'home'
  }
})

const router = useRouter()

const navItems = [
  { 
    id: 'home', 
    label: '首页', 
    icon: 'home', 
    route: '/' 
  },
  { 
    id: 'market', 
    label: '市场', 
    icon: 'shop', 
    route: '/product/list' 
  },
  { 
    id: 'publish', 
    label: '发布', 
    icon: 'plus-circle', 
    route: '/publish' 
  },
  { 
    id: 'message', 
    label: '消息', 
    icon: 'message', 
    route: '/message' 
  },
  { 
    id: 'user', 
    label: '我的', 
    icon: 'user', 
    route: '/mine'
  }
]

const isActive = (item) => {
  const currentPath = router.currentRoute.value.path;
  
  if (item.id === 'home' && currentPath === '/') {
    return true;
  }
  
  if (item.id === 'market' && currentPath.startsWith('/product')) {
    return true;
  }
  
  if (item.id === 'publish' && currentPath.startsWith('/publish')) {
    return true;
  }
  
  if (item.id === 'message' && 
     (currentPath.startsWith('/message') || 
      currentPath.startsWith('/im') || 
      currentPath.startsWith('/chat'))) {
    return true;
  }
  
  if (item.id === 'user' && 
     (currentPath === '/mine' || 
      currentPath.startsWith('/user') || 
      currentPath.startsWith('/settings'))) {
    return true;
  }
  
  return item.id === props.activeTab;
}

const navigateTo = (route) => {
  router.push(route)
}
</script>

<template>
  <nav class="footer-navigation">
    <div 
      v-for="item in navItems" 
      :key="item.id" 
      class="nav-item" 
      :class="{ active: isActive(item) }"
      @click="navigateTo(item.route)"
    >
      <div class="icon-wrapper">
        <svg-icon :name="item.icon" :size="item.id === 'publish' ? 32 : 24" />
      </div>
      <div class="label">{{ item.label }}</div>
    </div>
  </nav>
</template>

<style scoped>
.footer-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  display: flex;
  background-color: var(--bg-primary);
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
  cursor: pointer;
  user-select: none;
}

.nav-item.active {
  color: var(--primary-color);
}

.icon-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-item:nth-child(3) .icon-wrapper {
  margin-top: -10px;
}

.nav-item:nth-child(3) .icon-wrapper svg-icon {
  color: white;
  background-color: var(--primary-color);
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 120, 255, 0.35);
}

.label {
  font-size: var(--font-size-caption-2);
  margin-top: 4px;
}

.nav-item:hover:not(.active) {
  color: var(--text-secondary);
}

@media (max-width: 360px) {
  .footer-navigation {
    height: 50px;
  }
  
  .nav-item:nth-child(3) .icon-wrapper {
    margin-top: -8px;
  }
}

/* 适配底部安全区域 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .footer-navigation {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(56px + env(safe-area-inset-bottom));
  }
}
</style>