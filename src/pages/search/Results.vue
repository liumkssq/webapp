<template>
  <div class="search-results-page">
    <!-- 使用HeaderNav组件 -->
    <header-nav title="搜索结果" />
    
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-bar">
        <i class="icon-search"></i>
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索商品、文章、失物招领..." 
          class="search-input"
          @keyup.enter="handleSearch"
        >
        <i class="icon-clear" v-if="searchKeyword" @click="clearSearch"></i>
      </div>
      
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>
    
    <!-- 分类标签 -->
    <div class="category-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.value" 
        class="tab-item" 
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>
    
    <!-- 筛选条件 -->
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
    
    <!-- 搜索结果列表 -->
    <div class="results-container">
      <!-- 正在加载 -->
      <div class="loading-container" v-if="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载...</div>
      </div>
      
      <!-- 无搜索结果 -->
      <empty-state
        v-else-if="results.length === 0"
        icon="search_off"
        :text="`没有找到与'${searchKeyword}'相关的${getTabLabel(currentTab)}`"
        sub-text="请尝试其他关键词或切换到其他分类"
        action-text="返回搜索"
        @action="router.push('/search')"
      />
      
      <!-- 搜索结果列表 -->
      <div class="results-list" v-else>
        <div v-if="results.length > 0" class="results-header">
          <!-- 搜索结果数量提示 -->
          <div class="results-count">
            <span class="results-number">{{ results.length }}</span> 条{{ getTabLabel(currentTab) }}结果
          </div>
        </div>
        
            <!-- 直接渲染商品项 (确保能显示) -->
        <div v-for="(item, index) in results" :key="item.id || index" class="product-item" 
             style="margin-bottom: 16px; padding: 16px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" 
             @click="goToDetail(currentTab, item.id)">
          <h3 style="margin-top: 0; font-size: 18px; font-weight: 600;">{{ item.title }}</h3>
          <p style="color: #666; font-size: 15px;">{{ item.content || item.description }}</p>
          <div v-if="item.images && item.images.length" style="display: flex; gap: 8px; margin: 10px 0; overflow-x: auto;">
            <img v-for="(img, imgIndex) in item.images" :key="imgIndex" :src="img" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #666; margin-top: 10px;">
            <span>{{ formatTime(item.createdAt || new Date().toISOString()) }}</span>
            <span style="color: #ff3b30; font-weight: 600;">查看详情 ></span>
          </div>
        </div>

        <!-- 第二种方式: 使用 SearchResultItem 组件
        <search-result-item
          v-for="item in results"
          :key="item.id || item._id"
          :item="item"
          :type="currentTab"
          @click="goToDetail(currentTab, item.id || item._id)"
        />
        -->
      </div>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore && results.length > 0">
        <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <footer-nav />
  </div>
</template>

<script setup name="Results">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SearchResultItem from '@/components/search/SearchResultItem.vue'
import { globalSearch, searchProducts, searchArticles, searchLostFound } from '@/api/search'
import { useSearchResultsStore } from '@/store/searchResults'

// 调试辅助函数
const logInfo = (message, data) => {
  console.log(`%c ${message}`, 'background: #34c759; color: white; padding: 2px 4px; border-radius: 4px;', data)
}

const router = useRouter()
const route = useRoute()

// 使用 Pinia 存储搜索结果
const searchStore = useSearchResultsStore()

// 搜索关键词 - 使用 ref 并与 store 关联
const searchKeyword = ref('')
watch(searchKeyword, (newVal) => {
  searchStore.setKeyword(newVal)
})

// 当前选中的分类标签 - 使用 ref 并与 store 关联
const currentTab = ref('product')
watch(currentTab, (newVal) => {
  searchStore.setCurrentTab(newVal)
})

// 搜索结果 - 使用 ref 以兼容现有代码
const results = ref([])
// 同步数据
watch(() => searchStore.results, (newVal) => {
  results.value = newVal
  logInfo('从 store 更新结果到 results ref:', results.value)
}, { immediate: true })

// 标签列表
const tabs = [
  { label: '商品', value: 'product' },
  { label: '文章', value: 'article' },
  { label: '失物招领', value: 'lostFound' }
]

// 筛选条件
const filters = [
  { label: '综合排序', type: 'sort' },
  { label: '价格', type: 'price' },
  { label: '类别', type: 'category' }
]

// 当前激活的筛选条件
const activeFilters = ref({
  sort: false,
  price: false,
  category: false
})

// 加载状态
const loading = ref(true)
const loadingMore = ref(false)

// 分页 - 使用计算属性从 store 获取
const page = computed({
  get: () => searchStore.page,
  set: (val) => searchStore.setPage(val)
})
const pageSize = ref(10)
const hasMore = computed({
  get: () => searchStore.hasMore,
  set: (val) => searchStore.setHasMore(val)
})

// 获取标签名称
const getTabLabel = (tabValue) => {
  const tab = tabs.find(t => t.value === tabValue)
  return tab ? tab.label : ''
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

// 初始化页面
onMounted(() => {
  // 从URL获取搜索关键词
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
    fetchResults()
  }
})

// 监听URL参数变化
watch(() => route.query.keyword, (newVal) => {
  if (newVal) {
    searchKeyword.value = newVal
    fetchResults()
  }
})

// 切换标签
const switchTab = (tab) => {
  currentTab.value = tab
  page.value = 1
  fetchResults()
}

// 切换筛选条件
const toggleFilter = (filterType) => {
  // 关闭其他筛选条件
  Object.keys(activeFilters.value).forEach(key => {
    if (key !== filterType) {
      activeFilters.value[key] = false
    }
  })
  
  // 切换当前筛选条件
  activeFilters.value[filterType] = !activeFilters.value[filterType]
  
  // 如果有筛选条件变化，重新加载数据
  fetchResults()
}

// 获取搜索结果
const fetchResults = async () => {
  if (!searchKeyword.value) return
  
  loading.value = true
  // 直接使用 ref 重置搜索状态
  page.value = 1
  results.value = []
  // 同步到 store
  searchStore.setPage(1)
  searchStore.clearResults()
  
  logInfo('开始搜索:', searchKeyword.value)
  
  try {
    let response
    const params = {
      keyword: searchKeyword.value,
      page: 1, // 始终使用第1页
      limit: pageSize.value
    }
    
    // 根据当前标签确定API调用
    switch (currentTab.value) {
      case 'product':
        response = await searchProducts(params)
        logInfo('产品搜索响应:', response)
        break
        
      case 'article':
        response = await searchArticles(params)
        break
        
      case 'lostFound':
        // 如果有子类型，添加到参数中
        if (route.query.subtype) {
          params.subtype = route.query.subtype
        }
        response = await searchLostFound(params)
        break
        
      default:
        // 全局搜索
        response = await globalSearch(params)
    }
    
    if (response && response.list) {
      logInfo('收到搜索响应 - list字段:', response.list)
      // 对数据进行预处理，重点是保留原始字段，并处理图片
      const processedResults = response.list.map(item => {
        const newItem = { ...item };
        
        // 处理图片字段
        try {
          if (item.image) {
            if (typeof item.image === 'string') {
              try {
                // 尝试解析JSON字符串
                newItem.images = JSON.parse(item.image);
                logInfo('解析图片JSON成功:', newItem.images)
              } catch (e) {
                // 如果不是JSON，将其作为单个图片URL
                newItem.images = [item.image];
                console.error('解析图片失败，使用原始字符串:', e);
              }
            } else if (Array.isArray(item.image)) {
              // 如果已经是数组，直接使用
              newItem.images = item.image;
            }
          } else {
            newItem.images = [];
          }
        } catch (e) {
          console.error('处理图片字段错误:', e);
          newItem.images = [];
        }
        
        // 根据内容类型添加需要的字段
        if (currentTab.value === 'product') {
          newItem.description = item.content || '';
          newItem.price = item.price || item.extra?.price || 0;
          newItem.seller = item.seller || { name: '未知卖家' };
          newItem.createTime = item.createdAt || new Date().toISOString();
        }
        
        return newItem;
      });
      
      logInfo('处理后的商品数据:', processedResults);
      
      // 处理失物招领类型（如果需要）
      let finalResults = processedResults;
      if (currentTab.value === 'lostFound') {
        // 确保等同的数据结构
        finalResults = processedResults.map(item => ({
          ...item,
          type: item.lostFoundType || (item.isLost ? 'lost' : 'found'),
          status: item.status || 'open'
        }));
      }
      
      // 先直接设置到 ref，再存入store
      results.value = finalResults;
      logInfo('设置搜索结果到 results.value:', results.value)
      searchStore.setResults(finalResults);
      
      // 根据total、page和limit计算是否有更多数据
      const hasMoreData = response.total > 0 
        ? (1 * pageSize.value) < response.total 
        : response.list.length === pageSize.value;
      hasMore.value = hasMoreData;
      searchStore.setHasMore(hasMoreData);
    } else if (response && response.code === 0 && response.data) {
      // 兼容原有的API响应格式
      let resultItems = response.data.items || []
      
      // 处理不同类型的数据转换（如果需要）
      if (currentTab.value === 'lostFound') {
        // 确保等同的数据结构
        resultItems = resultItems.map(item => ({
          ...item,
          type: item.lostFoundType || (item.isLost ? 'lost' : 'found'),
          status: item.status || 'open'
        }))
      }
      
      // 将结果存入store
      searchStore.setResults(resultItems);
      searchStore.setHasMore(response.data.hasMore || false);
    } else {
      // 如果API响应失败，使用空数组
      searchStore.setResults([]);
      searchStore.setHasMore(false);
      console.error('获取搜索结果失败', response)
    }
  } catch (error) {
    console.error('获取搜索结果失败', error)
    searchStore.setResults([]);
    searchStore.setHasMore(false);
  } finally {
    loading.value = false
  }
}

// 加载更多结果
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  page.value++
  
  try {
    let response
    const params = {
      keyword: searchKeyword.value,
      page: page.value,
      limit: pageSize.value
    }
    
    // 根据当前标签确定API调用
    switch (currentTab.value) {
      case 'product':
        response = await searchProducts(params)
        break
        
      case 'article':
        response = await searchArticles(params)
        break
        
      case 'lostFound':
        // 如果有子类型，添加到参数中
        if (route.query.subtype) {
          params.subtype = route.query.subtype
        }
        response = await searchLostFound(params)
        break
        
      default:
        // 全局搜索
        response = await globalSearch(params)
    }
    
    if (response && response.list) {
      // 对新数据进行预处理，重点是保留原始字段，并处理图片
      let newItems = response.list.map(item => {
        const newItem = { ...item };
        
        // 处理图片字段
        try {
          if (item.image) {
            if (typeof item.image === 'string') {
              try {
                // 尝试解析JSON字符串
                newItem.images = JSON.parse(item.image);
              } catch (e) {
                // 如果不是JSON，将其作为单个图片URL
                newItem.images = [item.image];
              }
            } else if (Array.isArray(item.image)) {
              // 如果已经是数组，直接使用
              newItem.images = item.image;
            }
          } else {
            newItem.images = [];
          }
        } catch (e) {
          console.error('处理图片字段错误:', e);
          newItem.images = [];
        }
        
        // 根据内容类型添加需要的字段
        if (currentTab.value === 'product') {
          newItem.description = item.content || '';
          newItem.price = item.price || item.extra?.price || 0;
          newItem.seller = item.seller || { name: '未知卖家' };
          newItem.createTime = item.createdAt || new Date().toISOString();
        }
        
        return newItem;
      });
      
      console.log('加载更多: 处理后的商品数据:', newItems);
      
      // 处理失物招领类型（如果需要）
      if (currentTab.value === 'lostFound') {
        // 确保等同的数据结构
        newItems = newItems.map(item => ({
          ...item,
          type: item.lostFoundType || (item.isLost ? 'lost' : 'found'),
          status: item.status || 'open'
        }));
      }
      
      // 使用store添加更多结果
      searchStore.addResults(newItems);
      
      // 根据total、page和limit计算是否有更多数据
      searchStore.setHasMore(response.total > 0 
        ? (page.value * pageSize.value) < response.total 
        : response.list.length === pageSize.value);
    } else if (response && response.code === 0 && response.data) {
      // 兼容原有的API响应格式
      let newItems = response.data.items || []
      
      // 处理不同类型的数据转换（如果需要）
      if (currentTab.value === 'lostFound') {
        // 确保等同的数据结构
        newItems = newItems.map(item => ({
          ...item,
          type: item.lostFoundType || (item.isLost ? 'lost' : 'found'),
          status: item.status || 'open'
        }))
      }
      
      // 使用store添加更多结果
      searchStore.addResults(newItems);
      searchStore.setHasMore(response.data.hasMore || false);
    } else {
      console.error('加载更多失败', response)
      searchStore.setHasMore(false);
    }
  } catch (error) {
    console.error('加载更多失败', error)
    searchStore.setHasMore(false);
  } finally {
    loadingMore.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  
  // 跳转到搜索结果页（带上新的关键词）
  router.push({
    path: '/search-results',
    query: { keyword: searchKeyword.value }
  })
  
  // 重置分页和结果
  page.value = 1
  fetchResults()
}

// 清除搜索关键词
const clearSearch = () => {
  searchKeyword.value = ''
}

// 跳转到详情页
const goToDetail = (type, id) => {
  console.log('跳转到详情页:', type, id);
  let path = ''
  
  switch (type) {
    case 'product':
      path = `/product/detail/${id}`
      break
    case 'article':
      path = `/article/detail/${id}`
      break
    case 'lostFound':
      path = `/lost-found/detail/${id}`
      break
    default:
      console.warn('未知的类型:', type);
      // 如果类型不匹配，尝试使用默认路径
      if (id) {
        path = `/product/detail/${id}`; // 默认使用产品路径
      }
      break
  }
  
  if (path) {
    console.log('将跳转到路径:', path);
    router.push(path);
  } else {
    console.error('无效路径，无法跳转');
  }
}
</script>

<style scoped>
.search-results-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.search-container {
  display: flex;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(142, 142, 147, 0.12);
  border-radius: 10px;
  padding: 0 12px;
  margin-right: 10px;
  height: 36px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
  outline: none;
  font-size: 17px;
  color: #000;
}

.icon-search {
  color: #8e8e93;
  margin-right: 8px;
  font-size: 14px;
}

.icon-search::before {
  content: "\1F50D";
}

.icon-clear {
  color: #8e8e93;
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(142, 142, 147, 0.3);
  font-size: 12px;
}

.icon-clear::before {
  content: "\2715";
}

.search-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  height: 36px;
  transition: background-color 0.2s ease;
}

.search-btn:active {
  background-color: #0062cc;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.category-tabs::-webkit-scrollbar {
  display: none; /* Chrome & Safari */
}

.tab-item {
  padding: 6px 16px;
  margin-right: 12px;
  white-space: nowrap;
  border-radius: 16px;
  font-size: 14px;
  background-color: rgba(142, 142, 147, 0.12);
  color: #8e8e93;
  transition: all 0.2s ease;
  user-select: none;
}

.tab-item.active {
  background-color: #007aff;
  color: white;
}

/* 筛选条件 */
.filter-bar {
  display: flex;
  padding: 8px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 13px;
  color: #8e8e93;
  cursor: pointer;
}

.filter-item.active {
  color: #007aff;
}

.icon-arrow-down {
  font-size: 12px;
  margin-left: 4px;
}

.icon-arrow-down::before {
  content: "\25BC";
}

/* 结果容器 */
.results-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  -webkit-overflow-scrolling: touch;
}

/* 加载中 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  color: #8e8e93;
  font-size: 14px;
}

/* 结果列表 */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-header {
  margin-bottom: 12px;
}

.results-count {
  font-size: 15px;
  color: #8e8e93;
  padding: 4px 0;
  display: flex;
  align-items: center;
}

.results-number {
  font-weight: 600;
  color: #007aff;
  margin-right: 2px;
}

/* 增强搜索结果项延迟加载动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-result-item {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

.search-result-item:nth-child(1) { animation-delay: 0.05s; }
.search-result-item:nth-child(2) { animation-delay: 0.1s; }
.search-result-item:nth-child(3) { animation-delay: 0.15s; }
.search-result-item:nth-child(4) { animation-delay: 0.2s; }
.search-result-item:nth-child(5) { animation-delay: 0.25s; }

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.load-more-btn {
  background-color: transparent;
  border: 1px solid #007aff;
  color: #007aff;
  border-radius: 20px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:active {
  background-color: rgba(0, 122, 255, 0.1);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .search-results-page {
    background-color: #1c1c1e;
  }
  
  .search-container,
  .category-tabs,
  .filter-bar {
    background-color: #2c2c2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .search-bar {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .search-input {
    color: #ffffff;
  }
  
  .icon-clear {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .tab-item {
    background-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.7);
  }
  
  .filter-item {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .loading-text {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .loading-spinner {
    border-color: rgba(10, 132, 255, 0.2);
    border-top-color: #0a84ff;
  }
  
  .load-more-btn {
    border-color: #0a84ff;
    color: #0a84ff;
  }
  
  .load-more-btn:active {
    background-color: rgba(10, 132, 255, 0.1);
  }
}

/* 响应式适配 */
@media (min-width: 768px) {
  .search-container,
  .category-tabs,
  .filter-bar,
  .results-container {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>