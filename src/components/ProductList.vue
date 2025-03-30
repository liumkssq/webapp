<template>
  <div class="product-list-component">
    <!-- 商品过滤器 -->
    <div class="filter-bar" v-if="showFilter">
      <div 
        v-for="filter in filters" 
        :key="filter.type"
        class="filter-item"
        :class="{ active: activeFilters[filter.type] === filter.defaultValue }"
        @click="toggleFilter(filter.type)"
      >
        {{ filter.label }}
        <i :class="['filter-icon', getFilterIcon(filter.type)]"></i>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <div class="product-grid" v-if="products.length > 0">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="product-card"
        @click="goToProductDetail(product.id)"
      >
        <!-- 商品图片 -->
        <div class="product-image">
          <img 
            :src="product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png'" 
            :alt="product.title"
            @error="handleImageError"
          >
          <!-- 商品状态标签 -->
          <div class="product-status" v-if="product.status !== '在售'">
            {{ product.status }}
          </div>
        </div>
        
        <!-- 商品信息 -->
        <div class="product-info">
          <div class="product-title">{{ product.title }}</div>
          <div class="product-price-row">
            <div class="product-price">¥{{ product.price }}</div>
            <div class="product-original-price" v-if="product.originalPrice > product.price">
              ¥{{ product.originalPrice }}
            </div>
          </div>
          
          <!-- 卖家信息 -->
          <div class="seller-info">
            <img :src="product.seller.avatar" class="seller-avatar" :alt="product.seller.name">
            <div class="seller-name">{{ product.seller.name }}</div>
            <div class="publish-time">{{ formatTime(product.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading && !products.length">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 空状态 -->
    <empty-state
      v-if="!loading && !products.length"
      icon="shopping_bag"
      :text="emptyText"
      :action-text="showEmptyAction ? emptyActionText : ''"
      @action="handleEmptyAction"
    />
    
    <!-- 上拉加载更多 -->
    <div class="load-more" v-if="products.length > 0 && hasMore">
      <div class="loading-spinner small" v-if="loadingMore"></div>
      <div class="load-more-text" v-else>上拉加载更多</div>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="products.length > 0 && !hasMore && !loading">
      已经到底了~
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProductList } from '@/api/product'
import EmptyState from '@/components/common/EmptyState.vue'

// 组件props
const props = defineProps({
  // 分类ID，不传则获取全部
  categoryId: {
    type: [String, Number],
    default: ''
  },
  // 用户ID，获取指定用户的商品
  userId: {
    type: [String, Number],
    default: ''
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 10
  },
  // 是否显示过滤器
  showFilter: {
    type: Boolean,
    default: true
  },
  // 空状态文本
  emptyText: {
    type: String,
    default: '暂无商品'
  },
  // 是否显示空状态操作按钮
  showEmptyAction: {
    type: Boolean,
    default: false
  },
  // 空状态操作按钮文本
  emptyActionText: {
    type: String,
    default: '去发布'
  }
})

// 组件事件
const emit = defineEmits(['refresh', 'emptyAction'])

const router = useRouter()

// 状态变量
const loading = ref(false)
const loadingMore = ref(false)
const products = ref([])
const page = ref(1)
const hasMore = ref(true)
const activeFilters = reactive({
  sort: 'latest',    // 排序: latest-最新, price_asc-价格低到高, price_desc-价格高到低
  price: 'all',      // 价格: all-全部, under50, 50_100, 100_500, above500
  condition: 'all'   // 成色: all-全部, new-全新, almost_new-几乎全新, slight_use-轻微使用, used-使用过
})

// 过滤器配置
const filters = [
  {
    type: 'sort',
    label: '综合排序',
    defaultValue: 'latest',
    options: [
      { value: 'latest', label: '最新发布' },
      { value: 'price_asc', label: '价格从低到高' },
      { value: 'price_desc', label: '价格从高到低' },
      { value: 'popular', label: '最受欢迎' }
    ]
  },
  {
    type: 'price',
    label: '价格',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部价格' },
      { value: 'under50', label: '50元以下' },
      { value: '50_100', label: '50-100元' },
      { value: '100_500', label: '100-500元' },
      { value: 'above500', label: '500元以上' }
    ]
  },
  {
    type: 'condition',
    label: '成色',
    defaultValue: 'all',
    options: [
      { value: 'all', label: '全部成色' },
      { value: 'new', label: '全新' },
      { value: 'almost_new', label: '几乎全新' },
      { value: 'slight_use', label: '轻微使用' },
      { value: 'used', label: '使用过' }
    ]
  }
]

// 获取过滤器图标
const getFilterIcon = (type) => {
  const value = activeFilters[type]
  
  if (type === 'sort') {
    if (value === 'latest') return 'icon-sort-default'
    if (value === 'price_asc') return 'icon-sort-up'
    if (value === 'price_desc') return 'icon-sort-down'
    if (value === 'popular') return 'icon-sort-popular'
    return 'icon-sort-default'
  }
  
  return value === 'all' ? 'icon-filter' : 'icon-filter-active'
}

// 切换过滤器
const toggleFilter = (type) => {
  const filter = filters.find(f => f.type === type)
  if (!filter) return
  
  const currentValue = activeFilters[type]
  const index = filter.options.findIndex(opt => opt.value === currentValue)
  const nextIndex = (index + 1) % filter.options.length
  
  activeFilters[type] = filter.options[nextIndex].value
  
  // 重置页码并重新获取数据
  page.value = 1
  products.value = []
  fetchProducts()
}

// 获取商品列表
const fetchProducts = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  
  try {
    // 构建查询参数
    const params = {
      page: page.value,
      limit: props.pageSize
    }
    
    // 添加分类ID
    if (props.categoryId) {
      params.category = props.categoryId
    }
    
    // 添加用户ID
    if (props.userId) {
      params.userId = props.userId
    }
    
    // 添加排序参数
    if (activeFilters.sort !== 'latest') {
      params.sort = activeFilters.sort
    }
    
    // 添加价格范围
    if (activeFilters.price !== 'all') {
      if (activeFilters.price === 'under50') {
        params.minPrice = 0
        params.maxPrice = 50
      } else if (activeFilters.price === '50_100') {
        params.minPrice = 50
        params.maxPrice = 100
      } else if (activeFilters.price === '100_500') {
        params.minPrice = 100
        params.maxPrice = 500
      } else if (activeFilters.price === 'above500') {
        params.minPrice = 500
      }
    }
    
    // 添加成色参数
    if (activeFilters.condition !== 'all') {
      params.condition = activeFilters.condition
    }
    
    const res = await getProductList(params)
    
    if (res.code === 200 && res.data && res.data.list) {
      if (isLoadMore) {
        products.value = [...products.value, ...res.data.list]
      } else {
        products.value = res.data.list
      }
      
      // 更新是否有更多数据
      hasMore.value = res.data.hasMore || false
    } else {
      console.error('返回数据格式错误', res)
      if (!isLoadMore) {
        products.value = []
      }
    }
  } catch (error) {
    console.error('获取商品列表失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  // 小于1分钟
  if (diff < 60) {
    return '刚刚'
  }
  // 小于1小时
  else if (diff < 3600) {
    return Math.floor(diff / 60) + '分钟前'
  }
  // 小于24小时
  else if (diff < 86400) {
    return Math.floor(diff / 3600) + '小时前'
  }
  // 小于30天
  else if (diff < 2592000) {
    return Math.floor(diff / 86400) + '天前'
  }
  // 超过30天
  else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 跳转到商品详情
const goToProductDetail = (id) => {
  router.push(`/product/detail/${id}`)
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = '/placeholder.png'
}

// 处理空状态操作
const handleEmptyAction = () => {
  emit('emptyAction')
}

// 加载更多数据
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  
  page.value++
  fetchProducts(true)
}

// 刷新列表
const refresh = () => {
  page.value = 1
  products.value = []
  hasMore.value = true
  fetchProducts()
}

// 监听分类和用户变化，重新获取数据
watch(() => props.categoryId, () => {
  page.value = 1
  products.value = []
  hasMore.value = true
  fetchProducts()
})

watch(() => props.userId, () => {
  page.value = 1
  products.value = []
  hasMore.value = true
  fetchProducts()
})

// 上拉加载更多处理
let scrollListener = null
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = document.documentElement.clientHeight || window.innerHeight
  
  // 距离底部100px时加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

onMounted(() => {
  fetchProducts()
  
  // 添加滚动监听
  scrollListener = window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 移除滚动监听
  if (scrollListener) {
    window.removeEventListener('scroll', handleScroll)
  }
})

// 暴露方法给父组件
defineExpose({
  refresh
})
</script>