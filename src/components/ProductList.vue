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
  
  // 重置页码并重新获取数据
  page.value = 1;
  products.value = [];
  fetchProducts();
  
  // 关闭筛选菜单
  closeFilterMenu();
};

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
    
    console.log('[ProductList] 开始请求商品列表，参数:', params);
    
    // 直接通过fetch尝试获取，以便查看原始数据结构
    try {
      const fetchResponse = await fetch(`/api/product/list?page=${params.page}&limit=${params.limit}${props.categoryId && props.categoryId !== 'all' ? '&category=' + props.categoryId : ''}`);
      const fetchData = await fetchResponse.json();
      console.log('[ProductList] 直接fetch获取的原始数据:', fetchData);
    } catch (fetchError) {
      console.error('[ProductList] 直接fetch获取失败:', fetchError);
    }
    
    const response = await getProductList(params);
    console.log('[ProductList] 商品列表API响应原始数据:', response);
    
    // 处理响应数据
    if (response) {
      console.log('[ProductList] 响应状态码:', response.code);
      
      // 检查响应的各种可能格式
      if (response.code === 200 && response.data) {
        console.log('[ProductList] 标准响应格式，处理list数据');
        
        // 检查是否有list字段
        if (response.data.list && Array.isArray(response.data.list)) {
          handleProductData(response.data.list, isLoadMore);
          
          // 更新分页信息
          hasMore.value = products.value.length < (response.data.total || 0);
        } else if (Array.isArray(response.data)) {
          // 直接是数组的情况
          console.log('[ProductList] 响应数据是数组格式');
          handleProductData(response.data, isLoadMore);
          
          // 假设还有更多数据
          hasMore.value = response.data.length >= props.pageSize;
        } else {
          console.warn('[ProductList] 响应数据格式异常:', response.data);
      if (isLoadMore) {
            // 加载更多时不清空现有数据
          } else {
            products.value = [];
          }
        }
      } else if (Array.isArray(response)) {
        // 直接返回数组的情况
        console.log('[ProductList] 直接返回数组格式');
        handleProductData(response, isLoadMore);
        
        // 假设还有更多数据
        hasMore.value = response.length >= props.pageSize;
      } else {
        console.error('[ProductList] 无法识别的响应格式:', response);
        if (!isLoadMore) {
          products.value = [];
        }
      }
    } else {
      console.error('[ProductList] 获取商品列表失败: 空响应');
      if (!isLoadMore) {
        products.value = [];
      }
    }
  } catch (error) {
    console.error('[ProductList] 获取商品列表异常:', error);
    if (!isLoadMore) {
      products.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
    
    // 输出最终产品数据状态
    console.log('[ProductList] 最终products数据状态:', {
      length: products.value.length,
      hasMore: hasMore.value,
      firstItem: products.value[0] ? {
        id: products.value[0].id,
        title: products.value[0].title,
        images: products.value[0].images,
        processedImage: getProductImage(products.value[0])
      } : null
    });
    
    // 打印出所有产品以便调试
    products.value.forEach((product, index) => {
      console.log(`[ProductList] 产品[${index}]:`, {
        id: product.id,
        title: product.title,
        images: product.images,
        processedImage: getProductImage(product)
      });
    });
  }
};

// 处理商品数据
const handleProductData = (productsData, isLoadMore) => {
  if (!Array.isArray(productsData)) {
    console.error('[ProductList] 处理商品数据失败: 不是数组', productsData);
    return;
  }
  
  console.log(`[ProductList] 处理${productsData.length}个商品数据`);
  
  // 数据转换和处理
  const newProducts = productsData.map(product => {
    console.log(`[ProductList] 处理商品[${product.id}]:`, product.title);
    
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
    
    // 处理图片数据 - 针对特定格式的优化
    let processedImages = [];
    
    try {
      // 先检查是否有图片数据
      if (product.images) {
        // 如果是数组
        if (Array.isArray(product.images)) {
          // 处理数组中的每个元素
          for (const img of product.images) {
            if (typeof img === 'string') {
              // 特殊处理JSON字符串格式的图片
              if (img.startsWith('[') && img.includes('http')) {
                try {
                  // 尝试直接解析
                  const parsed = JSON.parse(img);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log(`[ProductList] 成功解析商品[${product.id}]的JSON图片:`, parsed[0]);
                    processedImages.push(parsed[0]);
                  }
                } catch (e) {
                  // 解析失败，尝试清理字符串后再解析
                  console.error(`[ProductList] 解析商品[${product.id}]的JSON图片失败, 尝试清理:`, e);
                  try {
                    // 手动提取URL
                    const urlMatch = img.match(/https?:\/\/[^"\\]+/g);
                    if (urlMatch && urlMatch.length > 0) {
                      console.log(`[ProductList] 手动提取商品[${product.id}]的图片URL:`, urlMatch[0]);
                      processedImages.push(urlMatch[0]);
                    } else {
                      // 如果无法提取，直接使用整个字符串
                      processedImages.push(img);
                    }
                  } catch (innerError) {
                    console.error(`[ProductList] 手动提取商品[${product.id}]的图片URL失败:`, innerError);
                    processedImages.push(img);
                  }
                }
              } else {
                // 普通URL字符串
                processedImages.push(img);
              }
            } else if (img) {
              // 非字符串但有效值
              processedImages.push(img);
            }
          }
        } 
        // 如果是字符串
        else if (typeof product.images === 'string') {
          if (product.images.startsWith('[')) {
            try {
              const parsed = JSON.parse(product.images);
              if (Array.isArray(parsed) && parsed.length > 0) {
                processedImages = parsed;
              } else {
                processedImages = [product.images];
              }
            } catch (e) {
              processedImages = [product.images];
            }
          } else {
            processedImages = [product.images];
          }
        }
      }
    } catch (error) {
      console.error(`[ProductList] 处理商品[${product.id}]图片时出错:`, error);
    }
    
    // 如果处理后仍然没有图片，使用默认图片
    if (!processedImages || processedImages.length === 0) {
      processedImages = [`https://picsum.photos/id/${(parseInt(product.id) % 30) + 1}/400/400`];
    }
    
    console.log(`[ProductList] 商品[${product.id}]最终处理后的图片:`, processedImages[0]);
    
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

// 优化商品排序时的性能
const sortedProducts = computed(() => {
  console.time('产品排序耗时');
  // 先深拷贝一份，避免修改原始数据
  let result = [];
  
  try {
    if (!products.value || products.value.length === 0) {
      console.timeEnd('产品排序耗时');
      return [];
    }
    
    // 使用Array.from创建浅拷贝而不是深拷贝，提高性能
    result = Array.from(products.value);
    
    // 根据排序条件排序
    if (activeFilters.sort === 'price_asc') {
      result.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
    } else if (activeFilters.sort === 'price_desc') {
      result.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
    } else if (activeFilters.sort === 'dateDesc') {
      result.sort((a, b) => {
        const dateA = a.createTime ? new Date(a.createTime).getTime() : 0;
        const dateB = b.createTime ? new Date(b.createTime).getTime() : 0;
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.error('排序过程中发生错误:', error);
  }
  
  console.timeEnd('产品排序耗时');
  return result;
});
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