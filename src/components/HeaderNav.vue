<template>
  <div>
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">{{ currentTime }}</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" v-if="showBack" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">{{ title }}</div>
      <div class="nav-right">
        <slot name="right"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const currentTime = ref('00:00')
let timeInterval = null

// 更新时间
const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 60000) // 每分钟更新一次
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.status-bar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #f8f8f8;
  font-size: 12px;
  color: #000;
}

.status-icons {
  display: flex;
  gap: 8px;
}

.navigation-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #e1e1e1;
  position: relative;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 22px;
  cursor: pointer;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 17px;
  font-weight: 600;
}

.nav-right {
  width: 44px;
  display: flex;
  justify-content: flex-end;
}
</style>