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
          <span class="item-category">{{ item.category }}</span>
          <span class="item-time">{{ formatTime(item.eventTime) }}</span>
        </div>
      </div>
      
      <!-- 图片展示 -->
      <div class="item-images" v-if="item.images && item.images.length > 0">
        <div 
          v-for="(image, index) in item.images" 
          :key="index" 
          class="image-item"
          @click="previewImage(index)"
        >
          <img :src="image" :alt="item.title">
        </div>
      </div>
      
      <!-- 详情信息 -->
      <div class="detail-section">
        <div class="section-title">详情信息</div>
        
        <div class="detail-item">
          <div class="detail-label">物品描述</div>
          <div class="detail-content">{{ item.description }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">{{ item.type === 'lost' ? '丢失地点' : '拾获地点' }}</div>
          <div class="detail-content">{{ item.location }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">{{ item.type === 'lost' ? '丢失时间' : '拾获时间' }}</div>
          <div class="detail-content">{{ formatDetailTime(item.eventTime) }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">发布时间</div>
          <div class="detail-content">{{ formatDetailTime(item.createTime) }}</div>
        </div>
        
        <div class="detail-item" v-if="item.reward && item.type === 'lost'">
          <div class="detail-label">悬赏金额</div>
          <div class="detail-content reward">¥{{ item.reward }}</div>
        </div>
      </div>
      
      <!-- 联系信息 -->
      <div class="contact-section">
        <div class="section-title">联系信息</div>
        
        <div class="user-info" @click="goToUserProfile(item.publisher.id)">
          <img :src="item.publisher.avatar" class="user-avatar" :alt="item.publisher.name">
          <div class="user-meta">
            <div class="user-name">
              {{ item.publisher.name }}
              <i class="icon-verified" v-if="item.publisher.verified"></i>
            </div>
            <div class="user-school">{{ item.publisher.school }}</div>
          </div>
          <div class="contact-btn" v-if="!isCurrentUser">联系Ta</div>
        </div>
        
        <div class="contact-methods" v-if="item.contactInfo">
          <div class="contact-item" v-if="item.contactInfo.phone && (isCurrentUser || item.contactInfo.showPhone)">
            <i class="icon-phone"></i>
            <div class="contact-info">
              <div class="contact-label">电话</div>
              <div class="contact-value">{{ item.contactInfo.phone }}</div>
            </div>
            <div class="action-btn" v-if="!isCurrentUser" @click="callPhone(item.contactInfo.phone)">拨打</div>
          </div>
          
          <div class="contact-item" v-if="item.contactInfo.wechat && (isCurrentUser || item.contactInfo.showWechat)">
            <i class="icon-wechat"></i>
            <div class="contact-info">
              <div class="contact-label">微信</div>
              <div class="contact-value">{{ item.contactInfo.wechat }}</div>
            </div>
            <div class="action-btn" v-if="!isCurrentUser" @click="copyWechat(item.contactInfo.wechat)">复制</div>
          </div>
          
          <div class="contact-item" v-if="!isCurrentUser">
            <i class="icon-chat"></i>
            <div class="contact-info">
              <div class="contact-label">站内聊天</div>
              <div class="contact-value">在线交流更方便</div>
            </div>
            <div class="action-btn" @click="goToChat(item.publisher.id)">聊天</div>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div class="comment-section">
        <div class="section-title">
          <span>留言 {{ item.commentCount || 0 }}</span>
          <span class="comment-btn" @click="showComment">我要留言</span>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list" v-if="item.comments && item.comments.length > 0">
          <div 
            v-for="comment in item.comments" 
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
        
        <!-- 无评论 -->
        <div class="no-comment" v-else>
          <div class="no-data-icon"></div>
          <div class="no-data-text">暂无留言</div>
        </div>
      </div>
      
      <!-- 相似物品推荐 -->
      <div class="similar-items" v-if="item.similarItems && item.similarItems.length > 0">
        <div class="section-title">相似{{ item.type === 'lost' ? '丢失物品' : '招领物品' }}</div>
        <div class="item-scroll">
          <div 
            v-for="simItem in item.similarItems" 
            :key="simItem.id" 
            class="similar-item"
            @click="goToLostFoundDetail(simItem.id)"
          >
            <div class="item-image">
              <img :src="simItem.images && simItem.images.length > 0 ? simItem.images[0] : '/placeholder.png'" :alt="simItem.title">
              <div class="item-status" :class="getStatusClass(simItem.status)">{{ getStatusText(simItem.status) }}</div>
            </div>
            <div class="item-info">
              <div class="item-title">{{ simItem.title }}</div>
              <div class="item-meta">
                <span class="item-location">{{ simItem.location }}</span>
                <span class="item-time">{{ formatTime(simItem.eventTime) }}</span>
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
        <div class="action-icon" @click="toggleFollow">
          <i :class="['icon-star', {'active': item.isFollowed}]"></i>
          <div class="icon-text">{{ item.isFollowed ? '已关注' : '关注' }}</div>
        </div>
        <div class="action-icon" @click="shareItem">
          <i class="icon-share"></i>
          <div class="icon-text">分享</div>
        </div>
      </div>
      <div class="action-buttons">
        <button 
          class="action-btn contact" 
          v-if="!isCurrentUser" 
          @click="contactPublisher"
        >联系发布者</button>
        <button 
          class="action-btn update-status" 
          v-if="isCurrentUser && item.status !== 'closed'"
          @click="showStatusUpdatePopup = true"
        >{{ item.type === 'lost' ? '标记为已找到' : '标记为已归还' }}</button>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getLostFoundDetail, updateLostFoundStatus, commentLostFound } from '@/api/lostFound'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const item = ref({})
const loading = ref(true)
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
      { value: 'closed', label: '关闭' }
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

// 获取失物招领详情
const fetchLostFoundDetail = async () => {
  loading.value = true
  
  try {
    const id = route.params.id
    const res = await getLostFoundDetail(id)
    
    if (res.code === 200) {
      item.value = res.data
    } else {
      showToast('获取详情失败')
    }
  } catch (error) {
    console.error('获取详情失败', error)
    showToast('获取详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换关注状态
const toggleFollow = async () => {
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
  // 等待DOM更新后聚焦
  setTimeout(() => {
    const inputEl = document.querySelector('.comment-input input')
    if (inputEl) {
      inputEl.focus()
    }
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
          comment.replies.push(res.data)
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

// 图片预览
const previewImage = (index) => {
  previewSrc.value = item.value.images[index]
  showImagePreview.value = true
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false
  previewSrc.value = ''
}

// 分享物品
const shareItem = () => {
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
  router.push(`/lost-found/${id}`)
}

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 页面加载时获取失物招领详情
onMounted(async () => {
  await fetchLostFoundDetail()
})
</script>