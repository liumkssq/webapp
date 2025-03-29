<template>
  <div class="product-detail-container">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">商品详情</div>
      <div class="share-btn">
        <i class="icon-share"></i>
      </div>
    </div>
    
    <!-- 商品轮播图 -->
    <div class="product-swiper">
      <div class="swiper-container">
        <div class="swiper-slide" v-for="(image, index) in product.images" :key="index">
          <img :src="image" :alt="`商品图片${index + 1}`">
        </div>
      </div>
      <div class="swiper-pagination"></div>
    </div>
    
    <!-- 商品基本信息 -->
    <div class="product-info">
      <div class="product-price">
        <span class="current-price">¥{{ product.price }}</span>
        <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
      </div>
      
      <h1 class="product-title">{{ product.title }}</h1>
      
      <div class="product-tags">
        <span class="tag" v-for="(tag, index) in product.tags" :key="index">{{ tag }}</span>
      </div>
      
      <div class="product-meta">
        <span class="product-condition">{{ product.condition }}</span>
        <span class="views">{{ product.views }} 浏览</span>
        <span class="favorites">{{ product.favorites }} 收藏</span>
      </div>
    </div>
    
    <!-- 卖家信息 -->
    <div class="seller-info" @click="goToSellerProfile">
      <div class="seller-avatar">
        <img :src="product.seller?.avatar" :alt="product.seller?.name">
      </div>
      <div class="seller-detail">
        <div class="seller-name">{{ product.seller?.name }}</div>
        <div class="seller-rating">
          <span class="rating-stars">
            <i class="star-icon" v-for="i in 5" :key="i" :class="{ 'filled': i <= Math.floor(product.seller?.rating || 0) }"></i>
          </span>
          <span class="rating-value">{{ product.seller?.rating }}</span>
        </div>
      </div>
      <div class="go-profile">
        <i class="icon-right"></i>
      </div>
    </div>
    
    <!-- 商品详情 -->
    <div class="product-detail">
      <h2 class="section-title">商品详情</h2>
      <div class="detail-item">
        <span class="detail-label">类别</span>
        <span class="detail-value">{{ product.category }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">状态</span>
        <span class="detail-value">{{ product.status }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">交易地点</span>
        <span class="detail-value">{{ product.location }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">交易方式</span>
        <span class="detail-value">{{ product.deliveryMethod?.join('、') }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">发布时间</span>
        <span class="detail-value">{{ formatDate(product.createTime) }}</span>
      </div>
    </div>
    
    <!-- 商品描述 -->
    <div class="product-description">
      <h2 class="section-title">商品描述</h2>
      <p class="description-content">{{ product.description }}</p>
    </div>
    
    <!-- 推荐商品 -->
    <div class="recommended-products" v-if="recommendedProducts.length > 0">
      <h2 class="section-title">相似商品推荐</h2>
      <div class="product-list">
        <div 
          class="product-item" 
          v-for="item in recommendedProducts" 
          :key="item.id"
          @click="goToProductDetail(item.id)"
        >
          <div class="product-image">
            <img :src="item.images[0]" :alt="item.title">
          </div>
          <div class="product-item-info">
            <div class="product-item-title">{{ item.title }}</div>
            <div class="product-item-price">¥{{ item.price }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <div class="action-buttons">
        <div class="action-btn favorite" @click="toggleFavorite">
          <i class="icon-favorite" :class="{ 'active': isFavorite }"></i>
          <span>收藏</span>
        </div>
        <div class="action-btn share" @click="shareProduct">
          <i class="icon-share"></i>
          <span>分享</span>
        </div>
      </div>
      
      <div class="main-actions">
        <button class="chat-btn" @click="startChat">联系卖家</button>
        <button class="buy-btn" @click="handleBuy">立即购买</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 商品数据
const product = ref({
  id: '',
  title: '',
  description: '',
  price: 0,
  originalPrice: 0,
  condition: '',
  images: [],
  category: '',
  seller: null,
  location: '',
  createTime: '',
  updateTime: '',
  status: '',
  views: 0,
  favorites: 0,
  contactInfo: {},
  deliveryMethod: [],
  tags: []
})

// 相似商品推荐
const recommendedProducts = ref([])

// 收藏状态
const isFavorite = ref(false)

// 获取商品详情
const fetchProductDetail = async () => {
  try {
    const productId = route.params.id
    if (!productId) return
    
    const { data } = await getProductDetail(productId)
    product.value = data
    
    // TODO: 获取相似商品推荐
    fetchRecommendedProducts()
  } catch (error) {
    console.error('获取商品详情失败', error)
  }
}

// 获取推荐商品
const fetchRecommendedProducts = async () => {
  // 模拟获取推荐商品数据
  // 实际项目中应该调用API
  recommendedProducts.value = []
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 前往卖家主页
const goToSellerProfile = () => {
  if (product.value?.seller?.id) {
    router.push(`/user/${product.value.seller.id}`)
  }
}

// 前往商品详情
const goToProductDetail = (id) => {
  router.push(`/product/${id}`)
}

// 切换收藏状态
const toggleFavorite = () => {
  // 如果用户未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  isFavorite.value = !isFavorite.value
  // TODO: 调用收藏/取消收藏API
}

// 分享商品
const shareProduct = () => {
  // 实现分享功能
  alert('分享功能开发中')
}

// 联系卖家
const startChat = () => {
  // 如果用户未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (product.value?.seller?.id) {
    router.push(`/chat/${product.value.seller.id}`)
  }
}

// 购买商品
const handleBuy = () => {
  // 如果用户未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  // 实现购买功能
  alert('购买功能开发中')
}

// 页面挂载时获取数据
onMounted(() => {
  fetchProductDetail()
})
</script>