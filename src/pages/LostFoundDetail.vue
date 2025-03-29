<template>
  <div class="lost-found-detail-container">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">{{ item.type === 'lost' ? '寻物启事' : '失物招领' }}</div>
      <div class="more-btn" @click="showOptions">
        <i class="icon-more"></i>
      </div>
    </div>
    
    <!-- 失物招领信息卡片 -->
    <div class="item-card">
      <div class="item-header">
        <div class="user-info">
          <img :src="item.user?.avatar" alt="用户头像" class="user-avatar">
          <div class="user-detail">
            <div class="user-name">{{ item.user?.name }}</div>
            <div class="post-time">{{ formatDate(item.createTime) }}</div>
          </div>
        </div>
        <div class="status-tag" :class="item.status">
          {{ item.status === 'open' ? '未解决' : '已解决' }}
        </div>
      </div>
      
      <h1 class="item-title">{{ item.title }}</h1>
      
      <!-- 图片轮播 -->
      <div class="item-images" v-if="item.images && item.images.length > 0">
        <div class="swiper-container">
          <div class="swiper-slide" v-for="(image, index) in item.images" :key="index">
            <img :src="image" :alt="`图片${index + 1}`" @click="previewImage(index)">
          </div>
        </div>
        <div class="swiper-pagination"></div>
      </div>
      
      <!-- 失物招领详情 -->
      <div class="item-info">
        <div class="info-row">
          <span class="info-label">类别：</span>
          <span class="info-value">{{ item.category }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">地点：</span>
          <span class="info-value">{{ item.location }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ item.type === 'lost' ? '丢失' : '拾获' }}时间：</span>
          <span class="info-value">{{ formatDate(item.lostFoundTime) }}</span>
        </div>
        <div class="info-row" v-if="item.type === 'lost' && item.reward > 0">
          <span class="info-label">酬谢：</span>
          <span class="info-value reward">￥{{ item.reward }}</span>
        </div>
      </div>
      
      <!-- 详细描述 -->
      <div class="item-description">
        <div class="description-title">详细描述</div>
        <p class="description-content">{{ item.description }}</p>
      </div>
      
      <!-- 联系信息 -->
      <div class="contact-info">
        <div class="contact-title">联系方式</div>
        <div class="contact-content">
          <span class="contact-label">{{ item.contactWay }}：</span>
          <span class="contact-value">{{ item.contactInfo }}</span>
          <button class="copy-btn" @click="copyContactInfo">复制</button>
        </div>
      </div>
    </div>
    
    <!-- 评论区 -->
    <div class="comments-section">
      <div class="comments-header">
        <span class="comments-title">评论区</span>
        <span class="comments-count">{{ item.comments?.length || 0 }}</span>
      </div>
      
      <!-- 评论列表 -->
      <div class="comments-list" v-if="item.comments && item.comments.length > 0">
        <div class="comment-item" v-for="comment in item.comments" :key="comment.id">
          <div class="comment-user">
            <img :src="comment.userAvatar" alt="评论用户头像" class="comment-user-avatar">
            <div class="comment-user-info">
              <div class="comment-user-name">{{ comment.userName }}</div>
              <div class="comment-time">{{ formatDate(comment.createTime) }}</div>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
      
      <!-- 没有评论时显示 -->
      <div class="no-comments" v-else>
        <span>暂无评论，来说点什么吧~</span>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <div class="comment-input-area">
        <input 
          type="text" 
          v-model="commentContent" 
          placeholder="写评论..." 
          class="comment-input"
        >
      </div>
      
      <div class="action-buttons">
        <button class="share-btn" @click="shareItem">
          <i class="icon-share"></i>
          <span>分享</span>
        </button>
        
        <button 
          class="contact-btn" 
          @click="contactUser"
          v-if="item.status === 'open'"
        >
          联系 {{ item.type === 'lost' ? '失主' : '拾主' }}
        </button>
        
        <button 
          class="solve-btn" 
          @click="markAsSolved"
          v-if="item.status === 'open' && isMyPost"
        >
          标记为已解决
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLostFoundDetail, addComment, markAsSolved as apiMarkAsSolved } from '@/api/lostFound'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 数据
const item = ref({
  id: '',
  type: 'lost', // 'lost' 或 'found'
  title: '',
  description: '',
  category: '',
  images: [],
  location: '',
  contactWay: '',
  contactInfo: '',
  reward: 0,
  user: null,
  createTime: '',
  lostFoundTime: '',
  status: 'open',
  views: 0,
  comments: []
})

// 评论内容
const commentContent = ref('')

// 是否是用户自己的发布
const isMyPost = computed(() => {
  return userStore.userId && item.value.user && item.value.user.id === userStore.userId
})

// 获取失物招领详情
const fetchItemDetail = async () => {
  try {
    const itemId = route.params.id
    if (!itemId) return
    
    const { data } = await getLostFoundDetail(itemId)
    item.value = data
  } catch (error) {
    console.error('获取失物招领详情失败', error)
  }
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

// 预览图片
const previewImage = (index) => {
  // 实现图片预览功能
  console.log('预览图片', index)
}

// 复制联系信息
const copyContactInfo = () => {
  navigator.clipboard.writeText(item.value.contactInfo)
    .then(() => {
      alert('联系方式已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败', err)
    })
}

// 显示更多选项菜单
const showOptions = () => {
  // 实现显示选项菜单功能
  console.log('显示更多选项')
}

// 发布评论
const submitComment = async () => {
  if (!commentContent.value.trim()) return
  
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    const params = {
      userId: userStore.userId,
      userName: userStore.nickname,
      userAvatar: userStore.avatar,
      content: commentContent.value.trim()
    }
    
    await addComment(item.value.id, params)
    
    // 刷新详情
    fetchItemDetail()
    
    // 清空评论内容
    commentContent.value = ''
  } catch (error) {
    console.error('发布评论失败', error)
  }
}

// 分享
const shareItem = () => {
  // 实现分享功能
  alert('分享功能开发中')
}

// 联系用户
const contactUser = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (item.value?.user?.id) {
    router.push(`/chat/${item.value.user.id}`)
  }
}

// 标记为已解决
const markAsSolved = async () => {
  if (!isMyPost.value) return
  
  try {
    await apiMarkAsSolved(item.value.id)
    
    // 刷新详情
    fetchItemDetail()
  } catch (error) {
    console.error('标记为已解决失败', error)
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchItemDetail()
})
</script>