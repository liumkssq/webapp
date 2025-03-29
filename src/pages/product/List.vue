<template>
  <div class="product-list-page">
    <!-- 头部导航 -->
    <HeaderNav title="二手商品" :showSearch="true" @search="goToSearch" />
    
    <!-- 分类切换 -->
    <div class="category-tabs">
      <div 
        class="category-scroll"
        ref="categoryScroll"
      >
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          :class="{ active: activeCategoryId === category.id }"
          @click="switchCategory(category.id)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <ProductList 
      :categoryId="activeCategoryId"
      :showFilter="true"
      ref="productList"
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
import { ref, onMounted, nextTick, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import ProductList from '@/components/ProductList.vue'

const router = useRouter()

// 激活的分类ID
const activeCategoryId = ref('all')
const categoryScroll = ref(null)
const productList = ref(null)

// 商品分类列表
const categories = [
  { id: 'all', name: '全部' },
  { id: 'electronics', name: '电子数码' },
  { id: 'books', name: '图书教材' },
  { id: 'clothing', name: '服装鞋包' },
  { id: 'sports', name: '运动户外' },
  { id: 'beauty', name: '美妆日化' },
  { id: 'furniture', name: '家具家电' },
  { id: 'tickets', name: '门票卡券' },
  { id: 'stationery', name: '文具办公' },
  { id: 'toys', name: '玩具乐器' },
  { id: 'bicycles', name: '自行车' },
  { id: 'others', name: '其他' }
]

// 切换分类
const switchCategory = (categoryId) => {
  if (activeCategoryId.value === categoryId) return
  
  activeCategoryId.value = categoryId
  
  // 滚动分类到可见区域
  nextTick(() => {
    scrollCategoryIntoView()
  })
  
  // 刷新商品列表
  if (productList.value) {
    productList.value.refresh()
  }
}

// 滚动分类到可见区域
const scrollCategoryIntoView = () => {
  if (!categoryScroll.value) return
  
  const container = categoryScroll.value
  const activeEl = container.querySelector('.category-item.active')
  
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

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search?type=product')
}

// 跳转到发布页
const goToPublish = () => {
  router.push('/publish/product')
}

// 页面加载和激活时进行初始化
onMounted(() => {
  // 从 URL 参数中获取分类
  const query = new URLSearchParams(window.location.search)
  const categoryId = query.get('category')
  
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
  // 刷新商品列表
  if (productList.value) {
    productList.value.refresh()
  }
})
</script>

<style scoped>
.product-list-page {
  padding-top: calc(var(--header-height) + var(--safe-area-inset-top));
  padding-bottom: calc(var(--footer-height) + var(--safe-area-inset-bottom));
  background-color: var(--background-secondary);
  min-height: 100vh;
}

.category-tabs {
  position: sticky;
  top: calc(var(--header-height) + var(--safe-area-inset-top));
  background-color: var(--background-primary);
  z-index: 5;
  border-bottom: 0.5px solid var(--separator-color);
}

.category-scroll {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--spacing-sm);
}

.category-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.category-item {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  margin: var(--spacing-xs) var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.category-item.active {
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
  .category-item.active {
    background-color: rgba(0, 122, 255, 0.2);
  }
}
</style>