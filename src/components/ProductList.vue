<template>
  <div class="product-list-component">
    <!-- 商品过滤器 -->
    <div class="filter-bar" v-if="showFilter">
      <div 
        v-for="filter in filters" 
        :key="filter.type"
        class="filter-item"
        :class="{ active: activeFilters[filter.type] !== filter.defaultValue }"
        @click="showFilterMenu(filter)"
      >
        {{ getFilterLabel(filter) }}
        <i :class="['filter-icon', getFilterIcon(filter.type)]"></i>
      </div>
    </div>
    
    <!-- 筛选弹出菜单 -->
    <div class="filter-menu-overlay" v-if="showFilterMenuType" @click="closeFilterMenu"></div>
    <div class="filter-menu" v-if="showFilterMenuType">
      <div class="filter-menu-header">
        <div class="filter-menu-title">{{ currentFilter ? currentFilter.label : '筛选' }}</div>
        <div class="filter-menu-close" @click="closeFilterMenu">
          <i class="icon-close"></i>
        </div>
      </div>
      <div class="filter-menu-options">
        <div 
          v-for="option in currentFilterOptions" 
          :key="option.value"
          class="filter-menu-option"
          :class="{ selected: activeFilters[showFilterMenuType] === option.value }"
          @click="selectFilterOption(option.value)"
        >
          {{ option.label }}
          <i class="icon-check" v-if="activeFilters[showFilterMenuType] === option.value"></i>
        </div>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <div class="product-grid" v-if="sortedProducts.length > 0">
      <div 
        v-for="product in sortedProducts" 
        :key="product.id" 
        class="product-card"
        @click="goToProductDetail(product.id)"
      >
        <!-- 商品图片 -->
        <div class="product-image">
          <img 
            :src="getProductImage(product)" 
            :alt="product.name || 'Product Image'" 
            loading="lazy" 
            @error="(e) => handleImageError(e, product.id)" 
            class="product-img" />
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
    <div class="loading-container" v-if="loading && !sortedProducts.length">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 空状态 -->
    <empty-state
      v-if="!loading && !sortedProducts.length"
      icon="shopping_bag"
      :text="emptyText"
      :action-text="showEmptyAction ? emptyActionText : ''"
      @action="handleEmptyAction"
    />
    
    <!-- 上拉加载更多 -->
    <div class="load-more" v-if="sortedProducts.length > 0 && hasMore">
      <div class="loading-spinner small" v-if="loadingMore"></div>
      <div class="load-more-text" v-else>上拉加载更多</div>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="sortedProducts.length > 0 && !hasMore && !loading">
      已经到底了~
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/common/EmptyState.vue'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

// 组件props
const props = defineProps({
  // 商品数据，直接由父组件传入
  products: {
    type: Array,
    default: () => []
  },
  // 是否有更多数据可加载
  hasMore: {
    type: Boolean,
    default: false
  },
  // 是否正在加载
  loading: {
    type: Boolean,
    default: false
  },
  // 是否正在加载更多
  loadingMore: {
    type: Boolean,
    default: false
  },
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
const emit = defineEmits(['refresh', 'emptyAction', 'filterChange'])

const router = useRouter()

// 状态变量 - 移除了loading, products, page, hasMore相关的本地状态
const activeFilters = reactive({
  sort: 'latest',    // 排序: latest-最新, price_asc-价格低到高, price_desc-价格高到低
  price: 'all',      // 价格: all-全部, under50, 50_100, 100_500, above500
  condition: 'all'   // 成色: all-全部, new-全新, almost_new-几乎全新, slight_use-轻微使用, used-使用过
})

// 状态变量增加筛选菜单状态
const showFilterMenuType = ref(null);
const currentFilter = ref(null);
const currentFilterOptions = ref([]);

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

// 获取筛选选项的显示文本
const getFilterLabel = (filter) => {
  const activeValue = activeFilters[filter.type];
  const option = filter.options.find(opt => opt.value === activeValue);
  if (filter.type === 'sort') {
    return option ? option.label : filter.label;
  } else {
    return activeValue === filter.defaultValue ? filter.label : option?.label || filter.label;
  }
};

// 显示筛选菜单
const showFilterMenu = (filter) => {
  showFilterMenuType.value = filter.type;
  currentFilter.value = filter;
  currentFilterOptions.value = filter.options;
};

// 关闭筛选菜单
const closeFilterMenu = () => {
  showFilterMenuType.value = null;
  currentFilter.value = null;
  currentFilterOptions.value = [];
};

// 选择筛选选项
const selectFilterOption = (value) => {
  if (!showFilterMenuType.value) return;
  
  // 设置选中的值
  activeFilters[showFilterMenuType.value] = value;
  
  console.log(`[ProductList.vue] Filter selected: ${showFilterMenuType.value} = ${value}`);
  
  // 特殊处理condition筛选
  if (showFilterMenuType.value === 'condition') {
    console.log(`[ProductList.vue] Condition filter changed to: ${value}`);
  }
  
  // 向父组件发送筛选改变事件
  emit('filterChange', { ...activeFilters });
  
  // 关闭筛选菜单
  closeFilterMenu();
};

// 优化获取商品图片函数，添加缓存避免重复处理
const imageCache = new Map(); // 图片缓存

// 获取商品图片，使用缓存提高性能
const getProductImage = (product) => {
  if (!product || !product.id) return '/placeholder.png';
  
  // 如果缓存中有此商品的图片，直接返回
  if (imageCache.has(product.id)) {
    return imageCache.get(product.id);
  }
  
  let imageUrl = '/placeholder.png'; // 默认图片
  
  // 处理图片数组
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // 取第一张图片
    const firstImage = product.images[0];
    
    // 如果是字符串，根据情况处理
    if (typeof firstImage === 'string') {
      if (firstImage.startsWith('[') && firstImage.includes('http')) {
        // 嵌套JSON字符串，提取URL
        try {
          // 正则表达式直接提取URL，避免复杂的JSON解析
          const urlMatch = firstImage.match(/https?:\/\/[^"\\]+/);
          if (urlMatch && urlMatch[0]) {
            imageUrl = urlMatch[0];
          } else {
            imageUrl = `/placeholder.png?id=${product.id}`; // 使用ID作为参数避免重复请求
          }
        } catch (e) {
          imageUrl = `/placeholder.png?id=${product.id}`;
        }
      } else if (firstImage.startsWith('http')) {
        // 直接是URL
        imageUrl = firstImage;
      } else {
        // 其他字符串，使用占位图
        imageUrl = `/placeholder.png?id=${product.id}`;
      }
    } 
    // 如果是对象，尝试获取url属性
    else if (typeof firstImage === 'object' && firstImage !== null) {
      imageUrl = firstImage.url || firstImage.src || `/placeholder.png?id=${product.id}`;
    }
  } 
  // 处理商品可能直接有image属性的情况
  else if (product.image) {
    imageUrl = product.image;
  } 
  else if (product.imageUrl) {
    imageUrl = product.imageUrl;
  }
  // 没有任何图片，使用默认图片
  else {
    imageUrl = `https://picsum.photos/id/${(parseInt(product.id) % 30) + 1}/400/400`;
  }
  
  // 缓存结果
  imageCache.set(product.id, imageUrl);
  
  return imageUrl;
};

// 处理图片加载错误，避免循环加载
const handleImageError = (e, id) => {
  console.warn(`商品图片加载失败，使用占位图替换，商品ID: ${id}`);
  
  // 检查是否已经是占位图，避免循环加载
  if (e.target.src.includes('placeholder.png')) {
    return; // 已经是占位图，不再处理
  }
  
  // 使用带随机参数的占位图，避免缓存问题
  e.target.src = `/placeholder.png?id=${id}&t=${Date.now()}`;
  
  // 从缓存中删除，避免再次获取错误的图片
  if (id && imageCache.has(id)) {
    imageCache.delete(id);
  }
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

// 刷新列表 - 触发父组件刷新
const refresh = () => {
  emit('refresh')
}

// 优化商品排序时的性能 - 现在直接使用传入的props.products
const sortedProducts = computed(() => {
  console.time('产品排序耗时');
  
  try {
    if (!props.products || props.products.length === 0) {
      console.timeEnd('产品排序耗时');
      return [];
    }
    
    // 使用Array.from创建浅拷贝而不是深拷贝，提高性能
    let result = Array.from(props.products);
    
    // 只在非服务器排序的情况下进行客户端排序
    // 当activeFilters.sort为'price_asc'或'price_desc'时，后端已经排序，无需再次客户端排序
    if (activeFilters.sort === 'latest' || 
        (activeFilters.sort !== 'price_asc' && 
         activeFilters.sort !== 'price_desc' && 
         activeFilters.sort !== 'popular')) {
      // 默认不做额外处理，使用后端排序
      console.log('[ProductList.vue] Using server-side sorting');
    } else {
      // 执行客户端排序
      console.log(`[ProductList.vue] Applying client-side sorting for: ${activeFilters.sort}`);
      
    if (activeFilters.sort === 'price_asc') {
      result.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (activeFilters.sort === 'price_desc') {
      result.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      } else if (activeFilters.sort === 'popular') {
        // 按照受欢迎程度排序，例如按点赞数或收藏数
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }
  }
  
  console.timeEnd('产品排序耗时');
  return result;
  } catch (error) {
    console.error('排序过程中发生错误:', error);
    console.timeEnd('产品排序耗时');
    return props.products || [];
  }
});

onMounted(() => {
  // 移除了自动数据获取和滚动监听
})

onUnmounted(() => {
  // 移除了滚动监听清理
})

// 暴露方法给父组件
defineExpose({
  refresh
})
</script>

<style scoped>
.product-list-component {
  padding: var(--spacing-sm);
}

.filter-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #f2f2f2;
  padding: 10px 15px;
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
  margin-right: 20px;
  padding: 6px 10px;
  border-radius: 15px;
  background-color: #f7f7f7;
  transition: all 0.2s;
}

.filter-item.active {
  color: #007aff;
  background-color: #e9f3ff;
  font-weight: 500;
}

.filter-icon {
  font-size: 12px;
  margin-left: 5px;
  transition: transform 0.2s;
}

.filter-item.active .filter-icon {
  transform: rotate(180deg);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.product-card {
  display: flex;
  flex-direction: column;
  background-color: var(--background-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
  position: relative;
}

.product-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.product-image {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 Aspect Ratio */
  overflow: hidden;
  background-color: var(--background-tertiary);
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-status {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  background-color: var(--primary-color);
  color: var(--white);
  padding: var(--spacing-xxs) var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  z-index: 2;
}

.product-info {
  padding: var(--spacing-sm);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.product-price-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: var(--spacing-xs);
}

.product-price {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--price-color, var(--red));
}

.product-original-price {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  text-decoration: line-through;
  margin-left: var(--spacing-xs);
}

.seller-info {
  display: flex;
  align-items: center;
  margin-top: auto;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.seller-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  margin-right: var(--spacing-xxs);
  object-fit: cover;
}

.seller-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publish-time {
  margin-left: var(--spacing-xs);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--background-tertiary);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-sm);
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 0;
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md) 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.load-more-text {
  color: var(--text-tertiary);
}

.no-more {
  text-align: center;
  padding: var(--spacing-md) 0;
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (prefers-color-scheme: dark) {
  .filter-item.active {
    background-color: rgba(0, 122, 255, 0.2);
  }
  
  .product-card {
    background-color: var(--background-secondary);
  }
  
  .product-image {
    background-color: var(--background-secondary);
  }
}

.filter-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 100;
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
}

.filter-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 101;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  max-height: 70vh;
  overflow-y: auto;
  transform: translateZ(0);
  transition: transform 0.3s ease;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.filter-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f2f2f2;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
}

.filter-menu-title {
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.filter-menu-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f5f5;
}

.filter-menu-options {
  padding: 8px 0;
}

.filter-menu-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  font-size: 16px;
  color: #333;
  transition: background-color 0.2s;
}

.filter-menu-option:active {
  background-color: #f9f9f9;
}

.filter-menu-option.selected {
  color: #007aff;
  font-weight: 500;
}

.icon-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #007aff;
  position: relative;
}

.icon-check::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 5px;
  height: 10px;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
  margin-top: -1px;
}

.icon-close::before,
.icon-close::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 2px;
  background-color: #999;
  top: 50%;
  left: 50%;
  margin-top: -1px;
}

.icon-close::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.icon-close::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
</style>