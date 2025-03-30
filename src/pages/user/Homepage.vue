<template>
  <div class="user-homepage">
    <!-- 头部导航 -->
    <HeaderNav :title="isCurrentUser ? '我的主页' : '用户主页'" />
    
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="user-header">
        <img :src="user.avatar" class="user-avatar" :alt="user.nickname">
        <div class="user-detail">
          <div class="user-name-row">
            <div class="user-name">{{ user.nickname }}</div>
            <div class="user-badge" v-if="user.verified">
              <i class="icon-verified"></i>
            </div>
          </div>
          <div class="user-id">ID: {{ user.id }}</div>
          <div class="user-school">{{ user.school }}</div>
        </div>
      </div>
      
      <!-- 用户数据统计 -->
      <div class="user-stats">
        <div class="stat-item" @click="goToFollowing">
          <div class="stat-count">{{ user.followingCount || 0 }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item" @click="goToFollowers">
          <div class="stat-count">{{ user.followerCount || 0 }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item">
          <div class="stat-count">{{ user.likeCount || 0 }}</div>
          <div class="stat-label">获赞</div>
        </div>
      </div>
      
      <!-- 用户简介 -->
      <div class="user-bio" v-if="user.bio">
        {{ user.bio }}
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="!isCurrentUser">
        <button 
          class="action-btn follow" 
          :class="{ 'followed': user.isFollowed }"
          @click="toggleFollow"
        >
          {{ user.isFollowed ? '已关注' : '关注' }}
        </button>
        <button class="action-btn message" @click="sendMessage">
          发消息
        </button>
      </div>
      <div class="action-buttons" v-else>
        <button class="action-btn edit" @click="editProfile">
          编辑资料
        </button>
      </div>
    </div>
    
    <!-- 内容选项卡 -->
    <div class="content-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'articles' }"
        @click="switchTab('articles')"
      >
        文章
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'products' }"
        @click="switchTab('products')"
      >
        商品
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'lostfound' }"
        @click="switchTab('lostfound')"
      >
        失物招领
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'favorites' }"
        @click="switchTab('favorites')"
      >
        收藏
      </div>
    </div>
    
    <!-- 文章列表 -->
    <div class="tab-content" v-if="activeTab === 'articles' && !loading">
      <div class="article-list" v-if="articles.length > 0">
        <div 
          v-for="article in articles" 
          :key="article.id" 
          class="article-item"
          @click="goToArticleDetail(article.id)"
        >
          <!-- 文章内容 -->
          <div class="article-content">
            <div class="article-title">{{ article.title }}</div>
            <div class="article-summary">{{ article.summary }}</div>
            <div class="article-meta">
              <span class="article-time">{{ formatTime(article.createTime) }}</span>
              <span class="article-stats">
                <i class="icon-view"></i> {{ formatNumber(article.viewCount) }}
                <i class="icon-comment"></i> {{ formatNumber(article.commentCount) }}
                <i class="icon-like"></i> {{ formatNumber(article.likeCount) }}
              </span>
            </div>
          </div>
          
          <!-- 文章图片 -->
          <div class="article-image" v-if="article.images && article.images.length > 0">
            <img :src="article.images[0]" :alt="article.title">
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <empty-state
        v-else
        icon="article"
        text="暂无文章"
        :action-text="isCurrentUser ? '去发布文章' : ''"
        @action="goToPublishArticle"
      />
    </div>
    
    <!-- 商品列表 -->
    <div class="tab-content" v-if="activeTab === 'products' && !loading">
      <div class="product-grid" v-if="products.length > 0">
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="product-item"
          @click="goToProductDetail(product.id)"
        >
          <!-- 商品图片 -->
          <div class="product-image">
            <img 
              :src="product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png'" 
              :alt="product.title"
            >
            <!-- 商品状态标签 -->
            <div class="product-status" v-if="product.status !== '在售'">
              {{ product.status }}
            </div>
          </div>
          
          <!-- 商品信息 -->
          <div class="product-info">
            <div class="product-title">{{ product.title }}</div>
            <div class="product-price">¥{{ product.price }}</div>
            <div class="product-time">{{ formatTime(product.createTime) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <empty-state
        v-else
        icon="shopping_bag"
        text="暂无商品"
        :action-text="isCurrentUser ? '去发布商品' : ''"
        @action="goToPublishProduct"
      />
    </div>
    
    <!-- 失物招领列表 -->
    <div class="tab-content" v-if="activeTab === 'lostfound' && !loading">
      <div class="lostfound-list" v-if="lostfounds.length > 0">
        <div 
          v-for="item in lostfounds" 
          :key="item.id" 
          class="lostfound-item"
          @click="goToLostFoundDetail(item.id)"
        >
          <!-- 物品图片 -->
          <div class="item-image" v-if="item.images && item.images.length > 0">
            <img :src="item.images[0]" :alt="item.title">
          </div>
          <div class="item-placeholder" v-else>
            <i :class="item.type === 'lost' ? 'icon-lost' : 'icon-found'"></i>
          </div>
          
          <!-- 物品信息 -->
          <div class="item-info">
            <!-- 物品标题 -->
            <div class="item-title-row">
              <div class="item-type-tag" :class="item.type">
                {{ item.type === 'lost' ? '寻物' : '招领' }}
              </div>
              <div class="item-title">{{ item.title }}</div>
            </div>
            
            <!-- 物品元数据 -->
            <div class="item-meta">
              <div class="meta-item">
                <i class="icon-category"></i>
                <span>{{ item.category }}</span>
              </div>
              <div class="meta-item">
                <i class="icon-location"></i>
                <span>{{ item.location }}</span>
              </div>
            </div>
            
            <!-- 物品状态 -->
            <div class="item-status-row">
              <div class="item-status" :class="getStatusClass(item.status)">
                {{ getStatusText(item.status, item.type) }}
              </div>
              <div class="item-time">{{ formatTime(item.createTime) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <empty-state
        v-else
        icon="search"
        text="暂无失物招领"
        :action-text="isCurrentUser ? '去发布启事' : ''"
        @action="goToPublishLostFound"
      />
    </div>
    
    <!-- 收藏列表 -->
    <div class="tab-content" v-if="activeTab === 'favorites' && !loading">
      <!-- 收藏分类 -->
      <div class="favorite-tabs">
        <div 
          class="favorite-tab" 
          :class="{ active: activeFavoriteTab === 'articles' }"
          @click="switchFavoriteTab('articles')"
        >
          文章
        </div>
        <div 
          class="favorite-tab" 
          :class="{ active: activeFavoriteTab === 'products' }"
          @click="switchFavoriteTab('products')"
        >
          商品
        </div>
      </div>
      
      <!-- 收藏的文章 -->
      <div class="favorite-content" v-if="activeFavoriteTab === 'articles'">
        <div class="article-list" v-if="favoriteArticles.length > 0">
          <div 
            v-for="article in favoriteArticles" 
            :key="article.id" 
            class="article-item"
            @click="goToArticleDetail(article.id)"
          >
            <!-- 文章内容 -->
            <div class="article-content">
              <div class="article-title">{{ article.title }}</div>
              <div class="article-author">{{ article.author.nickname }}</div>
              <div class="article-summary">{{ article.summary }}</div>
              <div class="article-meta">
                <span class="article-time">{{ formatTime(article.createTime) }}</span>
                <span class="article-stats">
                  <i class="icon-view"></i> {{ formatNumber(article.viewCount) }}
                  <i class="icon-comment"></i> {{ formatNumber(article.commentCount) }}
                  <i class="icon-like"></i> {{ formatNumber(article.likeCount) }}
                </span>
              </div>
            </div>
            
            <!-- 文章图片 -->
            <div class="article-image" v-if="article.images && article.images.length > 0">
              <img :src="article.images[0]" :alt="article.title">
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <empty-state
          v-else
          icon="favorite_border"
          text="暂无收藏的文章"
          :action-text="isCurrentUser ? '去浏览内容' : ''"
          @action="router.push('/product/list')"
        />
      </div>
      
      <!-- 收藏的商品 -->
      <div class="favorite-content" v-if="activeFavoriteTab === 'products'">
        <div class="product-grid" v-if="favoriteProducts.length > 0">
          <div 
            v-for="product in favoriteProducts" 
            :key="product.id" 
            class="product-item"
            @click="goToProductDetail(product.id)"
          >
            <!-- 商品图片 -->
            <div class="product-image">
              <img 
                :src="product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png'" 
                :alt="product.title"
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
                <div class="product-seller">{{ product.seller.nickname }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <empty-state
          v-else
          icon="favorite_border"
          text="暂无收藏的商品"
          :action-text="isCurrentUser ? '去浏览内容' : ''"
          @action="router.push('/product/list')"
        />
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
    
    <!-- 底部加载更多 -->
    <div class="load-more" v-if="hasMore && !loading && !isEmptyState">
      <div 
        class="load-more-btn" 
        v-if="!loadingMore"
        @click="loadMore"
      >
        点击加载更多
      </div>
      <div class="loading-spinner small" v-else></div>
    </div>
    
    <!-- 没有更多数据 -->
    <div class="no-more" v-if="!hasMore && !loading && !isEmptyState">
      已经到底了~
    </div>
    
    <!-- 提示消息 -->
    <div class="toast" v-if="toast.show">
      {{ toast.message }}
    </div>
    
    <!-- 底部导航 -->
    <FooterNav />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getUserProfile, followUser, unfollowUser } from '@/api/user'
import { getUserArticles, getFavoriteArticles } from '@/api/article'
import { getUserProducts, getFavoriteProducts } from '@/api/product'
import { getUserLostFound } from '@/api/lostFound'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const user = ref({})
const activeTab = ref('articles')
const activeFavoriteTab = ref('articles')
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = 10

// 数据列表
const articles = ref([])
const products = ref([])
const lostfounds = ref([])
const favoriteArticles = ref([])
const favoriteProducts = ref([])

// 提示消息
const toast = reactive({
  show: false,
  message: ''
})

// 计算属性
const isCurrentUser = computed(() => {
  return Number(route.params.id) === userStore.userId
})

const isEmptyState = computed(() => {
  if (activeTab.value === 'articles') {
    return articles.value.length === 0
  } else if (activeTab.value === 'products') {
    return products.value.length === 0
  } else if (activeTab.value === 'lostfound') {
    return lostfounds.value.length === 0
  } else if (activeTab.value === 'favorites') {
    if (activeFavoriteTab.value === 'articles') {
      return favoriteArticles.value.length === 0
    } else {
      return favoriteProducts.value.length === 0
    }
  }
  return false
})

// 格式化数字
const formatNumber = (num) => {
  if (!num) return 0
  return num > 999 ? (num / 1000).toFixed(1) + 'k' : num
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
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

// 获取失物招领状态文本
const getStatusText = (status, type) => {
  if (type === 'lost') {
    if (status === 'pending') return '寻找中'
    if (status === 'found') return '已找到'
    if (status === 'closed') return '已关闭'
  } else {
    if (status === 'pending') return '待认领'
    if (status === 'claimed') return '已认领'
    if (status === 'closed') return '已关闭'
  }
  
  return '未知状态'
}

// 获取状态样式类
const getStatusClass = (status) => {
  if (status === 'pending') return 'status-pending'
  if (status === 'found' || status === 'claimed') return 'status-success'
  if (status === 'closed') return 'status-closed'
  
  return 'status-pending'
}

// 获取用户信息
const fetchUserProfile = async () => {
  loading.value = true
  
  try {
    const userId = route.params.id
    const res = await getUserProfile(userId)
    
    if (res.code === 200) {
      user.value = res.data
    } else {
      showToast('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    showToast('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取用户文章
const fetchUserArticles = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    articles.value = []
  }
  
  try {
    const userId = route.params.id
    const res = await getUserArticles(userId, {
      page: page.value,
      limit: pageSize
    })
    
    if (res.code === 200) {
      if (isLoadMore) {
        articles.value = [...articles.value, ...res.data.list]
      } else {
        articles.value = res.data.list
      }
      
      hasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('获取用户文章失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 获取用户商品
const fetchUserProducts = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    products.value = []
  }
  
  try {
    const userId = route.params.id
    const res = await getUserProducts(userId, {
      page: page.value,
      limit: pageSize
    })
    
    if (res.code === 200) {
      if (isLoadMore) {
        products.value = [...products.value, ...res.data.list]
      } else {
        products.value = res.data.list
      }
      
      hasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('获取用户商品失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 获取用户失物招领
const fetchUserLostFound = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    lostfounds.value = []
  }
  
  try {
    const userId = route.params.id
    const res = await getUserLostFound(userId, {
      page: page.value,
      limit: pageSize
    })
    
    if (res.code === 200) {
      if (isLoadMore) {
        lostfounds.value = [...lostfounds.value, ...res.data.list]
      } else {
        lostfounds.value = res.data.list
      }
      
      hasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('获取用户失物招领失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 获取收藏的文章
const fetchFavoriteArticles = async (isLoadMore = false) => {
  if (!userStore.isLoggedIn || !isCurrentUser.value) {
    favoriteArticles.value = []
    return
  }
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    favoriteArticles.value = []
  }
  
  try {
    const res = await getFavoriteArticles({
      page: page.value,
      limit: pageSize
    })
    
    if (res.code === 200) {
      if (isLoadMore) {
        favoriteArticles.value = [...favoriteArticles.value, ...res.data.list]
      } else {
        favoriteArticles.value = res.data.list
      }
      
      hasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('获取收藏文章失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 获取收藏的商品
const fetchFavoriteProducts = async (isLoadMore = false) => {
  if (!userStore.isLoggedIn || !isCurrentUser.value) {
    favoriteProducts.value = []
    return
  }
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    favoriteProducts.value = []
  }
  
  try {
    const res = await getFavoriteProducts({
      page: page.value,
      limit: pageSize
    })
    
    if (res.code === 200) {
      if (isLoadMore) {
        favoriteProducts.value = [...favoriteProducts.value, ...res.data.list]
      } else {
        favoriteProducts.value = res.data.list
      }
      
      hasMore.value = res.data.hasMore
    }
  } catch (error) {
    console.error('获取收藏商品失败', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 切换标签
const switchTab = (tab) => {
  if (activeTab.value === tab) return
  
  activeTab.value = tab
  page.value = 1
  hasMore.value = true
  
  if (tab === 'articles') {
    fetchUserArticles()
  } else if (tab === 'products') {
    fetchUserProducts()
  } else if (tab === 'lostfound') {
    fetchUserLostFound()
  } else if (tab === 'favorites') {
    if (activeFavoriteTab.value === 'articles') {
      fetchFavoriteArticles()
    } else {
      fetchFavoriteProducts()
    }
  }
}

// 切换收藏标签
const switchFavoriteTab = (tab) => {
  if (activeFavoriteTab.value === tab) return
  
  activeFavoriteTab.value = tab
  page.value = 1
  hasMore.value = true
  
  if (tab === 'articles') {
    fetchFavoriteArticles()
  } else {
    fetchFavoriteProducts()
  }
}

// 关注/取消关注用户
const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const userId = route.params.id
    let res
    
    if (user.value.isFollowed) {
      res = await unfollowUser(userId)
    } else {
      res = await followUser(userId)
    }
    
    if (res.code === 200) {
      user.value.isFollowed = !user.value.isFollowed
      user.value.followerCount = res.data.followerCount
      
      showToast(user.value.isFollowed ? '关注成功' : '已取消关注')
    }
  } catch (error) {
    console.error('操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 发送消息
const sendMessage = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  router.push(`/chat/${route.params.id}`)
}

// 编辑个人资料
const editProfile = () => {
  router.push('/profile')
}

// 加载更多
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  
  page.value++
  
  if (activeTab.value === 'articles') {
    fetchUserArticles(true)
  } else if (activeTab.value === 'products') {
    fetchUserProducts(true)
  } else if (activeTab.value === 'lostfound') {
    fetchUserLostFound(true)
  } else if (activeTab.value === 'favorites') {
    if (activeFavoriteTab.value === 'articles') {
      fetchFavoriteArticles(true)
    } else {
      fetchFavoriteProducts(true)
    }
  }
}

// 页面跳转
const goToArticleDetail = (id) => {
  router.push(`/article/${id}`)
}

const goToProductDetail = (id) => {
  router.push(`/product/${id}`)
}

const goToLostFoundDetail = (id) => {
  router.push(`/lost-found/${id}`)
}

const goToFollowing = () => {
  router.push(`/user/${route.params.id}/following`)
}

const goToFollowers = () => {
  router.push(`/user/${route.params.id}/followers`)
}

const goToPublishArticle = () => {
  router.push('/publish-article')
}

const goToPublishProduct = () => {
  router.push('/publish-product')
}

const goToPublishLostFound = () => {
  router.push('/publish-lost-found')
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  fetchUserProfile()
  
  // 重置标签页
  activeTab.value = 'articles'
  activeFavoriteTab.value = 'articles'
  page.value = 1
  
  // 获取初始数据
  fetchUserArticles()
})

// 监听URL查询参数
watch(() => route.query, (query) => {
  if (query.tab && ['articles', 'products', 'lostfound', 'favorites'].includes(query.tab)) {
    switchTab(query.tab)
  }
})

// 页面加载
onMounted(() => {
  fetchUserProfile()
  
  // 从URL查询参数获取标签页
  const { tab } = route.query
  if (tab && ['articles', 'products', 'lostfound', 'favorites'].includes(tab)) {
    activeTab.value = tab
  }
  
  // 根据当前标签获取数据
  switchTab(activeTab.value)
})
</script>