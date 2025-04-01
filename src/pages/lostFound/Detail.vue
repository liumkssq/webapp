<template>
  <div class="lost-found-detail-page">
    <!-- 头部导航 -->
    <HeaderNav :title="item.type === 'lost' ? '寻物详情' : '招领详情'" />
    
    <!-- 主要内容 -->
    <div class="content" v-if="!loading">
      <!-- 状态标签 -->
      <div class="status-label" :class="statusClass">
        {{ statusText }}
      </div>
      
      <!-- 标题和基本信息 -->
      <div class="item-header">
        <div class="item-title">{{ item.title }}</div>
        <div class="item-meta">
          <span class="item-category">
            <i class="van-icon van-icon-label"></i> {{ item.category }}
          </span>
          <span class="item-time">
            <i class="van-icon van-icon-clock-o"></i> {{ formatTime(item.eventTime, 'short') }}
          </span>
          <span class="item-views" v-if="item.viewCount">
            <i class="van-icon van-icon-eye-o"></i> {{ formatNumber(item.viewCount) }}
          </span>
        </div>
      </div>
      
      <!-- 图片轮播 -->
      <div class="image-carousel" v-if="item.images && item.images.length > 0">
        <div class="carousel-container">
          <!-- 主轮播区域 -->
          <div class="carousel-main">
            <div 
              class="carousel-slide" 
              v-for="(image, index) in item.images" 
              :key="index"
              :style="{ transform: `translateX(${(index - currentImageIndex) * 100}%)` }"
              @click="previewImage(index)"
            >
              <img :src="image" :alt="item.title">
            </div>
            
            <!-- 前后导航按钮 -->
            <div class="carousel-nav prev" @click.stop="prevImage" v-if="item.images.length > 1">
              <i class="van-icon van-icon-arrow-left"></i>
            </div>
            <div class="carousel-nav next" @click.stop="nextImage" v-if="item.images.length > 1">
              <i class="van-icon van-icon-arrow"></i>
            </div>
          </div>
          
          <!-- 分页指示器 -->
          <div class="carousel-indicators" v-if="item.images.length > 1">
            <div 
              v-for="(_, index) in item.images" 
              :key="index"
              class="indicator-dot"
              :class="{ active: currentImageIndex === index }"
              @click="currentImageIndex = index"
            ></div>
          </div>
          
          <!-- 缩略图导航 -->
          <div class="carousel-thumbnails" v-if="item.images.length > 1">
            <div 
              v-for="(image, index) in item.images" 
              :key="index"
              class="thumbnail"
              :class="{ active: currentImageIndex === index }"
              @click="currentImageIndex = index"
            >
              <img :src="image" :alt="item.title">
            </div>
          </div>
        </div>
      </div>
      
      <!-- 详情信息 -->
      <div class="detail-section">
        <div class="section-title">
          <i class="van-icon van-icon-info-o"></i> 详情信息
        </div>
        
        <div class="detail-card">
          <div class="description-block">
            <div class="description-label">物品描述</div>
            <div class="description-content">{{ item.description || '暂无描述' }}</div>
          </div>
          
          <div class="detail-items">
            <div class="detail-item">
              <div class="detail-label">
                <i class="van-icon van-icon-location-o"></i>
                {{ item.type === 'lost' ? '丢失地点' : '拾获地点' }}
              </div>
              <div class="detail-content location-value">
                <span>{{ item.location }}</span>
                <i class="van-icon van-icon-map-marked" @click="viewLocation"></i>
              </div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">
                <i class="van-icon van-icon-clock-o"></i>
                {{ item.type === 'lost' ? '丢失时间' : '拾获时间' }}
              </div>
              <div class="detail-content">{{ formatDetailTime(item.eventTime) }}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">
                <i class="van-icon van-icon-calendar-o"></i>
                发布时间
              </div>
              <div class="detail-content">{{ formatDetailTime(item.createTime) }}</div>
            </div>
            
            <div class="detail-item" v-if="item.reward && item.type === 'lost'">
              <div class="detail-label">
                <i class="van-icon van-icon-gold-coin-o"></i>
                悬赏金额
              </div>
              <div class="detail-content reward">¥{{ item.reward }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 联系信息 -->
      <div class="contact-section">
        <div class="section-title">
          <i class="van-icon van-icon-friends-o"></i> 联系信息
        </div>
        
        <div class="user-info" @click="goToUserProfile(item.publisher.id)">
          <img :src="item.publisher.avatar" class="user-avatar" :alt="item.publisher.name">
          <div class="user-meta">
            <div class="user-name">
              {{ item.publisher.name }}
              <i class="van-icon van-icon-certificate" v-if="item.publisher.verified"></i>
              <span class="user-badge" v-if="item.publisher.level">
                <i class="van-icon van-icon-gem-o"></i> Lv{{ item.publisher.level }}
              </span>
            </div>
            <div class="user-details">
              <span class="user-school">{{ item.publisher.school }}</span>
              <span class="user-join" v-if="item.publisher.joinDate">加入于 {{formatTime(item.publisher.joinDate, 'date')}}</span>
            </div>
          </div>
          <div class="contact-btn" v-if="!isCurrentUser">联系Ta</div>
        </div>
        
        <div class="contact-methods" v-if="item.contactInfo">
          <div class="contact-item" v-if="item.contactInfo.phone && (isCurrentUser || item.contactInfo.showPhone)">
            <div class="contact-icon phone">
              <i class="van-icon van-icon-phone-o"></i>
            </div>
            <div class="contact-info">
              <div class="contact-label">电话</div>
              <div class="contact-value">{{ item.contactInfo.phone }}</div>
            </div>
            <div class="action-btn phone-action" v-if="!isCurrentUser" @click="callPhone(item.contactInfo.phone)">拨打</div>
          </div>
          
          <div class="contact-item" v-if="item.contactInfo.wechat && (isCurrentUser || item.contactInfo.showWechat)">
            <div class="contact-icon wechat">
              <i class="van-icon van-icon-wechat"></i>
            </div>
            <div class="contact-info">
              <div class="contact-label">微信</div>
              <div class="contact-value">{{ item.contactInfo.wechat }}</div>
            </div>
            <div class="action-btn wechat-action" v-if="!isCurrentUser" @click="copyWechat(item.contactInfo.wechat)">复制</div>
          </div>
          
          <div class="contact-item" v-if="!isCurrentUser">
            <div class="contact-icon chat">
              <i class="van-icon van-icon-chat-o"></i>
            </div>
            <div class="contact-info">
              <div class="contact-label">站内聊天</div>
              <div class="contact-value">在线交流更方便</div>
            </div>
            <div class="action-btn chat-action" @click="goToChat(item.publisher.id)">聊天</div>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div class="comment-section">
        <div class="section-title">
          <span>留言 {{ item.commentCount || 0 }}</span>
          <span class="comment-action" @click="showComment">
            <i class="van-icon van-icon-edit"></i> 我要留言
          </span>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list" v-if="item.comments && item.comments.length > 0">
          <div 
            v-for="comment in item.comments.slice(0, 5)" 
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
                <span class="user-label" v-if="comment.author.id === item.publisher.id">发布者</span>
                <span class="comment-time">{{ formatTime(comment.createTime, 'short') }}</span>
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
                    <span class="user-label" v-if="reply.author.id === item.publisher.id">发布者</span>
                    <span class="reply-to" v-if="reply.replyTo">回复 <span class="reply-to-name">{{ reply.replyTo.name }}</span></span>
                    <span class="reply-text">{{ reply.content }}</span>
                  </div>
                  <div class="reply-actions">
                    <span class="reply-time">{{ formatTime(reply.createTime, 'short') }}</span>
                    <span class="reply-btn" @click="replyComment(comment, reply)">
                      <i class="van-icon van-icon-chat-o"></i> 回复
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 无评论 -->
        <div class="no-comment" v-else>
          <div class="no-data-icon"></div>
          <div class="no-data-text">暂无留言</div>
        </div>
      </div>
      
      <!-- 相似物品推荐 -->
      <div class="similar-items" v-if="item.similarItems && item.similarItems.length > 0">
        <div class="section-title">
          <span>相似{{ item.type === 'lost' ? '丢失物品' : '招领物品' }}</span>
          <span class="more-link" @click="viewMoreSimilar">
            查看更多 <i class="van-icon van-icon-arrow"></i>
          </span>
        </div>
        <div class="similar-scroll">
          <div 
            v-for="simItem in item.similarItems" 
            :key="simItem.id" 
            class="similar-item"
            @click="goToLostFoundDetail(simItem.id)"
          >
            <div class="similar-image">
              <img :src="simItem.images && simItem.images.length > 0 ? simItem.images[0] : '/placeholder.png'" :alt="simItem.title">
              <div class="item-status" :class="getStatusClass(simItem.status)">{{ getStatusText(simItem.status) }}</div>
            </div>
            <div class="similar-info">
              <div class="similar-title">{{ simItem.title }}</div>
              <div class="similar-meta">
                <span class="similar-location">{{ simItem.location }}</span>
                <span class="similar-time">{{ formatTime(simItem.eventTime, 'short') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 可能是你在找的 -->
      <div class="similar-items" v-if="item.relatedItems && item.relatedItems.length > 0">
        <div class="section-title">
          <span>可能是你在找的</span>
          <span class="more-link" @click="viewMoreRelated">
            查看更多 <i class="van-icon van-icon-arrow"></i>
          </span>
        </div>
        <div class="similar-scroll">
          <div 
            v-for="relItem in item.relatedItems" 
            :key="relItem.id" 
            class="similar-item"
            @click="goToLostFoundDetail(relItem.id)"
          >
            <div class="similar-image">
              <img :src="relItem.images && relItem.images.length > 0 ? relItem.images[0] : '/placeholder.png'" :alt="relItem.title">
              <div class="item-status" :class="getStatusClass(relItem.status)">{{ getStatusText(relItem.status) }}</div>
            </div>
            <div class="similar-info">
              <div class="similar-title">{{ relItem.title }}</div>
              <div class="similar-meta">
                <span class="similar-location">{{ relItem.location }}</span>
                <span class="similar-time">{{ formatTime(relItem.eventTime, 'short') }}</span>
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
        <div class="loading-tips">
          <div class="tip-icon"><i class="van-icon van-icon-info-o"></i></div>
          <div class="tip-text">如果加载时间过长，将自动显示示例内容</div>
        </div>
      </div>
    </div>
    
    <!-- 添加一个容器元素来增加底部间距，防止内容被底部操作栏遮挡 -->
    <div class="bottom-spacer" style="height: 72px;"></div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <div class="action-icons">
        <div class="action-icon" @click="likeItem">
          <i :class="['icon-like', {'active': item.isLiked}]"></i>
          <div class="icon-count">{{ item.likes || 0 }}</div>
        </div>
        <div class="action-icon" @click="showComment">
          <i class="icon-comment"></i>
          <div class="icon-count">{{ item.comments || 0 }}</div>
        </div>
        <div class="action-icon" @click="shareItem">
          <i class="icon-share"></i>
          <div class="icon-count">分享</div>
        </div>
      </div>
      <div class="action-buttons">
        <div v-if="!isCurrentUser && item.status !== 'closed'" 
             class="action-btn action-contact" 
             @click="contactPublisher">
          联系发布者
        </div>
        <div v-if="isCurrentUser && item.status !== 'closed'" 
             class="action-btn action-primary" 
             @click="showStatusUpdatePopup = true">
          {{ item.type === 'lost' ? '标记为已找到' : '标记为已归还' }}
        </div>
      </div>
    </div>
    
    <!-- 留言输入框 -->
    <div class="comment-input-wrapper" v-if="showCommentInput">
      <div class="comment-input">
        <input 
          type="text" 
          v-model="commentText" 
          :placeholder="replyTo ? `回复 ${replyTo.name}` : '有什么想说的...'" 
          ref="commentInputEl"
        >
        <button 
          class="comment-submit" 
          :disabled="!commentText.trim()" 
          @click="submitComment"
        >发送</button>
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
    
    <!-- 状态更新弹窗 -->
    <div class="status-popup" v-if="showStatusUpdatePopup">
      <div class="popup-mask" @click="showStatusUpdatePopup = false"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">更新状态</div>
          <div class="popup-close" @click="showStatusUpdatePopup = false">
            <i class="icon-close"></i>
          </div>
        </div>
        <div class="status-options">
          <div 
            class="status-option" 
            v-for="status in availableStatuses" 
            :key="status.value"
            @click="updateStatus(status.value)"
          >
            {{ status.label }}
          </div>
        </div>
        <div class="cancel-btn" @click="showStatusUpdatePopup = false">
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
import '@/style/loading.css' // 引入加载样式
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getLostFoundDetail, updateLostFoundStatus, commentLostFound, likeLostFound, unlikeLostFound } from '@/api/lostFound'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const item = ref({})
const loading = ref(true)
const loadingStatus = ref('加载中...')
const loadingError = ref(false)
const currentImageIndex = ref(0) // 当前显示的图片索引
const autoPlayTimer = ref(null) // 自动播放定时器
const commentText = ref('')
const replyTo = ref(null)
const showCommentInput = ref(false)
const showImagePreview = ref(false)
const previewSrc = ref('')
const showSharePopup = ref(false)
const showStatusUpdatePopup = ref(false)
const toast = reactive({
  show: false,
  message: ''
})

// 计算当前用户是否是发布者
const isCurrentUser = computed(() => {
  return item.value.publisher && item.value.publisher.id === userStore.userId
})

// 生成相关物品的数据
const generateRelatedItems = () => {
  if (!item.value || !item.value.category) return []
  
  // 根据当前物品的分类和类型生成不同的相关物品
  const mockId = parseInt(route.params.id) || 30
  return Array(3).fill().map((_, i) => ({
    id: mockId + 200 + i,
    title: `${item.value.type === 'lost' ? '已招领' : '已丢失'}的${item.value.category} ${i+1}`,
    type: item.value.type === 'lost' ? 'found' : 'lost',
    status: ['pending', 'claimed', 'found'][Math.floor(Math.random() * 3)],
    location: ['教学楼', '图书馆', '食堂', '宿舍区'][Math.floor(Math.random() * 4)],
    eventTime: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
    images: [`https://picsum.photos/id/${(mockId % 30) + i + 80}/300/300`]
  }))
}

// 计算状态文本和样式
const statusText = computed(() => {
  return getStatusText(item.value.status)
})

const statusClass = computed(() => {
  return getStatusClass(item.value.status)
})

// 可用的状态选项
const availableStatuses = computed(() => {
  if (item.value.type === 'lost') {
    return [
      { value: 'pending', label: '寻找中' },
      { value: 'found', label: '已找到' },
      { value: 'closed', label: '关闭' }
    ]
  } else {
    return [
      { value: 'pending', label: '等待认领' },
      { value: 'claimed', label: '已认领' },
      { value: 'closed', label: '已关闭' }
    ]
  }
})

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: item.value.type === 'lost' ? '寻找中' : '等待认领',
    found: '已找到',
    claimed: '已认领',
    closed: '已关闭'
  }
  
  return statusMap[status] || '未知状态'
}

// 获取状态样式
const getStatusClass = (status) => {
  const statusMap = {
    pending: 'status-pending',
    found: 'status-success',
    claimed: 'status-success',
    closed: 'status-closed'
  }
  
  return statusMap[status] || 'status-pending'
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
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
}

// 详细时间格式
const formatDetailTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 生成模拟数据
const generateMockData = (id) => {
  const mockId = parseInt(id) || 30;
  return {
    id: mockId,
    title: `模拟失物招领 ${mockId}`,
    description: `这是一个模拟失物招领详情，用于在无法获取真实数据时显示。这个物品具有特点是尺寸适中，形状规整，能够轻松识别。`,
    type: mockId % 2 === 0 ? 'lost' : 'found',
    status: ['pending', 'found', 'claimed', 'closed'][Math.floor(Math.random() * 4)],
    category: ['数码产品', '证件钱包', '生活用品', '图书教材', '其他物品'][Math.floor(Math.random() * 5)],
    location: ['教学楼A区', '图书馆', '食堂广场', '宿舍楼B栋', '校园南门'][Math.floor(Math.random() * 5)],
    eventTime: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString(),
    createTime: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
    images: [
      `https://picsum.photos/id/${(mockId % 30) + 1}/600/600`,
      `https://picsum.photos/id/${(mockId % 30) + 10}/600/600`,
      `https://picsum.photos/id/${(mockId % 30) + 20}/600/600`
    ],
    reward: mockId % 2 === 0 ? Math.floor(Math.random() * 50) + 5 : null,
    viewCount: Math.floor(Math.random() * 500) + 50,
    commentCount: Math.floor(Math.random() * 20) + 1,
    likes: Math.floor(Math.random() * 30) + 5,
    isLiked: false,
    publisher: {
      id: 1001,
      name: `模拟用户_${Math.floor(Math.random() * 100)}`,
      avatar: `https://picsum.photos/id/${mockId + 50}/100/100`,
      school: '华南理工大学',
      verified: Math.random() > 0.5,
      level: Math.floor(Math.random() * 6) + 1,
      joinDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000).toISOString()
    },
    contactInfo: {
      phone: `1${Math.floor(Math.random() * 9 + 1)}${Math.floor(Math.random() * 10000000000)}`.substring(0, 11),
      showPhone: true,
      wechat: `wx_user_${Math.floor(Math.random() * 10000)}`,
      showWechat: true
    },
    comments: Array(5).fill().map((_, i) => ({
      id: i + 1,
      content: `这是一条测试留言 ${i+1}，希望能尽快找到/物归原主！`,
      createTime: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
      likeCount: Math.floor(Math.random() * 10),
      isLiked: false,
      author: {
        id: 2000 + i,
        name: `评论用户_${i+1}`,
        avatar: `https://picsum.photos/id/${100 + i}/100/100`
      },
      replies: i === 0 ? [
        {
          id: 101,
          content: '感谢留言，我会继续寻找/等待认领',
          createTime: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000).toISOString(),
          author: {
            id: 1001,
            name: '发布者回复',
            avatar: `https://picsum.photos/id/${mockId + 50}/100/100`
          },
          replyTo: {
            id: 2000,
            name: '评论用户_1'
          }
        }
      ] : []
    })),
    similarItems: Array(4).fill().map((_, i) => ({
      id: mockId + 100 + i,
      title: `相似${mockId % 2 === 0 ? '丢失' : '拾获'}物品 ${i+1}`,
      type: mockId % 2 === 0 ? 'lost' : 'found',
      status: ['pending', 'found', 'claimed'][Math.floor(Math.random() * 3)],
      location: ['教学楼', '图书馆', '食堂', '宿舍楼'][Math.floor(Math.random() * 4)],
      eventTime: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
      images: [`https://picsum.photos/id/${(mockId % 20) + i + 40}/300/300`]
    }))
  };
};

// 获取失物招领详情
const fetchLostFoundDetail = async () => {
  loading.value = true
  loadingStatus.value = '加载中...'
  
  try {
    const id = route.params.id
    console.log('正在获取失物招领详情，ID:', id);
    const res = await getLostFoundDetail(id)
    
    if (res && res.code === 200 && res.data) {
      console.log('获取失物招领详情成功:', res.data)
      
      // 处理评论数据，确保正确格式
      if (res.data.comments) {
        try {
          // 如果评论是字符串（JSON），尝试解析
          if (typeof res.data.comments === 'string') {
            res.data.comments = JSON.parse(res.data.comments);
          }
          
          // 确保评论是数组
          if (!Array.isArray(res.data.comments)) {
            res.data.comments = [];
          }
          
          // 处理每条评论，确保格式正确
          res.data.comments = res.data.comments.map(comment => {
            // 确保评论的基础结构
            const formattedComment = {
              id: comment.id || Math.random().toString(36).substr(2, 9),
              content: comment.content || '',
              createTime: comment.createTime || new Date().toISOString(),
              likeCount: comment.likeCount || 0,
              isLiked: comment.isLiked || false,
              author: {
                id: comment.author?.id || 0,
                name: comment.author?.name || '匿名用户',
                avatar: comment.author?.avatar || 'https://picsum.photos/100/100'
              },
              replies: []
            };
            
            // 处理回复
            if (comment.replies) {
              try {
                // 如果回复是字符串（JSON），尝试解析
                if (typeof comment.replies === 'string') {
                  comment.replies = JSON.parse(comment.replies);
                }
                
                if (Array.isArray(comment.replies)) {
                  formattedComment.replies = comment.replies.map(reply => ({
                    id: reply.id || Math.random().toString(36).substr(2, 9),
                    content: reply.content || '',
                    createTime: reply.createTime || new Date().toISOString(),
                    author: {
                      id: reply.author?.id || 0,
                      name: reply.author?.name || '匿名用户',
                      avatar: reply.author?.avatar || 'https://picsum.photos/100/100'
                    },
                    replyTo: reply.replyTo ? {
                      id: reply.replyTo.id || 0,
                      name: reply.replyTo.name || '匿名用户'
                    } : null
                  }));
                }
              } catch (e) {
                console.error('解析评论回复失败:', e);
                formattedComment.replies = [];
              }
            }
            
            return formattedComment;
          });
        } catch (e) {
          console.error('解析评论数据失败:', e);
          res.data.comments = [];
        }
      } else {
        res.data.comments = [];
      }
      
      item.value = res.data;
      
      // 确保 images 属性存在且为数组
      if (!item.value.images) {
        item.value.images = []
      } else if (typeof item.value.images === 'string') {
        // 如果是字符串，尝试解析为数组
        try {
          item.value.images = JSON.parse(item.value.images)
        } catch (e) {
          item.value.images = [item.value.images]
        }
      }
      
      if (!item.value.relatedItems || !item.value.relatedItems.length) {
        // 如果服务器没有返回相关物品，则生成一些
        item.value.relatedItems = generateRelatedItems();
      }
      
      // 启动自动轮播
      nextTick(() => {
        startAutoPlay();
      });
    } else {
      console.warn('获取失物招领详情响应不正确:', res)
      // 使用模拟数据
      item.value = generateMockData(id)
      showToast('使用模拟数据显示')
      
      // 启动自动轮播
      nextTick(() => {
        startAutoPlay();
      });
    }
  } catch (error) {
    console.error('获取失物招领详情失败:', error)
    // 使用模拟数据
    const id = route.params.id
    item.value = generateMockData(id)
    showToast('加载失败，已显示模拟数据')
    
    // 启动自动轮播
    nextTick(() => {
      startAutoPlay();
    });
  } finally {
    loading.value = false
  }
}

// 切换关注状态
const toggleFollow = async () => {
  console.log('toggleFollow clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  // 在真实环境中应调用对应的API
  // 这里仅做前端模拟
  item.value.isFollowed = !item.value.isFollowed
  showToast(item.value.isFollowed ? '关注成功' : '已取消关注')
}

// 联系发布者
const contactPublisher = () => {
  console.log('contactPublisher clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  if (isCurrentUser.value) {
    showToast('不能联系自己')
    return
  }
  
  // 这里应该弹出联系方式选择弹窗
  // 简化处理，直接跳转到聊天页面
  goToChat(item.value.publisher.id)
}

// 拨打电话
const callPhone = (phone) => {
  window.location.href = `tel:${phone}`
}

// 复制微信号
const copyWechat = (wechat) => {
  navigator.clipboard.writeText(wechat).then(
    () => {
      showToast('微信号已复制')
    },
    () => {
      showToast('复制失败，请手动复制')
    }
  )
}

// 跳转到聊天页面
const goToChat = (userId) => {
  router.push(`/chat/${userId}`)
}

// 更新物品状态
const updateStatus = async (status) => {
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  
  if (!isCurrentUser.value) {
    showToast('只有发布者才能更新状态')
    return
  }
  
  try {
    const id = item.value.id
    const res = await updateLostFoundStatus(id, status)
    
    if (res.code === 200) {
      item.value.status = status
      showStatusUpdatePopup.value = false
      showToast('状态更新成功')
    } else {
      showToast('状态更新失败')
    }
  } catch (error) {
    console.error('状态更新失败', error)
    showToast('状态更新失败，请稍后重试')
  }
}

// 显示留言框
const showComment = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  showCommentInput.value = true
  replyTo.value = null
  
  nextTick(() => {
    const commentInputEl = document.querySelector('.comment-input input')
    if (commentInputEl) {
      commentInputEl.focus()
    }
  })
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
    const id = item.value.id
    const data = {
      content: commentText.value,
      replyToId: replyTo.value ? replyTo.value.id : null
    }
    
    const res = await commentLostFound(id, data)
    
    if (res.code === 200) {
      // 如果是回复评论
      if (replyTo.value && replyTo.value.commentId) {
        const comment = item.value.comments.find(c => c.id === replyTo.value.commentId)
        if (comment) {
          if (!comment.replies) {
            comment.replies = []
          }
          // 确保回复数据格式正确
          const replyData = {
            ...res.data,
            replyTo: {
              id: replyTo.value.id,
              name: replyTo.value.name
            }
          }
          comment.replies.push(replyData)
        }
      } else {
        // 如果是新评论
        if (!item.value.comments) {
          item.value.comments = []
        }
        item.value.comments.unshift(res.data)
        item.value.commentCount = (item.value.commentCount || 0) + 1
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

// 图片轮播相关功能
// 切换到上一张图片
const prevImage = () => {
  if (!item.value?.images || item.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + item.value.images.length) % item.value.images.length;
}

// 切换到下一张图片
const nextImage = () => {
  if (!item.value?.images || item.value.images.length <= 1) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % item.value.images.length;
}

// 自动轮播
const startAutoPlay = () => {
  if (item.value?.images && item.value.images.length > 1) {
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

// 图片预览
const previewImage = (index) => {
  currentImageIndex.value = index;
  previewSrc.value = item.value.images[index];
  showImagePreview.value = true;
  stopAutoPlay(); // 预览模式停止自动轮播
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false;
  previewSrc.value = '';
  startAutoPlay(); // 关闭预览后重新开始自动轮播
}

// 分享物品
const shareItem = () => {
  console.log('shareItem clicked!') // 调试日志
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

// 跳转到其他失物招领详情
const goToLostFoundDetail = (id) => {
  if (id === item.value.id) return
  router.push(`/lost-found/detail/${id}`)
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 更新点赞功能
const likeItem = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const id = item.value.id
    let res
    
    if (item.value.isLiked) {
      res = await unlikeLostFound(id)
    } else {
      res = await likeLostFound(id)
    }
    
    if (res.code === 200) {
      item.value.isLiked = res.data.isLiked
      item.value.likes = res.data.likeCount
      showToast(item.value.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      showToast('操作失败')
    }
  } catch (error) {
    console.error('点赞操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 评论点赞功能
const likeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  console.log('点赞评论:', comment.id);
  // 在实际项目中，调用评论点赞API
  try {
    // 如果有API可以调用实际API：
    // const res = await api.lostFound.likeComment(comment.id);
    
    // 前端模拟点赞效果
    comment.isLiked = !comment.isLiked;
    comment.likeCount = comment.isLiked ? (comment.likeCount || 0) + 1 : Math.max(0, (comment.likeCount || 1) - 1);
    showToast(comment.isLiked ? '点赞成功' : '已取消点赞');
  } catch (error) {
    console.error('点赞评论失败', error);
    showToast('操作失败，请稍后重试');
  }
}

// 查看更多相似物品
const viewMoreSimilar = () => {
  // 导航到包含类似物品的搜索页面
  if (item.value && item.value.category) {
    router.push({
      path: '/lost-found/list',
      query: { 
        category: item.value.category,
        type: item.value.type 
      }
    });
  }
}

// 查看更多相关物品
const viewMoreRelated = () => {
  // 导航到包含相关物品的搜索页面
  if (item.value) {
    router.push({
      path: '/lost-found/list',
      query: { 
        type: item.value.type === 'lost' ? 'found' : 'lost',  // 类型相反
        keyword: item.value.title?.split(/\s+/)[0] || ''  // 使用标题的第一个关键词
      }
    });
  }
}

// 格式化数字显示
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  
  const number = parseInt(num);
  if (number < 1000) {
    return number.toString();
  } else if (number < 10000) {
    return (number / 1000).toFixed(1) + 'K';
  } else {
    return (number / 10000).toFixed(1) + 'W';
  }
}

// 查看位置
const viewLocation = () => {
  if (item.value && item.value.location) {
    if (item.value.coordinates) {
      const { latitude, longitude } = item.value.coordinates
      window.open(`https://maps.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(item.value.location)}`, '_blank')
    }
  } else {
    showToast('暂无地理位置信息')
  }
}

// 组件挂载
onMounted(() => {
  fetchLostFoundDetail()
  
  // 添加调试事件
  document.querySelector('.bottom-action-bar')?.addEventListener('click', (event) => {
    console.log('点击了底部操作栏:', event.target);
  });
})

// 组件卸载前清理
onBeforeUnmount(() => {
  stopAutoPlay()
})
</script>

<style scoped>
/* 通用样式修复 */
.no-comment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #999;
}

.no-data-icon {
  width: 60px;
  height: 60px;
  background-color: #f5f5f5;
  border-radius: 50%;
  margin-bottom: 15px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M9,11H7V9h2V11z M13,11h-2V9h2V11z M17,11h-2V9h2V11z"/></svg>');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 32px;
}

.no-data-text {
  font-size: 14px;
}

/* iOS风格轮播图样式 */
.image-carousel {
  position: relative;
  margin: 16px 0;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f8f8f8;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.carousel-container {
  position: relative;
}

.carousel-main {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background-color: #f2f2f2;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
  user-select: none;
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.carousel-nav:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.05);
}

.carousel-nav.prev {
  left: 12px;
}

.carousel-nav.next {
  right: 12px;
}

.carousel-nav i {
  font-size: 20px;
  color: #333;
}

/* 分页指示器 */
.carousel-indicators {
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  z-index: 10;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.5);
  margin: 0 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  width: 16px;
  background-color: white;
}

/* 缩略图导航 */
.carousel-thumbnails {
  display: flex;
  overflow-x: auto;
  padding: 12px;
  gap: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.carousel-thumbnails::-webkit-scrollbar {
  display: none;
}

.thumbnail {
  flex: 0 0 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.6;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.thumbnail.active {
  opacity: 1;
  border-color: #007AFF;
}

.thumbnail:hover {
  opacity: 0.9;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* 评论列表样式优化 */
.comment-list {
  width: 100%;
}

.comment-item {
  display: flex;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f2f2;
}

.comment-user {
  flex-shrink: 0;
  margin-right: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  overflow: hidden;
}

.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.comment-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-right: 8px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-label {
  background-color: #ff9500;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 8px;
}

.comment-time {
  font-size: 12px;
  color: #8e8e93;
  margin-left: auto;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
  color: #333;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.reply-btn, .like-btn {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8e8e93;
  margin-left: 16px;
  cursor: pointer;
}

.like-btn.active,
.like-btn .active {
  color: #ff2d55;
}

.reply-list {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
}

.reply-item {
  padding: 8px 0;
}

.reply-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.reply-content {
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.reply-name {
  font-weight: 500;
  color: #333;
}

.reply-to {
  color: #8e8e93;
}

.reply-to-name {
  color: #007AFF;
}

.reply-text {
  color: #333;
  margin-left: 4px;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.reply-time {
  color: #8e8e93;
}

/* 图片预览 */
.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.preview-close i {
  color: white;
  font-size: 20px;
}

/* 相似物品推荐样式 */
.similar-items {
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

.similar-scroll {
  display: flex;
  overflow-x: auto;
  padding: 8px 0;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  gap: 12px;
}

.similar-scroll::-webkit-scrollbar {
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

.item-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: rgba(0, 0, 0, 0.6);
}

.status-pending {
  background: rgba(255, 149, 0, 0.8);
}

.status-success {
  background: rgba(52, 199, 89, 0.8);
}

.status-closed {
  background: rgba(142, 142, 147, 0.8);
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: #8e8e93;
}

.similar-location {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 4px;
}

.similar-time {
  font-size: 11px;
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

/* 底部操作栏样式 */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 15px;
  background-color: #fff;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 101;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 50%;
  position: relative;
  z-index: 10;
  cursor: pointer;
  pointer-events: auto !important;
}

/* 添加明显的点击反馈 */
.action-icon:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  pointer-events: auto !important;
}

.action-contact {
  background-color: #f2f2f2;
  color: #333;
}

.action-primary {
  background-color: var(--primary-color, #007AFF);
  color: white;
}

/* 添加明显的点击反馈 */
.action-btn:active {
  transform: scale(0.97);
}

/* 修复点赞和评论图标样式 */
.icon-like, .icon-comment, .icon-share {
  font-size: 22px;
  color: #8e8e93;
  display: inline-block;
}

.icon-like.active {
  color: #ff2d55;
}

.icon-count {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 4px;
  text-align: center;
}

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
  font-weight: 500;
  color: #333;
}
</style>