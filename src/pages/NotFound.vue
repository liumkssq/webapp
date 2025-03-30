<template>
  <div class="not-found-page">
    <header-nav title="页面未找到" />
    
    <empty-state
      icon="error_outline"
      text="404 页面未找到"
      sub-text="您访问的页面不存在或已被删除"
      action-text="回到首页"
      @action="goHome"
    />
    
    <footer-nav />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}
</script>

<script>
export default {
  name: 'NotFoundPage'
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f7f7;
}
</style>