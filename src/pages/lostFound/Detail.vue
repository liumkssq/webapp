<template>
  <div class="lost-found-detail-page">
    <!-- 头部导航 -->
    <HeaderNav 
      :title="item.type === 'lost' ? '寻物启事' : '招领启事'" 
      :showBack="true" 
      class="ios-header"
    />
    
    <!-- 主要内容区域 -->
    <div class="detail-container">
      <!-- 物品图片 -->
      <div class="image-container" v-if="item.images && item.images.length > 0">
        <swiper 
          :slides-per-view="1" 
          :pagination="{ clickable: true }" 
          :autoplay="{ delay: 3000 }"
          class="image-swiper"
        >
          <swiper-slide v-for="(img, index) in parsedImages" :key="index">
            <img :src="img" @error="handleImageError" class="detail-image" :alt="item.title">
          </swiper-slide>
        </swiper>
      </div>
      
      <!-- 物品基本信息 -->
      <div class="info-card ios-card">
      <div class="item-header">
          <div class="item-status ios-badge" :class="item.status">{{ 
            item.status === 'open' ? '进行中' : 
            item.status === 'pending' ? '确认中' : '已完成' 
          }}</div>
          <h1 class="item-title">{{ item.title }}</h1>
      </div>
      
        <div class="item-meta">
          <div class="meta-item">
            <svg-icon name="location" class="ios-icon" />
            <span>{{ item.location || '未知位置' }}</span>
            </div>
          <div class="meta-item">
            <svg-icon name="time" class="ios-icon" />
            <span>{{ formatTime(item.createTime) }}</span>
            </div>
          <div class="meta-item">
            <svg-icon name="category" class="ios-icon" />
            <span>{{ item.category?.name || '未分类' }}</span>
            </div>
          </div>
          
        <div class="item-description">
          <h2 class="section-title">物品描述</h2>
          <p class="description-text">{{ item.description }}</p>
        </div>
      </div>
      
      <!-- 发布者信息 -->
      <div class="publisher-card ios-card">
        <h2 class="section-title">发布者信息</h2>
        <div class="publisher-info">
          <img :src="item.publisher?.avatar || '/images/default-avatar.jpg'" class="publisher-avatar" alt="发布者头像">
          <div class="publisher-detail">
            <div class="publisher-name">{{ item.publisher?.nickname || '未知用户' }}</div>
            <div class="publisher-time">发布于 {{ formatTime(item.createTime) }}</div>
        </div>
          <div class="contact-btn" v-if="item.status === 'open'" @click="contactPublisher">
            <svg-icon name="chat" class="ios-icon" />
            <span>联系TA</span>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div class="comments-card ios-card">
        <h2 class="section-title">互动区 ({{ comments.length }})</h2>
        
        <!-- 评论列表 -->
        <div class="comments-list" v-if="comments.length > 0">
          <div class="comment-item" v-for="(comment, index) in comments" :key="index">
            <img :src="comment.user?.avatar || '/images/default-avatar.jpg'" class="comment-avatar" alt="评论者头像">
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.user?.nickname || '未知用户' }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              
              <!-- 回复列表 -->
              <div class="replies" v-if="comment.replies && comment.replies.length > 0">
                <div class="reply-item" v-for="(reply, rIndex) in comment.replies" :key="rIndex">
                  <span class="reply-user">{{ reply.user?.nickname || '未知用户' }}</span>
                    <span class="reply-text">{{ reply.content }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 无评论提示 -->
        <div class="no-comments" v-else>
          <svg-icon name="comment-empty" class="empty-icon" />
          <span>暂无评论，快来留言吧</span>
      </div>
      
        <!-- 评论输入框 -->
        <div class="comment-input-container">
        <input 
          type="text" 
          v-model="commentText" 
            placeholder="说点什么..." 
            class="comment-input ios-input"
            @keyup.enter="submitComment"
          />
          <button class="submit-btn" :disabled="!commentText.trim()" @click="submitComment">
            <svg-icon name="send" class="ios-icon" />
          </button>
      </div>
    </div>
    
      <!-- 相关推荐 -->
      <div class="related-card ios-card" v-if="relatedItems.length > 0">
        <h2 class="section-title">相关物品</h2>
        <div class="related-list">
          <div 
            class="related-item" 
            v-for="relatedItem in relatedItems" 
            :key="relatedItem.id"
            @click="goToDetail(relatedItem.id)"
          >
            <img :src="getImageUrl(relatedItem)" class="related-image" :alt="relatedItem.title">
            <div class="related-title">{{ relatedItem.title }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <div class="action-button share-btn" @click="shareItem">
        <svg-icon name="share" class="action-icon" />
        <span>分享</span>
    </div>
    
      <div class="action-button primary-btn" @click="handlePrimaryAction">
        <svg-icon :name="primaryActionIcon" class="action-icon" />
        <span>{{ primaryActionText }}</span>
      </div>
    </div>
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
.lost-found-detail-page {
  min-height: 100vh;
  background-color: var(--background-secondary);
  padding-top: calc(var(--header-height) + var(--safe-area-inset-top));
  padding-bottom: calc(60px + var(--safe-area-inset-bottom));
}

.ios-header {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.85);
  border-bottom: 0.5px solid var(--separator-color);
}

.detail-container {
  padding: 16px;
}

.ios-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 0.5px solid var(--separator-color);
}

.image-container {
  height: 240px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.image-swiper {
  height: 100%;
}

.detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-header {
  position: relative;
  margin-bottom: 16px;
}

.item-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding-right: 80px;
  line-height: 1.3;
}

.ios-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.ios-badge.open {
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--warning-color);
}

.ios-badge.pending {
  background-color: rgba(0, 122, 255, 0.1);
  color: var(--primary-color);
}

.ios-badge.closed {
  background-color: rgba(52, 199, 89, 0.1);
  color: var(--success-color);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.ios-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.description-text {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

.publisher-info {
  display: flex;
  align-items: center;
}

.publisher-avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  object-fit: cover;
  margin-right: 12px;
  border: 1px solid var(--separator-color);
}

.publisher-detail {
  flex: 1;
}

.publisher-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.publisher-time {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.contact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.contact-btn .ios-icon {
  color: white;
}

.comments-list {
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 0.5px solid var(--separator-color);
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  object-fit: cover;
  margin-right: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.replies {
  padding: 8px;
  background-color: var(--background-tertiary);
  border-radius: 8px;
}

.reply-item {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-user {
  font-weight: 500;
  color: var(--primary-color);
  margin-right: 4px;
}

.reply-text {
  color: var(--text-secondary);
}

.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  color: var(--text-tertiary);
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.comment-input-container {
  display: flex;
  align-items: center;
  margin-top: 16px;
  background-color: var(--background-tertiary);
  border-radius: 20px;
  padding: 4px;
}

.ios-input {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.submit-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: var(--text-tertiary);
  opacity: 0.5;
}

.related-list {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.related-list::-webkit-scrollbar {
  display: none;
}

.related-item {
  flex: 0 0 120px;
  border-radius: 8px;
  overflow: hidden;
}

.related-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.related-title {
  font-size: 13px;
  padding: 8px 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 12px 16px;
  background-color: white;
  border-top: 0.5px solid var(--separator-color);
  z-index: 10;
  padding-bottom: calc(12px + var(--safe-area-inset-bottom));
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
}

.share-btn {
  margin-right: 12px;
  background-color: rgba(0, 0, 0, 0.04);
  color: var(--text-secondary);
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.action-icon {
  width: 18px;
  height: 18px;
}

@media (prefers-color-scheme: dark) {
  .ios-header {
    background-color: rgba(30, 30, 30, 0.85);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .ios-card {
    background-color: rgba(50, 50, 50, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .comment-input-container {
    background-color: rgba(255, 255, 255, 0.08);
  }
  
  .replies {
    background-color: rgba(255, 255, 255, 0.08);
  }
  
  .bottom-actions {
    background-color: rgba(50, 50, 50, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .share-btn {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>