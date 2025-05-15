<template>
  <!-- 产品详情页面 -->
  <div class="product-detail-page">
    <!-- Header -->
    <HeaderNav :title="product?.title || '商品详情'" :showBack="true" />
    
    <!-- 加载中显示骨架屏 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-card">
        <div class="loading-header">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载商品信息...</div>
        </div>
        <div class="loading-progress">
          <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <div class="loading-tips">
          <div class="tip-icon">
            <i class="van-icon van-icon-info-o"></i>
          </div>
          <div class="tip-text">正在从服务器获取商品详情，请稍候...</div>
        </div>
      </div>
    </div>
    
    <!-- 主要内容 -->
    <div v-else class="product-content">
      <!-- 商品轮播图 -->
      <div class="product-carousel">
        <div class="carousel-container">
          <div class="carousel-main">
            <div class="carousel-track"
              :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <div v-for="(image, index) in product.images || []" :key="index" class="carousel-slide"
                @click="previewImage(index)">
                <img :src="image" :alt="product.title" class="carousel-image">
              </div>
            </div>
          </div>
          
          <div class="carousel-arrows">
            <div class="carousel-arrow carousel-arrow-left" @click="prevImage">
              <i class="van-icon van-icon-arrow-left"></i>
            </div>
            <div class="carousel-arrow carousel-arrow-right" @click="nextImage">
              <i class="van-icon van-icon-arrow"></i>
            </div>
          </div>
          
          <div v-if="product.images && product.images.length > 1" class="carousel-pagination">
            <span class="pagination-text">{{ currentImageIndex + 1 }}</span>
            /
            <span>{{ product.images.length }}</span>
          </div>
        </div>
        
        <div v-if="product.images && product.images.length > 1" class="carousel-thumbnails">
          <div v-for="(image, index) in product.images" :key="index"
            :class="['carousel-thumbnail', { 'active': currentImageIndex === index }]"
            @click="currentImageIndex = index">
            <img :src="image" :alt="`缩略图 ${index + 1}`">
          </div>
        </div>
      </div>
      
      <!-- 商品基本信息 -->
      <div class="product-info">
        <h1 class="product-title">{{ product.title }}</h1>
        <div class="product-price">
          <div class="current-price">¥{{ product.price }}</div>
          <div v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
            ¥{{ product.originalPrice }}
          </div>
        </div>
        
        <div class="product-tags">
          <span v-if="product.condition" class="product-tag">{{ product.condition }}</span>
          <span v-if="product.category" class="product-tag">{{ product.category }}</span>
          <span v-if="product.deliveryMethod" class="product-tag">{{ product.deliveryMethod }}</span>
        </div>
        
        <div class="product-meta">
          <div class="meta-item">
            <i class="van-icon van-icon-eye-o"></i>
            <span>{{ product.viewCount || 0 }}人浏览</span>
          </div>
          <div class="meta-item">
            <i class="van-icon van-icon-clock-o"></i>
            <span>{{ formatTime(product.createTime) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 卖家信息 -->
      <div class="seller-info" @click="goToUserProfile(product.seller?.id)">
        <img :src="product.seller?.avatar" class="seller-avatar" alt="卖家头像">
        <div class="seller-meta">
          <div class="seller-name">
            {{ product.seller?.name }}
            <i v-if="product.seller?.verified" class="van-icon van-icon-certificate icon-verified"></i>
          </div>
          <div class="seller-school">{{ product.seller?.school || '校园用户' }}</div>
        </div>
        <div class="seller-rate">
          <i class="van-icon van-icon-good-job-o"></i>
          <span>{{ product.seller?.goodRate || 0 }}%</span>
        </div>
      </div>
      
      <!-- 商品详情 -->
      <div class="product-detail">
        <!-- 基本信息 -->
        <div class="detail-card">
          <div class="detail-items">
            <div v-if="product.location" class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-location-o"></i>
                <span>交易地点</span>
              </div>
              <div class="item-value location-value" @click="viewLocation">
                {{ product.location }}
                <i class="van-icon van-icon-arrow"></i>
              </div>
            </div>
            
            <div class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-label-o"></i>
                <span>商品状态</span>
              </div>
              <div class="item-value">{{ product.condition || '未知' }}</div>
            </div>
            
            <div class="detail-item">
              <div class="item-label">
                <i class="van-icon van-icon-shopping-cart-o"></i>
                <span>配送方式</span>
              </div>
              <div class="item-value">{{ product.deliveryMethod || '校园自提' }}</div>
            </div>
          </div>
        </div>
        
        <!-- 商品描述 -->
        <div class="description-card">
          <div class="description-header">
            <i class="van-icon van-icon-description"></i>
            <span>商品描述</span>
          </div>
          <div class="description-content">
            <p>{{ product.description || '暂无描述信息' }}</p>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div class="comment-section">
        <div class="section-title">
          <span>留言 {{ commentTotal || 0 }}</span>
          <span class="comment-action" @click="showComment">
            <i class="van-icon van-icon-edit"></i> 我要留言
          </span>
        </div>
        
        <div v-if="product.comments && product.comments.length > 0" class="comment-list">
          <div v-for="comment in product.comments" :key="comment.id" class="comment-item">
            <div class="comment-user">
              <img 
                :src="comment.author?.avatar || comment.userAvatar || `https://picsum.photos/id/${120 + ((comment.userId || 0) % 10)}/100/100`" 
                class="comment-avatar" 
                alt="评论用户头像"
                @error="handleAvatarError($event, comment.userId)"
              >
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-name">{{ comment.author?.name || comment.userName || `用户${comment.userId}` }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime || comment.createdAt) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <span class="comment-action-item" @click="replyToComment(comment)">回复</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="!loadingComments" class="empty-comment">
          <div class="empty-comment-icon">
            <i class="van-icon van-icon-comment-o"></i>
          </div>
          <div class="empty-comment-text">暂无留言</div>
        </div>
        
        <div v-if="commentTotal > product.comments?.length && !noMoreComments" class="load-more" @click="loadMoreComments">
          <span v-if="!loadingComments">加载更多</span>
          <span v-else>加载中...</span>
        </div>
        
        <div v-if="showCommentInput" class="comment-input-wrapper">
          <div class="comment-input">
            <input 
              v-model="commentText" 
              :placeholder="replyTo ? `回复 ${replyTo.author?.name || '用户'}` : '写下你的留言...'" 
              @keyup.enter="submitComment"
            />
            <button @click="submitComment">发送</button>
            <span v-if="replyTo" class="cancel-reply" @click="cancelReply">取消回复</span>
          </div>
        </div>
      </div>
      
      <!-- 相似商品 -->
      <div v-if="product.similarProducts && product.similarProducts.length > 0" class="similar-products">
        <div class="section-title">
          <span>相似商品</span>
          <span class="more-action" @click="viewMoreSimilar">
            <span>查看更多</span>
            <i class="van-icon van-icon-arrow"></i>
          </span>
        </div>
        
        <div class="similar-list">
          <div v-for="item in product.similarProducts.slice(0, 4)" :key="item.id" class="similar-item" @click="goToProductDetail(item.id)">
            <div class="similar-image">
              <img :src="item.image || 'https://picsum.photos/id/1/200/200'" alt="相似商品图片">
              <div class="price-tag">¥{{ item.price }}</div>
            </div>
            <div class="similar-info">
              <div class="similar-title">{{ item.title }}</div>
              <div class="similar-meta">{{ item.condition || '二手' }} · {{ formatTime(item.createTime, 'short') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div v-if="!loading" class="bottom-action-bar">
      <div class="action-icons">
        <div class="action-icon" @click="toggleFavorite">
          <i :class="['van-icon', product.isLiked ? 'van-icon-star icon-favorite-filled' : 'van-icon-star-o']"></i>
          <span class="icon-text">{{ product.isLiked ? '已收藏' : '收藏' }}</span>
        </div>
        <div class="action-icon" @click="shareProduct">
          <i class="van-icon van-icon-share-o"></i>
          <span class="icon-text">分享</span>
        </div>
        <div class="action-icon" @click="handleReport">
          <i class="van-icon van-icon-warning-o"></i>
          <span class="icon-text">举报</span>
        </div>
      </div>
      <div class="action-buttons">
        <button v-if="!isCurrentUser" class="action-btn contact" @click="contactSeller">联系卖家</button>
        <button v-if="!isCurrentUser" class="action-btn buy" @click="buyProduct">立即购买</button>
        <button v-else class="action-btn contact" @click="router.push(`/product/edit/${product.id}`)">编辑商品</button>
      </div>
    </div>
    
    <!-- 评论输入区 -->
    <div v-if="showCommentInput" class="comment-input-wrapper">
      <div class="comment-input">
        <input 
          v-model="commentText" 
          type="text" 
          placeholder="写下你的留言..."
          @keyup.enter="submitComment"
        >
        <button 
          class="comment-submit" 
          :disabled="!commentText.trim()" 
          @click="submitComment"
        >
          发送
        </button>
      </div>
    </div>
    
    <!-- 底部安全区域 -->
    <div class="safe-area-bottom"></div>
    
    <!-- 图片预览 -->
    <div v-if="showImagePreview" class="image-preview" @click="closePreview">
      <div class="preview-wrapper">
        <img :src="previewSrc" alt="商品图片预览" class="preview-image">
      </div>
      <div class="preview-close">
        <i class="van-icon van-icon-cross"></i>
      </div>
    </div>
    
    <!-- 分享操作表 -->
    <van-share-sheet
      v-model:show="showSharePopup"
      title="分享给好友"
      :options="shareOptions"
      @select="onShareSelect"
    />
    
    <!-- 举报对话框 -->
    <van-dialog
      v-model:show="showReportDialog"
      title="举报内容"
      show-cancel-button
      @confirm="submitReport"
      confirm-button-color="#ee0a24"
    >
      <div class="dialog-content">
        <p class="dialog-subtitle">请选择举报原因：</p>
        <van-radio-group v-model="reportReason">
          <van-cell-group inset>
            <van-cell clickable @click="reportReason = 'fake'">
              <template #title>
                <van-radio name="fake">虚假信息</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'spam'">
              <template #title>
                <van-radio name="spam">广告/垃圾信息</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'rights'">
              <template #title>
                <van-radio name="rights">侵犯权益</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'illegal'">
              <template #title>
                <van-radio name="illegal">违法违规</van-radio>
              </template>
            </van-cell>
            <van-cell clickable @click="reportReason = 'other'">
              <template #title>
                <van-radio name="other">其他原因</van-radio>
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
        
        <van-field
          v-if="reportReason === 'other'"
          v-model="reportDetail"
          rows="3"
          autosize
          type="textarea"
          maxlength="200"
          placeholder="请详细说明原因"
          show-word-limit
          class="report-detail"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import api from '@/api'
import { favoriteProduct, getProductComments, getProductDetail, reportProduct, unfavoriteProduct } from '@/api/product'
import HeaderNav from '@/components/HeaderNav.vue'
import { useUserStore } from '@/store/user'
import { Toast } from 'vant'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

// 举报相关
const showReportDialog = ref(false);
const reportReason = ref('fake'); // Default reason
const reportDetail = ref('');

// 计算当前用户是否是卖家
const isCurrentUser = computed(() => {
  return product.value.seller && product.value.seller.id === userStore.userId
})

// 格式化数字(超过1000显示为1k)
const formatNumber = (num) => {
  if (!num) return 0
  return num > 999 ? (num / 1000).toFixed(1) + 'k' : num
}

// 格式化时间显示
const formatTime = (timestamp, format = 'auto') => {
  if (!timestamp) return ''
  
  try {
    // 处理ISO 8601格式的时间字符串
    const date = new Date(timestamp)
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[时间格式化] 无效的时间格式:', timestamp)
      return '时间格式错误'
    }
    
    const now = new Date()
    const diffMs = now - date
    const diff = Math.floor(diffMs / 1000)
    
    // 处理未来时间（如2025年，可能是测试数据）
    if (diff < 0) {
      console.log('[时间格式化] 检测到未来时间:', timestamp)
      return '刚刚' // 对于测试数据，显示为"刚刚"
    }
    
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
  } catch (error) {
    console.error('[时间格式化] 异常:', error, timestamp)
    return '时间格式错误'
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

// 评论分页相关状态
const commentPage = ref(1)
const commentLimit = ref(10)
const loadingComments = ref(false)
const noMoreComments = ref(false)
const commentTotal = ref(0)

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
    console.log('[详细日志] 正在获取商品ID:', productId)
    
    // 使用原始方式直接获取并打印原始响应
    const response = await fetch(`/api/product/detail/${productId}`)
    const rawData = await response.json()
    console.log('[详细日志] 原始API响应:', rawData)
    
    // 如果直接获取到有效数据，直接使用
    if (rawData && (rawData.code === 200 || rawData["product.sql"])) {
      console.log('[详细日志] 直接获取到有效数据，跳过getProductDetail调用');
      
      // 如果是标准响应格式
      if (rawData.code === 200 && rawData.data) {
        processProductData(rawData.data, productId);
      } 
      // 如果是直接响应数据对象
      else if (rawData["product.sql"]) {
        processProductData(rawData, productId);
      }
      // 如果已经处理过，提前返回
      return;
    }
    
    // 如果直接获取失败，尝试使用API函数
    console.log('[详细日志] 直接获取失败，尝试使用API函数')
    const res = await getProductDetail(productId)
    console.log('[详细日志] API响应完整对象:', res)
    
    if (res && res.code === 200) {
      console.log('[详细日志] 成功获取商品详情:', res.data)
      processProductData(res.data, productId);
      
      // 获取商品评论列表
      fetchComments(1);
    } else {
      console.error('[详细日志] API请求失败:', res)
      throw new Error('API请求失败');
    }
  } catch (error) {
    console.error('[详细日志] 获取商品详情失败', error);
    
    // 尝试直接获取数据的最后尝试
    try {
      const productId = route.params.id;
      // 尝试一个特定的硬编码路径
      const lastResponse = await fetch(`/api/products/${productId}`);
      if (lastResponse.ok) {
        const lastData = await lastResponse.json();
        console.log('[详细日志] 最后尝试获取数据成功:', lastData);
        if (lastData && (lastData.code === 200 || lastData["product.sql"])) {
          if (lastData.code === 200 && lastData.data) {
            processProductData(lastData.data, productId);
          } else if (lastData["product.sql"]) {
            processProductData(lastData, productId);
          }
          return;
        }
      }
    } catch (e) {
      console.error('[详细日志] 最后尝试获取数据失败:', e);
    }
    
    // 所有尝试都失败，使用Mock数据
    console.log('[详细日志] 所有尝试失败，使用Mock数据');
    
    // 针对ID 78的特殊处理
    if (route.params.id === '78') {
      useMockDataFor78();
      return;
    }
    
    // 在加载失败时使用默认数据
    product.value = generateDefaultProduct(route.params.id)
    showToast('加载失败，显示示例商品数据')
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

// 处理产品数据的函数，统一处理逻辑
const processProductData = (data, productId) => {
  console.log('[详细日志] 处理产品数据:', data);
  
  // 处理字符串格式的JSON数据
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
      console.log('[详细日志] 解析JSON字符串数据成功:', data);
    } catch (e) {
      console.error('[详细日志] 解析JSON字符串数据失败:', e);
    }
  }
  
  // 处理API返回的数据结构
  if (data["product.sql"]) {
    // 使用API返回的实际数据结构
    console.log('[详细日志] 检测到product.sql格式数据');
    const productData = data["product.sql"]
    product.value = {
      id: productData.id,
      title: productData.title,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      category: productData.categoryName || '未分类',
      condition: productData.condition || '二手',
      viewCount: productData.viewCount,
      createTime: productData.createdAt || new Date().toISOString(),
      location: productData.location || productData.locationDetail || '校园内',
      isLiked: productData.isFavorite,
      deliveryMethod: '校园自提', // 默认值
      seller: {
        id: productData.sellerId,
        name: productData.sellerName || '匿名用户',
        avatar: productData.sellerAvatar || 'https://picsum.photos/id/1005/100/100',
        school: '校园用户',
        verified: true,
        goodRate: 98,
        level: 5,
        joinDate: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      commentCount: productData.commentCount || 0
    }
    
    console.log('[详细日志] 处理图片数据之前:', productData.images);
    // 处理图片数组，解析JSON字符串
    if (productData.images && productData.images.length > 0) {
      try {
        let imageData = productData.images[0];
        console.log('[详细日志] 图片数据类型:', typeof imageData, '值:', imageData);
        if (typeof imageData === 'string') {
          // 尝试解析JSON字符串格式的图片
          try {
            const parsedImages = JSON.parse(imageData);
            console.log('[详细日志] 解析图片JSON成功:', parsedImages);
            product.value.images = parsedImages;
          } catch (e) {
            console.error('[详细日志] 解析图片JSON失败:', e);
            // 如果解析失败，将其视为单个图片URL
            product.value.images = [imageData];
          }
        } else {
          product.value.images = productData.images;
        }
      } catch (error) {
        console.error('[详细日志] 解析图片数据失败:', error);
        product.value.images = [
          `https://picsum.photos/id/${(parseInt(productId) % 30) + 1}/600/600`
        ];
      }
    } else {
      product.value.images = [
        `https://picsum.photos/id/${(parseInt(productId) % 30) + 1}/600/600`
      ];
    }
    console.log('[详细日志] 最终使用的图片数组:', product.value.images);
    
    // 处理评论数据
    if (data.comments) {
      product.value.comments = data.comments;
    } else {
      product.value.comments = [];
    }
    
    // 处理相关商品数据
    if (data.relatedProducts) {
      product.value.similarProducts = data.relatedProducts;
    } else {
      // 默认空数组
      product.value.similarProducts = [];
    }
    
    // 处理联系方式
    product.value.contactInfo = {
      phone: productData.contactWay || '暂未提供',
      showPhone: !!productData.contactWay,
      wechat: productData.contactInfo || '暂未提供',
      showWechat: !!productData.contactInfo
    };
    
    console.log('[详细日志] 最终使用的商品数据:', product.value);
  } else {
    // 处理常规API返回格式
    console.log('[详细日志] 处理标准API返回格式');
    product.value = data;
    
    // 确保商品图片存在
    if (!product.value.images || !Array.isArray(product.value.images) || product.value.images.length === 0) {
      product.value.images = [
        `https://picsum.photos/id/${(parseInt(productId) % 30) + 1}/600/600`,
        `https://picsum.photos/id/${(parseInt(productId) % 30) + 10}/600/600`
      ];
    }
    
    // 确保卖家信息存在
    if (!product.value.seller) {
      product.value.seller = {
        id: 1,
        name: '商品卖家',
        avatar: 'https://picsum.photos/id/1005/100/100',
        school: '校园用户',
        verified: true,
        goodRate: 98
      };
    }
    
    // 确保联系信息存在
    if (!product.value.contactInfo) {
      product.value.contactInfo = {
        phone: '暂未提供',
        showPhone: false,
        wechat: '暂未提供',
        showWechat: false
      };
    }
    
    console.log('[详细日志] 标准格式处理后的商品数据:', product.value);
  }
  
  // 添加这一行，在处理完商品数据后获取评论
  fetchComments(1);
}

// 使用ID 78的模拟数据
const useMockDataFor78 = () => {
  try {
    // 使用用户提供的测试数据
    const testData = {
      "product.sql": {
        "id": 78,
        "title": "索尼WH-1000XM4降噪耳机",
        "description": "宿舍学习神器，降噪效果极佳，充电一次可用30小时，9.5成新，转手原因是收到新款耳机。",
        "price": 1299,
        "originalPrice": 2299,
        "categoryId": 0,
        "categoryName": "数码产品",
        "images": [
          "[\"https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80\\u0026w=1000\", \"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80\\u0026w=1000\"]"
        ],
        "condition": "九成新",
        "contactInfo": "wx123456",
        "contactWay": "13800138000",
        "location": "校园北区",
        "sellerId": 1007,
        "sellerName": "music_lover",
        "sellerAvatar": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce.jpg",
        "viewCount": 345,
        "likeCount": 62,
        "commentCount": 9,
        "isFavorite": false
      },
      "comments": [],
      "relatedProducts": []
    };
    
    console.log('[详细日志] 使用硬编码的测试数据');
    
    // 处理测试数据
    processProductData(testData, '78');
    
    showToast('使用示例商品数据');
  } catch (error) {
    console.error('[详细日志] 处理硬编码测试数据出错:', error);
    
    // 最终回退到默认模拟数据
    product.value = generateDefaultProduct('78');
    showToast('使用默认示例数据');
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
      // 当前已收藏，点击后取消收藏
      console.log('取消收藏商品:', productId)
      res = await unfavoriteProduct(productId)
      if (res && (res.code === 200 || res.success)) {
        product.value.isLiked = false
        showToast('已取消收藏')
      }
    } else {
      // 当前未收藏，点击后添加收藏
      console.log('收藏商品:', productId)
      res = await favoriteProduct(productId)
      if (res && (res.code === 200 || res.success)) {
        product.value.isLiked = true
        showToast('收藏成功')
      }
    }
    
    console.log('收藏操作响应:', res)
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

  // --- 修改开始 ---
  // 不再显示联系方式弹窗
  // showContactPopup.value = true

  // 直接跳转到聊天页面
  if (product.value && product.value.seller && product.value.seller.id) {
    const sellerId = product.value.seller.id;
    const sellerName = product.value.seller.name || '卖家'; // 获取卖家名称
    console.log(`Navigating to chat with seller ID: ${sellerId}, Name: ${sellerName}`);

    // 注意：这里通常不需要传递 conversationId，
    // ChatDetail 页面会在加载时根据 senderId 和 receiverId 查找或创建会话。
    router.push({
      path: `/im/chat/${sellerId}`,
      query: {
        name: sellerName // 传递卖家名称作为聊天标题
        // conversationId: 'OPTIONAL_IF_YOU_HAVE_IT' // 通常不需要
      }
    });

  } else {
    console.error('无法获取卖家信息以开始聊天');
    showToast('无法联系卖家，信息不完整');
  }
  // --- 修改结束 ---
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
const buyProduct = async () => {
  console.log('buyProduct clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (isCurrentUser.value) {
    showToast('不能购买自己的商品')
    return
  }
  
  try {
    // 显示加载中提示
    showToast('正在创建订单...')
    
    // 1. 创建订单
    const productId = product.value.id
    const orderData = {
      productId: productId,
      quantity: 1, // 默认购买数量为1
      remark: '' // 可以后续添加备注功能
    }
    
    console.log('创建订单数据:', orderData)
    const orderRes = await api.order.createOrder(orderData)
    console.log('订单创建响应:', orderRes)
    
    // 获取订单编号，处理多种可能的响应格式
    let orderSn = null;
    
    // 标准响应格式：{code: 200, data: {sn: "xxx"}}
    if (orderRes && orderRes.code === 200 && orderRes.data && orderRes.data.sn) {
      orderSn = orderRes.data.sn;
      console.log('从标准响应格式获取订单SN:', orderSn);
    } 
    // 直接返回格式：{sn: "xxx"}
    else if (orderRes && orderRes.sn) {
      orderSn = orderRes.sn;
      console.log('从直接响应获取订单SN:', orderSn);
    }
    
    if (!orderSn) {
      console.error('无法获取订单编号:', orderRes);
      throw new Error(orderRes?.message || '订单创建失败，请稍后重试');
    }
    
    // 获取订单编号
    showToast('订单创建成功')
    
    // 记录创建订单成功信息
    console.log('订单创建成功，准备跳转到订单详情页', orderSn)
    
    // 跳转到订单详情页面 - 使用查询参数而非路径参数
    router.push({
      path: '/user/order/1', // 使用一个已存在的订单ID作为路径参数
      query: { 
        sn: orderSn,
        from: 'product', 
        new: 'true' 
      }
    })
    
    // 记录跳转指令已执行
    console.log('跳转指令已执行')
    
  } catch (error) {
    console.error('购买过程发生错误:', error)
    showToast(error.message || '购买失败，请稍后重试')
  }
}

// 显示留言框
const showComment = () => {
  // 检查是否有token作为登录状态
  const token = localStorage.getItem('token');
  
  console.log('[评论] 显示留言框状态检查 - token:', token ? '存在' : '不存在');
  
  if (!token) {
    console.warn('[评论] 用户未登录，将跳转到登录页面');
    showToast('请先登录')
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  showCommentInput.value = true
  console.log("[评论] 显示评论输入框，showCommentInput设置为:", showCommentInput.value)
  
  // 等待DOM更新后聚焦
  setTimeout(() => {
    const inputEl = document.querySelector('.comment-input input')
    if (inputEl) {
      inputEl.focus()
      console.log("[评论] 成功聚焦到输入框")
    } else {
      console.warn("[评论] 未找到评论输入框元素, DOM选择器失败")
      
      // 打印DOM树以帮助诊断
      const commentWrapper = document.querySelector('.comment-input-wrapper')
      if (commentWrapper) {
        console.log("[评论] 找到了评论包装器，但内部没有input元素:", commentWrapper.innerHTML)
      } else {
        console.warn("[评论] 找不到评论包装器元素，可能DOM尚未更新")
      }
    }
  }, 200) // 增加等待时间，确保DOM已更新
}

// 回复评论
const replyToComment = (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  replyTo.value = comment
  showCommentInput.value = true
  
  // 等待DOM更新后聚焦
  setTimeout(() => {
    const inputEl = document.querySelector('.comment-input input')
    if (inputEl) {
      inputEl.focus()
      console.log("[评论] 聚焦到回复输入框")
    } else {
      console.warn("[评论] 未找到回复输入框元素")
    }
  }, 50)
}

// 提交评论
const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (!commentText.value.trim()) {
    showToast('评论内容不能为空')
    return
  }
  
  try {
    console.log('[评论] 开始提交评论')
    const productId = product.value.id
    const data = {
      content: commentText.value,
      replyToId: replyTo.value ? replyTo.value.id : null
    }
    
    showToast('正在提交评论...')
    
    // 获取在localStorage中保存的当前用户信息，以便立即添加评论显示
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const currentUserId = userInfo.id || userStore.userId || localStorage.getItem('userId')
    
    console.log('[评论] 当前用户信息:', userInfo)
    
    // 创建一个临时评论对象，用于立即显示
    const tempComment = {
      id: Date.now(), // 临时ID
      content: commentText.value,
      userId: currentUserId,
      userName: userInfo.nickname || userInfo.username || userStore.nickname || '当前用户',
      userAvatar: userInfo.avatar || '',
      createdAt: new Date().toISOString(),
      _isTemp: true, // 标记为临时评论
      author: {
        id: currentUserId,
        name: userInfo.nickname || userInfo.username || userStore.nickname || '当前用户',
        avatar: evaluateAvatarUrl(userInfo.avatar, currentUserId)
      }
    }
    
    // 添加回复信息
    if (replyTo.value) {
      tempComment.replyToId = replyTo.value.id
      tempComment.replyTo = {
        id: replyTo.value.id,
        name: replyTo.value.author?.name || replyTo.value.userName || `用户${replyTo.value.userId}`
      }
    }
    
    // 先添加到本地评论列表，提供即时反馈
    if (!product.value.comments) {
      product.value.comments = []
    }
    
    // 将新评论添加到列表顶部
    product.value.comments.unshift(tempComment)
    commentTotal.value = commentTotal.value + 1
    
    // 清空输入和回复状态
    commentText.value = ''
    replyTo.value = null
    
    // 发送到服务器
    console.log('[评论] 提交评论数据:', data)
    
    const commentRes = await api.product.commentProduct(productId, data)
    console.log('[评论] 评论提交响应:', commentRes)
    
    if (commentRes && commentRes.code === 200) {
      console.log('[评论] 评论提交成功')
      showToast('评论成功')
      
      // 用服务器返回的评论ID替换临时ID
      if (commentRes.data && commentRes.data.id) {
        const serverCommentId = commentRes.data.id
        const tempCommentIndex = product.value.comments.findIndex(c => c._isTemp)
        if (tempCommentIndex !== -1) {
          product.value.comments[tempCommentIndex].id = serverCommentId
          product.value.comments[tempCommentIndex]._isTemp = false
        }
      }
      
      // 刷新评论列表获取最新数据
      // 这次可能不需要，因为我们已经添加了本地版本
      // fetchComments(1)
    } else {
      console.error('[评论] 评论提交失败:', commentRes)
      showToast('评论提交失败，请稍后重试')
      
      // 移除临时评论
      product.value.comments = product.value.comments.filter(c => !c._isTemp)
      commentTotal.value = Math.max(0, commentTotal.value - 1)
    }
  } catch (error) {
    console.error('[评论] 评论提交发生异常:', error)
    showToast('评论提交失败，请稍后重试')
    
    // 移除临时评论
    if (product.value.comments) {
      product.value.comments = product.value.comments.filter(c => !c._isTemp)
      commentTotal.value = Math.max(0, commentTotal.value - 1)
    }
  } finally {
    // 关闭评论输入框
    showCommentInput.value = false
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

// 举报商品
const handleReport = () => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录');
    router.push('/login?redirect=' + route.fullPath);
    return;
  }
  
  // 显示举报对话框
  showReportDialog.value = true;
};

// 提交举报
const submitReport = async () => {
  if (reportReason.value === 'other' && !reportDetail.value.trim()) {
    showToast('请填写举报原因');
    return;
  }
  
  try {
    console.log('[举报] 提交举报:', reportReason.value, reportDetail.value);
    
    // 准备举报数据
    const reportData = {
      reason: reportReason.value,
      description: reportDetail.value.trim()
    };
    
    // 调用API提交举报
    const result = await reportProduct(product.value.id, reportData);
    console.log('[举报] 提交举报响应:', result);
    
    if (result && (result.code === 200 || result.success === true)) {
      showToast('举报已提交，感谢您的反馈');
      
      // 重置表单
      reportReason.value = 'fake';
      reportDetail.value = '';
      showReportDialog.value = false;
    } else {
      // 处理可能的错误响应
      const errorMsg = result?.message || '举报提交失败，请稍后重试';
      showToast(errorMsg);
    }
  } catch (error) {
    console.error('[举报] 提交举报失败:', error);
    showToast('举报提交失败，请稍后重试');
  }
};

// 分享商品
const handleShare = () => {
  showSharePopup.value = true;
};

// 处理分享选择
const onShareSelect = (option) => {
  Toast.text(`已选择 ${option.name}`);
  
  if (option.name === '复制链接') {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        Toast.success('链接已复制到剪贴板');
      })
      .catch(() => {
        Toast.fail('复制失败，请手动复制链接');
      });
  } else {
    // 这里可以接入实际的分享SDK
    Toast.text(`分享到${option.name}功能暂未接入，敬请期待`);
  }
  
  showSharePopup.value = false;
};

// 获取商品评论列表
const fetchComments = async (page = 1) => {
  if (loadingComments.value || !product.value.id) return
  
  loadingComments.value = true
  commentPage.value = page
  
  try {
    const params = {
      page: page,
      limit: commentLimit.value
    }
    
    console.log(`[评论] 获取商品${product.value.id}的第${page}页评论`)
    const res = await getProductComments(product.value.id, params)
    console.log('[评论] 获取评论响应结果:', res)
    
    // 判断响应格式并提取评论数据
    let commentsData = null
    let totalComments = 0
    
    // 处理直接返回的数据格式 {comments: [], total: 0, page: 1, limit: 10}
    if (res && res.comments) {
      commentsData = res.comments || []
      totalComments = res.total || 0
      console.log('[评论] 直接数据格式响应, 评论数:', commentsData.length, '总数:', totalComments)
    } 
    // 标准API响应格式 {code: 200, data: {comments: [], total: 0}}
    else if (res && res.code === 200 && res.data) {
      commentsData = res.data.comments || []
      totalComments = res.data.total || 0
      console.log('[评论] 标准API格式响应, 评论数:', commentsData.length, '总数:', totalComments)
    } 
    // 处理其他可能的响应格式
    else if (res && typeof res === 'object') {
      // 尝试查找任何包含评论的数组
      const possibleCommentsKeys = ['comments', 'commentList', 'list', 'items']
      for (const key of possibleCommentsKeys) {
        if (Array.isArray(res[key])) {
          commentsData = res[key]
          break
        }
      }
      
      // 尝试查找总数
      const possibleTotalKeys = ['total', 'totalCount', 'count', 'totalItems']
      for (const key of possibleTotalKeys) {
        if (typeof res[key] === 'number') {
          totalComments = res[key]
          break
        }
      }
      
      console.log('[评论] 尝试从非标准响应提取数据，找到评论:', commentsData?.length || 0, '总数:', totalComments)
    }
    
    // 如果成功找到评论数据，更新评论总数和处理评论
    if (commentsData && Array.isArray(commentsData)) {
      // 更新评论总数
      commentTotal.value = totalComments
      console.log('[评论] 评论总数:', commentTotal.value, '当前页评论数:', commentsData.length)
      
      // 直接使用评论中的userName和userAvatar创建author对象
      commentsData.forEach(comment => {
        // 确保createTime字段存在
        if (!comment.createTime && comment.createdAt) {
          comment.createTime = comment.createdAt
        }
        
        // 直接使用评论数据中的userName和userAvatar
        comment.author = {
          id: comment.userId,
          name: comment.userName || `用户${comment.userId}`,
          avatar: comment.userAvatar || `https://picsum.photos/id/${120 + ((comment.userId || 0) % 10)}/100/100`
        }
      })
      
      console.log('[评论] 处理后的评论数据:', commentsData)
      
      // 更新评论显示
      if (page === 1) {
        // 第一页，直接替换评论列表
        product.value.comments = commentsData
      } else {
        // 追加评论
        if (!product.value.comments) {
          product.value.comments = []
        }
        product.value.comments = product.value.comments.concat(commentsData)
      }
      
      // 判断是否还有更多评论
      noMoreComments.value = product.value.comments.length >= totalComments
    } else {
      // 无法提取评论数据
      console.error('[评论] 无法从响应中提取评论数据:', res)
      showToast('获取评论失败')
    }
  } catch (error) {
    console.error('[评论] 获取评论失败:', error)
    showToast('获取评论失败，请稍后重试')
  } finally {
    loadingComments.value = false
  }
}

// 处理头像加载错误
const handleAvatarError = (event, userId) => {
  console.log(`[评论] 用户ID=${userId}的头像加载失败`)
  // 使用默认随机头像
  event.target.src = `https://picsum.photos/id/${120 + ((userId || 0) % 10)}/100/100`
}

// 应用默认用户信息
const applyDefaultUserInfo = (comments) => {
  comments.forEach(comment => {
    comment.author = {
      id: comment.userId,
      name: comment.userName || `用户${comment.userId}`,
      avatar: comment.userAvatar || `https://picsum.photos/id/${120 + (comment.userId % 10)}/100/100`
    }
    
    // 确保createTime字段存在
    if (!comment.createTime && comment.createdAt) {
      comment.createTime = comment.createdAt
    }
  })
  console.log('[评论] 应用默认用户信息完成')
}

// 加载更多评论
const loadMoreComments = () => {
  if (loadingComments.value || noMoreComments.value) return
  fetchComments(commentPage.value + 1)
}

// 取消回复
const cancelReply = () => {
  replyTo.value = null
}

// 评估头像URL，确保链接有效
const evaluateAvatarUrl = (avatar, userId) => {
  if (!avatar || typeof avatar !== 'string' || avatar.trim() === '') {
    return `https://picsum.photos/id/${120 + ((userId || 0) % 10)}/100/100`
  }
  
  // 检查是否为相对路径，如果是则添加基础URL
  if (avatar.startsWith('/') && !avatar.startsWith('//')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin
    return `${baseUrl}${avatar}`
  }
  
  return avatar
}

// 状态变量
const showEditForm = ref(false)

// 分享选项
const shareOptions = [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  { name: 'QQ', icon: 'qq' },
  { name: '复制链接', icon: 'link' }
];
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

.action-icons {
  display: flex;
  gap: 24px; /* 增大图标间距 */
}

.action-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: var(--ios-secondaryLabel, #8a8a8e); /* 图标和文字默认颜色 */
}
.action-icon i {
  font-size: 22px; /* 图标大小 */
  margin-bottom: 2px; /* 图标和文字间距 */
}
/* 收藏激活状态 */
.action-icon i.icon-favorite-filled {
  color: #ffc107; /* 从红色(#ff3b30)改为黄色 */
}
.action-icon:has(i.icon-favorite-filled) .icon-text {
  color: #ffc107; /* 从红色(#ff3b30)改为黄色 */
}

.icon-text {
  font-size: 10px; /* iOS TabBar 文字大小 */
}

.action-buttons {
  display: flex;
}

.action-btn {
  border-radius: 20px; /* 更圆润的按钮 */
  padding: 10px 20px; /* 调整按钮大小 */
  font-size: 15px;
  font-weight: 600; /* Semibold */
  border: none; /* 移除 contact 按钮的边框，用背景区分 */
  cursor: pointer;
}

.action-btn.contact {
  background: var(--ios-quaternarySystemFill, rgba(120, 120, 128, 0.08)); /* iOS 次要按钮背景 */
  color: var(--ios-link, #007aff);
  margin-right: 12px; /* 调整按钮间距 */
}
.action-btn.contact:active {
  background: var(--ios-tertiarySystemFill, rgba(120, 120, 128, 0.12));
  transform: scale(0.98); /* 轻微缩放反馈 */
}

.action-btn.buy {
  background: var(--ios-link, #007aff); /* iOS 主要按钮颜色 */
  color: white;
}
.action-btn.buy:active {
  background: #005ecf; /* 点击加深颜色 */
  transform: scale(0.98);
}

/* 评论输入框 */
.comment-input-wrapper {
  background: var(--ios-secondarySystemBackground, #f2f2f7); /* 匹配页面背景 */
  box-shadow: none; /* 移除阴影 */
  border-top: 0.5px solid rgba(60, 60, 67, 0.2); /* iOS 分割线 */
  padding: 8px 12px; /* 调整内边距 */
  padding-bottom: calc(8px + env(safe-area-inset-bottom)); /* 适配底部安全区域 */
}

.comment-input {
  background: var(--ios-systemBackground, white); /* 输入框背景 */
  border-radius: 18px; /* iOS 搜索框/输入框圆角 */
  padding: 6px 12px; /* 调整内边距 */
  border: 0.5px solid rgba(60, 60, 67, 0.2); /* iOS 边框 */
}

.comment-input input {
  padding: 4px 0; /* 调整输入框内文字垂直居中 */
  font-size: 16px; /* iOS 标准输入字体大小 */
}

.comment-submit {
  background: var(--ios-link, #007aff);
  border-radius: 16px; /* 调整圆角 */
  padding: 6px 14px; /* 调整按钮大小 */
  font-size: 15px;
  font-weight: 600; /* Semibold */
}
.comment-submit:disabled {
  background: var(--ios-quaternaryLabel, #d1d1d6); /* iOS 禁用颜色 */
  color: var(--ios-tertiaryLabel, #c7c7cc);
}

/* 其他微调 */
.van-icon {
  vertical-align: middle; /* 尝试让图标垂直居中 */
}

/* --- iOS 风格美化 --- */

/* 全局容器微调 */
.product-content {
  padding: 0 16px; /* 页面左右留白 */
  background-color: var(--ios-secondarySystemBackground, #f2f2f7); /* iOS 页面背景色 */
}

/* 通用卡片样式 */
.ios-card {
  background: var(--ios-systemBackground, white);
  border-radius: 12px; /* iOS 常用圆角 */
  margin: 16px 0; /* 上下间距 */
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); /* 更柔和的阴影 */
  overflow: hidden; /* 确保内容不溢出圆角 */
}

/* 移除原有特定卡片的背景和边距，统一使用ios-card或van-cell-group inset */
.product-info,
.seller-info,
.seller-products, /* 如果外部容器需要卡片化 */
.product-detail .detail-card,
.product-detail .description-card,
.similar-products,
.comment-section {
  /* background: none;
  box-shadow: none;
  margin: 0;
  padding: 0;
  border-radius: 0; */
  /* 采用下面的方式继承或应用 .ios-card */
}

/* 应用通用卡片样式到各个部分 */
.product-info { /* 基本信息卡片已存在，微调 */
  margin: 16px 0;
  padding: 20px; /* 维持原有较大内边距 */
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.seller-info { /* 卖家信息卡片已存在，微调 */
  margin: 16px 0;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.product-detail { /* 商品详情容器，本身不是卡片 */
  margin: 16px 0;
}

/* 商品详情 - 细节卡片 */
.product-detail .detail-card {
  background: var(--ios-systemBackground, white);
  border-radius: 12px;
  padding: 0 16px; /* 使用 Cell 的内边距，这里设为0或根据需要调整 */
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.product-detail .detail-items {
  /* 移除原有样式 */
}

.product-detail .detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0; /* 调整内边距 */
  border-bottom: 1px solid var(--ios-separator, #e5e5ea); /* iOS 分割线 */
  font-size: 15px; /* iOS 常用字体大小 */
}

.product-detail .detail-item:last-child {
  border-bottom: none;
}

.product-detail .item-label {
  display: flex;
  align-items: center;
  color: var(--ios-label, #000); /* iOS 主要文字颜色 */
}

.product-detail .item-label i {
  margin-right: 8px;
  color: var(--ios-secondaryLabel, #8a8a8e); /* iOS 次要图标颜色 */
  font-size: 18px;
}

.product-detail .item-value {
  color: var(--ios-secondaryLabel, #8a8a8e); /* iOS 次要文字颜色 */
  text-align: right;
}

.product-detail .location-value {
  display: flex;
  align-items: center;
}
.product-detail .location-value i {
  margin-left: 8px;
  color: var(--ios-link, #007aff); /* iOS 链接颜色 */
  cursor: pointer;
}

/* 商品详情 - 描述卡片 */
.product-detail .description-card {
  background: var(--ios-systemBackground, white);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px; /* 与标题间距 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.product-description .section-title {
  padding: 0 4px; /* 给标题一点呼吸空间 */
}

.description-content {
  font-size: 15px;
  line-height: 1.6; /* 增加行高提高可读性 */
  color: var(--ios-label, #333);
}

.no-description {
  text-align: center;
  padding: 20px;
  color: var(--ios-tertiaryLabel, #c7c7cc);
}
.no-description i {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

/* 相似商品 */
.similar-products {
  /* 应用通用卡片样式 */
  background: var(--ios-systemBackground, white);
  border-radius: 12px;
  margin: 16px 0;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.similar-products .section-title {
   margin-bottom: 8px; /* 调整标题和滚动区域间距 */
}

.product-scroll {
  gap: 16px; /* 增加项目间距 */
}

.similar-item {
  flex: 0 0 150px; /* 稍微增大宽度 */
  border-radius: 10px; /* 统一圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 调整阴影 */
}

.similar-image {
  height: 150px; /* 1:1 比例 */
}

.similar-info {
  padding: 10px; /* 调整内边距 */
}

.similar-title {
  font-size: 14px;
  font-weight: 500; /* Medium weight */
}

.similar-meta {
  font-size: 12px;
  color: var(--ios-secondaryLabel, #8a8a8e);
}

/* 评论区 */
.comment-section {
  /* 应用通用卡片样式 */
  background: var(--ios-systemBackground, white);
  border-radius: 12px;
  margin: 16px 0;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.comment-section .section-title {
  margin-bottom: 12px;
}

.comment-list {
  margin-bottom: 0; /* 移除底部边距，由卡片内边距控制 */
}

.comment-item {
  padding: 16px 0; /* 增加上下内边距 */
  border-bottom: 1px solid var(--ios-separator, #e5e5ea);
  display: flex; /* 改为 flex 布局 */
  gap: 12px; /* 头像和内容间距 */
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-user {
  margin-right: 0; /* 移除原有 margin */
  flex-shrink: 0;
}

.comment-avatar {
  width: 36px; /* 调整头像大小 */
  height: 36px;
  border-radius: 18px; /* 保持圆形 */
  border: none; /* 移除边框 */
}

.comment-content {
  /* flex: 1 已有 */
}

.comment-header {
  margin-bottom: 4px; /* 调整间距 */
}

.comment-name {
  font-size: 14px; /* 调整字体大小 */
  font-weight: 600; /* Semibold */
}

.user-label {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 5px; /* 微调内边距 */
  margin-left: 6px; /* 与名字间距 */
  vertical-align: middle; /* 垂直居中 */
}

.comment-time {
  font-size: 12px;
  color: var(--ios-tertiaryLabel, #c7c7cc); /* 更浅的颜色 */
  margin-left: 8px;
}

.comment-text {
  font-size: 15px;
  line-height: 1.5;
  color: var(--ios-label, #000);
  margin-bottom: 10px; /* 增加与操作按钮间距 */
}

.comment-actions {
  font-size: 13px;
  color: var(--ios-secondaryLabel, #8a8a8e);
}

.reply-btn, .like-btn {
  color: var(--ios-secondaryLabel, #8a8a8e);
  transition: color 0.2s ease; /* 添加过渡效果 */
}
.reply-btn:active, .like-btn:active {
  color: var(--ios-tertiaryLabel, #c7c7cc); /* 点击反馈 */
}

.like-btn i.active {
  color: var(--ios-systemRed, #ff3b30); /* iOS 红色 */
}
.like-btn.active .like-count{ /* 点赞数也变色 */
  color: var(--ios-systemRed, #ff3b30);
}

/* 回复列表样式 */
.reply-list {
  background: var(--ios-secondarySystemBackground, #f2f2f7); /* iOS 次级背景色 */
  border-radius: 10px;
  padding: 10px 12px; /* 调整内边距 */
  margin-top: 12px; /* 增加与评论操作间距 */
}

.reply-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--ios-separator, #e5e5ea);
}
.reply-item:first-child {
   padding-top: 0;
}
.reply-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.reply-content {
  font-size: 14px;
  line-height: 1.5;
}

.reply-name {
  font-weight: 600; /* Semibold */
}

.reply-to {
  color: var(--ios-secondaryLabel, #8a8a8e);
}
.reply-to-name {
  color: var(--ios-link, #007aff); /* iOS 链接颜色 */
}

.reply-text {
   color: var(--ios-label, #000);
}

.reply-actions {
  margin-top: 6px; /* 增加与回复内容间距 */
  font-size: 12px;
  color: var(--ios-tertiaryLabel, #c7c7cc); /* 更浅的颜色 */
}
.reply-actions .reply-btn {
   color: var(--ios-secondaryLabel, #8a8a8e); /* 回复按钮颜色深一点 */
   font-size: 12px;
}
.reply-actions .reply-btn i {
   font-size: 14px;
}

/* 加载状态 */
.loading-container {
   background-color: var(--ios-secondarySystemBackground, #f2f2f7); /* 匹配页面背景 */
}
.loading-card {
   /* 已有样式，检查是否需要调整 */
   background: var(--ios-systemBackground, white);
   border-radius: 12px;
}
.loading-tips {
   background: var(--ios-tertiarySystemBackground, #f9f9f9); /* 更浅的背景 */
   border-radius: 8px;
}

/* 底部操作栏 */
.bottom-action-bar {
  background: rgba(249, 249, 249, 0.85); /* iOS 毛玻璃背景色 */
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.29); /* iOS 分割线颜色和粗细 */
  padding: 8px 16px; /* 微调内边距 */
  padding-bottom: calc(8px + env(safe-area-inset-bottom)); /* 适配 iPhone X 等底部安全区域 */
}

.action-icons {
  display: flex;
  gap: 24px; /* 增大图标间距 */
}

.action-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: var(--ios-secondaryLabel, #8a8a8e); /* 图标和文字默认颜色 */
}
.action-icon i {
  font-size: 22px; /* 图标大小 */
  margin-bottom: 2px; /* 图标和文字间距 */
}
/* 收藏激活状态 */
.action-icon i.icon-favorite-filled {
  color: var(--ios-systemRed, #ff3b30);
}
.action-icon:has(i.icon-favorite-filled) .icon-text {
  color: var(--ios-systemRed, #ff3b30);
}

.icon-text {
  font-size: 10px; /* iOS TabBar 文字大小 */
}

.action-buttons {
  display: flex;
}

.action-btn {
  border-radius: 20px; /* 更圆润的按钮 */
  padding: 10px 20px; /* 调整按钮大小 */
  font-size: 15px;
  font-weight: 600; /* Semibold */
  border: none; /* 移除 contact 按钮的边框，用背景区分 */
  cursor: pointer;
}

.action-btn.contact {
  background: var(--ios-quaternarySystemFill, rgba(120, 120, 128, 0.08)); /* iOS 次要按钮背景 */
  color: var(--ios-link, #007aff);
  margin-right: 12px; /* 调整按钮间距 */
}
.action-btn.contact:active {
  background: var(--ios-tertiarySystemFill, rgba(120, 120, 128, 0.12));
  transform: scale(0.98); /* 轻微缩放反馈 */
}

.action-btn.buy {
  background: var(--ios-link, #007aff); /* iOS 主要按钮颜色 */
  color: white;
}
.action-btn.buy:active {
  background: #005ecf; /* 点击加深颜色 */
  transform: scale(0.98);
}

/* 评论输入框 */
.comment-input-wrapper {
  background: var(--ios-secondarySystemBackground, #f2f2f7); /* 匹配页面背景 */
  box-shadow: none; /* 移除阴影 */
  border-top: 0.5px solid rgba(60, 60, 67, 0.2); /* iOS 分割线 */
  padding: 8px 12px; /* 调整内边距 */
  padding-bottom: calc(8px + env(safe-area-inset-bottom)); /* 适配底部安全区域 */
}

.comment-input {
  background: var(--ios-systemBackground, white); /* 输入框背景 */
  border-radius: 18px; /* iOS 搜索框/输入框圆角 */
  padding: 6px 12px; /* 调整内边距 */
  border: 0.5px solid rgba(60, 60, 67, 0.2); /* iOS 边框 */
}

.comment-input input {
  padding: 4px 0; /* 调整输入框内文字垂直居中 */
  font-size: 16px; /* iOS 标准输入字体大小 */
}

.comment-submit {
  background: var(--ios-link, #007aff);
  border-radius: 16px; /* 调整圆角 */
  padding: 6px 14px; /* 调整按钮大小 */
  font-size: 15px;
  font-weight: 600; /* Semibold */
}
.comment-submit:disabled {
  background: var(--ios-quaternaryLabel, #d1d1d6); /* iOS 禁用颜色 */
  color: var(--ios-tertiaryLabel, #c7c7cc);
}

/* 其他微调 */
.van-icon {
  vertical-align: middle; /* 尝试让图标垂直居中 */
}

/* 商品基本信息 */
.product-info {
  padding: 16px;
}
.product-title {
  font-size: 20px; /* 调整标题字体大小 */
  font-weight: 600;
  margin-bottom: 8px;
}
.product-price {
  margin-bottom: 12px;
  display: flex; /* Ensure items align baseline */
  align-items: baseline; /* Align based on text baseline */
}

/* --- New Price Styling --- */
.current-price {
  /* Remove direct styling from parent */
  color: var(--ios-systemRed, #ff3b30); /* Keep color consistent */
  display: inline-flex; /* Use inline-flex for alignment */
  align-items: baseline; /* Align symbol and amount */
  margin-right: 8px; /* Space between price and original price */
}
.current-price .currency-symbol {
  font-size: 16px; /* Smaller font for ¥ */
  font-weight: 400; /* Regular weight */
  margin-right: 1px; /* Slight space */
  align-self: flex-start; /* Align ¥ slightly higher */
  margin-top: 2px; /* Fine-tune vertical alignment */
}
.current-price .amount {
  font-size: 26px; /* Large font for amount */
  font-weight: 700; /* Bold */
  line-height: 1; /* Ensure compact height */
}
/* --- End New Price Styling --- */

.original-price {
  font-size: 15px;
  color: var(--ios-secondaryLabel);
  text-decoration: line-through;
  margin-left: 0; /* Reset margin, use gap or parent margin */
  margin-right: 8px; /* Space before discount */
}
.discount-badge {
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 4px;
  background-color: var(--ios-systemRed);
  color: white;
  margin-left: 0; /* Reset margin */
  font-weight: 500;
  white-space: nowrap; /* Prevent wrapping */
}
.product-meta {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 0.5px solid var(--ios-separator-light);
  font-size: 13px;
  color: var(--ios-secondaryLabel);
  display: flex;
  /* justify-content: space-around; */
  justify-content: flex-start; /* Align items to the start */
  gap: 20px; /* Consistent spacing between items */
  align-items: center; /* Vertically align icon and text */
}
.product-meta span {
  display: flex;
  align-items: center;
}
.product-meta span i {
  margin-right: 4px;
  font-size: 16px;
  color: var(--ios-systemGray);
}

/* ... rest of existing styles ... */

/* 卖家信息卡片 */
.seller-info {
  padding: 12px 16px; /* 微调内边距 */
  display: flex;
  align-items: center;
  gap: 10px; /* 调整整体间距 */
}
.seller-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
}
.seller-meta {
  flex: 1;
}
.seller-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 3px; /* 微调间距 */
  display: flex;
  align-items: center; /* 确保垂直居中 */
  gap: 4px; /* 名字和徽章间距 */
}
.seller-name .van-icon { /* 认证图标 */
  color: var(--ios-link);
  font-size: 15px;
  /* vertical-align: text-bottom; */ /* 尝试调整垂直对齐 */
}
.user-badge { /* Lv 徽章 */
  /* margin-left: 6px; */ /* 使用 gap */
  font-size: 11px; /* 减小字号 */
  font-weight: 500;
  color: var(--ios-secondaryLabel);
  display: inline-flex; /* 改为 inline-flex */
  align-items: center;
  background-color: var(--ios-systemGray6);
  padding: 1px 4px; /* 调整内边距 */
  border-radius: 3px; /* 调整圆角 */
  /* vertical-align: middle; */ /* 尝试调整垂直对齐 */
}
.user-badge i {
  font-size: 11px; /* 图标与文字同大小 */
  margin-right: 2px;
  color: var(--ios-systemGray);
}
.seller-details {
  font-size: 12px; /* 确认字体大小 */
  color: var(--ios-secondaryLabel);
  line-height: 1.4;
  margin-top: 3px; /* 调整与名称行的距离 */
}
.seller-details span {
  margin-right: 8px;
}

/* 好评率区域精确样式 */
.seller-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: var(--ios-systemGray6, #f2f2f7);
  border-radius: 8px; /* 根据截图调整圆角 */
  padding: 5px 10px; /* 根据截图调整内边距 */
  padding-right: 22px; /* 为箭头留出更多空间 */
  position: relative;
  flex-shrink: 0;
}
.seller-rate .rate-label {
  font-size: 10px; /* 减小"好"和"率"的字体 */
  color: var(--ios-secondaryLabel);
  line-height: 1.2;
}
.seller-rate .rate-value {
  font-size: 13px; /* 调整百分比字体大小 */
  font-weight: 500; /* Medium weight */
  color: var(--ios-label);
  line-height: 1.2;
  margin: 1px 0; /* 微调垂直间距 */
}
.seller-rate > .van-icon-arrow {
  position: absolute;
  right: 8px; /* 调整箭头位置 */
  top: 50%;
  transform: translateY(-50%);
  color: var(--ios-systemGray3, #c7c7cc); /* 调整箭头颜色 */
  font-size: 12px; /* 调整箭头大小 */
}


/* ... rest of existing styles ... */

/* 对话框内容样式 */
.dialog-content {
  padding: 16px;
}

.dialog-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.report-detail {
  margin-top: 16px;
}

/* 加载更多按钮 */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.load-more-btn {
  background: transparent;
  border: none;
  color: #007AFF;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-more-btn:disabled {
  color: #8e8e93;
  cursor: not-allowed;
}

.circular {
  animation: circular 1s linear infinite;
  margin-right: 8px;
}

@keyframes circular {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  color: #8e8e93;
  font-size: 14px;
  margin-top: 16px;
  padding: 8px;
}

/* 无评论状态 */
.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #8e8e93;
}

.no-comments i {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-comments-text {
  font-size: 14px;
}

.empty-comment {
  text-align: center;
  padding: 20px;
  color: #8e8e93;
}

.empty-comment-icon {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-comment-text {
  font-size: 14px;
}

.cancel-reply {
  color: #8e8e93;
  font-size: 14px;
  margin-left: 10px;
  cursor: pointer;
}
</style>