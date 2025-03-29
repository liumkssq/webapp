<template>
  <div class="not-found-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">页面不存在</div>
    </div>
    
    <!-- 404内容 -->
    <div class="not-found-content">
      <div class="error-image">
        <img src="@/assets/404.png" alt="404 Not Found" class="error-img">
      </div>
      
      <div class="error-code">404</div>
      <div class="error-message">哎呀，页面走丢了</div>
      <div class="error-description">
        您请求的页面不存在或已被删除
      </div>
      
      <div class="action-buttons">
        <button class="home-btn" @click="goToHome">
          返回首页
        </button>
        <button class="retry-btn" @click="refresh">
          刷新重试
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}

// 返回首页
const goToHome = () => {
  router.push('/')
}

// 刷新页面
const refresh = () => {
  window.location.reload()
}
</script>