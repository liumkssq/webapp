<template>
  <div class="article-detail-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="back-btn" @click="goBack">
      <span>返回</span>
    </div>
    
    <!-- 文章头部 -->
    <div class="article-header">
      <h1 class="article-title">{{ article.title }}</h1>
      
      <div class="article-meta">
        <div class="author-info" @click="goToUserPage(article.author.id)">
          <div class="author-avatar">
            <!-- 作者头像 -->
          </div>
          
          <div class="author-name">
            <p>{{ article.author.nickname }}</p>
            <p class="publish-time">{{ article.publishTime }}</p>
          </div>
        </div>
        
        <div class="follow-btn" v-if="!isAuthor" @click="handleFollowAction">
          {{ article.author.isFollowing ? '已关注' : '关注' }}
        </div>
      </div>
    </div>
    
    <!-- 文章内容 -->
    <div class="article-content">
      <div class="content-images" v-if="article.images && article.images.length">
        <div 
          v-for="(image, index) in article.images" 
          :key="index" 
          class="image-item"
        >
          <!-- 图片区域 -->
        </div>
      </div>
      
      <div class="content-text">
        <p v-html="article.content"></p>
      </div>
    </div>
    
    <!-- 文章标签 -->
    <div class="article-tags" v-if="article.tags && article.tags.length">
      <span 
        v-for="tag in article.tags" 
        :key="tag" 
        class="tag-item"
        @click="searchByTag(tag)"
      >
        {{ tag }}
      </span>
    </div>
    
    <!-- 文章操作栏 -->
    <div class="article-actions">
      <div class="action-item" @click="handleLike">
        <span class="action-icon">
          {{ article.isLiked ? '❤️' : '♡' }}
        </span>
        <span class="action-count">{{ article.likes }}</span>
      </div>
      
      <div class="action-item" @click="scrollToComments">
        <span class="action-icon">💬</span>
        <span class="action-count">{{ article.comments }}</span>
      </div>
      
      <div class="action-item" @click="handleShare">
        <span class="action-icon">分享</span>
      </div>
    </div>
    
    <!-- 评论区 -->
    <div class="comments-section" ref="commentsRef">
      <div class="section-header">
        <h3>评论 ({{ article.comments }})</h3>
      </div>
      
      <div class="comment-list">
        <div 
          v-for="comment in commentList" 
          :key="comment.id" 
          class="comment-item"
        >
          <div class="comment-author" @click="goToUserPage(comment.author.id)">
            <div class="author-avatar">
              <!-- 评论者头像 -->
            </div>
            
            <div class="author-name">
              {{ comment.author.nickname }}
            </div>
          </div>
          
          <div class="comment-content">
            <p>{{ comment.content }}</p>
          </div>
          
          <div class="comment-actions">
            <span class="comment-time">{{ comment.time }}</span>
            <span class="reply-btn" @click="replyToComment(comment)">回复</span>
            <span class="like-btn" @click="likeComment(comment)">
              {{ comment.isLiked ? '已赞' : '点赞' }}
            </span>
          </div>
          
          <!-- 回复列表 -->
          <div class="replies-list" v-if="comment.replies && comment.replies.length">
            <div 
              v-for="reply in comment.replies" 
              :key="reply.id" 
              class="reply-item"
            >
              <div class="reply-author">
                <span @click="goToUserPage(reply.author.id)">{{ reply.author.nickname }}</span>
                <span class="reply-to" v-if="reply.replyTo">
                  回复 
                  <span @click="goToUserPage(reply.replyTo.id)">{{ reply.replyTo.nickname }}</span>
                </span>
                :
              </div>
              
              <div class="reply-content">
                <p>{{ reply.content }}</p>
              </div>
              
              <div class="reply-actions">
                <span class="reply-time">{{ reply.time }}</span>
                <span class="reply-btn" @click="replyToReply(comment, reply)">回复</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 评论输入框 -->
      <div class="comment-input">
        <input
          v-model="commentContent"
          type="text"
          :placeholder="replyTarget ? `回复 ${replyTarget.nickname}` : '发表评论...'"
        />
        <button @click="submitComment">发送</button>
      </div>
    </div>
    
    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <div class="action-left" @click="goToUserPage(article.author.id)">
        <span>查看更多来自 {{ article.author.nickname }} 的内容</span>
      </div>
      
      <div class="action-right">
        <button @click="handleShare">分享</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 获取文章ID
const articleId = computed(() => route.params.id)

// 评论区引用
const commentsRef = ref(null)

// 文章数据
const article = reactive({
  id: '',
  title: '示例文章标题',
  content: '这是文章的详细内容...',
  publishTime: '2023-03-20 14:30',
  images: [/* 图片URL数组 */],
  tags: ['校园生活', '学习经验', '分享'],
  likes: 42,
  comments: 15,
  isLiked: false,
  author: {
    id: '1',
    nickname: '示例用户',
    avatar: '',
    isFollowing: false
  }
})

// 判断当前用户是否为作者
const isAuthor = computed(() => article.author.id === userStore.userId)

// 评论列表
const commentList = ref([
  {
    id: '1',
    content: '很棒的分享，谢谢！',
    time: '10分钟前',
    isLiked: false,
    author: {
      id: '2',
      nickname: '评论用户1',
      avatar: ''
    },
    replies: [
      {
        id: '101',
        content: '我也觉得很有帮助',
        time: '8分钟前',
        author: {
          id: '3',
          nickname: '评论用户2',
          avatar: ''
        },
        replyTo: {
          id: '2',
          nickname: '评论用户1'
        }
      }
    ]
  },
  {
    id: '2',
    content: '学到了很多，期待更多内容',
    time: '30分钟前',
    isLiked: true,
    author: {
      id: '4',
      nickname: '评论用户3',
      avatar: ''
    },
    replies: []
  }
])

// 评论输入内容
const commentContent = ref('')

// 回复目标
const replyTarget = ref(null)

// 获取文章详情
onMounted(async () => {
  // 实际项目中应该调用API获取文章详情
  console.log('获取文章ID为', articleId.value, '的详情')
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 前往用户主页
const goToUserPage = (userId) => {
  router.push(`/user/${userId}`)
}

// 关注/取消关注
const handleFollowAction = async () => {
  article.author.isFollowing = !article.author.isFollowing
  // 实际项目中应该调用API关注/取消关注用户
}

// 点赞文章
const handleLike = () => {
  if (article.isLiked) {
    article.likes--
  } else {
    article.likes++
  }
  article.isLiked = !article.isLiked
  // 实际项目中应该调用API点赞/取消点赞
}

// 分享文章
const handleShare = () => {
  // 实现分享功能
  console.log('分享文章', article.id)
}

// 滚动到评论区
const scrollToComments = () => {
  commentsRef.value.scrollIntoView({ behavior: 'smooth' })
}

// 回复评论
const replyToComment = (comment) => {
  replyTarget.value = {
    id: comment.id,
    type: 'comment',
    nickname: comment.author.nickname
  }
}

// 回复回复
const replyToReply = (comment, reply) => {
  replyTarget.value = {
    id: reply.id,
    commentId: comment.id,
    type: 'reply',
    nickname: reply.author.nickname
  }
}

// 点赞评论
const likeComment = (comment) => {
  comment.isLiked = !comment.isLiked
  // 实际项目中应该调用API点赞/取消点赞评论
}

// 提交评论
const submitComment = () => {
  if (!commentContent.value.trim()) {
    return
  }
  
  if (replyTarget.value) {
    // 回复评论或回复
    if (replyTarget.value.type === 'comment') {
      // 回复评论
      const targetComment = commentList.value.find(c => c.id === replyTarget.value.id)
      if (targetComment) {
        targetComment.replies.push({
          id: Date.now().toString(),
          content: commentContent.value,
          time: '刚刚',
          author: {
            id: userStore.userId,
            nickname: userStore.nickname,
            avatar: userStore.avatar
          },
          replyTo: {
            id: targetComment.author.id,
            nickname: targetComment.author.nickname
          }
        })
      }
    } else {
      // 回复回复
      const targetComment = commentList.value.find(c => c.id === replyTarget.value.commentId)
      if (targetComment) {
        targetComment.replies.push({
          id: Date.now().toString(),
          content: commentContent.value,
          time: '刚刚',
          author: {
            id: userStore.userId,
            nickname: userStore.nickname,
            avatar: userStore.avatar
          },
          replyTo: {
            id: replyTarget.value.id,
            nickname: replyTarget.value.nickname
          }
        })
      }
    }
  } else {
    // 发表新评论
    commentList.value.unshift({
      id: Date.now().toString(),
      content: commentContent.value,
      time: '刚刚',
      isLiked: false,
      author: {
        id: userStore.userId,
        nickname: userStore.nickname,
        avatar: userStore.avatar
      },
      replies: []
    })
    article.comments++
  }
  
  // 清空输入内容和回复目标
  commentContent.value = ''
  replyTarget.value = null
}

// 通过标签搜索
const searchByTag = (tag) => {
  router.push({
    path: '/search',
    query: { tag }
  })
}
</script>