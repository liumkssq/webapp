import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useEdgeSwipeGesture(disable = false) {
  const router = useRouter()
  const isSwipingBack = ref(false)
  const swipePercent = ref(0)
  let startX = 0
  let gestureElement = null
  
  // 检测当前页面是否有需要边缘交互的元素
  const checkForEdgeElements = () => {
    const hasEdgeElements = document.querySelectorAll('.bottom-action-bar, .article-actions, .action-buttons, .action-icons').length > 0
    if (hasEdgeElements) {
      document.body.classList.add('has-edge-elements')
    } else {
      document.body.classList.remove('has-edge-elements')
    }
  }
  
  const handleTouchStart = (e) => {
    // 当在底部操作栏等元素上开始触摸时，不触发边缘滑动
    if (e.target.closest('.bottom-action-bar, .article-actions, .action-buttons, .action-icons')) {
      return
    }
    
    // 仅在屏幕左侧20px区域触发
    if (e.touches[0].clientX <= 20) {
      startX = e.touches[0].clientX
      isSwipingBack.value = true
      document.body.classList.add('swiping-back')
      
      // 边缘滑动活跃时启用pointer-events
      if (gestureElement) {
        gestureElement.classList.add('active')
      }
    }
  }
  
  const handleTouchMove = (e) => {
    if (!isSwipingBack.value) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    
    // 计算滑动百分比 (最大100%)
    let percent = Math.min(1, Math.max(0, diff / window.innerWidth))
    swipePercent.value = percent
    
    // 设置CSS变量以供样式使用
    document.documentElement.style.setProperty('--swipe-percent', percent)
    
    // 应用变换到当前页面
    const pageContainer = document.querySelector('.page-container')
    if (pageContainer) {
      pageContainer.style.transform = `translateX(${diff}px)`
    }
  }
  
  const handleTouchEnd = () => {
    if (!isSwipingBack.value) return
    
    if (gestureElement) {
      gestureElement.classList.remove('active')
    }
    
    if (swipePercent.value > 0.3) {
      // 滑动超过30%，返回上一页
      router.back()
    } else {
      // 否则恢复原位
      const pageContainer = document.querySelector('.page-container')
      if (pageContainer) {
        pageContainer.style.transform = ''
      }
    }
    
    // 重置状态
    isSwipingBack.value = false
    swipePercent.value = 0
    document.documentElement.style.setProperty('--swipe-percent', 0)
    document.body.classList.remove('swiping-back')
  }
  
  onMounted(() => {
    if (disable) {
      document.body.classList.add('disable-edge-swipe')
      return
    }
    
    // 创建边缘手势区域
    gestureElement = document.createElement('div')
    gestureElement.className = 'edge-gesture-area'
    document.body.appendChild(gestureElement)
    
    // 检查页面是否有边缘交互元素
    checkForEdgeElements()
    
    // 添加手势监听
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)
    
    // 监听DOM变化，检测边缘元素
    const observer = new MutationObserver(checkForEdgeElements)
    observer.observe(document.body, { childList: true, subtree: true })
  })
  
  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchEnd)
    
    if (gestureElement && document.body.contains(gestureElement)) {
      document.body.removeChild(gestureElement)
    }
    
    document.body.classList.remove('disable-edge-swipe')
    document.body.classList.remove('has-edge-elements')
    document.documentElement.style.removeProperty('--swipe-percent')
  })
  
  return {
    isSwipingBack,
    swipePercent
  }
} 