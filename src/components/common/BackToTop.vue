<template>
  <transition name="fade">
    <div 
      v-if="visible" 
      class="back-to-top" 
      :class="{ 'position-bottom': positionBottom }"
      @click="scrollToTop"
    >
      <i class="material-icons">arrow_upward</i>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 滚动阈值
  threshold: {
    type: Number,
    default: 200
  },
  // 是否固定在底部
  positionBottom: {
    type: Boolean,
    default: false
  }
})

// 是否可见
const visible = ref(false)

// 滚动处理
const handleScroll = () => {
  visible.value = window.scrollY > props.threshold
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 70px;
  width: 40px;
  height: 40px;
  background-color: rgba(30, 136, 229, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 90;
}

.back-to-top.position-bottom {
  bottom: 15px;
}

.back-to-top:active {
  background-color: rgba(30, 136, 229, 1);
  transform: scale(0.95);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>