<template>
  <div class="user-profile-page">
    <!-- 返回顶部按钮 -->
    <BackToTop />

    <!-- 用户信息头部 -->
    <section class="user-info-header">
      <div class="user-header-wrapper" ref="headerRef">
        <div class="user-header-bg" :style="{backgroundImage: `url(${getSafeImageUrl(userInfo.backgroundImage, defaultBgImage)})`}"></div>
        <div class="header-content">
          <div class="avatar-wrapper">
            <img :src="getSafeImageUrl(userInfo.avatar, defaultAvatar)" alt="用户头像" class="user-avatar" @error="e => e.target.src = defaultAvatar" />
            <div v-if="isCurrentUser" class="edit-avatar" @click="handleEditAvatar">
              <i class="material-icons">photo_camera</i>
            </div>
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ userInfo.nickname || userInfo.username || '未知用户' }}</h2>
            <p class="user-id">ID: {{ userInfo.id || userId }}</p>
            <p v-if="userInfo.school" class="user-school">{{ userInfo.school }}</p>
            <p v-if="userInfo.bio" class="user-bio">{{ userInfo.bio }}</p>
            <p v-if="!userInfo.id && !userInfo.username" class="user-id">数据加载中...</p>
            <p v-if="isDebugMode" class="debug-info">
              路径: {{ route.path }}<br>
              ID参数: {{ route.params.id || route.query.id || '无' }}<br>
              当前用户模式: {{ isCurrentUser ? '是' : '否' }}<br>
              数据ID: {{ userInfo.id || '无' }}
            </p>
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
        <div class="stat-number">{{ userInfo.articleCount || 0 }}</div>
        <div class="stat-label">文章</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ userInfo.productCount || 0 }}</div>
        <div class="stat-label">商品</div>
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

    <!-- 调试面板 -->
    <div v-if="isDebugMode" class="debug-panel">
      <h4>调试面板</h4>
      <div class="debug-controls">
        <button @click="forceReloadData" class="debug-btn">重新加载数据</button>
        <button @click="logCurrentState" class="debug-btn">输出当前状态</button>
        <button @click="toggleDebugMode" class="debug-btn">{{ isDebugMode ? '关闭' : '开启' }}调试模式</button>
        <button v-if="isDebugMode" @click="useMockData" class="debug-btn mock-data-btn">
          使用模拟数据
        </button>
        <button v-if="isDebugMode" @click="showRawApiData" class="debug-btn api-data-btn">
          显示原始API数据
        </button>
      </div>
      <div class="debug-data">
        <p>路径: {{ route.path }}</p>
        <p>用户ID: {{ userId }}</p>
        <p>当前用户: {{ isCurrentUser ? '是' : '否' }}</p>
        <p>用户数据: {{ userInfo.id ? '已加载' : '未加载' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToTop from '@/components/common/BackToTop.vue'
import ArticleItem from '@/components/article/ArticleItem.vue'
import ProductItem from '@/components/product/ProductItem.vue'
import LostFoundItem from '@/components/lostFound/LostFoundItem.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FooterNavigation from '@/components/common/FooterNavigation.vue'
import UploadDialog from '@/components/dialog/UploadDialog.vue'
import UserEditDialog from '@/components/dialog/UserEditDialog.vue'
import Toast from '@/components/common/Toast.vue'
import { getUserProfile, followUser, unfollowUser, uploadAvatar, updateUserInfo, getUserInfo } from '@/api/user'
import { getUserArticles, getFavoriteArticles } from '@/api/article'
import { getUserProducts, getFavoriteProducts } from '@/api/product'
import { getUserLostFound } from '@/api/lostFound'
import { getConversationDetail } from '@/api/chat'
import { useUserStore } from '@/store/user'
import { getSafeImageUrl, DEFAULT_AVATAR, DEFAULT_BACKGROUND } from '@/utils/defaultImages'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = ref(null)
const headerRef = ref(null)

// 判断是否为个人主页路径
const isPersonalProfileRoute = computed(() => {
  return route.path === '/user/profile' || route.path === '/user/me';
});

// 当前用户ID
const userId = computed(() => {
  // 如果路由是/user/profile或/user/me，始终显示自己的资料
  if (isPersonalProfileRoute.value) {
    console.log('当前页面为个人主页，使用当前登录用户ID');
    return userStore.userInfo?.id || localStorage.getItem('userId');
  }
  
  // 如果路由是/user/:id，显示指定用户的资料
  if (route.params.id) {
    console.log('当前页面为用户主页，使用路由参数ID:', route.params.id);
    return route.params.id;
  }
  
  // 兼容旧版路由查询参数方式
  if (route.query.id) {
    console.log('当前页面使用查询参数ID:', route.query.id);
    return route.query.id;
  }
  
  console.log('无法确定要显示的用户ID，尝试使用当前登录用户');
  // 如果都没有，尝试显示当前登录用户
  return userStore.userInfo?.id || localStorage.getItem('userId');
});

// 判断是否为当前用户的资料页
const isCurrentUser = computed(() => {
  // 如果路由是/user/profile或/user/me，强制视为当前用户
  if (isPersonalProfileRoute.value) {
    console.log('当前页面是个人主页，设置为当前用户模式');
    return true;
  }
  
  if (!userStore.userInfo?.id || !userId.value) {
    console.log('无法判断是否为当前用户（用户未登录或ID未知）');
    return false;
  }
  
  const isCurrent = String(userStore.userInfo.id) === String(userId.value);
  console.log('当前页面用户ID比较结果:', {
    storeId: userStore.userInfo.id,
    pageId: userId.value,
    isCurrent
  });
  
  return isCurrent;
});

// 用户信息
const userInfo = ref({})
const defaultBgImage = DEFAULT_BACKGROUND
const defaultAvatar = DEFAULT_AVATAR

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

// 调试模式
const isDebugMode = ref(true)

// 添加保存原始API数据的变量
const rawApiData = ref(null);

// 获取用户信息
const fetchUserProfile = async () => {
  try {
    console.log('获取用户信息，当前状态:', {
      routePath: route.path,
      isPersonalRoute: isPersonalProfileRoute.value,
      routeParams: route.params,
      routeQuery: route.query,
      storeUserId: userStore.userInfo?.id,
      computedUserId: userId.value,
      isCurrentUser: isCurrentUser.value,
      isToastReady: !!toast.value
    });
    
    // 确保Toast组件已初始化
    await nextTick();
    if (!toast.value) {
      console.warn('Toast组件未初始化，等待组件挂载');
      // 使用setTimeout给Vue一点时间进行渲染
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 检查用户ID
    if (!userId.value) {
      console.error('未找到有效的userId，无法获取用户资料');
      if (toast.value) {
        toast.value.show('无法获取用户信息', 'error');
      } else {
        console.error('Toast组件仍未初始化，使用alert代替');
        alert('无法获取用户信息');
      }
      
      if (isPersonalProfileRoute.value) {
        console.log('个人主页无法获取ID，重定向到登录页');
        router.replace('/login');
      }
      return;
    }
    
    // 严格区分API调用
    let res;
    
    if (isPersonalProfileRoute.value || isCurrentUser.value) {
      // 当前用户：使用getUserInfo API，不需要传递ID
      console.log('获取当前用户个人资料 - 调用/api/user/info');
      res = await getUserInfo();
      console.log('API返回原始数据:', JSON.stringify(res));
    } else {
      // 其他用户：使用getUserProfile API，需要传递ID
      console.log(`获取其他用户资料 - 调用/api/user/profile/${userId.value}`);
      res = await getUserProfile(userId.value);
      console.log('API返回原始数据:', JSON.stringify(res));
    }
    
    if (res && res.code === 200 && res.data) {
      console.log('成功获取用户资料:', JSON.stringify(res.data));
      
      // 保存原始API数据用于调试
      rawApiData.value = res.data;
      
      // 确保核心字段存在并使用安全的图片URL处理
      const userData = {
        ...res.data,
        // 确保有ID
        id: res.data.id || res.data.userId || userId.value,
        // 确保有显示名
        username: res.data.username || '用户' + userId.value,
        nickname: res.data.nickname || res.data.username || '用户' + userId.value,
        // 确保有头像和背景图（使用备用图）
        avatar: getSafeImageUrl(res.data.avatar, defaultAvatar),
        backgroundImage: getSafeImageUrl(res.data.backgroundImage, defaultBgImage),
        // 确保有基本信息字段
        bio: res.data.bio || '',
        school: res.data.school || '',
        // 处理计数字段（避免null或undefined）
        followingCount: res.data.followingCount || 0,
        followerCount: res.data.followerCount || res.data.followersCount || 0,
        likeCount: res.data.likeCount || 0,
        // 关注状态
        isFollowing: res.data.isFollowing || false,
        // 内容计数
        productCount: res.data.productCount || 0,
        articleCount: res.data.articleCount || 0,
        lostFoundCount: res.data.lostFoundCount || 0
      };
      
      // 更新用户信息
      userInfo.value = userData;
      
      if (isDebugMode.value) {
        console.log('处理后的用户数据:', JSON.stringify(userData));
      }
      
      // 如果是当前用户，同步更新Pinia store
      if (isCurrentUser.value) {
        console.log('更新当前用户Pinia状态...');
        userStore.updateUserInfo(userData);
      }
      
      // 设置页面标题
      document.title = isPersonalProfileRoute.value 
        ? '个人主页' 
        : `${userData.nickname || userData.username || '用户'}的主页`;
    } else {
      console.error('获取用户资料失败:', res);
      // 安全地显示错误信息
      if (toast.value) {
        toast.value.show('获取用户信息失败: ' + (res?.message || '服务器错误'), 'error');
      } else {
        console.error('Toast组件未初始化');
        alert('获取用户信息失败: ' + (res?.message || '服务器错误'));
      }
    }
  } catch (error) {
    console.error('获取用户信息异常:', error);
    // 安全地显示错误信息
    if (toast.value) {
      toast.value.show('获取用户信息失败: ' + (error.message || '未知错误'), 'error');
    } else {
      console.error('Toast组件未初始化');
      alert('获取用户信息失败: ' + (error.message || '未知错误'));
    }
  }
}

// 获取用户文章
const fetchUserArticles = async (isLoadMore = false) => {
  try {
    if (!userId.value) return
    
    loading.value = true
    const page = isLoadMore ? pageInfo.value.articles.page + 1 : 1
    
    const res = await getUserArticles({
      userId: userId.value, 
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
    
    const res = await getUserProducts({
      userId: userId.value,
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
    
    const res = await getUserLostFound({
      userId: userId.value,
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
    if (!userStore.userInfo) {
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
    if (!userStore.userInfo) {
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

// 监听整个路由对象变化，确保捕获所有路由变化
watch(() => route.fullPath, async (newPath, oldPath) => {
  console.log('路由完整路径变化:', {
    newPath, 
    oldPath,
    params: route.params,
    query: route.query
  });
  
    // 重置数据
    userArticles.value = []
    userProducts.value = []
    userLostFound.value = []
    favoriteArticles.value = []
    favoriteProducts.value = []
    
  // 确保Toast组件已初始化
  await nextTick();
  
  try {
    // 重新加载数据
    await fetchUserProfile();
    
    // 如果成功获取了用户资料，再加载文章等内容
    if (userInfo.value && userInfo.value.id) {
      await fetchUserArticles();
    }
  } catch (error) {
    console.error('路由变化时加载数据失败:', error);
  }
}, { immediate: true });

// 监听用户登录状态，确保用户信息更新时重新加载数据
watch(() => userStore.userInfo?.id, async (newUserId, oldUserId) => {
  console.log('用户信息ID变化:', newUserId, oldUserId);
  
  // 如果是在个人主页路径且用户ID变化，则重新加载资料
  if ((route.path === '/user/profile' || route.path === '/user/me') && newUserId !== oldUserId) {
    console.log('个人主页检测到用户ID变化，重新加载资料');
    
    // 确保Toast组件已初始化
    await nextTick();
    
    try {
      await fetchUserProfile();
      
      // 如果成功获取了用户资料，再加载文章等内容
      if (userInfo.value && userInfo.value.id) {
        await fetchUserArticles();
      }
    } catch (error) {
      console.error('用户ID变化时加载数据失败:', error);
    }
  }
}, { immediate: true });

// 调试功能
const forceReloadData = async () => {
  toast.value.show('正在重新加载数据...', 'info');
  
  // 重置数据
  userInfo.value = {};
  userArticles.value = [];
  userProducts.value = [];
  userLostFound.value = [];
  
  // 重新加载
  await nextTick();
  await fetchUserProfile();
  await fetchUserArticles();
}

const logCurrentState = () => {
  console.log('当前状态:', {
    route: {
      path: route.path,
      params: route.params,
      query: route.query
    },
    user: {
      storeInfo: userStore.userInfo,
      computedId: userId.value,
      isCurrentUser: isCurrentUser.value,
      displayInfo: userInfo.value
    },
    data: {
      articles: userArticles.value.length,
      products: userProducts.value.length,
      lostFound: userLostFound.value.length
    }
  });
  
  toast.value.show('状态已输出到控制台', 'info');
}

const toggleDebugMode = () => {
  isDebugMode.value = !isDebugMode.value;
  toast.value.show(`调试模式已${isDebugMode.value ? '开启' : '关闭'}`, 'info');
}

// 添加模拟数据功能
const useMockData = () => {
  toast.value.show('正在加载模拟数据...', 'info');
  
  // 模拟用户数据
  const mockUserData = {
    id: userId.value || 1001,
    username: 'mockuser',
    nickname: '模拟用户',
    avatar: 'https://img01.yzcdn.cn/vant/cat.jpeg',
    backgroundImage: 'https://img01.yzcdn.cn/vant/cat-2.jpeg',
    bio: '这是一个模拟的用户简介，用于测试界面显示效果。',
    school: '模拟大学',
    followerCount: 458,
    followingCount: 253,
    likeCount: 1024,
    isFollowing: false
  };
  
  // 设置模拟数据
  userInfo.value = mockUserData;
  
  // 模拟文章数据
  userArticles.value = Array(5).fill(null).map((_, index) => ({
    id: 10000 + index,
    title: `模拟文章标题 ${index + 1}`,
    content: `这是模拟文章内容，用于测试界面显示效果。这是文章 ${index + 1}`,
    coverImage: index % 2 === 0 ? 'https://img01.yzcdn.cn/vant/cat.jpeg' : '',
    createTime: new Date(Date.now() - index * 86400000).toISOString(),
    viewCount: Math.floor(Math.random() * 1000),
    likeCount: Math.floor(Math.random() * 100),
    commentCount: Math.floor(Math.random() * 50),
    user: {
      id: mockUserData.id,
      nickname: mockUserData.nickname,
      avatar: mockUserData.avatar
    }
  }));
  
  // 设置模拟分页信息
  pageInfo.value.articles = {
    page: 1,
    limit: 10,
    total: 5,
    hasMore: false
  };
  
  toast.value.show('已加载模拟数据', 'success');
}

// 添加显示原始API数据的函数
const showRawApiData = () => {
  if (rawApiData.value) {
    console.log('原始API数据:', rawApiData.value);
    alert(JSON.stringify(rawApiData.value, null, 2));
  } else {
    toast.value.show('暂无原始API数据', 'info');
  }
};

onMounted(async () => {
  console.log('Profile页面加载，路由信息:', {
    path: route.path,
    isPersonalRoute: isPersonalProfileRoute.value,
    params: route.params,
    query: route.query
  });
  console.log('从store获取的用户信息:', userStore.userInfo);
  console.log('计算得到的userId:', userId.value);
  console.log('是否为当前用户:', isCurrentUser.value);
  console.log('Toast组件状态:', toast.value ? '已初始化' : '未初始化');
  
  // 确保组件挂载完成后再获取数据
  await nextTick();
  
  // 处理路由异常情况
  if (isPersonalProfileRoute.value && !userStore.token) {
    console.log('访问个人主页但未登录，重定向到登录页');
    router.replace('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  
  // 如果是/user/:id路由但ID是当前用户，重定向到/mine
  if (route.params.id && userStore.userInfo?.id && 
      String(route.params.id) === String(userStore.userInfo.id)) {
    console.log('检测到访问自己的用户主页，重定向到个人中心');
    router.replace('/mine');
    return;
  }
  
  // 如果是访问个人主页，也重定向到/mine
  if (isPersonalProfileRoute.value) {
    console.log('访问个人主页，重定向到个人中心');
    router.replace('/mine');
    return;
  }
  
  // 到这里，只处理查看其他用户资料的情况
  try {
    await fetchUserProfile();
    
    // 如果成功获取了用户资料，再加载文章等内容
    if (userInfo.value && userInfo.value.id) {
      await fetchUserArticles();
    }
  } catch (error) {
    console.error('加载用户资料失败:', error);
  }
  
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
});
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
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0));
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
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

.debug-info {
  margin-top: 5px;
  font-size: 0.8rem;
  color: #ff5722;
  background: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 4px;
}

.debug-panel {
  margin: 20px 10px;
  padding: 10px;
  border: 1px dashed #ff5722;
  border-radius: 8px;
  background: rgba(255, 87, 34, 0.1);
}

.debug-panel h4 {
  margin: 0 0 10px;
  color: #ff5722;
}

.debug-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.debug-btn {
  padding: 6px 12px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.debug-data {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.7);
  padding: 8px;
  border-radius: 4px;
}

.debug-data p {
  margin: 3px 0;
}

.mock-data-btn {
  background-color: #1e88e5;
  color: white;
}

.api-data-btn {
  background-color: #9c27b0;
  color: white;
}
</style>