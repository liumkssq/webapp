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
            :src="getProductImage(product)" 
            :alt="product.title"
            @error="handleImageError"
          >
          <!-- 商品状态标签 -->
          <div class="product-status" v-if="product.status && product.status !== '在售' && product.status !== '\u0000'">
            {{ product.status === '\u0000' ? '在售' : product.status }}
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
    loadingMore.value = true;
  } else {
    loading.value = true;
  }
  
  try {
    // 构建查询参数
    const params = {
      page: page.value,
      limit: props.pageSize
    };
    
    // 添加分类ID
    if (props.categoryId && props.categoryId !== 'all') {
      params.category = props.categoryId;
    }
    
    // 添加用户ID
    if (props.userId) {
      params.userId = props.userId;
    }
    
    // 添加排序参数
    if (activeFilters.sort !== 'latest') {
      params.sort = activeFilters.sort;
    }
    
    // 添加价格范围
    if (activeFilters.price !== 'all') {
      // 设置价格范围
      if (activeFilters.price === 'under50') {
        params.maxPrice = 50;
      } else if (activeFilters.price === '50_100') {
        params.minPrice = 50;
        params.maxPrice = 100;
      } else if (activeFilters.price === '100_500') {
        params.minPrice = 100;
        params.maxPrice = 500;
      } else if (activeFilters.price === 'above500') {
        params.minPrice = 500;
      }
    }
    
    // 添加成色条件
    if (activeFilters.condition !== 'all') {
      params.condition = activeFilters.condition;
    }
    
    console.log('开始请求商品列表，参数:', params);
    const response = await getProductList(params);
    console.log('商品列表响应原始数据:', response);
    
    // 处理响应数据
    if (response) {
      console.log('响应状态码:', response.code);
      
      // 检查响应的各种可能格式
      if (response.code === 200 && response.data) {
        console.log('标准响应格式，处理list数据');
        
        // 检查是否有list字段
        if (response.data.list && Array.isArray(response.data.list)) {
          handleProductData(response.data.list, isLoadMore);
          
          // 更新分页信息
          hasMore.value = products.value.length < (response.data.total || 0);
        } else if (Array.isArray(response.data)) {
          // 直接是数组的情况
          console.log('响应数据是数组格式');
          handleProductData(response.data, isLoadMore);
          
          // 假设还有更多数据
          hasMore.value = response.data.length >= props.pageSize;
        } else {
          console.warn('响应数据格式异常:', response.data);
          if (isLoadMore) {
            // 加载更多时不清空现有数据
          } else {
            products.value = [];
          }
        }
      } else if (Array.isArray(response)) {
        // 直接返回数组的情况
        console.log('直接返回数组格式');
        handleProductData(response, isLoadMore);
        
        // 假设还有更多数据
        hasMore.value = response.length >= props.pageSize;
      } else {
        console.error('无法识别的响应格式:', response);
        if (!isLoadMore) {
          products.value = [];
        }
      }
    } else {
      console.error('获取商品列表失败: 空响应');
      if (!isLoadMore) {
        products.value = [];
      }
    }
  } catch (error) {
    console.error('获取商品列表异常:', error);
    if (!isLoadMore) {
      products.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
    
    // 输出最终产品数据状态
    console.log('最终products数据状态:', {
      length: products.value.length,
      hasMore: hasMore.value,
      firstItem: products.value[0] ? {
        id: products.value[0].id,
        title: products.value[0].title,
        images: products.value[0].images,
        processedImage: getProductImage(products.value[0])
      } : null
    });
  }
};

// 处理商品数据
const handleProductData = (productsData, isLoadMore) => {
  if (!Array.isArray(productsData)) {
    console.error('处理商品数据失败: 不是数组', productsData);
    return;
  }
  
  console.log(`处理${productsData.length}个商品数据`);
  
  // 数据转换和处理
  const newProducts = productsData.map(product => {
    // 创建统一的卖家信息
    const seller = product.seller || {
      id: product.sellerId || '未知ID',
      name: product.sellerName || '未知用户',
      avatar: product.sellerAvatar || '/avatar-placeholder.png'
    };
    
    // 处理商品时间
    const createTime = product.createdAt || product.createTime || new Date().toISOString();
    
    // 确保价格是数字并处理
    const price = typeof product.price === 'number' ? product.price : 
                   (parseFloat(product.price) || 0);
    
    // 处理图片数据
    let processedImages = product.images;
    
    if (typeof processedImages === 'string') {
      try {
        if (processedImages.startsWith('[')) {
          processedImages = JSON.parse(processedImages);
        } else {
          processedImages = [processedImages];
        }
      } catch (e) {
        console.error('解析图片JSON失败:', e);
        processedImages = [processedImages];
      }
    } else if (!processedImages) {
      processedImages = [];
    }
    
    console.log(`商品[${product.id}]图片处理:`, {
      原始: product.images,
      处理后: processedImages
    });
    
    return {
      ...product,
      seller,
      createTime,
      price,
      images: processedImages,
      // 确保状态字段统一
      status: product.status === '\u0000' ? '在售' : (product.status || '在售')
    };
  });
  
  // 更新商品列表
  if (isLoadMore) {
    products.value = [...products.value, ...newProducts];
  } else {
    products.value = newProducts;
  }
  
  // 如果有数据，且还有更多，自动增加页码
  if (newProducts.length > 0 && hasMore.value) {
    page.value += 1;
  }
  
  // 触发刷新事件
  emit('refresh', {
    total: products.value.length + (hasMore.value ? '以上' : ''),
    current: products.value.length
  });
};

// 获取商品图片
const getProductImage = (product) => {
  if (!product || !product.images) return '/placeholder.png';
  
  // 处理图片数组
  if (Array.isArray(product.images) && product.images.length > 0) {
    // 取第一张图片
    const firstImage = product.images[0];
    // 如果图片是字符串但实际是JSON字符串，需要解析
    if (typeof firstImage === 'string' && firstImage.startsWith('[')) {
      try {
        const parsedImages = JSON.parse(firstImage);
        return Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : '/placeholder.png';
      } catch (e) {
        console.error('解析商品图片JSON失败:', e, firstImage);
        return firstImage.replace(/^\[\"|\"\]$/g, '') || '/placeholder.png';
      }
    }
    return firstImage;
  }
  
  // 处理商品可能直接有image属性的情况
  if (product.image) return product.image;
  
  return '/placeholder.png';
};

// 处理图片加载错误
const handleImageError = (e) => {
  console.warn('商品图片加载失败，使用占位图替换');
  e.target.src = '/placeholder.png';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '刚刚';
  
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) return '未知时间';
    
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60 * 1000) return '刚刚';
    // 小于1小时
    if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前';
    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
    
    // 显示具体日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    console.error('时间格式化错误:', e);
    return '未知时间';
  }
};

// 跳转到商品详情
const goToProductDetail = (id) => {
  router.push(`/product/detail/${id}`)
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