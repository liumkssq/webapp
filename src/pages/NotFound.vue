<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="error-code">404</div>
      <div class="error-title">页面未找到</div>
      <div class="error-text">您访问的页面不存在或已被删除</div>
      
      <div class="actions">
        <button class="back-button" @click="goBack">返回上一页</button>
        <button class="home-button" @click="goHome">回到首页</button>
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
  align-items: center;
  justify-content: center;
  background-color: #f7f7f7;
}

.not-found-container {
  text-align: center;
  padding: 30px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #1e88e5;
  line-height: 1;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333;
}

.error-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.back-button, .home-button {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button {
  background-color: #f0f0f0;
  color: #333;
}

.home-button {
  background-color: #1e88e5;
  color: white;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.home-button:hover {
  background-color: #1976d2;
}
</style>