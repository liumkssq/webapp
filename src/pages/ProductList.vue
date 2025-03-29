<template>
  <div class="product-list-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">二手商品</div>
      <div class="search-btn" @click="goToSearch">
        <i class="icon-search"></i>
      </div>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div 
        v-for="filter in filters" 
        :key="filter.type" 
        class="filter-item"
        :class="{ active: activeFilters[filter.type] }"
        @click="toggleFilter(filter.type)"
      >
        {{ filter.label }}
        <i class="icon-arrow-down"></i>
      </div>
    </div>
    
    <!-- 分类切换 -->
    <div class="category-tabs-container">
      <div class="category-tabs">
        <div 
          v-for="category in categories" 
          :key="category.value" 
          class="category-tab"
          :class="{ active: currentCategory === category.value }"
          @click="switchCategory(category.value)"
        >
          {{ category.label }}
        </div>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <div class="products-container">
      <!-- 加载中 -->
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
      
      <!-- 商品网格 -->
      <div class="product-grid" v-else>
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="product-card"
          @click="viewProduct(product.id)"
        >
          <div class="product-image">
            <img :src="product.images[0]" :alt="product.title">
            <div class="product-badge" v-if="product.status !== '在售'">
              {{ product.status }}
            </div>
          </div>
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span class="original-price" v-if="product.originalPrice > product.price">¥{{ product.originalPrice }}</span>
            </div>
            <div class="product-meta">
              <span class="seller-info">{{ product.seller.name }}</span>
              <span class="product-time">{{ formatTime(product.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无商品提示 -->
      <div class="no-products" v-if="!loading && products.length === 0">
        <div class="no-data-icon">
          <i class="icon-empty"></i>
        </div>
        <div class="no-data-text">暂无商品</div>
        <div class="no-data-tips" v-if="currentCategory !== 'all'">
          试试切换到其他分类
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore && products.length > 0">
        <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
    
    <!-- 排序弹窗 -->
    <div class="sort-popup" v-if="showSortPopup">
      <div class="popup-mask" @click="showSortPopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">排序方式</div>
          <div class="popup-close" @click="showSortPopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="popup-body">
          <div 
            v-for="option in sortOptions" 
            :key="option.value" 
            class="sort-option"
            :class="{ active: currentSort === option.value }"
            @click="selectSort(option.value)"
          >
            {{ option.label }}
            <i class="icon-check" v-if="currentSort === option.value"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 价格弹窗 -->
    <div class="price-popup" v-if="showPricePopup">
      <div class="popup-mask" @click="showPricePopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">价格区间</div>
          <div class="popup-close" @click="showPricePopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="popup-body">
          <div class="price-range">
            <div class="price-input-group">
              <input 
                type="number" 
                v-model="priceRange.min" 
                placeholder="最低价" 
                class="price-input"
              >
              <span class="price-separator">至</span>
              <input 
                type="number" 
                v-model="priceRange.max" 
                placeholder="最高价" 
                class="price-input"
              >
            </div>
          </div>
          
          <div class="price-quick-options">
            <div 
              v-for="option in priceOptions" 
              :key="option.value" 
              class="price-option"
              @click="selectPriceOption(option.min, option.max)"
            >
              {{ option.label }}
            </div>
          </div>
          
          <div class="popup-buttons">
            <button class="reset-btn" @click="resetPriceFilter">重置</button>
            <button class="confirm-btn" @click="confirmPriceFilter">确定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 过滤器选项
const filters = [
  { label: '综合排序', type: 'sort' },
  { label: '价格', type: 'price' },
  { label: '筛选', type: 'filter' }
]

// 当前激活的过滤器
const activeFilters = reactive({
  sort: false,
  price: false,
  filter: false
})

// 排序选项
const sortOptions = [
  { label: '综合排序', value: 'comprehensive' },
  { label: '最新发布', value: 'newest' },
  { label: '价格由低到高', value: 'priceAsc' },
  { label: '价格由高到低', value: 'priceDesc' },
  { label: '浏览量最多', value: 'viewsDesc' }
]

// 价格区间选项
const priceOptions = [
  { label: '0-100元', min: 0, max: 100 },
  { label: '100-500元', min: 100, max: 500 },
  { label: '500-1000元', min: 500, max: 1000 },
  { label: '1000-5000元', min: 1000, max: 5000 },
  { label: '5000元以上', min: 5000, max: '' }
]

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '电子产品', value: 'electronics' },
  { label: '图书教材', value: 'books' },
  { label: '生活用品', value: 'daily' },
  { label: '服装鞋帽', value: 'clothing' },
  { label: '体育用品', value: 'sports' },
  { label: '美妆护肤', value: 'beauty' },
  { label: '其他', value: 'others' }
]

// 状态变量
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const showSortPopup = ref(false)
const showPricePopup = ref(false)
const currentSort = ref('comprehensive')
const currentCategory = ref('all')
const page = ref(1)
const pageSize = ref(10)
const products = ref([])

// 价格区间
const priceRange = reactive({
  min: '',
  max: ''
})

// 加载商品列表
const fetchProducts = async () => {
  loading.value = true
  
  try {
    // 模拟API请求
    setTimeout(() => {
      // 生成模拟数据
      const mockProducts = Array(10).fill().map((_, index) => {
        const id = Date.now() + index
        const isDiscount = Math.random() > 0.5
        const price = Math.floor(Math.random() * 5000) + 100
        
        return {
          id,
          title: `商品示例 ${id}`,
          price: isDiscount ? Math.floor(price * 0.8) : price,
          originalPrice: isDiscount ? price : price,
          images: [`https://picsum.photos/300/300?random=${id}`],
          status: Math.random() > 0.8 ? '已售出' : '在售',
          createTime: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
          seller: {
            name: `用户${Math.floor(Math.random() * 1000)}`,
            avatar: 'https://via.placeholder.com/40'
          }
        }
      })
      
      products.value = mockProducts
      loading.value = false
      hasMore.value = true
    }, 800)
  } catch (error) {
    console.error('获取商品列表失败', error)
    loading.value = false
  }
}

// 加载更多商品
const loadMore = async () => {
  if (loadingMore.value) return
  
  loadingMore.value = true
  page.value++
  
  try {
    // 模拟加载更多
    setTimeout(() => {
      const mockMoreProducts = Array(10).fill().map((_, index) => {
        const id = Date.now() + index + 100
        const isDiscount = Math.random() > 0.5
        const price = Math.floor(Math.random() * 5000) + 100
        
        return {
          id,
          title: `商品示例 ${id}`,
          price: isDiscount ? Math.floor(price * 0.8) : price,
          originalPrice: isDiscount ? price : price,
          images: [`https://picsum.photos/300/300?random=${id}`],
          status: Math.random() > 0.8 ? '已售出' : '在售',
          createTime: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
          seller: {
            name: `用户${Math.floor(Math.random() * 1000)}`,
            avatar: 'https://via.placeholder.com/40'
          }
        }
      })
      
      products.value = [...products.value, ...mockMoreProducts]
      loadingMore.value = false
      
      // 模拟加载到底
      if (page.value >= 3) {
        hasMore.value = false
      }
    }, 800)
  } catch (error) {
    console.error('加载更多商品失败', error)
    loadingMore.value = false
  }
}

// 切换筛选器
const toggleFilter = (filterType) => {
  // 重置其他筛选器
  Object.keys(activeFilters).forEach(key => {
    if (key !== filterType) {
      activeFilters[key] = false
    }
  })
  
  // 切换当前筛选器
  activeFilters[filterType] = !activeFilters[filterType]
  
  // 显示对应的弹窗
  if (filterType === 'sort' && activeFilters.sort) {
    showSortPopup.value = true
    showPricePopup.value = false
  } else if (filterType === 'price' && activeFilters.price) {
    showPricePopup.value = true
    showSortPopup.value = false
  } else {
    showSortPopup.value = false
    showPricePopup.value = false
  }
}

// 选择排序方式
const selectSort = (sortValue) => {
  currentSort.value = sortValue
  showSortPopup.value = false
  activeFilters.sort = false
  
  // 重置并重新加载数据
  page.value = 1
  fetchProducts()
}

// 选择价格选项
const selectPriceOption = (min, max) => {
  priceRange.min = min
  priceRange.max = max
}

// 确认价格筛选
const confirmPriceFilter = () => {
  showPricePopup.value = false
  activeFilters.price = false
  
  // 重置并重新加载数据
  page.value = 1
  fetchProducts()
}

// 重置价格筛选
const resetPriceFilter = () => {
  priceRange.min = ''
  priceRange.max = ''
}

// 切换商品分类
const switchCategory = (category) => {
  currentCategory.value = category
  
  // 重置并重新加载数据
  page.value = 1
  fetchProducts()
}

// 查看商品详情
const viewProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
}

// 格式化时间
const formatTime = (timeString) => {
  const date = new Date(timeString)
  const now = new Date()
  
  // 今天的日期
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 昨天的日期
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  // 其他日期
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  fetchProducts()
})
</script>