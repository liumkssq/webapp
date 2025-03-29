<template>
  <div class="article-list-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="back-btn" @click="goBack">
      <span>返回</span>
    </div>
    
    <!-- 搜索栏 -->
    <div class="search-bar" @click="goToSearch">
      <span>搜索文章、商品...</span>
    </div>
    
    <!-- 分类标签 -->
    <div class="category-tabs">
      <div 
        v-for="category in categories" 
        :key="category.value"
        class="tab-item"
        :class="{ active: activeCategory === category.value }"
        @click="activeCategory = category.value"
      >
        {{ category.label }}
      </div>
    </div>
    
    <!-- 排序选项 -->
    <div class="sort-options">
      <div 
        v-for="option in sortOptions" 
        :key="option.value"
        class="sort-item"
        :class="{ active: activeSort === option.value }"
        @click="activeSort = option.value"
      >
        {{ option.label }}
      </div>
    </div>
    
    <!-- 文章列表 -->
    <div class="article-list">
      <div 
        v-for="article in articleList" 
        :key="article.id"
        class="article-item"
        @click="goToDetail(article.id)"
      >
        <div class="article-image" v-if="article.images && article.images.length">
          <!-- 图片区域 -->
        </div>
        
        <div class="article-content">
          <h3 class="article-title">{{ article.title }}</h3>
          
          <div class="article-preview">
            {{ article.content }}
          </div>
          
          <div class="article-meta">
            <div class="article-author">
              <span class="author-name">{{ article.author.nickname }}</span>
            </div>
            
            <div class="article-stats">
              <span class="views">{{ article.views }} 浏览</span>
              <span class="likes">{{ article.likes }} 赞</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部加载更多 -->
    <div class="load-more" v-if="hasMore" @click="loadMore">
      <span>加载更多</span>
    </div>
    
    <div class="no-more" v-else>
      <span>没有更多了</span>
    </div>
    
    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="goToPath('/home')">
        <div class="nav-icon">首页</div>
        <div class="nav-name">首页</div>
      </div>
      <div class="nav-item active">
        <div class="nav-icon">发现</div>
        <div class="nav-name">发现</div>
      </div>
      <div class="nav-item" @click="goToPath('/publish')">
        <div class="nav-icon">发布</div>
        <div class="nav-name">发布</div>
      </div>
      <div class="nav-item" @click="goToPath('/chat')">
        <div class="nav-icon">消息</div>
        <div class="nav-name">消息</div>
      </div>
      <div class="nav-item" @click="goToPath('/user/' + userId)">
        <div class="nav-icon">我的</div>
        <div class="nav-name">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getArticleList } from '@/api/article'

const router = useRouter()
const userStore = useUserStore()

// 获取用户ID
const userId = computed(() => userStore.userId || '1')

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '二手', value: 'secondhand' },
  { label: '失物招领', value: 'lostfound' },
  { label: '交流', value: 'communication' },
  { label: '学习', value: 'study' }
]

// 排序选项
const sortOptions = [
  { label: '最新', value: 'newest' },
  { label: '最热', value: 'hottest' },
  { label: '推荐', value: 'recommended' }
]

// 当前选中的分类和排序
const activeCategory = ref('all')
const activeSort = ref('newest')

// 文章列表数据
const articleList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = computed(() => articleList.value.length < total.value)

// 获取文章列表
const fetchArticleList = async (isLoadMore = false) => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      type: activeCategory.value !== 'all' ? activeCategory.value : undefined,
      sort: activeSort.value
    }
    
    const { data } = await getArticleList(params)
    
    if (!data || !data.list) {
      console.error('获取文章列表返回数据格式错误', data)
      return
    }
    
    if (isLoadMore) {
      articleList.value = [...articleList.value, ...data.list]
    } else {
      articleList.value = data.list
    }
    
    total.value = data.total || 0
  } catch (error) {
    console.error('获取文章列表失败', error)
    articleList.value = []
    total.value = 0
  }
}

// 加载更多
const loadMore = () => {
  if (hasMore.value) {
    currentPage.value++
    fetchArticleList(true)
  }
}

// 监听分类和排序变化
watch([activeCategory, activeSort], () => {
  currentPage.value = 1
  fetchArticleList()
})

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/article/detail/${id}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 导航到指定路径
const goToPath = (path) => {
  router.push(path)
}

// 页面挂载时获取数据
onMounted(() => {
  fetchArticleList()
})
</script>