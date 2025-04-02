<template>
  <div class="lost-found-list-page">
    <!-- 头部导航 -->
    <HeaderNav 
      title="失物招领" 
      :showSearch="true" 
      :showBack="true"
      @search="goToSearch" 
      class="ios-header"
    />
    
    <!-- 顶部选项卡切换 -->
    <div class="main-content">
      <div class="ios-segmented-control">
        <div 
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item" 
          :class="{ active: activeTab === tab.value }"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
          <div class="tab-indicator" v-if="activeTab === tab.value"></div>
        </div>
      </div>
      
      <!-- 分类选择 -->
      <div class="ios-category-tabs" v-if="showCategories">
        <div class="sub-tabs-scroll" ref="categoryScroll">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="sub-tab-item"
            :class="{ active: activeCategoryId === category.id }"
            @click="switchCategory(category.id)"
          >
            {{ category.name }}
          </div>
        </div>
      </div>
      
      <!-- 失物招领列表 -->
      <div class="lost-found-content">
        <div class="loading-indicator" v-if="isLoading">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        
        <transition name="fade">
          <LostFoundList 
            :defaultTab="activeTab"
            :showTabs="false"
            ref="lostFoundList"
            @tabChange="handleTabChange"
            @emptyAction="goToPublish"
            class="ios-list"
            @loading="handleLoading"
          />
        </transition>
      </div>
    </div>
    
    <!-- 浮动按钮 -->
    <div class="float-button ios-button" @click="goToPublish">
      <svg-icon name="plus" class="plus-icon" />
      <span>发布</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getLostFoundList } from '@/api/lostFound'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import LostFoundList from '@/components/LostFoundList.vue'

const router = useRouter()

// 状态变量
const activeTab = ref('all')
const activeCategoryId = ref('all')
const showCategories = ref(true)
const categoryScroll = ref(null)
const lostFoundList = ref(null)
const isLoading = ref(false)

// 物品分类列表
const categories = [
  { id: 'all', name: '全部' },
  { id: 'electronics', name: '电子产品' },
  { id: 'books', name: '图书资料' },
  { id: 'cards', name: '卡片证件' },
  { id: 'clothing', name: '衣物饰品' },
  { id: 'daily', name: '生活用品' },
  { id: 'sports', name: '运动用品' },
  { id: 'bags', name: '背包箱包' },
  { id: 'jewelry', name: '首饰配件' },
  { id: 'keys', name: '钥匙钱包' },
  { id: 'others', name: '其他物品' }
]

// 定义选项卡配置
const tabs = [
  { label: '全部', value: 'all' },
  { label: '寻物启事', value: 'lost' },
  { label: '招领启事', value: 'found' }
]

// 计算属性 - 当前类型文本
const currentTypeText = computed(() => {
  if (activeTab.value === 'lost') return '寻物启事'
  if (activeTab.value === 'found') return '招领启事'
  return '失物招领'
})

// 处理加载状态
const handleLoading = (loading) => {
  isLoading.value = loading
}

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  isLoading.value = true
  
  // 更新列表组件的选项卡
  if (lostFoundList.value) {
    lostFoundList.value.switchTab(tab)
  }
}

// 切换分类
const switchCategory = (categoryId) => {
  if (activeCategoryId.value === categoryId) return
  
  activeCategoryId.value = categoryId
  isLoading.value = true
  
  // 滚动分类到可见区域
  nextTick(() => {
    scrollCategoryIntoView()
  })
  
  // 刷新列表
  if (lostFoundList.value) {
    lostFoundList.value.refresh()
  }
}

// 滚动分类到可见区域
const scrollCategoryIntoView = () => {
  if (!categoryScroll.value) return
  
  const container = categoryScroll.value
  const activeEl = container.querySelector('.sub-tab-item.active')
  
  if (!activeEl) return
  
  // 计算滚动位置
  const containerWidth = container.offsetWidth
  const activeElLeft = activeEl.offsetLeft
  const activeElWidth = activeEl.offsetWidth
  
  // 如果分类不在可见区域内，滚动到适当位置
  if (activeElLeft < container.scrollLeft || 
      activeElLeft + activeElWidth > container.scrollLeft + containerWidth) {
    // 使用平滑滚动
    container.scrollTo({
      left: activeElLeft - (containerWidth / 2) + (activeElWidth / 2),
      behavior: 'smooth'
    })
  }
}

// 处理选项卡变化
const handleTabChange = (tab) => {
  activeTab.value = tab
}

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search?type=lost-found')
}

// 跳转到发布页
const goToPublish = (type = activeTab.value) => {
  router.push(`/publish/lost-found?type=${type === 'all' ? 'lost' : type}`)
}

// 页面加载和激活时进行初始化
onMounted(() => {
  // 从 URL 参数中获取类型和分类
  const query = new URLSearchParams(window.location.search)
  const tab = query.get('tab')
  const categoryId = query.get('category')
  
  if (tab && ['all', 'lost', 'found'].includes(tab)) {
    activeTab.value = tab
  }
  
  if (categoryId && categories.some(c => c.id === categoryId)) {
    activeCategoryId.value = categoryId
  }
  
  // 滚动分类到可见区域
  nextTick(() => {
    scrollCategoryIntoView()
  })
})

// 当页面被缓存后再次激活时执行
onActivated(() => {
  // 刷新列表
  if (lostFoundList.value) {
    lostFoundList.value.refresh()
  }
})
</script>

<style scoped>
.lost-found-list-page {
  min-height: 100vh;
  background-color: var(--background-secondary);
  padding-top: calc(var(--header-height) + var(--safe-area-inset-top));
  padding-bottom: var(--safe-area-inset-bottom);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 80px 16px;
}

.ios-header {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.85);
  border-bottom: 0.5px solid var(--separator-color);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.ios-segmented-control {
  display: flex;
  background-color: rgba(0, 0, 0, 0.04);
  padding: 2px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.ios-segmented-control .tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: var(--text-secondary);
  position: relative;
  border-radius: 6px;
  transition: all 0.3s ease;
  z-index: 1;
}

.ios-segmented-control .tab-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.ios-segmented-control .tab-item.active::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  z-index: -1;
  animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.ios-category-tabs {
  background-color: transparent;
  margin-bottom: 16px;
  position: relative;
}

.sub-tabs-scroll {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 8px;
}

.sub-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.sub-tab-item {
  padding: 8px 16px;
  margin-right: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  background-color: white;
  border-radius: 16px;
  white-space: nowrap;
  transition: all 0.2s ease;
  border: 0.5px solid var(--separator-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.sub-tab-item.active {
  color: white;
  background-color: var(--primary-color);
  font-weight: 500;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 122, 255, 0.2);
}

.lost-found-content {
  flex: 1;
  position: relative;
}

.ios-list {
  border-radius: 12px;
  overflow: hidden;
  background-color: transparent;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-indicator span {
  font-size: 14px;
  color: var(--text-secondary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.float-button {
  position: fixed;
  right: 20px;
  bottom: calc(20px + var(--safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 99;
}

.float-button:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
}

.plus-icon {
  margin-right: 6px;
  font-size: 18px;
}

@media (prefers-color-scheme: dark) {
  .ios-header {
    background-color: rgba(30, 30, 30, 0.85);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .ios-segmented-control {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .ios-segmented-control .tab-item.active::before {
    background-color: rgba(50, 50, 50, 0.95);
  }
  
  .sub-tab-item {
    background-color: rgba(60, 60, 60, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .spinner {
    border-color: rgba(0, 122, 255, 0.2);
    border-top-color: var(--primary-color);
  }
}
</style>