<template>
  <van-config-provider
    :theme-vars="themeVars"
    theme="light"
    class="ios-style-app"
  >
    <router-view v-slot="{ Component }">
      <transition 
        :name="transitionName" 
        @before-leave="beforeLeave"
        @leave="onLeave"
        @after-leave="afterLeave"
      >
        <component :is="Component" class="page-component" />
      </transition>
    </router-view>
    <AppMessage />
  </van-config-provider>
</template>

<script setup>
import { ConfigProvider as VanConfigProvider } from 'vant'
import AppMessage from '@/components/AppMessage.vue'
import { onMounted, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEdgeSwipeGesture } from './composables/useGesture'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'

// 初始化路由器
const router = useRouter()

// 使用优化后的边缘滑动手势
const { isSwipingBack } = useEdgeSwipeGesture()

// 添加iOS风格的过渡效果
const transitionName = ref('van-slide-right')
const beforeLeave = (el) => {
  // 在离开前保存当前滚动位置
  el._scrollTop = document.documentElement.scrollTop || document.body.scrollTop
}

const onLeave = () => {
  // 过渡期间禁用滚动
  document.body.classList.add('transition-active')
}

const afterLeave = (el) => {
  // 过渡结束后启用滚动并恢复位置
  document.body.classList.remove('transition-active')
  if (el._scrollTop) {
    document.documentElement.scrollTop = el._scrollTop
    document.body.scrollTop = el._scrollTop
  }
}

const userStore = useUserStore()
const messageStore = useMessageStore()

// 添加token失效/过期的全局处理
const setupTokenEvents = () => {
  // 监听token过期事件
  window.addEventListener('token-expired', () => {
    console.log('监听到token过期事件')
    messageStore.showWarning('登录已过期，请重新登录')
  })
  
  // 监听token无效事件
  window.addEventListener('token-invalid', () => {
    console.log('监听到token无效事件')
    messageStore.showWarning('登录状态已失效，请重新登录')
  })
}

onMounted(async () => {
  console.log('App mounted, checking login status...')
  
  // 设置token事件监听
  setupTokenEvents()
  
  // 检查localStorage中是否有token
  const token = localStorage.getItem('token')
  
  if (token) {
    console.log('Found token in localStorage, attempting to restore session')
    
    try {
      // 恢复用户状态
      const userData = await userStore.restoreUserSession()
      
      if (userData) {
        console.log('Session restored successfully:', userData.nickname || userData.username)
      } else {
        console.warn('Failed to restore session, token may be invalid')
      }
    } catch (error) {
      console.error('Error restoring session:', error)
    }
  } else {
    console.log('No token found, user is not logged in')
  }
  
  // 初始化手势优化
  initializeInteractionFixes()
  
  // 监听路由变化，为每个页面应用交互优化
  router.afterEach(() => {
    nextTick(() => {
      applyInteractionFixes()
    })
  })
})

// 初始化交互优化函数
const initializeInteractionFixes = () => {
  // 添加iOS类到body以应用iOS样式
  document.body.classList.add('ios-style')
  
  // 监听全局点击事件，以便调试潜在的点击问题
  window.addEventListener('click', (e) => {
    // 检查是否点击被意外阻止
    if (e.target.classList.contains('edge-gesture-area') && !isSwipingBack.value) {
      console.warn('检测到边缘区域阻止了点击事件:', e.target)
    }
  }, true)
}

// 为每个页面应用交互优化
const applyInteractionFixes = () => {
  // 获取当前页面容器
  const pageContainer = document.querySelector('.page-container')
  if (pageContainer) {
    // 确保页面容器不会阻止底层元素的点击
    pageContainer.style.pointerEvents = 'auto'
  }
  
  // 找到所有操作栏元素
  const actionElements = document.querySelectorAll('.bottom-action-bar, .article-actions, .action-buttons, .action-icons')
  actionElements.forEach(el => {
    // 提高所有操作栏的z-index和交互优先级
    el.style.zIndex = '10000'
    el.style.position = 'relative'
    el.style.pointerEvents = 'auto'
  })
}

// 定义iOS风格的主题变量
const themeVars = {
  // 颜色系统
  primaryColor: '#007aff',
  successColor: '#34c759',
  warningColor: '#ff9500',
  dangerColor: '#ff3b30',
  
  // 圆角设置
  buttonBorderRadius: '10px',
  popupRoundBorderRadius: '10px',
  
  // 按钮样式
  buttonPrimaryBackground: '#007aff',
  buttonPrimaryBorderColor: '#007aff',
  
  // 列表样式
  cellBackgroundColor: '#fff',
  cellBorderColor: 'rgba(60, 60, 67, 0.15)',
  
  // 阴影效果
  shadowColor: 'rgba(0, 0, 0, 0.05)',
}
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>