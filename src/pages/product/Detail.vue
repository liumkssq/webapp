<template>
  <div class="product-detail-page">
    <!-- 引入通用头部导航组件 -->
    <HeaderNav :title="'商品详情'" />
    
    <!-- 商品详情内容 -->
    <div class="product-content" v-if="!loading">
      <!-- 商品轮播图 -->
      <div class="product-swiper">
        <div class="swiper-container">
          <div class="swiper-images">
            <div 
              v-for="(image, index) in product.images" 
              :key="index" 
              class="swiper-slide"
              @click="previewImage(index)"
            >
              <img :src="image" :alt="product.title">
            </div>
          </div>
          <div class="swiper-indicator">
            <span>{{ currentImage + 1 }}/{{ product.images.length }}</span>
          </div>
        </div>
      </div>
      
      <!-- 商品基本信息 -->
      <div class="product-info">
        <div class="product-price">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price" v-if="product.originalPrice > product.price">¥{{ product.originalPrice }}</span>
        </div>
        <div class="product-title">{{ product.title }}</div>
        <div class="product-meta">
          <span class="product-condition">{{ product.condition }}</span>
          <span class="view-count">
            <i class="icon-view"></i>
            {{ formatNumber(product.viewCount) }}
          </span>
        </div>
      </div>
      
      <!-- 卖家信息 -->
      <div class="seller-info" @click="goToUserProfile(product.seller.id)">
        <img :src="product.seller.avatar" class="seller-avatar" :alt="product.seller.name">
        <div class="seller-meta">
          <div class="seller-name">
            {{ product.seller.name }}
            <i class="icon-verified" v-if="product.seller.verified"></i>
          </div>
          <div class="seller-school">{{ product.seller.school }}</div>
        </div>
        <div class="seller-rate">
          <span>好评率 {{ product.seller.goodRate }}%</span>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 卖家其他商品 -->
      <div class="seller-products" v-if="product.seller.otherProducts && product.seller.otherProducts.length > 0">
        <div class="section-title">
          <span>Ta的其他商品</span>
          <span class="more-link" @click="goToSellerProducts(product.seller.id)">
            查看更多
            <i class="icon-arrow-right"></i>
          </span>
        </div>
        <div class="product-scroll">
          <div 
            v-for="item in product.seller.otherProducts" 
            :key="item.id" 
            class="product-card"
            @click="goToProductDetail(item.id)"
          >
            <div class="product-image">
              <img :src="item.images[0]" :alt="item.title">
              <div class="product-status" v-if="item.status !== '在售'">{{ item.status }}</div>
            </div>
            <div class="product-card-price">¥{{ item.price }}</div>
          </div>
        </div>
      </div>
      
      <!-- 商品详情 -->
      <div class="product-detail">
        <div class="section-title">商品详情</div>
        <div class="detail-items">
          <div class="detail-item">
            <div class="item-label">商品类别</div>
            <div class="item-value">{{ product.category }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">发布时间</div>
            <div class="item-value">{{ formatTime(product.createTime) }}</div>
          </div>
          <div class="detail-item">
            <div class="item-label">交易方式</div>
            <div class="item-value">{{ product.deliveryMethod }}</div>
          </div>
          <div class="detail-item" v-if="product.location">
            <div class="item-label">交易地点</div>
            <div class="item-value">{{ product.location }}</div>
          </div>
        </div>
        <div class="product-description">
          <div class="section-title">商品描述</div>
          <div class="description-content">
            {{ product.description }}
          </div>
        </div>
      </div>
      
      <!-- 相似商品推荐 -->
      <div class="similar-products" v-if="product.similarProducts && product.similarProducts.length > 0">
        <div class="section-title">相似商品推荐</div>
        <div class="product-grid">
          <div 
            v-for="item in product.similarProducts" 
            :key="item.id" 
            class="product-card"
            @click="goToProductDetail(item.id)"
          >
            <div class="product-image">
              <img :src="item.images[0]" :alt="item.title">
            </div>
            <div class="product-card-info">
              <div class="product-card-title">{{ item.title }}</div>
              <div class="product-card-price">¥{{ item.price }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品评论 -->
      <div class="comment-section" v-if="product.comments && product.comments.length > 0">
        <div class="section-title">
          <span>留言 {{ product.commentCount }}</span>
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
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <div class="comment-text">
                {{ comment.content }}
              </div>
              
              <!-- 评论操作 -->
              <div class="comment-actions">
                <span class="reply-btn" @click="replyComment(comment)">回复</span>
                <span class="like-btn">
                  <i :class="['icon-like-small', {'active': comment.isLiked}]"></i>
                  {{ comment.likeCount > 0 ? comment.likeCount : '点赞' }}
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
                    <span class="reply-to" v-if="reply.replyTo">回复 {{ reply.replyTo.name }}</span>
                    <span class="reply-text">{{ reply.content }}</span>
                  </div>
                  <div class="reply-actions">
                    <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                    <span class="reply-btn" @click="replyComment(comment, reply)">回复</span>
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
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getProductDetail, favoriteProduct, unfavoriteProduct, commentProduct } from '@/api/product'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const product = ref({})
const loading = ref(true)
const currentImage = ref(0)
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

// 获取商品详情
const fetchProductDetail = async () => {
  loading.value = true
  
  try {
    const productId = route.params.id
    const res = await getProductDetail(productId)
    
    if (res.code === 200) {
      product.value = res.data
    } else {
      showToast('获取商品详情失败')
    }
  } catch (error) {
    console.error('获取商品详情失败', error)
    showToast('获取商品详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const productId = product.value.id
    let res
    
    if (product.value.isLiked) {
      res = await unfavoriteProduct(productId)
    } else {
      res = await favoriteProduct(productId)
    }
    
    if (res.code === 200) {
      product.value.isLiked = res.data.isLiked
      product.value.likeCount = res.data.likeCount
      showToast(product.value.isLiked ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 联系卖家
const contactSeller = () => {
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
    
    const res = await commentProduct(productId, data)
    
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

// 图片预览
const previewImage = (index) => {
  currentImage.value = index
  previewSrc.value = product.value.images[index]
  showImagePreview.value = true
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false
  previewSrc.value = ''
}

// 分享商品
const shareProduct = () => {
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
  router.push(`/product/${productId}`)
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 页面加载时获取商品详情
onMounted(async () => {
  await fetchProductDetail()
})
</script>