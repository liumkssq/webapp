<template>
  <div class="product-detail-page">
    <!-- 引入通用头部导航组件 -->
    <HeaderNav :title="'商品详情'" />
    
    <!-- 商品详情内容 -->
    <div class="product-content" v-if="!loading">
      <!-- 商品轮播图：iOS样式的全屏轮播 -->
      <div class="product-carousel">
        <div class="carousel-container">
          <!-- 轮播图主区域 -->
          <div class="carousel-main">
            <div class="carousel-track" :style="{transform: `translateX(-${currentImageIndex * 100}%)`}">
              <div 
                v-for="(image, index) in product.images" 
                :key="index" 
                class="carousel-slide"
                @click="previewImage(index)"
              >
                <img :src="image" :alt="product.title" class="carousel-image">
              </div>
            </div>
            
            <!-- 箭头导航 -->
            <div class="carousel-arrows" v-if="product.images && product.images.length > 1">
              <div class="carousel-arrow carousel-arrow-left" @click.stop="prevImage">
                <i class="van-icon van-icon-arrow-left"></i>
              </div>
              <div class="carousel-arrow carousel-arrow-right" @click.stop="nextImage">
                <i class="van-icon van-icon-arrow"></i>
              </div>
            </div>
            
            <!-- 页码指示器 -->
            <div class="carousel-pagination">
              <span class="pagination-text">{{ currentImageIndex + 1 }} / {{ product.images && product.images.length }}</span>
            </div>
          </div>
          
          <!-- 缩略图导航 -->
          <div class="carousel-thumbnails" v-if="product.images && product.images.length > 1">
            <div 
              v-for="(image, index) in product.images" 
              :key="index"
              class="carousel-thumbnail"
              :class="{active: currentImageIndex === index}"
              @click.stop="currentImageIndex = index"
            >
              <img :src="image" :alt="`缩略图 ${index + 1}`" class="thumbnail-image">
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品基本信息 -->
      <div class="product-info">
        <div class="product-price">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price" v-if="product.originalPrice > product.price">¥{{ product.originalPrice }}</span>
          <span class="discount-badge" v-if="product.originalPrice > product.price">
            {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
          </span>
        </div>
        <div class="product-title">{{ product.title }}</div>
        <div class="product-meta">
          <span class="product-condition">
            <i class="van-icon van-icon-label"></i> {{ product.condition }}
          </span>
          <span class="view-count">
            <i class="van-icon van-icon-eye-o"></i>
            {{ formatNumber(product.viewCount) }}
          </span>
          <span class="publish-time">
            <i class="van-icon van-icon-clock-o"></i>
            {{ formatTime(product.createTime, 'short') }}
          </span>
        </div>
      </div>
      
      <!-- 卖家信息 -->
      <div class="seller-info" @click="goToUserProfile(product.seller.id)">
        <img :src="product.seller.avatar" class="seller-avatar" :alt="product.seller.name">
        <div class="seller-meta">
          <div class="seller-name">
            {{ product.seller.name }}
            <i class="van-icon van-icon-certificate" v-if="product.seller.verified"></i>
            <span class="user-badge" v-if="product.seller.level">
              <i class="van-icon van-icon-gem-o"></i> Lv{{ product.seller.level }}
            </span>
          </div>
          <div class="seller-details">
            <span class="seller-school">{{ product.seller.school }}</span>
            <span class="seller-join-date" v-if="product.seller.joinDate">加入于 {{ formatTime(product.seller.joinDate, 'date') }}</span>
          </div>
        </div>
        <div class="seller-rate">
          <div class="rate-value">{{ product.seller.goodRate }}%</div>
          <div class="rate-label">好评率</div>
          <i class="van-icon van-icon-arrow"></i>
        </div>
      </div>
      
      <!-- 卖家其他商品 -->
      <div class="seller-products" v-if="product.seller.otherProducts && product.seller.otherProducts.length > 0">
        <div class="section-title">
          <span>Ta的其他商品</span>
          <span class="more-link" @click="goToSellerProducts(product.seller.id)">
            查看更多
            <i class="van-icon van-icon-arrow"></i>
          </span>
        </div>
        <div class="seller-product-scroll">
          <div 
            v-for="item in product.seller.otherProducts" 
            :key="item.id" 
            class="seller-product-item"
            @click="goToProductDetail(item.id)"
          >
            <div class="seller-product-image">
              <img :src="item.images[0]" :alt="item.title">
              <div class="seller-product-status" v-if="item.status !== '在售'">{{ item.status }}</div>
            </div>
            <div class="seller-product-info">
              <div class="seller-product-title">{{ item.title }}</div>
              <div class="seller-product-price">¥{{ item.price }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品详情 -->
      <div class="product-detail">
        <div class="section-title">
          <i class="van-icon van-icon-info-o"></i> 商品详情
        </div>
        <div class="detail-card">
          <div class="detail-items">
            <div class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-filter-o"></i> 商品类别
              </div>
              <div class="item-value">{{ product.category }}</div>
            </div>
            <div class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-clock-o"></i> 发布时间
              </div>
              <div class="item-value">{{ formatTime(product.createTime) }}</div>
            </div>
            <div class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-logistics"></i> 交易方式
              </div>
              <div class="item-value">{{ product.deliveryMethod }}</div>
            </div>
            <div class="detail-item" v-if="product.location">
              <div class="item-label">
                <i class="van-icon van-icon-location-o"></i> 交易地点
              </div>
              <div class="item-value location-value">
                <span>{{ product.location }}</span>
                <i class="van-icon van-icon-map-marked" @click="viewLocation"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div class="product-description">
          <div class="section-title">
            <i class="van-icon van-icon-description"></i> 商品描述
          </div>
          <div class="description-card">
            <div class="description-content" v-if="product.description">
              {{ product.description }}
            </div>
            <div class="no-description" v-else>
              <i class="van-icon van-icon-info-o"></i>
              <span>卖家暂时没有添加商品描述</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 相似商品推荐 -->
      <div class="similar-products" v-if="product.similarProducts && product.similarProducts.length > 0">
        <div class="section-title">
          <span>相似商品推荐</span>
          <span class="more-link" @click="viewMoreSimilar">
            查看更多 <i class="van-icon van-icon-arrow"></i>
          </span>
        </div>
        <div class="product-scroll">
          <div 
            v-for="item in product.similarProducts" 
            :key="item.id" 
            class="similar-item"
            @click="goToProductDetail(item.id)"
          >
            <div class="similar-image">
              <img :src="item.images[0]" :alt="item.title">
              <div class="price-tag">¥{{ item.price }}</div>
            </div>
            <div class="similar-info">
              <div class="similar-title">{{ item.title }}</div>
              <div class="similar-meta">
                <span class="similar-date">{{ formatTime ? formatTime(item.createTime, 'short') : formatSimpleTime(item.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品评论 -->
      <div class="comment-section" v-if="product.comments && product.comments.length > 0">
        <div class="section-title">
          <span>留言 {{ product.commentCount }}</span>
          <span class="comment-action" @click="showComment">
            <i class="van-icon van-icon-edit"></i> 我要留言
          </span>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list">
          <div 
            v-for="comment in product.comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <!-- 评论信息 -->
            <div class="comment-user" @click="goToUserProfile(comment.author.id)">
              <img :src="comment.author.avatar" class="comment-avatar" :alt="comment.author.name">
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-name">{{ comment.author.name }}</span>
                <span class="user-label" v-if="comment.author.id === product.seller.id">卖家</span>
                <span class="comment-time">{{ formatTime ? formatTime(comment.createTime) : formatSimpleTime(comment.createTime) }}</span>
              </div>
              <div class="comment-text">
                {{ comment.content }}
              </div>
              
              <!-- 评论操作 -->
              <div class="comment-actions">
                <span class="reply-btn" @click="replyComment(comment)">
                  <i class="van-icon van-icon-chat-o"></i> 回复
                </span>
                <span class="like-btn" @click="likeComment(comment)">
                  <i :class="['van-icon', comment.isLiked ? 'van-icon-like-fill active' : 'van-icon-like-o']"></i>
                  <span class="like-count">{{ comment.likeCount > 0 ? comment.likeCount : '' }}</span>
                </span>
              </div>
              
              <!-- 回复列表 -->
              <div class="reply-list" v-if="comment.replies && comment.replies.length > 0">
                <div 
                  v-for="reply in comment.replies" 
                  :key="reply.id" 
                  class="reply-item"
                >
                  <div class="reply-content">
                    <span class="reply-name">{{ reply.author.name }}</span>
                    <span class="user-label" v-if="reply.author.id === product.seller.id">卖家</span>
                    <span class="reply-to" v-if="reply.replyTo">回复 <span class="reply-to-name">{{ reply.replyTo.name }}</span></span>
                    <span class="reply-text">{{ reply.content }}</span>
                  </div>
                  <div class="reply-actions">
                  <span class="reply-time">{{ formatTime ? formatTime(reply.createTime) : formatSimpleTime(reply.createTime) }}</span>
                  <span class="reply-btn" @click="replyComment(comment, reply)">
                  <i class="van-icon van-icon-chat-o"></i> 回复
                  </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading">
      <div class="loading-card">
        <div class="loading-header">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ loadingStatus }}</div>
        </div>
        <div class="loading-progress">
          <div class="progress-bar" :style="{width: `${loadingProgress}%`}"></div>
        </div>
        <div class="loading-tips">
          <div class="tip-icon"><i class="material-icons">info</i></div>
          <div class="tip-text">如果加载时间过长，将自动显示示例商品</div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <div class="action-icons">
        <div class="action-icon" @click="toggleFavorite">
          <i :class="[product.isLiked ? 'icon-favorite-filled' : 'icon-favorite']"></i>
          <div class="icon-text">{{ product.isLiked ? '已收藏' : '收藏' }}</div>
        </div>
        <div class="action-icon" @click="shareProduct">
          <i class="icon-share"></i>
          <div class="icon-text">分享</div>
        </div>
      </div>
      <div class="action-buttons">
        <button class="action-btn contact" @click="contactSeller">联系卖家</button>
        <button class="action-btn buy" @click="buyProduct">立即购买</button>
      </div>
    </div>
    
    <!-- 留言输入框 -->
    <div class="comment-input-wrapper" v-if="showCommentInput">
      <div class="comment-input">
        <input 
          type="text" 
          v-model="commentText" 
          :placeholder="replyTo ? `回复 ${replyTo.name}` : '对此商品有疑问?在此留言'" 
          ref="commentInputEl"
        >
        <button 
          class="comment-submit" 
          :disabled="!commentText.trim()" 
          @click="submitComment"
        >发送</button>
      </div>
    </div>
    
    <!-- 联系方式弹窗 -->
    <div class="contact-popup" v-if="showContactPopup">
      <div class="popup-mask" @click="showContactPopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">联系卖家</div>
          <div class="popup-close" @click="showContactPopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="contact-list">
          <div class="contact-item" v-if="product.contactInfo.phone && product.contactInfo.showPhone">
            <div class="contact-icon phone">
              <i class="icon-phone"></i>
            </div>
            <div class="contact-info">
              <div class="contact-name">手机号</div>
              <div class="contact-value">{{ product.contactInfo.phone }}</div>
            </div>
            <button class="contact-action" @click="callPhone(product.contactInfo.phone)">拨打</button>
          </div>
          <div class="contact-item" v-if="product.contactInfo.wechat && product.contactInfo.showWechat">
            <div class="contact-icon wechat">
              <i class="icon-wechat"></i>
            </div>
            <div class="contact-info">
              <div class="contact-name">微信号</div>
              <div class="contact-value">{{ product.contactInfo.wechat }}</div>
            </div>
            <button class="contact-action" @click="copyWechat(product.contactInfo.wechat)">复制</button>
          </div>
          <div class="contact-item">
            <div class="contact-icon chat">
              <i class="icon-chat"></i>
            </div>
            <div class="contact-info">
              <div class="contact-name">站内聊天</div>
              <div class="contact-value">在线交流更方便</div>
            </div>
            <button class="contact-action" @click="goToChat(product.seller.id)">聊天</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览 -->
    <div class="image-preview" v-if="showImagePreview" @click="closePreview">
      <div class="preview-container">
        <img :src="previewSrc" alt="预览图片">
      </div>
      <div class="preview-close">
        <i class="icon-close"></i>
      </div>
    </div>
    
    <!-- 分享弹窗 -->
    <div class="share-popup" v-if="showSharePopup">
      <div class="popup-mask" @click="showSharePopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">分享到</div>
          <div class="popup-close" @click="showSharePopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="share-options">
          <div class="share-option" @click="shareVia('wechat')">
            <div class="option-icon wechat">
              <i class="icon-wechat"></i>
            </div>
            <div class="option-name">微信</div>
          </div>
          <div class="share-option" @click="shareVia('moments')">
            <div class="option-icon moments">
              <i class="icon-moments"></i>
            </div>
            <div class="option-name">朋友圈</div>
          </div>
          <div class="share-option" @click="shareVia('qq')">
            <div class="option-icon qq">
              <i class="icon-qq"></i>
            </div>
            <div class="option-name">QQ</div>
          </div>
          <div class="share-option" @click="shareVia('weibo')">
            <div class="option-icon weibo">
              <i class="icon-weibo"></i>
            </div>
            <div class="option-name">微博</div>
          </div>
          <div class="share-option" @click="shareVia('link')">
            <div class="option-icon link">
              <i class="icon-link"></i>
            </div>
            <div class="option-name">复制链接</div>
          </div>
        </div>
        <div class="cancel-btn" @click="showSharePopup = false">
          取消
        </div>
      </div>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getProductDetail, favoriteProduct } from '@/api/product'
import api from '@/api'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const product = ref({})
const loading = ref(true)
const loadingStatus = ref('加载中...')
const loadingProgress = ref(0)
const loadingError = ref(false)
const currentImageIndex = ref(0)
const autoPlayTimer = ref(null)
const commentText = ref('')
const replyTo = ref(null)
const showCommentInput = ref(false)
const showContactPopup = ref(false)
const showImagePreview = ref(false)
const previewSrc = ref('')
const showSharePopup = ref(false)
const toast = reactive({
  show: false,
  message: ''
})

// 计算当前用户是否是卖家
const isCurrentUser = computed(() => {
  return product.value.seller && product.value.seller.id === userStore.userId
})

// 格式化数字(超过1000显示为1k)
const formatNumber = (num) => {
  if (!num) return 0
  return num > 999 ? (num / 1000).toFixed(1) + 'k' : num
}

// 简化版形式化时间
const formatSimpleTime = (time) => {
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

// 生成默认商品详情数据
const generateDefaultProduct = (id) => {
  const productId = parseInt(id) || 76;
  return {
    id: productId,
    title: `样品商品 ${productId}`,
    description: `这是一个样例商品详惁描述，用于在无法获取真实数据时显示。该商品具有多种功能和特点，包括高质量材质、经久耐用的设计以及出色的外观。这个商品非常适合学生使用，具有较高的性价比。`,
    price: Math.floor(Math.random() * 500) + 50,
    originalPrice: Math.floor(Math.random() * 800) + 100,
    category: ['电子数码', '图书教材', '生活用品', '运动器材', '服装鞋包'][Math.floor(Math.random() * 5)],
    condition: ['全新', '几乎全新', '轻微使用痕迹', '明显使用痕迹'][Math.floor(Math.random() * 4)],
    images: [
      `https://picsum.photos/id/${(productId % 30) + 1}/600/600`,
      `https://picsum.photos/id/${(productId % 30) + 10}/600/600`,
      `https://picsum.photos/id/${(productId % 30) + 20}/600/600`
    ],
    createTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
    viewCount: Math.floor(Math.random() * 1000) + 100,
    deliveryMethod: Math.random() > 0.5 ? '校园自提' : '送货上门',
    location: '华南理工大学 大学城校区',
    seller: {
      id: 1,
      name: '演示用户',
      avatar: 'https://picsum.photos/id/1005/100/100',
      school: '华南理工大学',
      verified: true,
      goodRate: 98,
      otherProducts: Array(3).fill().map((_, i) => ({
        id: productId + i + 1,
        title: `相关商品 ${i+1}`,
        price: Math.floor(Math.random() * 300) + 30,
        images: [`https://picsum.photos/id/${(productId % 20) + i + 30}/300/300`],
        status: '在售'
      }))
    },
    contactInfo: {
      phone: '138****1234',
      showPhone: true,
      wechat: 'demo_wxid',
      showWechat: true
    },
    comments: Array(3).fill().map((_, i) => ({
      id: i + 1,
      content: `这是一条演示评论 ${i+1}，用于测试显示效果。`,
      createTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
      author: {
        id: 10 + i,
        name: `评论用户 ${i+1}`,
        avatar: `https://picsum.photos/id/${30 + i}/100/100`
      },
      likeCount: Math.floor(Math.random() * 20),
      isLiked: false,
      replies: i === 0 ? [{
        id: 101,
        content: '这是一条回复评论，用于测试显示效果。',
        createTime: new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000).toISOString(),
        author: {
          id: 20,
          name: '回复用户',
          avatar: 'https://picsum.photos/id/40/100/100'
        },
        replyTo: {
          id: 10,
          name: '评论用户 1'
        }
      }] : []
    })),
    commentCount: 3,
    isLiked: false,
    similarProducts: Array(4).fill().map((_, i) => ({
      id: productId + 10 + i,
      title: `相似商品 ${i+1}`,
      price: Math.floor(Math.random() * 400) + 40,
      images: [`https://picsum.photos/id/${(productId % 20) + i + 50}/300/300`],
    }))
  };
};

// 获取商品详情
const fetchProductDetail = async () => {
  loading.value = true
  loadingError.value = false
  loadingProgress.value = 0
  loadingStatus.value = '加载商品详情...'
  
  // 设置加载进度动画
  const progressInterval = setInterval(() => {
    if (loadingProgress.value < 70) {
      loadingProgress.value += Math.floor(Math.random() * 5) + 1
    }
  }, 200)
  
  try {
    const productId = route.params.id
    console.log('正在获取商品ID:', productId, '当前端口:', window.location.port)
    
    // 设置超时，6秒后显示默认数据
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('获取商品详情超时，使用优化的默认数据')
        loadingStatus.value = '超时，展示样例商品...'
        resolve({
          code: 200,
          data: generateDefaultProduct(productId)
        })
      }, 6000)
    })
    
    // 实际请求
    const fetchPromise = getProductDetail(productId)
    
    // 使用Promise.race确保请求超时时使用默认数据
    const res = await Promise.race([fetchPromise, timeoutPromise])
    
    if (res && res.code === 200 && res.data) {
      product.value = res.data
      console.log('成功获取商品详情:', product.value)
      
      // 确保商品图片存在
      if (!product.value.images || !Array.isArray(product.value.images) || product.value.images.length === 0) {
        product.value.images = [
          `https://picsum.photos/id/${(parseInt(productId) % 30) + 1}/600/600`,
          `https://picsum.photos/id/${(parseInt(productId) % 30) + 10}/600/600`
        ];
      }
      
      // 确保卖家信息存在
      if (!product.value.seller) {
        product.value.seller = generateDefaultProduct(productId).seller;
      }
      
      // 确保联系信息存在
      if (!product.value.contactInfo) {
        product.value.contactInfo = generateDefaultProduct(productId).contactInfo;
      }
    } else {
      console.error('返回的商品数据无效:', res)
      product.value = generateDefaultProduct(productId)
      showToast('已显示示例商品数据，刷新页面尝试连接服务器')
    }
  } catch (error) {
    console.error('获取商品详情失败', error)
    product.value = generateDefaultProduct(route.params.id)
    showToast('网络异常，显示示例商品数据')
  } finally {
    // 完成进度动画
    clearInterval(progressInterval)
    loadingProgress.value = 100
    
    // 添加一个短暂停以显示完成的加载动画
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  console.log('toggleFavorite clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const productId = product.value.id
    let res
    
    if (product.value.isLiked) {
      res = await api.product.unfavoriteProduct(productId)
    } else {
      res = await favoriteProduct(productId)
    }
    
    if (res.code === 200) {
      product.value.isLiked = res.data.isLiked
      showToast(product.value.isLiked ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 联系卖家
const contactSeller = () => {
  console.log('contactSeller clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (isCurrentUser.value) {
    showToast('不能联系自己')
    return
  }
  
  showContactPopup.value = true
}

// 拨打电话
const callPhone = (phone) => {
  window.location.href = `tel:${phone}`
  showContactPopup.value = false
}

// 复制微信号
const copyWechat = (wechat) => {
  navigator.clipboard.writeText(wechat).then(
    () => {
      showToast('微信号已复制')
      showContactPopup.value = false
    },
    () => {
      showToast('复制失败，请手动复制')
    }
  )
}

// 跳转到聊天页面
const goToChat = (sellerId) => {
  router.push(`/chat/${sellerId}`)
  showContactPopup.value = false
}

// 立即购买
const buyProduct = () => {
  console.log('buyProduct clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (isCurrentUser.value) {
    showToast('不能购买自己的商品')
    return
  }
  
  // 实际应用中这里应该跳转到购买/预约页面
  contactSeller()
}

// 显示留言框
const showComment = () => {
  showCommentInput.value = true
  // 等待DOM更新后聚焦
  setTimeout(() => {
    document.querySelector('.comment-input input').focus()
  }, 100)
}

// 回复评论
const replyComment = (comment, reply = null) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  replyTo.value = reply ? {
    id: reply.author.id,
    name: reply.author.name,
    commentId: comment.id
  } : {
    id: comment.author.id,
    name: comment.author.name,
    commentId: comment.id
  }
  
  showComment()
}

// 提交评论
const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (!commentText.value.trim()) {
    return
  }
  
  try {
    const productId = product.value.id
    const data = {
      content: commentText.value,
      replyToId: replyTo.value ? replyTo.value.id : null
    }
    
    const res = await api.product.commentProduct(productId, data)
    
    if (res.code === 200) {
      // 如果是回复评论
      if (replyTo.value && replyTo.value.commentId) {
        const comment = product.value.comments.find(c => c.id === replyTo.value.commentId)
        if (comment) {
          if (!comment.replies) {
            comment.replies = []
          }
          comment.replies.push(res.data)
        }
      } else {
        // 如果是新评论
        if (!product.value.comments) {
          product.value.comments = []
        }
        product.value.comments.unshift(res.data)
        product.value.commentCount = (product.value.commentCount || 0) + 1
      }
      
      commentText.value = ''
      replyTo.value = null
      showCommentInput.value = false
      showToast('留言成功')
    }
  } catch (error) {
    console.error('留言提交失败', error)
    showToast('留言失败，请稍后重试')
  }
}

// 查看交易地点地图
const viewLocation = () => {
  // 如果有地理坐标，可以调用地图授权并打开地图
  if (product.value && product.value.location) {
    // 这里可以根据实际情况用百度地图、高德地图等
    if (product.value.coordinates) {
      const { latitude, longitude } = product.value.coordinates
      window.open(`https://maps.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      // 没有精确坐标时，使用位置名称搜索
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(product.value.location)}`, '_blank')
    }
  }
}

// 格式化时间
const formatTime = (timestamp, format = 'auto') => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  // 短格式：只返回时间差
  if (format === 'short') {
    if (diff < 60) {
      return '刚刚'
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}分钟前`
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}小时前`
    } else if (diff < 604800) {
      return `${Math.floor(diff / 86400)}天前`
    } else {
      return `${Math.floor(diff / 604800)}周前`
    }
  }
  
  // 只返回日期部分
  if (format === 'date') {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }
  
  // 自动格式（默认）
  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)}天前`
  } else {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    // 如果是当年，不显示年份
    if (year === now.getFullYear()) {
      return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour}:${minute}`
    } else {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour}:${minute}`
    }
  }
}

// 图片轮播相关功能
// 切换到上一张图片
const prevImage = () => {
  if (!product.value.images || product.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length;
}

// 切换到下一张图片
const nextImage = () => {
  if (!product.value.images || product.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % product.value.images.length;
}

// 自动轮播
const startAutoPlay = () => {
  if (product.value.images && product.value.images.length > 1) {
    stopAutoPlay();
    autoPlayTimer.value = setInterval(() => {
      nextImage();
    }, 4000);
  }
}

const stopAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
}

// 已在后面实现图片预览功能

// 获取商品详情后自动开始轮播
onMounted(() => {
  fetchProductDetail();
  startAutoPlay();
})

// 图片预览
const previewImage = (index) => {
  // 处理不同类型的参数（兼容两种调用方式）
  if (typeof index === 'number') {
    currentImageIndex.value = index;
    previewSrc.value = product.value.images[index];
  } else {
    // 如果传入的是图片URL字符串
    previewSrc.value = index;
  }
  
  showImagePreview.value = true;
  stopAutoPlay(); // 预览模式停止自动轮播
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false;
  previewSrc.value = '';
  startAutoPlay(); // 关闭预览后重新开始自动轮播
}

// 分享商品
const shareProduct = () => {
  console.log('shareProduct clicked!') // 调试日志
  showSharePopup.value = true
}

// 分享到指定平台
const shareVia = (platform) => {
  // 实际应用中这里应该调用相应的分享API
  console.log('分享到', platform)
  
  if (platform === 'link') {
    // 复制链接
    const url = window.location.href
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('链接已复制')
      },
      () => {
        showToast('复制失败，请手动复制')
      }
    )
  }
  
  showSharePopup.value = false
}

// 跳转到用户主页
const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 跳转到卖家的商品列表
const goToSellerProducts = (sellerId) => {
  router.push(`/user/${sellerId}?tab=products`)
}

// 跳转到其他商品详情
const goToProductDetail = (productId) => {
  if (productId === product.value.id) return
  router.push(`/product/detail/${productId}`)
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 添加评论点赞功能
const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  console.log('点赞评论:', comment.id);
  // 在实际项目中，要调用评论点赞API
  try {
    // 如果有API可以调用实际API：
    // const res = await api.product.likeComment(comment.id);
    
    // 前端模拟点赞效果
    comment.isLiked = !comment.isLiked;
    comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : Math.max(0, (comment.likeCount || 1) - 1);
    showToast(comment.isLiked ? '点赞成功' : '已取消点赞');
  } catch (error) {
    console.error('点赞操作失败', error);
    showToast('操作失败，请稍后重试');
  }
}

// 查看更多相似商品
const viewMoreSimilar = () => {
  // 可以导航到包含类似商品的搜索页面
  if (product.value && product.value.category) {
    router.push({
      path: '/product/list',
      query: { category: product.value.category }
    });
  }
}

// 页面加载时获取商品详情
// onMounted 已经在前面中实现，包含获取商品详情和开始轮播

// 页面卸载时停止轮播，避免内存泄漏
onBeforeUnmount(() => {
  stopAutoPlay();
})
</script>

<style scoped>
/* 修复评论区样式确保内容不超出容器 */
.comment-item, .reply-item {
  overflow: hidden;
}

.comment-text, .reply-text {
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  overflow: hidden;
}

.reply-name, .reply-to-name, .comment-name {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  vertical-align: middle;
}
/* iOS 风格的轮播图样式 */
.product-carousel {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
}

.carousel-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.carousel-main {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1 / 1;
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.carousel-slide {
  flex: 0 0 100%;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #fcfcfc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.carousel-slide:active .carousel-image {
  transform: scale(0.98);
}

.carousel-thumbnails {
  display: flex;
  padding: 12px;
  gap: 10px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.02);
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch;
}

.carousel-thumbnails::-webkit-scrollbar {
  height: 0;
  width: 0;
}

.carousel-thumbnail {
  flex: 0 0 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.7;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.carousel-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-thumbnail.active {
  opacity: 1;
  border-color: #007AFF;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.carousel-pagination {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
}

.pagination-text {
  font-weight: 600;
}

.carousel-arrows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  pointer-events: none;
  z-index: 9;
}

.carousel-arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  transition: all 0.2s ease;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  margin: 0 10px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.carousel-arrow:active {
  background: white;
  transform: translateY(-50%) scale(0.95);
}

.carousel-arrow i {
  font-size: 18px;
  color: #333;
}

.carousel-arrow-left i {
  margin-left: -2px;
}

.carousel-arrow-right i {
  margin-right: -2px;
}

/* 添加模糊效果和动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 评论区域样式 */
.comment-section {
  background: white;
  border-radius: 16px;
  margin: 16px 0;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.comment-action {
  color: #007AFF;
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.comment-action i {
  margin-right: 4px;
  font-size: 16px;
}

.comment-list {
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  margin-bottom: 20px;
  position: relative;
}

.comment-user {
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
  border: 2px solid rgba(0, 122, 255, 0.1);
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.comment-name {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  font-size: 14px;
}

.user-label {
  background: #007AFF;
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-right: 8px;
}

.comment-time {
  color: #8e8e93;
  font-size: 12px;
}

.comment-text {
  line-height: 1.5;
  color: #333;
  margin-bottom: 8px;
  word-break: break-word;
  font-size: 14px;
}

.comment-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-size: 13px;
  color: #8e8e93;
}

.reply-btn, .like-btn {
  display: flex;
  align-items: center;
  margin-right: 16px;
  cursor: pointer;
  color: #8e8e93;
}

.reply-btn i, .like-btn i {
  font-size: 16px;
  margin-right: 4px;
}

.like-btn.active, .like-btn i.active {
  color: #ff3b30;
}

.like-count {
  margin-left: 2px;
}

.reply-list {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
}

.reply-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin-bottom: 6px;
  font-size: 14px;
}

.reply-name {
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.reply-to {
  color: #8e8e93;
  margin-right: 4px;
}

.reply-to-name {
  color: #007AFF;
}

.reply-text {
  color: #333;
  flex: 1 1 100%;
  margin-top: 4px;
  word-break: break-word;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8e8e93;
}

.reply-time {
  font-size: 12px;
}

/* 相似商品推荐样式 */
.similar-products {
  background: white;
  border-radius: 16px;
  margin: 16px 0;
  padding: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
}

.more-link {
  color: #8e8e93;
  font-size: 14px;
  font-weight: normal;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.more-link i {
  font-size: 12px;
  margin-left: 4px;
}

.product-scroll {
  display: flex;
  overflow-x: auto;
  padding: 8px 0;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  gap: 12px;
}

.product-scroll::-webkit-scrollbar {
  display: none;
}

.similar-item {
  flex: 0 0 140px;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.similar-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.similar-image {
  height: 140px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.similar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.similar-item:hover .similar-image img {
  transform: scale(1.05);
}

.price-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 600;
}

.similar-info {
  padding: 8px 10px;
}

.similar-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.similar-meta {
  font-size: 12px;
  color: #8e8e93;
}

/* 底部添加留言按钮样式 */
.comment-input-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 12px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: transform 0.3s ease;
}

.comment-input {
  display: flex;
  align-items: center;
  background: #f2f2f7;
  border-radius: 20px;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.comment-input input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 6px 0;
  font-size: 15px;
  outline: none;
}

.comment-submit {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 10px;
  cursor: pointer;
}

.comment-submit:disabled {
  background: #c7c7cc;
  cursor: not-allowed;
}

/* 加载卡片样式 */
.loading-container {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.loading-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  padding: 24px;
  animation: card-fade-in 0.3s ease-out;
}

@keyframes card-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--primary-color, #007AFF);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
  margin-right: 16px;
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.loading-progress {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 16px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-color, #007AFF);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.loading-tips {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.tip-icon {
  color: var(--primary-color, #007AFF);
  margin-right: 12px;
}

.tip-text {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

/* 美化百分比进度条 */
.progress-bar {
  background: linear-gradient(to right, #007AFF, #34C759);
  box-shadow: 0 1px 5px rgba(0, 122, 255, 0.3);
}

/* 商品卡片样式增强 */
.product-info {
  margin-top: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  animation: slide-up 0.5s ease-out;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.product-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.4;
  color: #333;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #ff3b30; /* iOS 红色 */
  margin-right: 8px;
}

.original-price {
  font-size: 16px;
  color: #8e8e93;
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f2f2f7;
  margin-top: 10px;
  color: #8e8e93;
  font-size: 14px;
}

/* 卖家信息样式 */
.seller-info {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin: 20px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.seller-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.seller-avatar {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid rgba(0, 122, 255, 0.2);
}

.seller-meta {
  flex: 1;
}

.seller-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.icon-verified {
  width: 16px;
  height: 16px;
  margin-left: 6px;
  color: #007AFF;
}

.seller-school {
  font-size: 14px;
  color: #8e8e93;
}

.seller-rate {
  background: #f2f2f7;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

/* 卡片动画效果 */
.product-card, .similar-item {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.product-card:hover, .similar-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 底部操作栏增强 */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 101;
}

.action-btn {
  border-radius: 24px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn.buy {
  background: var(--primary-color, #007AFF);
  color: white;
}

.action-btn.buy:active {
  transform: scale(0.96);
  background: #0062cc;
}

.action-btn.contact {
  border: 1px solid var(--primary-color, #007AFF);
  color: var(--primary-color, #007AFF);
  margin-right: 10px;
}

.action-btn.contact:active {
  background: rgba(0, 122, 255, 0.1);
  transform: scale(0.96);
}
</style>