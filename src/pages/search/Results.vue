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
      
      <!-- 商品列表 -->
      <div class="product-list" v-else-if="currentTab === 'product'">
        <div 
          v-for="item in results" 
          :key="item.id" 
          class="product-item"
          @click="goToDetail('product', item.id)"
        >
          <div class="product-image">
            <img :src="item.images[0]" :alt="item.title">
          </div>
          <div class="product-info">
            <div class="product-title">{{ item.title }}</div>
            <div class="product-price">¥{{ item.price }}</div>
            <div class="product-desc">{{ item.description }}</div>
            <div class="product-meta">
              <span class="seller-info">{{ item.seller.name }}</span>
              <span class="product-time">{{ formatTime(item.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 文章列表 -->
      <div class="article-list" v-else-if="currentTab === 'article'">
        <div 
          v-for="item in results" 
          :key="item.id" 
          class="article-item"
          @click="goToDetail('article', item.id)"
        >
          <div class="article-content">
            <div class="article-title">{{ item.title }}</div>
            <div class="article-text">{{ item.content }}</div>
            <div class="article-images" v-if="item.images && item.images.length > 0">
              <img 
                v-for="(image, index) in item.images.slice(0, 3)" 
                :key="index" 
                :src="image" 
                alt="文章图片"
              >
            </div>
            <div class="article-meta">
              <span class="author-info">{{ item.author.nickname }}</span>
              <span class="article-stats">
                <i class="icon-like"></i> {{ item.likes }}
                <i class="icon-comment"></i> {{ item.comments }}
              </span>
              <span class="article-time">{{ formatTime(item.publishTime) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 失物招领列表 -->
      <div class="lost-found-list" v-else-if="currentTab === 'lostFound'">
        <div 
          v-for="item in results" 
          :key="item.id" 
          class="lost-found-item"
          @click="goToDetail('lostFound', item.id)"
        >
          <div class="lost-found-badge" :class="item.type">
            {{ item.type === 'lost' ? '丢失' : '招领' }}
          </div>
          <div class="lost-found-content">
            <div class="lost-found-title">{{ item.title }}</div>
            <div class="lost-found-desc">{{ item.description }}</div>
            <div class="lost-found-images" v-if="item.images && item.images.length > 0">
              <img 
                v-for="(image, index) in item.images.slice(0, 2)" 
                :key="index" 
                :src="image" 
                alt="物品图片"
              >
            </div>
            <div class="lost-found-info">
              <div class="lost-found-meta">
                <span class="location">{{ item.location }}</span>
                <span class="category">{{ item.category }}</span>
                <span class="time">{{ formatTime(item.lostFoundTime) }}</span>
              </div>
              <div class="lost-found-status" :class="item.status">
                {{ item.status === 'open' ? '未解决' : '已解决' }}
              </div>
            </div>
          </div>
        </div>
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

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const route = useRoute()

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的分类标签
const currentTab = ref('product')

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

// 搜索结果
const results = ref([])

// 加载状态
const loading = ref(true)
const loadingMore = ref(false)

// 分页
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

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
  page.value = 1
  
  try {
    let apiUrl = ''
    let params = {
      keyword: searchKeyword.value,
      page: page.value,
      size: pageSize.value
    }
    
    // 根据当前标签确定API路径
    switch (currentTab.value) {
      case 'product':
        // 模拟API调用数据
        setTimeout(() => {
          results.value = Array(10).fill().map((_, i) => ({
            id: `p${i+1}`,
            title: `搜索商品 ${searchKeyword.value} ${i+1}`,
            description: '这是一个与搜索关键词相关的商品描述...',
            price: Math.floor(Math.random() * 1000) + 10,
            originalPrice: Math.floor(Math.random() * 2000) + 100,
            images: ['https://via.placeholder.com/200'],
            seller: {
              name: `卖家${i+1}`,
              avatar: 'https://via.placeholder.com/50'
            },
            createTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
          }))
          loading.value = false
          hasMore.value = true
        }, 800)
        break
        
      case 'article':
        // 模拟API调用数据
        setTimeout(() => {
          results.value = Array(10).fill().map((_, i) => ({
            id: `a${i+1}`,
            title: `关于${searchKeyword.value}的文章 ${i+1}`,
            content: '这是一篇与搜索关键词相关的文章内容...',
            images: i % 2 === 0 ? ['https://via.placeholder.com/120', 'https://via.placeholder.com/120'] : [],
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 30),
            author: {
              nickname: `作者${i+1}`
            },
            publishTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
          }))
          loading.value = false
          hasMore.value = true
        }, 800)
        break
        
      case 'lostFound':
        // 模拟API调用数据
        setTimeout(() => {
          results.value = Array(10).fill().map((_, i) => ({
            id: `lf${i+1}`,
            title: `${i % 2 === 0 ? '丢失' : '招领'}：${searchKeyword.value} ${i+1}`,
            description: '这是一条与搜索关键词相关的失物招领信息...',
            type: i % 2 === 0 ? 'lost' : 'found',
            status: i % 3 === 0 ? 'closed' : 'open',
            category: ['证件', '电子产品', '书籍', '钱包/钥匙', '服装'][i % 5],
            location: ['图书馆', '教学楼', '食堂', '宿舍楼', '操场'][i % 5],
            images: i % 3 === 0 ? ['https://via.placeholder.com/100', 'https://via.placeholder.com/100'] : [],
            lostFoundTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
          }))
          loading.value = false
          hasMore.value = true
        }, 800)
        break
    }
  } catch (error) {
    console.error('获取搜索结果失败', error)
    loading.value = false
  }
}

// 加载更多结果
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  page.value++
  
  try {
    // 模拟加载更多数据
    setTimeout(() => {
      const newResults = Array(10).fill().map((_, i) => {
        const index = results.value.length + i
        
        switch (currentTab.value) {
          case 'product':
            return {
              id: `p${index+1}`,
              title: `搜索商品 ${searchKeyword.value} ${index+1}`,
              description: '这是一个与搜索关键词相关的商品描述...',
              price: Math.floor(Math.random() * 1000) + 10,
              originalPrice: Math.floor(Math.random() * 2000) + 100,
              images: ['https://via.placeholder.com/200'],
              seller: {
                name: `卖家${index+1}`,
                avatar: 'https://via.placeholder.com/50'
              },
              createTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
            }
            
          case 'article':
            return {
              id: `a${index+1}`,
              title: `关于${searchKeyword.value}的文章 ${index+1}`,
              content: '这是一篇与搜索关键词相关的文章内容...',
              images: index % 2 === 0 ? ['https://via.placeholder.com/120', 'https://via.placeholder.com/120'] : [],
              likes: Math.floor(Math.random() * 100),
              comments: Math.floor(Math.random() * 30),
              author: {
                nickname: `作者${index+1}`
              },
              publishTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
            }
            
          case 'lostFound':
            return {
              id: `lf${index+1}`,
              title: `${index % 2 === 0 ? '丢失' : '招领'}：${searchKeyword.value} ${index+1}`,
              description: '这是一条与搜索关键词相关的失物招领信息...',
              type: index % 2 === 0 ? 'lost' : 'found',
              status: index % 3 === 0 ? 'closed' : 'open',
              category: ['证件', '电子产品', '书籍', '钱包/钥匙', '服装'][index % 5],
              location: ['图书馆', '教学楼', '食堂', '宿舍楼', '操场'][index % 5],
              images: index % 3 === 0 ? ['https://via.placeholder.com/100', 'https://via.placeholder.com/100'] : [],
              lostFoundTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString()
            }
            
          default:
            return {}
        }
      })
      
      results.value = [...results.value, ...newResults]
      loadingMore.value = false
      
      // 模拟加载到尽头
      if (page.value >= 3) {
        hasMore.value = false
      }
    }, 1000)
  } catch (error) {
    console.error('加载更多失败', error)
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
  let path = ''
  
  switch (type) {
    case 'product':
      path = `/product/${id}`
      break
    case 'article':
      path = `/article/${id}`
      break
    case 'lostFound':
      path = `/lost-found/${id}`
      break
  }
  
  if (path) {
    router.push(path)
  }
}
</script>