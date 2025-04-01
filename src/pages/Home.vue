<template>
  <page-container>
    <!-- 下拉刷新指示器 -->
    <div 
      class="refresh-indicator" 
      :class="{ active: isRefreshing }" 
      :style="{ height: `${refreshDistance}px` }"
    >
      <div class="refresh-spinner" v-if="refreshDistance > 0">
        <i class="material-icons" :style="{ transform: `rotate(${refreshDistance * 4.5}deg)` }">refresh</i>
        <span>{{ isRefreshing ? '正在刷新...' : '下拉刷新' }}</span>
      </div>
    </div>
    
    <div class="home-page">
      <!-- iOS风格状态栏 -->
      <div class="ios-status-bar">
        <div class="status-bar-content">
          <div class="time">{{ currentTime }}</div>
          <div class="status-icons">
            <div class="signal-icon">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                <path d="M0 7h3v5H0V7zm5-3h3v8H5V4zm5-4h3v12h-3V0zm5 2h3v10h-3V2z"/>
              </svg>
            </div>
            <div class="wifi-icon">
              <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2.5 5.4a7.8 7.8 0 0111 0l-1.8 1.8a5.3 5.3 0 00-7.4 0L2.5 5.4zm-2.1-2a11.5 11.5 0 0115.2 0l-1.8 1.7a8.9 8.9 0 00-11.6 0L.4 3.4z"/>
              </svg>
            </div>
            <div class="battery-icon">
              <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
                <rect x="1" y="1" width="20" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                <rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor"/>
                <path d="M23 4v4a1 1 0 001-1V5a1 1 0 00-1-1z" fill="currentColor"/>
              </svg>
              <span style="margin-left: 2px;">100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 顶部搜索栏 -->
      <div class="search-bar" @click="navigateToSearch">
        <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索商品、文章、失物招领..."
            readonly
        />
        <button @click.stop="navigateToSearch">搜索</button>
      </div>

      <!-- 轮播图 -->
      <div class="banner-swiper">
        <div class="swiper-container">
          <div
              v-for="(banner, index) in banners"
              :key="index"
              class="swiper-item"
              :class="{ active: currentBannerIndex === index }"
              :style="{ backgroundImage: `url(${banner.imageUrl})` }"
              @click="handleBannerClick(banner)"
          >
            <div class="banner-title">{{ banner.title }}</div>
          </div>
        </div>
        <div class="indicator">
          <span
              v-for="(_, index) in banners"
              :key="index"
              :class="{ active: currentBannerIndex === index }"
              @click="currentBannerIndex = index"
          ></span>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="feature-entries">
        <div
            v-for="entry in featureEntries"
            :key="entry.id"
            class="entry-item"
            @click="handleFeatureClick(entry)"
        >
          <div class="entry-icon" :style="{ backgroundColor: entry.color }">
            <svg-icon :name="entry.icon" size="24" />
          </div>
          <div class="entry-name">{{ entry.name }}</div>
        </div>
      </div>

      <!-- 内容区块 -->
      <div class="content-blocks">
        <!-- 热门商品 -->
        <div class="content-block">
          <div class="block-header">
            <h3>热门商品</h3>
            <div class="view-more" @click="router.push('/product/list')">查看更多</div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loadingStates.products" class="loading-state">
            <i class="material-icons spin">refresh</i>
            <p>加载中...</p>
          </div>
          
          <!-- 商品列表 -->
<div v-else-if="hotProducts.length > 0" class="product-list">
          <div 
          v-for="product in hotProducts"
          :key="product.id"
          class="product-card-wrapper"
          @click="goToProductDetail(product.id)"
          >
            <product-item
                :product="product"
                :show-description="false"
        class="product-card"
            ></product-item>
  </div>
</div>
          
          <!-- 空状态 -->
          <div v-else class="empty-placeholder">
            <i class="material-icons">shopping_bag</i>
            <p>暂无热门商品</p>
            <button class="retry-button" @click="refreshHotProducts">
              <i class="material-icons">refresh</i> 重试
            </button>
          </div>
        </div>

        <!-- 最新失物招领 -->
        <div class="content-block">
          <div class="block-header">
            <h3>最新失物招领</h3>
            <div class="view-more" @click="router.push('/lost-found/list')">查看更多</div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loadingStates.lostFound" class="loading-state">
            <i class="material-icons spin">refresh</i>
            <p>加载中...</p>
          </div>
          
          <!-- 失物招领列表 -->
          <div v-else-if="latestLostFound.length > 0" class="lost-found-list">
            <lost-found-item
                v-for="item in latestLostFound"
                :key="item.id"
                :item="item"
                :show-description="false"
            ></lost-found-item>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-placeholder">
            <i class="material-icons">search</i>
            <p>暂无失物招领信息</p>
            <button class="retry-button" @click="refreshLostFound">
              <i class="material-icons">refresh</i> 重试
            </button>
          </div>
        </div>

        <!-- 热门话题 -->
        <div class="content-block">
          <div class="block-header">
            <h3>热门话题</h3>
            <div class="view-more" @click="router.push('/article/list')">查看更多</div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loadingStates.articles" class="loading-state">
            <i class="material-icons spin">refresh</i>
            <p>加载中...</p>
          </div>
          
          <!-- 文章列表 -->
          <div v-else-if="hotArticles.length > 0" class="article-list">
            <div
                v-for="article in hotArticles"
                :key="article.id"
                class="article-item"
                @click="router.push(`/article/detail/${article.id}`)"
            >
              <div class="article-info">
                <div class="article-title">{{ article.title }}</div>
                <div class="article-brief">{{ article.brief }}</div>
                <div class="article-meta">
                  <span class="author">{{ article.author?.nickname || '匿名用户' }}</span>
                  <span class="dot">·</span>
                  <span class="view-count">{{ formatCount(article.viewCount) }} 阅读</span>
                  <span class="dot">·</span>
                  <span class="like-count">{{ formatCount(article.likeCount) }} 点赞</span>
                </div>
              </div>
              <div class="article-image" v-if="article.coverImage">
                <img :src="article.coverImage" alt="文章封面" />
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-placeholder">
            <i class="material-icons">forum</i>
            <p>暂无热门话题</p>
            <button class="retry-button" @click="refreshArticles">
              <i class="material-icons">refresh</i> 重试
            </button>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <footer-navigation :active-tab="'home'" />
    </div>
  </page-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { onBeforeRouteLeave } from 'vue-router'
import { useMessageStore } from '@/store/message'
import ProductItem from '@/components/product/ProductItem.vue'
import LostFoundItem from '@/components/lostFound/LostFoundItem.vue'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import api from '@/api'
import '@/style/Home.css'

const router = useRouter()
const searchKeyword = ref('')
const banners = ref([
  {
    id: 1,
    title: '校园二手交易',
    imageUrl: 'https://picsum.photos/id/1018/800/400',
    link: '/product/list'
  },
  {
    id: 2,
    title: '失物招领平台',
    imageUrl: 'https://picsum.photos/id/1015/800/400',
    link: '/lost-found/list'
  },
  {
    id: 3,
    title: '校园社区交流',
    imageUrl: 'https://picsum.photos/id/1019/800/400',
    link: '/article/list'
  }
])
const currentBannerIndex = ref(0)
const featureEntries = ref([
  {
    id: 1,
    name: '二手交易',
    icon: 'shop',
    color: '#FF9500',
    route: '/product/list'
  },
  {
    id: 2,
    name: '失物招领',
    icon: 'search',
    color: '#34C759',
    route: '/lost-found/list'
  },
  {
    id: 3,
    name: '校园论坛',
    icon: 'message',
    color: '#007AFF',
    route: '/article/list'
  },
  {
    id: 4,
    name: '求助信息',
    icon: 'help',
    color: '#5856D6',
    route: '/article/list?type=help'
  },
  {
    id: 5,
    name: '校园活动',
    icon: 'calendar',
    color: '#FF2D55',
    route: '/article/list?type=activity'
  }
])
const hotProducts = ref([])
const latestLostFound = ref([])
const hotArticles = ref([])

// 使用单独的加载状态管理不同区块
const loadingStates = reactive({
  products: true,
  lostFound: true,
  articles: true
})

// 引入消息提示功能
const messageStore = useMessageStore()

const currentTime = ref(formatTime(new Date()))

// 格式化时间为 HH:MM 格式
function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 更新时间
function updateTime() {
  currentTime.value = formatTime(new Date())
}

// 启动时间更新定时器
let timeInterval = null

// 跳转到搜索页面
const navigateToSearch = () => {
  router.push('/search')
}

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search/results',
      query: { keyword: searchKeyword.value }
    })
  } else {
    router.push('/search')
  }
}

const handleBannerClick = (banner) => router.push(banner.link)
const handleFeatureClick = (entry) => router.push(entry.route)
const formatCount = (count) => count < 1000 ? count : (count / 1000).toFixed(1) + 'k'

let bannerTimer = null
const startBannerAutoPlay = () => {
  bannerTimer = setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
  }, 3000)
}

const fetchHomeData = async () => {
  loadingStates.products = true;
  loadingStates.lostFound = true;
  loadingStates.articles = true;
  try {
    console.log('开始获取首页数据...');
    
    // 使用fetch直接请求后端API获取热门商品
    try {
      const response = await fetch('/api/product/list?sort=hot&limit=4');
      if (response.ok) {
        const data = await response.json();
        console.log('直接获取热门商品数据:', data);
        
        // 直接使用响应数据
        if (data && data.list && Array.isArray(data.list)) {
          // 处理图片数据
          hotProducts.value = data.list.map(product => {
            const processedProduct = { ...product };
            
            // 处理图片JSON字符串
            if (processedProduct.images && Array.isArray(processedProduct.images)) {
              processedProduct.images = processedProduct.images.map(img => {
                if (typeof img === 'string' && img.startsWith('[')) {
                  try {
                    return JSON.parse(img);
                  } catch (e) {
                    console.error('解析图片JSON失败:', e);
                    return [img];
                  }
                }
                return img;
              }).flat();
            }
            
            return processedProduct;
          });
          
          console.log('处理后的热门商品数据:', hotProducts.value);
        } else {
          console.error('热门商品数据格式异常:', data);
          hotProducts.value = [];
        }
      } else {
        console.error('获取热门商品失败，HTTP状态:', response.status);
        hotProducts.value = [];
      }
    } catch (error) {
      console.error('直接获取热门商品异常:', error);
      
      // 如果直接请求失败，回退到API模块
      const hotProductsRes = await api.product.getProductList({ sort: 'hot', limit: 4 });
      console.log('回退API响应:', hotProductsRes);
      
      if (hotProductsRes && hotProductsRes.code === 200 && hotProductsRes.data) {
        hotProducts.value = hotProductsRes.data.list || [];
      } else {
        hotProducts.value = [];
      }
    }
    
    // 其他数据获取保持不变
    // 获取最新失物招领
    try {
      console.log('开始获取失物招领数据...');
      const response = await fetch('/api/lost-found/list?sort=latest&limit=3');
      if (response.ok) {
        const data = await response.json();
        console.log('直接获取失物招领数据:', data);
        
        // 直接使用响应数据
        if (data && data.list && Array.isArray(data.list)) {
          // 处理数据
          latestLostFound.value = data.list.map(item => {
            const processedItem = { ...item };
            
            // 处理图片字段
            if (processedItem.images) {
              if (typeof processedItem.images === 'string' && processedItem.images.startsWith('[')) {
                try {
                  processedItem.images = JSON.parse(processedItem.images);
                } catch (e) {
                  console.error('解析图片JSON失败:', e);
                  processedItem.images = [processedItem.images];
                }
              }
            }
            
            // 确保有imageUrl字段
            if (processedItem.images && Array.isArray(processedItem.images) && processedItem.images.length > 0) {
              processedItem.imageUrl = processedItem.images[0];
            } else if (processedItem.imageUrl) {
              // 已有imageUrl，不做处理
            } else {
              processedItem.imageUrl = 'https://via.placeholder.com/300';
            }
            
            // 确保类型字段存在
            if (!processedItem.type) {
              processedItem.type = 'lost'; // 默认为寻物启事
            }
            
            // 确保状态字段存在
            if (!processedItem.status) {
              processedItem.status = 'open'; // 默认为进行中
            }
            
            // 处理时间字段
            if (processedItem.createdAt && !processedItem.time) {
              processedItem.time = formatTime(new Date(processedItem.createdAt));
            } else if (!processedItem.time) {
              processedItem.time = '未知时间';
            }
            
            // 确保位置字段存在
            if (!processedItem.location) {
              processedItem.location = '未知位置';
            }
            
            // 确保发布者信息存在
            if (!processedItem.publisher && processedItem.publisherName) {
              processedItem.publisher = {
                id: processedItem.publisherId || 0,
                nickname: processedItem.publisherName || '未知用户',
                avatar: processedItem.publisherAvatar || ''
              };
            } else if (!processedItem.publisher) {
              processedItem.publisher = {
                id: 0,
                nickname: '未知用户',
                avatar: ''
              };
            }
            
            return processedItem;
          });
          
          console.log('处理后的失物招领数据:', latestLostFound.value);
        } else {
          console.error('失物招领数据格式异常:', data);
          latestLostFound.value = [];
        }
      } else {
        console.error('获取失物招领失败，HTTP状态:', response.status);
        latestLostFound.value = [];
      }
    } catch (error) {
      console.error('直接获取失物招领异常:', error);
      
      // 如果直接请求失败，回退到API模块
      const lostFoundRes = await api.lostFound.getLostFoundList({ sort: 'latest', limit: 3 });
      console.log('回退API响应:', lostFoundRes);
      
      if (lostFoundRes && lostFoundRes.code === 200 && lostFoundRes.data) {
        latestLostFound.value = lostFoundRes.data.list || [];
        console.log('最新失物招领数据:', latestLostFound.value);
      } else {
        console.error('失物招领数据异常:', lostFoundRes);
        latestLostFound.value = [];
      }
    }
    
    // 获取热门文章
    const articlesRes = await api.article.getArticleList({ sort: 'hot', limit: 3 });
    console.log('热门文章API响应:', articlesRes);
    
    if (articlesRes && articlesRes.code === 200 && articlesRes.data) {
      hotArticles.value = articlesRes.data.list || [];
      console.log('热门文章数据:', hotArticles.value);
    } else {
      console.error('热门文章数据异常:', articlesRes);
      hotArticles.value = [];
    }
  } catch (error) {
    console.error('获取首页数据失败:', error);
    // 出错时使用空数组
    hotProducts.value = [];
    latestLostFound.value = [];
    hotArticles.value = [];
    
    // 显示错误提示
    messageStore.showError('获取首页数据失败，请稍后重试');
  } finally {
    loadingStates.products = false;
    loadingStates.lostFound = false;
    loadingStates.articles = false;
  }
}

// 下拉刷新相关
const isRefreshing = ref(false)
const refreshDistance = ref(0)
const maxRefreshDistance = 80
const startY = ref(0)

// 处理下拉刷新
const handleTouchStart = (e) => {
  // 只在页面顶部才能下拉刷新
  if (window.scrollY > 0) return
  
  startY.value = e.touches[0].clientY
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

const handleTouchMove = (e) => {
  // 如果不是从顶部开始，则不处理
  if (window.scrollY > 0) return
  
  const currentY = e.touches[0].clientY
  const diff = currentY - startY.value
  
  // 只处理下拉操作
  if (diff <= 0) return
  
  // 阻止默认滚动行为
  e.preventDefault()
  
  // 计算拖动距离，添加阻尼效果
  refreshDistance.value = Math.min(maxRefreshDistance, diff * 0.5)
  
  // 更新状态
  isRefreshing.value = refreshDistance.value >= maxRefreshDistance
}

const handleTouchEnd = async () => {
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  
  // 如果拖动距离足够，触发刷新
  if (refreshDistance.value >= maxRefreshDistance) {
    // 显示刷新状态
    isRefreshing.value = true
    
    try {
      // 执行刷新操作
      await fetchHomeData()
      messageStore.showSuccess('刷新成功')
    } catch (error) {
      console.error('刷新失败:', error)
      messageStore.showError('刷新失败，请重试')
    } finally {
      // 延迟重置刷新状态，给用户视觉反馈
      setTimeout(() => {
        isRefreshing.value = false
        refreshDistance.value = 0
      }, 500)
    }
  } else {
    // 如果拖动距离不够，直接重置
    refreshDistance.value = 0
    isRefreshing.value = false
  }
}

// 刷新热门商品
const refreshHotProducts = async () => {
  loadingStates.products = true
  try {
    const hotProductsRes = await api.product.getProductList({ sort: 'hot', limit: 4 });
    console.log('重新加载热门商品:', hotProductsRes);
    
    if (hotProductsRes && hotProductsRes.code === 200 && hotProductsRes.data) {
      hotProducts.value = hotProductsRes.data.list || [];
      if (hotProducts.value.length > 0) {
        messageStore.showSuccess('商品加载成功');
      } else {
        messageStore.showInfo('暂无热门商品');
      }
    } else {
      console.error('重新加载热门商品失败:', hotProductsRes);
      messageStore.showError('加载失败，请重试');
    }
  } catch (error) {
    console.error('刷新热门商品异常:', error);
    messageStore.showError('网络异常，请重试');
  } finally {
    loadingStates.products = false
  }
}

// 刷新最新失物招领
const refreshLostFound = async () => {
  loadingStates.lostFound = true
  try {
    const lostFoundRes = await api.lostFound.getLostFoundList({ sort: 'latest', limit: 3 });
    console.log('重新加载最新失物招领:', lostFoundRes);
    
    if (lostFoundRes && lostFoundRes.code === 200 && lostFoundRes.data) {
      latestLostFound.value = lostFoundRes.data.list || [];
      if (latestLostFound.value.length > 0) {
        messageStore.showSuccess('最新失物招领加载成功');
      } else {
        messageStore.showInfo('暂无最新失物招领');
      }
    } else {
      console.error('重新加载最新失物招领失败:', lostFoundRes);
      messageStore.showError('加载失败，请重试');
    }
  } catch (error) {
    console.error('刷新最新失物招领异常:', error);
    messageStore.showError('网络异常，请重试');
  } finally {
    loadingStates.lostFound = false
  }
}

// 刷新热门文章
const refreshArticles = async () => {
  loadingStates.articles = true
  try {
    const articlesRes = await api.article.getArticleList({ sort: 'hot', limit: 3 });
    console.log('重新加载热门文章:', articlesRes);
    
    if (articlesRes && articlesRes.code === 200 && articlesRes.data) {
      hotArticles.value = articlesRes.data.list || [];
      if (hotArticles.value.length > 0) {
        messageStore.showSuccess('热门文章加载成功');
      } else {
        messageStore.showInfo('暂无热门文章');
      }
    } else {
      console.error('重新加载热门文章失败:', articlesRes);
      messageStore.showError('加载失败，请重试');
    }
  } catch (error) {
    console.error('刷新热门文章异常:', error);
    messageStore.showError('网络异常，请重试');
  } finally {
    loadingStates.articles = false
  }
}

// 导航到商品详情页
const goToProductDetail = (productId) => {
  console.log('导航到商品详情页:', productId);
  router.push(`/product/detail/${productId}`);
}

// 页面节点间导航处理
onBeforeRouteLeave((to, from) => {
  console.log('离开首页，目标页面:', to.path);
});

onMounted(async () => {
  console.log('Home页面加载，当前路径:', window.location.pathname);
  console.log('登录状态:', {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    isLoggedIn: localStorage.getItem('isLoggedIn')
  });
  
  // 获取首页数据
  await fetchHomeData();
  
  // 启动轮播图自动播放
  startBannerAutoPlay();

  // 启动时间更新
  updateTime(); // 立即更新一次
  timeInterval = setInterval(updateTime, 60000); // 每分钟更新一次

  // 添加下拉刷新事件监听
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
});

onBeforeUnmount(() => { 
  // 清除轮播定时器
  if (bannerTimer) {
    clearInterval(bannerTimer);
    bannerTimer = null;
  }
  
  // 清除时间更新定时器
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }

  // 移除下拉刷新事件监听
  document.removeEventListener('touchstart', handleTouchStart)
});
</script>

<style scoped>
/* 下拉刷新指示器 */
.refresh-indicator {
  width: 100%;
  height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  transition: height 0.3s ease;
}

.refresh-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
}

.refresh-spinner i {
  font-size: 24px;
  margin-bottom: 8px;
  transition: transform 0.2s ease-out;
}

.refresh-spinner span {
  font-size: 12px;
}

.refresh-indicator.active .refresh-spinner i {
  animation: spin 1s infinite linear;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>