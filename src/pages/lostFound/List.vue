<template>
  <div class="lost-found-list-page">
    <!-- 头部导航 -->
    <HeaderNav title="失物招领" :showSearch="true" @search="goToSearch" />
    
    <!-- 顶部选项卡切换 -->
    <div class="main-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        全部
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'lost' }"
        @click="switchTab('lost')"
      >
        寻物启事
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'found' }"
        @click="switchTab('found')"
      >
        招领启事
      </div>
    </div>
    
    <!-- 分类选择 -->
    <div class="sub-tabs" v-if="showCategories">
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
    <LostFoundList 
      :defaultTab="activeTab"
      :showTabs="false"
      ref="lostFoundList"
      @tabChange="handleTabChange"
      @emptyAction="goToPublish"
    />
    
    <!-- 浮动按钮 -->
    <div class="float-button" @click="goToPublish">
      <i class="icon-plus"></i>
      <span>发布</span>
    </div>
    
    <!-- 底部导航 -->
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onActivated } from 'vue'
import { useRouter } from 'vue-router'
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

// 计算属性 - 当前类型文本
const currentTypeText = computed(() => {
  if (activeTab.value === 'lost') return '寻物启事'
  if (activeTab.value === 'found') return '招领启事'
  return '失物招领'
})

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  
  // 更新列表组件的选项卡
  if (lostFoundList.value) {
    lostFoundList.value.switchTab(tab)
  }
}

// 切换分类
const switchCategory = (categoryId) => {
  if (activeCategoryId.value === categoryId) return
  
  activeCategoryId.value = categoryId
  
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
    // 将分类滚动到中间位置
    container.scrollLeft = activeElLeft - (containerWidth / 2) + (activeElWidth / 2)
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
  padding-top: calc(var(--header-height) + var(--safe-area-inset-top));
  padding-bottom: calc(var(--footer-height) + var(--safe-area-inset-bottom));
  background-color: var(--background-secondary);
  min-height: 100vh;
}

.main-tabs {
  display: flex;
  background-color: var(--background-primary);
  border-bottom: 0.5px solid var(--separator-color);
}

.main-tabs .tab-item {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  position: relative;
}

.main-tabs .tab-item.active {
  color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
}

.main-tabs .tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: var(--radius-full);
}

.sub-tabs {
  position: sticky;
  top: calc(var(--header-height) + 44px + var(--safe-area-inset-top));
  background-color: var(--background-primary);
  z-index: 5;
  border-bottom: 0.5px solid var(--separator-color);
}

.sub-tabs-scroll {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--spacing-sm);
}

.sub-tabs-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.sub-tab-item {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: var(--spacing-xs) var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.sub-tab-item.active {
  color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
  background-color: rgba(0, 122, 255, 0.1);
}

.float-button {
  position: fixed;
  right: var(--spacing-lg);
  bottom: calc(var(--footer-height) + var(--spacing-lg) + var(--safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: var(--white);
  width: 90px;
  height: 36px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-medium);
  z-index: 99;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.float-button i {
  margin-right: var(--spacing-xxs);
  font-size: var(--font-size-lg);
}

@media (prefers-color-scheme: dark) {
  .sub-tab-item.active {
    background-color: rgba(0, 122, 255, 0.2);
  }
}
</style>