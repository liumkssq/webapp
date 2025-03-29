<template>
  <div class="user-profile-page">
    <!-- 返回顶部按钮 -->
    <BackToTop />

    <!-- 用户信息头部 -->
    <section class="user-info-header">
      <div class="user-header-wrapper" ref="headerRef">
        <div class="user-header-bg" :style="{backgroundImage: `url(${userInfo.backgroundImage || defaultBgImage})`}"></div>
        <div class="header-content">
          <div class="avatar-wrapper">
            <img :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
            <div v-if="isCurrentUser" class="edit-avatar" @click="handleEditAvatar">
              <i class="material-icons">photo_camera</i>
            </div>
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ userInfo.nickname || userInfo.username }}</h2>
            <p class="user-id">ID: {{ userInfo.id }}</p>
            <p v-if="userInfo.school" class="user-school">{{ userInfo.school }}</p>
            <p v-if="userInfo.bio" class="user-bio">{{ userInfo.bio }}</p>
          </div>
          <div class="actions">
            <template v-if="isCurrentUser">
              <button class="edit-profile-btn" @click="handleEditProfile">
                <i class="material-icons">edit</i>
                <span>编辑资料</span>
              </button>
            </template>
            <template v-else>
              <button 
                class="follow-btn" 
                :class="{ 'is-following': userInfo.isFollowing }"
                @click="handleFollowUser"
              >
                <i class="material-icons">{{ userInfo.isFollowing ? 'how_to_reg' : 'person_add' }}</i>
                <span>{{ userInfo.isFollowing ? '已关注' : '关注' }}</span>
              </button>
              <button class="message-btn" @click="handleStartChat">
                <i class="material-icons">chat</i>
                <span>私信</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- 用户统计数据 -->
    <section class="user-stats">
      <div class="stat-item" @click="navigateTo('/user/following', {userId: userInfo.id})">
        <div class="stat-number">{{ userInfo.followingCount || 0 }}</div>
        <div class="stat-label">关注</div>
      </div>
      <div class="stat-item" @click="navigateTo('/user/followers', {userId: userInfo.id})">
        <div class="stat-number">{{ userInfo.followerCount || 0 }}</div>
        <div class="stat-label">粉丝</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ userInfo.likeCount || 0 }}</div>
        <div class="stat-label">获赞</div>
      </div>
    </section>

    <!-- 内容选项卡 -->
    <section class="content-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
    </section>

    <!-- 内容区域 -->
    <section class="content-area">
      <!-- 文章列表 -->
      <div v-if="activeTab === 'articles'" class="content-list articles-list">
        <template v-if="userArticles.length">
          <ArticleItem
            v-for="article in userArticles"
            :key="article.id"
            :article="article"
            @click="navigateTo('/article/detail', {id: article.id})"
          />
        </template>
        <EmptyState v-else text="暂无文章" />
      </div>

      <!-- 商品列表 -->
      <div v-if="activeTab === 'products'" class="content-list products-list">
        <template v-if="userProducts.length">
          <ProductItem
            v-for="product in userProducts"
            :key="product.id"
            :product="product"
            @click="navigateTo('/product/detail', {id: product.id})"
          />
        </template>
        <EmptyState v-else text="暂无商品" />
      </div>

      <!-- 失物招领列表 -->
      <div v-if="activeTab === 'lostFound'" class="content-list lost-found-list">
        <template v-if="userLostFound.length">
          <LostFoundItem
            v-for="item in userLostFound"
            :key="item.id"
            :item="item"
            @click="navigateTo('/lost-found/detail', {id: item.id})"
          />
        </template>
        <EmptyState v-else text="暂无失物招领" />
      </div>

      <!-- 收藏列表 -->
      <div v-if="activeTab === 'favorites'" class="content-list favorites-list">
        <div class="favorites-tabs">
          <div 
            v-for="tab in favoriteTabs" 
            :key="tab.id"
            class="favorite-tab-item"
            :class="{ active: activeFavoriteTab === tab.id }"
            @click="activeFavoriteTab = tab.id"
          >
            {{ tab.label }}
          </div>
        </div>

        <!-- 收藏的文章 -->
        <div v-if="activeFavoriteTab === 'favoriteArticles'" class="favorite-content-list">
          <template v-if="favoriteArticles.length">
            <ArticleItem
              v-for="article in favoriteArticles"
              :key="article.id"
              :article="article"
              @click="navigateTo('/article/detail', {id: article.id})"
            />
          </template>
          <EmptyState v-else text="暂无收藏的文章" />
        </div>

        <!-- 收藏的商品 -->
        <div v-if="activeFavoriteTab === 'favoriteProducts'" class="favorite-content-list">
          <template v-if="favoriteProducts.length">
            <ProductItem
              v-for="product in favoriteProducts"
              :key="product.id"
              :product="product"
              @click="navigateTo('/product/detail', {id: product.id})"
            />
          </template>
          <EmptyState v-else text="暂无收藏的商品" />
        </div>
      </div>
    </section>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more" @click="loadMore">
      <span v-if="!loading">加载更多</span>
      <div v-else class="loading-spinner"></div>
    </div>

    <!-- 底部导航栏 -->
    <FooterNavigation />

    <!-- 上传头像弹窗 -->
    <UploadDialog
      v-if="showUploadDialog"
      title="上传头像"
      :aspect-ratio="1"
      @close="showUploadDialog = false"
      @upload="handleUploadAvatar"
    />

    <!-- 编辑资料弹窗 -->
    <UserEditDialog
      v-if="showEditDialog"
      :user-info="userInfo"
      @close="showEditDialog = false"
      @save="handleSaveProfile"
    />

    <!-- 消息提示 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToTop from '../components/common/BackToTop.vue'
import ArticleItem from '../components/article/ArticleItem.vue'
import ProductItem from '../components/product/ProductItem.vue'
import LostFoundItem from '../components/lostFound/LostFoundItem.vue'
import EmptyState from '../components/common/EmptyState.vue'
import FooterNavigation from '../components/common/FooterNavigation.vue'
import UploadDialog from '../components/dialog/UploadDialog.vue'
import UserEditDialog from '../components/dialog/UserEditDialog.vue'
import Toast from '../components/common/Toast.vue'
import { getUserProfile, followUser, unfollowUser, uploadAvatar, updateUserInfo } from '../api/user'
import { getUserArticles } from '../api/article'
import { getUserProducts, getFavoriteProducts } from '../api/product'
import { getUserLostFound } from '../api/lostFound'
import { getConversationDetail } from '../api/chat'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = ref(null)
const headerRef = ref(null)

// 当前用户ID
const userId = computed(() => route.query.id || userStore.currentUser?.id)
const isCurrentUser = computed(() => 
  userStore.currentUser && Number(userId.value) === Number(userStore.currentUser.id)
)

// 用户信息
const userInfo = ref({})
const defaultBgImage = '/images/default-bg.jpg'

// 选项卡状态
const activeTab = ref('articles')
const tabs = [
  { id: 'articles', label: '文章' },
  { id: 'products', label: '商品' },
  { id: 'lostFound', label: '失物招领' },
  { id: 'favorites', label: '收藏' }
]

// 收藏选项卡状态
const activeFavoriteTab = ref('favoriteArticles')
const favoriteTabs = [
  { id: 'favoriteArticles', label: '文章' },
  { id: 'favoriteProducts', label: '商品' }
]

// 各类内容列表
const userArticles = ref([])
const userProducts = ref([])
const userLostFound = ref([])
const favoriteArticles = ref([])
const favoriteProducts = ref([])

// 分页加载状态
const pageInfo = ref({
  articles: { page: 1, limit: 10, total: 0, hasMore: false },
  products: { page: 1, limit: 10, total: 0, hasMore: false },
  lostFound: { page: 1, limit: 10, total: 0, hasMore: false },
  favoriteArticles: { page: 1, limit: 10, total: 0, hasMore: false },
  favoriteProducts: { page: 1, limit: 10, total: 0, hasMore: false }
})
const loading = ref(false)
const hasMore = computed(() => {
  switch (activeTab.value) {
    case 'articles':
      return pageInfo.value.articles.hasMore
    case 'products':
      return pageInfo.value.products.hasMore
    case 'lostFound':
      return pageInfo.value.lostFound.hasMore
    case 'favorites':
      return activeFavoriteTab.value === 'favoriteArticles' 
        ? pageInfo.value.favoriteArticles.hasMore 
        : pageInfo.value.favoriteProducts.hasMore
    default:
      return false
  }
})

// 弹窗控制
const showUploadDialog = ref(false)
const showEditDialog = ref(false)

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    if (!userId.value) return
    
    const res = await getUserProfile(userId.value)
    if (res.data) {
      userInfo.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    toast.value.show('获取用户信息失败', 'error')
  }
}

// 获取用户文章
const fetchUserArticles = async (isLoadMore = false) => {
  try {
    if (!userId.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.articles.page + 1 : 1
    
    const res = await getUserArticles(userId.value, {
      page,
      limit: pageInfo.value.articles.limit
    })
    
    if (res.data) {
      if (isLoadMore) {
        userArticles.value = [...userArticles.value, ...res.data.list]
      } else {
        userArticles.value = res.data.list
      }
      
      pageInfo.value.articles = {
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        hasMore: res.data.hasMore
      }
    }
  } catch (error) {
    console.error('获取用户文章失败:', error)
    toast.value.show('获取用户文章失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取用户商品
const fetchUserProducts = async (isLoadMore = false) => {
  try {
    if (!userId.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.products.page + 1 : 1
    
    const res = await getUserProducts(userId.value, {
      page,
      limit: pageInfo.value.products.limit
    })
    
    if (res.data) {
      if (isLoadMore) {
        userProducts.value = [...userProducts.value, ...res.data.list]
      } else {
        userProducts.value = res.data.list
      }
      
      pageInfo.value.products = {
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        hasMore: res.data.hasMore
      }
    }
  } catch (error) {
    console.error('获取用户商品失败:', error)
    toast.value.show('获取用户商品失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取用户失物招领
const fetchUserLostFound = async (isLoadMore = false) => {
  try {
    if (!userId.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.lostFound.page + 1 : 1
    
    const res = await getUserLostFound(userId.value, {
      page,
      limit: pageInfo.value.lostFound.limit
    })
    
    if (res.data) {
      if (isLoadMore) {
        userLostFound.value = [...userLostFound.value, ...res.data.list]
      } else {
        userLostFound.value = res.data.list
      }
      
      pageInfo.value.lostFound = {
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        hasMore: res.data.hasMore
      }
    }
  } catch (error) {
    console.error('获取用户失物招领失败:', error)
    toast.value.show('获取用户失物招领失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取收藏的文章
const fetchFavoriteArticles = async (isLoadMore = false) => {
  try {
    if (!isCurrentUser.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.favoriteArticles.page + 1 : 1
    
    // 假设API提供了获取收藏文章的方法
    const res = await getFavoriteArticles({
      page,
      limit: pageInfo.value.favoriteArticles.limit
    })
    
    if (res.data) {
      if (isLoadMore) {
        favoriteArticles.value = [...favoriteArticles.value, ...res.data.list]
      } else {
        favoriteArticles.value = res.data.list
      }
      
      pageInfo.value.favoriteArticles = {
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        hasMore: res.data.hasMore
      }
    }
  } catch (error) {
    console.error('获取收藏文章失败:', error)
    toast.value.show('获取收藏文章失败', 'error')
  } finally {
    loading.value = false
  }
}

// 获取收藏的商品
const fetchFavoriteProducts = async (isLoadMore = false) => {
  try {
    if (!isCurrentUser.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.favoriteProducts.page + 1 : 1
    
    const res = await getFavoriteProducts({
      page,
      limit: pageInfo.value.favoriteProducts.limit
    })
    
    if (res.data) {
      if (isLoadMore) {
        favoriteProducts.value = [...favoriteProducts.value, ...res.data.list]
      } else {
        favoriteProducts.value = res.data.list
      }
      
      pageInfo.value.favoriteProducts = {
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        hasMore: res.data.hasMore
      }
    }
  } catch (error) {
    console.error('获取收藏商品失败:', error)
    toast.value.show('获取收藏商品失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loading.value) return
  
  switch (activeTab.value) {
    case 'articles':
      await fetchUserArticles(true)
      break
    case 'products':
      await fetchUserProducts(true)
      break
    case 'lostFound':
      await fetchUserLostFound(true)
      break
    case 'favorites':
      if (activeFavoriteTab.value === 'favoriteArticles') {
        await fetchFavoriteArticles(true)
      } else {
        await fetchFavoriteProducts(true)
      }
      break
  }
}

// 关注/取消关注用户
const handleFollowUser = async () => {
  try {
    if (!userStore.currentUser) {
      router.push('/login')
      return
    }
    
    if (userInfo.value.isFollowing) {
      await unfollowUser(userId.value)
      userInfo.value.isFollowing = false
      userInfo.value.followerCount = Math.max(0, userInfo.value.followerCount - 1)
      toast.value.show('已取消关注', 'success')
    } else {
      await followUser(userId.value)
      userInfo.value.isFollowing = true
      userInfo.value.followerCount = (userInfo.value.followerCount || 0) + 1
      toast.value.show('关注成功', 'success')
    }
  } catch (error) {
    console.error('操作失败:', error)
    toast.value.show('操作失败', 'error')
  }
}

// 开始私信
const handleStartChat = async () => {
  try {
    if (!userStore.currentUser) {
      router.push('/login')
      return
    }
    
    // 获取会话详情
    await getConversationDetail(userId.value)
    router.push(`/chat/conversation?userId=${userId.value}`)
  } catch (error) {
    console.error('进入私信页面失败:', error)
    toast.value.show('进入私信页面失败', 'error')
  }
}

// 编辑头像
const handleEditAvatar = () => {
  showUploadDialog.value = true
}

// 上传头像
const handleUploadAvatar = async (file) => {
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const res = await uploadAvatar(formData)
    
    if (res.data) {
      userInfo.value.avatar = res.data.url
      userStore.updateUserInfo({ avatar: res.data.url })
      showUploadDialog.value = false
      toast.value.show('头像上传成功', 'success')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    toast.value.show('头像上传失败', 'error')
  }
}

// 编辑个人资料
const handleEditProfile = () => {
  showEditDialog.value = true
}

// 保存个人资料
const handleSaveProfile = async (updatedInfo) => {
  try {
    const res = await updateUserInfo(updatedInfo)
    
    if (res.data) {
      Object.assign(userInfo.value, updatedInfo)
      userStore.updateUserInfo(updatedInfo)
      showEditDialog.value = false
      toast.value.show('资料更新成功', 'success')
    }
  } catch (error) {
    console.error('资料更新失败:', error)
    toast.value.show('资料更新失败', 'error')
  }
}

// 页面导航
const navigateTo = (path, query = {}) => {
  router.push({ path, query })
}

// 监听选项卡变化
watch(activeTab, (newTab, oldTab) => {
  if (newTab === oldTab) return
  
  switch (newTab) {
    case 'articles':
      if (userArticles.value.length === 0) {
        fetchUserArticles()
      }
      break
    case 'products':
      if (userProducts.value.length === 0) {
        fetchUserProducts()
      }
      break
    case 'lostFound':
      if (userLostFound.value.length === 0) {
        fetchUserLostFound()
      }
      break
    case 'favorites':
      if (activeFavoriteTab.value === 'favoriteArticles' && favoriteArticles.value.length === 0) {
        fetchFavoriteArticles()
      } else if (activeFavoriteTab.value === 'favoriteProducts' && favoriteProducts.value.length === 0) {
        fetchFavoriteProducts()
      }
      break
  }
})

// 监听收藏选项卡变化
watch(activeFavoriteTab, (newTab, oldTab) => {
  if (newTab === oldTab) return
  
  if (newTab === 'favoriteArticles' && favoriteArticles.value.length === 0) {
    fetchFavoriteArticles()
  } else if (newTab === 'favoriteProducts' && favoriteProducts.value.length === 0) {
    fetchFavoriteProducts()
  }
})

// 监听路由参数变化
watch(() => route.query.id, (newId, oldId) => {
  if (newId !== oldId) {
    // 重置数据
    userArticles.value = []
    userProducts.value = []
    userLostFound.value = []
    favoriteArticles.value = []
    favoriteProducts.value = []
    
    // 重新加载数据
    fetchUserProfile()
    fetchUserArticles()
  }
}, { immediate: true })

onMounted(async () => {
  await fetchUserProfile()
  await fetchUserArticles()
  
  // 实现滚动渐变效果
  const handleScroll = () => {
    if (!headerRef.value) return
    
    const scrollTop = window.scrollY
    const headerHeight = headerRef.value.offsetHeight
    const opacity = Math.min(scrollTop / headerHeight, 1)
    
    headerRef.value.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`
    
    if (scrollTop > headerHeight / 2) {
      headerRef.value.classList.add('header-shadow')
    } else {
      headerRef.value.classList.remove('header-shadow')
    }
  }
  
  window.addEventListener('scroll', handleScroll)
  
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* 这里只保留最基本的样式结构，详细样式可以根据需要补充 */
.user-profile-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

.user-info-header {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.user-header-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: background-color 0.3s;
}

.user-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(2px);
}

.header-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100%;
  z-index: 1;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 10px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
}

.edit-avatar {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-info {
  text-align: center;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.user-name {
  font-size: 1.5rem;
  margin: 0 0 5px;
}

.user-id, .user-school, .user-bio {
  margin: 2px 0;
  font-size: 0.9rem;
}

.actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.edit-profile-btn, .follow-btn, .message-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.edit-profile-btn {
  background-color: #f0f0f0;
  color: #333;
}

.follow-btn {
  background-color: #1e88e5;
  color: white;
}

.follow-btn.is-following {
  background-color: #f0f0f0;
  color: #333;
}

.message-btn {
  background-color: #f0f0f0;
  color: #333;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-number {
  font-size: 1.2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.content-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 0.9rem;
  cursor: pointer;
}

.tab-item.active {
  color: #1e88e5;
  border-bottom: 2px solid #1e88e5;
}

.content-area {
  padding: 10px;
}

.content-list {
  min-height: 200px;
}

.favorites-tabs {
  display: flex;
  margin-bottom: 10px;
}

.favorite-tab-item {
  padding: 8px 15px;
  margin-right: 10px;
  border-radius: 15px;
  font-size: 0.85rem;
  background-color: #f0f0f0;
  cursor: pointer;
}

.favorite-tab-item.active {
  background-color: #1e88e5;
  color: white;
}

.load-more {
  text-align: center;
  padding: 15px;
  color: #666;
  cursor: pointer;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #1e88e5;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.header-shadow {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>