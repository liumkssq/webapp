import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

/**
 * 滑动返回hooks
 * @param {Object} options 配置选项
 * @param {Element} options.el 监听元素，默认为document.body
 * @param {Number} options.threshold 触发阈值，默认为50
 * @param {Boolean} options.enable 是否启用，默认为true
 * @returns {Object} 返回启用/禁用方法
 */
export function useSwipeBack(options = {}) {
  const router = useRouter()
  const {
    el = document.body,
    threshold = 50,
    enable: initialEnable = true
  } = options
  
  let enable = initialEnable
  let startX = 0
  let startY = 0
  let initialScrollTop = 0
  let moved = false
  
  // 开始触摸处理
  const handleTouchStart = (e) => {
    if (!enable) return
    
    // 只有在屏幕左边缘滑动才会触发
    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    
    // 记录起始位置
    startX = touchX
    startY = touchY
    moved = false
    
    // 记录初始滚动位置，用于判断页面是否滚动
    initialScrollTop = document.documentElement.scrollTop || document.body.scrollTop
  }
  
  // 触摸移动处理
  const handleTouchMove = (e) => {
    if (!enable || startX > 50) return // 只捕获屏幕边缘50px内的滑动
    
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    
    // 计算水平和垂直移动距离
    const deltaX = currentX - startX
    const deltaY = currentY - startY
    
    // 如果是横向移动且距离足够，标记为移动
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 10) {
      moved = true
    }
  }
  
  // 触摸结束处理
  const handleTouchEnd = (e) => {
    if (!enable || !moved || startX > 50) return
    
    const endX = e.changedTouches[0].clientX
    const deltaX = endX - startX
    
    // 当前滚动位置
    const currentScrollTop = document.documentElement.scrollTop || document.body.scrollTop
    
    // 如果页面有滚动，不触发返回
    if (initialScrollTop !== currentScrollTop) return
    
    // 如果右滑距离超过阈值，触发返回
    if (deltaX > threshold) {
      router.back()
    }
  }
  
  // 启用滑动返回
  const enableSwipeBack = () => {
    enable = true
  }
  
  // 禁用滑动返回
  const disableSwipeBack = () => {
    enable = false
  }
  
  onMounted(() => {
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true })
      el.addEventListener('touchmove', handleTouchMove, { passive: true })
      el.addEventListener('touchend', handleTouchEnd)
    }
  })
  
  onUnmounted(() => {
    if (el) {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  })
  
  return {
    enable: enableSwipeBack,
    disable: disableSwipeBack
  }
}