<template>
  <div class="article-detail-page">
    <!-- 引入通用头部导航组件 -->
    <HeaderNav :title="article.title || '文章详情'" />
    
    <!-- 文章详情内容 -->
    <div class="article-content" v-if="!loading">
      <!-- 文章标题 -->
      <h1 class="article-title">{{ article.title }}</h1>
      
      <!-- 作者信息 -->
      <div class="author-info" @click="goToUserProfile(article.author.id)">
        <img :src="article.author.avatar" class="author-avatar" :alt="article.author.name">
        <div class="author-meta">
          <div class="author-name">
            {{ article.author.name }}
            <i class="icon-verified" v-if="article.author.verified"></i>
          </div>
          <div class="author-details">
            <span>{{ article.author.school }}</span>
            <span class="post-time">{{ formatTime(article.createTime) }}</span>
          </div>
        </div>
        <div class="follow-btn" v-if="!isCurrentUser" @click.stop="toggleFollow">
          {{ article.isFollowed ? '已关注' : '关注' }}
        </div>
      </div>
      
      <!-- 文章内容 -->
      <div class="article-body">
        <p v-html="article.content"></p>
      </div>
      
      <!-- 文章图片 -->
      <div class="article-images" v-if="article.images && article.images.length > 0">
        <div 
          v-for="(image, index) in article.images" 
          :key="index" 
          class="article-image-item"
          @click="previewImage(index)"
        >
          <img :src="image" :alt="article.title">
        </div>
      </div>
      
      <!-- 文章标签 -->
      <div class="article-tags" v-if="article.tags && article.tags.length > 0">
        <span 
          v-for="(tag, index) in article.tags" 
          :key="index" 
          class="tag-item"
          @click="searchByTag(tag)"
        >
          #{{ tag }}
        </span>
      </div>
      
      <!-- 文章底部信息 -->
      <div class="article-stats">
        <div class="stat-item">
          <i class="icon-view"></i>
          <span>{{ formatNumber(article.viewCount) }}</span>
        </div>
        <div class="stat-item">
          <i class="icon-comment"></i>
          <span>{{ formatNumber(article.commentCount) }}</span>
        </div>
        <div class="stat-item">
          <i class="icon-like"></i>
          <span>{{ formatNumber(article.likeCount) }}</span>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="article-actions">
        <div class="action-icons">
          <div class="action-icon" @click="toggleLike" style="position: relative; z-index: 10;">
            <i :class="['icon-like', {'active': article.isLiked}]"></i>
            <div class="icon-count">{{ formatNumber(article.likeCount) }}</div>
          </div>
          <div class="action-icon" @click="showComments" style="position: relative; z-index: 10;">
            <i class="icon-comment"></i>
            <div class="icon-count">{{ formatNumber(article.commentCount) }}</div>
          </div>
          <div class="action-icon" @click="toggleCollect" style="position: relative; z-index: 10;">
            <i :class="['icon-star', {'active': article.isCollected}]"></i>
            <div class="icon-count">{{ article.isCollected ? '已收藏' : '收藏' }}</div>
          </div>
          <div class="action-icon" @click="shareArticle" style="position: relative; z-index: 10;">
            <i class="icon-share"></i>
            <div class="icon-count">分享</div>
          </div>
        </div>
      </div>
      
      <!-- 评论区 -->
      <div class="comment-section" ref="commentSection">
        <div class="section-title">
          <span>评论 {{ article.commentCount }}</span>
        </div>
        
        <!-- 评论列表 -->
        <div class="comment-list" v-if="article.comments && article.comments.length > 0">
          <div 
            v-for="comment in article.comments" 
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
        
        <!-- 无评论提示 -->
        <div class="no-comment" v-else>
          <div class="no-data-icon">
            <i class="icon-comment-empty"></i>
          </div>
          <div class="no-data-text">暂无评论，快来抢沙发吧~</div>
        </div>
      </div>
      
      <!-- 评论输入框 -->
      <div class="comment-input-wrapper">
        <div class="comment-input">
          <input 
            type="text" 
            v-model="commentText" 
            :placeholder="replyTo ? `回复 ${replyTo.name}` : '写评论...'" 
            @focus="showFullCommentBox = true"
          >
          <button 
            class="comment-submit" 
            :disabled="!commentText.trim()" 
            @click="submitComment"
          >发送</button>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
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
import { getArticleDetail, likeArticle, unlikeArticle, collectArticle, uncollectArticle, commentArticle } from '@/api/article'
import { followUser, unfollowUser } from '@/api/user'
import HeaderNav from '@/components/HeaderNav.vue'
import FooterNav from '@/components/FooterNav.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 状态变量
const article = ref({})
const loading = ref(true)
const commentText = ref('')
const replyTo = ref(null)
const showFullCommentBox = ref(false)
const showImagePreview = ref(false)
const previewSrc = ref('')
const showSharePopup = ref(false)
const toast = reactive({
  show: false,
  message: ''
})

// 计算当前用户是否是文章作者
const isCurrentUser = computed(() => {
  return article.value.author && article.value.author.id === userStore.userId
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

// 获取文章详情
const fetchArticleDetail = async () => {
  loading.value = true
  
  try {
    const articleId = route.params.id
    const res = await getArticleDetail(articleId)
    
    if (res.code === 200) {
      article.value = res.data
    } else {
      showToast('获取文章详情失败')
    }
  } catch (error) {
    console.error('获取文章详情失败', error)
    showToast('获取文章详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换点赞状态
const toggleLike = async () => {
  console.log('toggleLike clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const articleId = article.value.id
    let res
    
    if (article.value.isLiked) {
      res = await unlikeArticle(articleId)
    } else {
      res = await likeArticle(articleId)
    }
    
    if (res.code === 200) {
      article.value.isLiked = res.data.isLiked
      article.value.likeCount = res.data.likeCount
      showToast(article.value.isLiked ? '点赞成功' : '已取消点赞')
    }
  } catch (error) {
    console.error('点赞操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 切换收藏状态
const toggleCollect = async () => {
  console.log('toggleCollect clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const articleId = article.value.id
    let res
    
    if (article.value.isCollected) {
      res = await uncollectArticle(articleId)
    } else {
      res = await collectArticle(articleId)
    }
    
    if (res.code === 200) {
      article.value.isCollected = res.data.isCollected
      showToast(article.value.isCollected ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏操作失败', error)
    showToast('操作失败，请稍后重试')
  }
}

// 切换关注状态
const toggleFollow = async () => {
  console.log('toggleFollow clicked!') // 调试日志
  
  if (!userStore.isLoggedIn) {
    router.push('/login?redirect=' + route.fullPath)
    return
  }
  
  try {
    const authorId = article.value.author.id
    let res
    
    if (article.value.isFollowed) {
      res = await unfollowUser(authorId)
    } else {
      res = await followUser(authorId)
    }
    
    if (res.code === 200) {
      article.value.isFollowed = res.data.isFollowed
      showToast(article.value.isFollowed ? '关注成功' : '已取消关注')
    }
  } catch (error) {
    console.error('关注操作失败', error)
    showToast('操作失败，请稍后重试')
  }
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
    const articleId = article.value.id
    const data = {
      content: commentText.value,
      replyToId: replyTo.value ? replyTo.value.id : null
    }
    
    const res = await commentArticle(articleId, data)
    
    if (res.code === 200) {
      // 如果是回复评论
      if (replyTo.value && replyTo.value.commentId) {
        const comment = article.value.comments.find(c => c.id === replyTo.value.commentId)
        if (comment) {
          if (!comment.replies) {
            comment.replies = []
          }
          comment.replies.push(res.data)
        }
      } else {
        // 如果是新评论
        article.value.comments.unshift(res.data)
        article.value.commentCount++
      }
      
      commentText.value = ''
      replyTo.value = null
      showToast('评论成功')
    }
  } catch (error) {
    console.error('评论提交失败', error)
    showToast('评论失败，请稍后重试')
  }
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
  
  // 聚焦输入框
  document.querySelector('.comment-input input').focus()
}

// 图片预览
const previewImage = (index) => {
  previewSrc.value = article.value.images[index]
  showImagePreview.value = true
}

// 关闭预览
const closePreview = () => {
  showImagePreview.value = false
  previewSrc.value = ''
}

// 通过标签搜索
const searchByTag = (tag) => {
  router.push(`/article-list?tag=${tag}`)
}

// 滚动到评论区
const scrollToComments = () => {
  const commentSection = document.querySelector('.comment-section')
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// 分享文章
const shareArticle = () => {
  console.log('shareArticle clicked!') // 调试日志
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

// 显示提示消息
const showToast = (message) => {
  toast.message = message
  toast.show = true
  
  setTimeout(() => {
    toast.show = false
  }, 2000)
}

// 页面加载时获取文章详情
onMounted(async () => {
  await fetchArticleDetail()
})
</script>

<style scoped>
.article-actions {
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

.icon-like, .icon-comment, .icon-star, .icon-share {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.icon-count {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  pointer-events: none;
}
</style>