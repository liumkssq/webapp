<template>
  <div class="product-list-page" ref="scrollContainerRef">
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
          @click="handleCategoryClick(category)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <ProductList 
      :products="products" 
      :loading="isLoading"
      :loadingMore="isLoading && products.length > 0"
      :hasMore="hasMore"
      :categoryId="activeCategoryId"
      :showFilter="true"
      ref="productListRef" 
      @emptyAction="goToPublish"
      @refresh="refreshProducts"
      @filterChange="handleFilterChange"
    />

    <!-- Loading indicator and sentinel for infinite scroll -->
    <div v-if="isLoading && products.length === 0" class="loading-initial">
      正在加载...
    </div>
    <div v-if="isLoading && products.length > 0" class="loading-more">
      正在加载更多...
    </div>
    <div v-if="!hasMore && products.length > 0" class="no-more-products">
      没有更多商品了
    </div>
    <div v-if="!isLoading && products.length === 0 && !hasMore" class="no-products-found">
      该分类下暂无商品，去发布一个吧！
    </div>

    <!-- Sentinel element for IntersectionObserver 移到底部以更好地触发下一页加载 -->
    <div ref="sentinel" class="sentinel"></div>
    
    <!-- 底部导航 -->
    <FooterNav />
  </div>
</template>

<script setup>
import { getProductList as apiGetProductList } from '@/api/product.js'
import FooterNav from '@/components/FooterNav.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import ProductList from '@/components/ProductList.vue'
import { useMessageStore } from '@/store/message'
import { nextTick, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const messageStore = useMessageStore()

const products = ref([])
const activeCategoryId = ref(-1)
const currentPage = ref(1)
const limit = ref(10)
const isLoading = ref(false)
const hasMore = ref(true)
const totalProducts = ref(0)

const categoryScroll = ref(null)
const productListRef = ref(null)
const sentinel = ref(null)
const scrollContainerRef = ref(null)

const categories = [
  { id: -1, name: '全部' },
  { id: 1, name: '电子数码' },
  { id: 2, name: '图书教材' },
  { id: 3, name: '服装鞋包' },
  { id: 4, name: '运动户外' },
  { id: 5, name: '美妆日化' },
  { id: 6, name: '家具家电' },
  { id: 7, name: '门票卡券' },
  { id: 8, name: '文具办公' },
  { id: 9, name: '玩具乐器' },
  { id: 10, name: '自行车' },
  { id: 11, name: '其他' }
]

const activeFilters = ref({
  sort: 'latest',
  price: 'all',
  condition: 'all'
});

const handleFilterChange = (filters) => {
  console.log('[List.vue] Filter changed:', filters);
  activeFilters.value = { ...filters };
  refreshProducts();
};

const fetchProducts = async (pageToLoad, append = false) => {
  if (isLoading.value) {
    console.log(`[List.vue] Fetch skipped: already loading. Page requested: ${pageToLoad}`);
    return;
  }
  if (append && !hasMore.value) {
    console.log(`[List.vue] Fetch skipped: append=true but no more data. Page requested: ${pageToLoad}`);
    return;
  }
  
  isLoading.value = true;
  console.log(`[List.vue] Fetching products. Page: ${pageToLoad}, Category: ${activeCategoryId.value}, Append: ${append}, HasMore: ${hasMore.value}`);

  try {
    const params = {
      page: pageToLoad,
      limit: limit.value,
    };
    
    if (activeCategoryId.value > 0) {
      params.category = activeCategoryId.value;
      console.log(`[List.vue] Using numeric category ID: ${activeCategoryId.value}`);
    } else {
      console.log(`[List.vue] No category filter applied (all categories)`);
    }
    
    if (activeFilters.value.sort !== 'latest') {
      params.sort = activeFilters.value.sort;
      console.log(`[List.vue] Setting sort parameter: ${params.sort}`);
    }
    
    if (activeFilters.value.price !== 'all') {
      if (activeFilters.value.price === 'under50') {
        params.maxPrice = 50;
        console.log('[List.vue] Setting maxPrice: 50');
      } else if (activeFilters.value.price === '50_100') {
        params.minPrice = 50;
        params.maxPrice = 100;
        console.log('[List.vue] Setting price range: 50-100');
      } else if (activeFilters.value.price === '100_500') {
        params.minPrice = 100;
        params.maxPrice = 500;
        console.log('[List.vue] Setting price range: 100-500');
      } else if (activeFilters.value.price === 'above500') {
        params.minPrice = 500;
        console.log('[List.vue] Setting minPrice: 500');
      }
    }
    
    if (activeFilters.value.condition !== 'all') {
      params.condition = activeFilters.value.condition;
      console.log(`[List.vue] Setting condition parameter: ${params.condition}`);
      
      if (!params.sort) {
        params.sort = `condition_${activeFilters.value.condition}`;
        console.log(`[List.vue] Setting condition via sort parameter: ${params.sort}`);
      }
    }
    
    console.log('[List.vue] Fetching products with params:', params);
    const response = await apiGetProductList(params);
    console.log('[List.vue] API response received:', JSON.parse(JSON.stringify(response)));

    if (response && response.data && Array.isArray(response.data.list)) {
      const newData = response.data.list;
      
      const processedData = newData.map(product => {
        const seller = product.seller || {
          id: product.sellerId || '未知ID',
          name: product.sellerName || '未知用户',
          avatar: product.sellerAvatar || '/avatar-placeholder.png'
        };
        
        let images = product.images || [];
        if (typeof images === 'string') {
          try {
            if (images.startsWith('[')) {
              images = JSON.parse(images);
  } else {
              images = [images];
            }
          } catch (e) {
            console.warn(`[List.vue] Failed to parse images JSON for product ${product.id}:`, e);
            images = [images];
          }
        }
        
        return {
          ...product,
          seller,
          images,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
          status: product.status === '\u0000' ? '在售' : (product.status || '在售')
        };
      });
      
      if (append) {
        products.value = [...products.value, ...processedData];
      } else {
        products.value = processedData;
      }
      
      if (typeof response.data.total === 'number') {
        totalProducts.value = Number(response.data.total);
      }
      currentPage.value = pageToLoad; 
      
      hasMore.value = newData.length >= limit.value;
      
      if (newData.length === 0) {
        hasMore.value = false;
      }
      
      console.log(`[List.vue] Products fetched. Total count: ${products.value.length}, HasMore: ${hasMore.value}, Page: ${currentPage.value}`);
    } else {
      console.error('[List.vue] Invalid API response structure:', response);
      messageStore.showError('获取商品数据格式错误');
      if (!append) {
        products.value = [];
      }
      hasMore.value = false; 
    }
  } catch (error) {
    console.error('[List.vue] Error fetching products:', error);
    messageStore.showError(error.message || '获取商品列表失败');
    if (!append) {
      products.value = [];
    }
    hasMore.value = false;
  } finally {
    isLoading.value = false;
  }
};

const refreshProducts = () => {
  console.log('[List.vue] Refreshing products list...');
  currentPage.value = 1;
  hasMore.value = true; 
  products.value = [];
  fetchProducts(1, false); 
};

let observer = null;
const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect();
    console.log("[List.vue] Previous IntersectionObserver disconnected.");
  }

  const options = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  };

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
      console.log(`[List.vue] Sentinel intersected. isLoading: ${isLoading.value}, hasMore: ${hasMore.value}, currentPage: ${currentPage.value}`);
      if (hasMore.value && !isLoading.value) {
        const nextPage = currentPage.value + 1;
        console.log(`[List.vue] Loading more products, page: ${nextPage}`);
        fetchProducts(nextPage, true);
      } else {
        console.log("[List.vue] Load more condition not met:", 
          isLoading.value ? "Still loading previous data" : "No more data to load");
      }
    }
  }, options);

  nextTick(() => {
    if (sentinel.value) {
      observer.observe(sentinel.value);
      console.log("[List.vue] IntersectionObserver observing sentinel element");
    } else {
      console.warn("[List.vue] Sentinel element not found for IntersectionObserver");
    }
  });
};

const handleCategoryClick = (category) => {
  console.log(`[List.vue] Category clicked: id=${category.id}, name=${category.name}`);
  if (activeCategoryId.value === category.id) {
    console.log('[List.vue] Same category clicked, ignoring.');
    return;
  }
  
  activeCategoryId.value = category.id;
  router.push({
    path: route.path,
    query: { 
      ...route.query,
      category: category.id === -1 ? undefined : category.id 
    }
  });
  
  console.log(`[List.vue] Category changed to: ${activeCategoryId.value}`);
  refreshProducts();
};

const scrollCategoryIntoView = () => {
  if (!categoryScroll.value) return
  const container = categoryScroll.value
  const activeEl = container.querySelector('.category-item.active')
  if (!activeEl) return
  
  const containerWidth = container.offsetWidth
  const activeElLeft = activeEl.offsetLeft
  const activeElWidth = activeEl.offsetWidth
  
  if (activeElLeft < container.scrollLeft || 
      activeElLeft + activeElWidth > container.scrollLeft + containerWidth) {
    container.scrollLeft = activeElLeft - (containerWidth / 2) + (activeElWidth / 2)
  }
}

const goToSearch = () => {
  router.push('/search?type=product')
}

const goToPublish = () => {
  router.push('/publish/product')
}

onMounted(() => {
  console.log('[List.vue] Component mounted')
  const categoryIdFromQuery = route.query.category
  
  if (categoryIdFromQuery && !isNaN(parseInt(categoryIdFromQuery))) {
    // 将查询字符串转换为数字
    const categoryIdNum = parseInt(categoryIdFromQuery)
    // 检查是否在我们的类别列表中
    if (categories.some(c => c.id === categoryIdNum)) {
      activeCategoryId.value = categoryIdNum
    }
  }
  
  refreshProducts()
  
  nextTick(() => {
    scrollCategoryIntoView()
    setupIntersectionObserver()
  })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log("[List.vue] IntersectionObserver disconnected on unmount.");
  }
})

onActivated(() => {
  console.log('[List.vue] Component activated');
  // Re-setup observer as DOM might have changed or sentinel might need re-observing
  nextTick(() => {
    if (sentinel.value) {
      console.log("[List.vue] Re-observing sentinel on activation.");
      setupIntersectionObserver(); // This will disconnect old and observe new/existing sentinel
    } else {
         console.warn("[List.vue] Sentinel not found on activation for observer.")
    }
  });
});

watch(activeCategoryId, (newVal, oldVal) => {
  if (newVal !== oldVal) {
  }
})

const onProductListRefresh = (info) => {
  console.log('[List.vue] ProductList emitted refresh. Triggering refreshProducts.', info);
  refreshProducts();
}
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.category-scroll {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  padding: 0 var(--spacing-sm);
}

.category-scroll::-webkit-scrollbar {
  display: none;
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

.loading-initial, .loading-more, .no-more-products, .no-products-found {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--text-tertiary);
}

.sentinel {
  height: 20px;
  margin: 10px 0;
  visibility: hidden; /* 隐藏但仍占据空间 */
}

@media (prefers-color-scheme: dark) {
  .category-item.active {
    background-color: rgba(0, 122, 255, 0.2);
  }
}
</style>