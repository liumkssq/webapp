<template>
  <div class="page-container">
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  // 是否启用边缘滑动返回
  enableEdgeSwipe: {
    type: Boolean,
    default: true
  }
});

const router = useRouter();
let startX = 0;
let startY = 0;
let isSwiping = false;
let initialScrollTop = 0;

// 处理触摸开始事件
const handleTouchStart = (e) => {
  if (!props.enableEdgeSwipe) return;
  
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  isSwiping = false;
  
  // 仅在屏幕左边缘20px内的触摸才可能触发返回手势
  if (startX <= 20) {
    initialScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  } else {
    startX = -1; // 标记为非边缘触摸
  }
};

// 处理触摸移动事件
const handleTouchMove = (e) => {
  if (startX === -1 || !props.enableEdgeSwipe) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;
  
  // 如果水平移动大于垂直移动，且是从左边缘开始的滑动
  if (deltaX > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
    isSwiping = true;
    
    // 阻止默认滚动行为
    e.preventDefault();
    
    // 计算滑动距离的百分比并应用页面过渡效果
    const percent = Math.min(deltaX / window.innerWidth, 1);
    document.documentElement.style.setProperty('--swipe-percent', percent);
    
    // 添加活动状态类
    document.body.classList.add('swiping-back');
  }
};

// 处理触摸结束事件
const handleTouchEnd = () => {
  if (!props.enableEdgeSwipe || startX === -1) return;
  
  const currentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  
  // 如果是滑动状态且页面没有垂直滚动太多
  if (isSwiping && Math.abs(currentScrollTop - initialScrollTop) < 10) {
    const percent = parseFloat(document.documentElement.style.getPropertyValue('--swipe-percent') || '0');
    
    // 如果滑动距离超过30%，触发返回操作
    if (percent > 0.3) {
      router.back();
    }
  }
  
  // 重置状态
  document.documentElement.style.removeProperty('--swipe-percent');
  document.body.classList.remove('swiping-back');
  isSwiping = false;
  startX = -1;
};

onMounted(() => {
  if (props.enableEdgeSwipe) {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }
});

onBeforeUnmount(() => {
  if (props.enableEdgeSwipe) {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }
});
</script>

<style>
.page-container {
  position: relative;
  width: 100%;
  min-height: 100%;
  background-color: #f7f8fa;
  overflow-x: hidden;
}

/* 滑动返回的过渡效果 */
body.swiping-back .page-container {
  transform: translateX(calc(var(--swipe-percent, 0) * 100%));
  transition-duration: 0ms;
}

body.swiping-back::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, calc((1 - var(--swipe-percent, 0)) * 0.5));
  z-index: 9998;
  pointer-events: none;
  transition-duration: 0ms;
}
</style>