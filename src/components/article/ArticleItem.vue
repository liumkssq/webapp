<template>
  <div class="article-item" @click="$emit('click')">
    <!-- 文章内容 -->
    <div class="article-content" :class="{ 'no-image': !hasImages }">
      <!-- 文章标题 -->
      <h3 class="article-title">{{ article.title }}</h3>
      
      <!-- 文章摘要 -->
      <p v-if="showSummary" class="article-summary">{{ article.summary }}</p>
      
      <!-- 文章信息 -->
      <div class="article-info">
        <!-- 作者信息 -->
        <div class="author-info" v-if="showAuthor" @click.stop="handleAuthorClick">
          <img :src="article.author.avatar" alt="头像" class="author-avatar" />
          <span class="author-name">{{ article.author.name }}</span>
        </div>
        
        <!-- 分类信息 -->
        <div v-if="showCategory" class="category-tag" @click.stop="handleCategoryClick">
          {{ article.category }}
        </div>
        
        <!-- 统计信息 -->
        <div class="article-stats">
          <span class="stat-item">
            <i class="material-icons">visibility</i>
            {{ formatCount(article.viewCount) }}
          </span>
          <span class="stat-item">
            <i class="material-icons">thumb_up</i>
            {{ formatCount(article.likeCount) }}
          </span>
          <span class="stat-item">
            <i class="material-icons">comment</i>
            {{ formatCount(article.commentCount) }}
          </span>
        </div>
        
        <!-- 发布时间 -->
        <div class="publish-time">{{ formatTime(article.createTime) }}</div>
      </div>
    </div>
    
    <!-- 文章图片 -->
    <div v-if="hasImages" class="article-image">
      <img :src="article.images[0]" alt="文章图片" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  // 文章数据
  article: {
    type: Object,
    required: true
  },
  // 是否显示摘要
  showSummary: {
    type: Boolean,
    default: true
  },
  // 是否显示作者
  showAuthor: {
    type: Boolean,
    default: true
  },
  // 是否显示分类
  showCategory: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'authorClick', 'categoryClick'])

const router = useRouter()

// 是否有图片
const hasImages = computed(() => {
  return props.article.images && props.article.images.length > 0
})

// 作者点击
const handleAuthorClick = () => {
  if (props.article.author && props.article.author.id) {
    emit('authorClick', props.article.author.id)
    router.push(`/user/profile?id=${props.article.author.id}`)
  }
}

// 分类点击
const handleCategoryClick = () => {
  if (props.article.category) {
    emit('categoryClick', props.article.category)
    router.push(`/article?category=${encodeURIComponent(props.article.category)}`)
  }
}

// 格式化数字
const formatCount = (count) => {
  if (count === undefined || count === null) return 0
  
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = (now - date) / 1000 // 秒数差
  
  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    return Math.floor(diff / 60) + '分钟前'
  } else if (diff < 86400) {
    return Math.floor(diff / 3600) + '小时前'
  } else if (diff < 604800) {
    return Math.floor(diff / 86400) + '天前'
  } else {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
</script>

<style scoped>
.article-item {
  display: flex;
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.article-item:active {
  background-color: #f9f9f9;
}

.article-content {
  flex: 1;
  margin-right: 15px;
  overflow: hidden;
}

.article-content.no-image {
  margin-right: 0;
}

.article-title {
  margin: 0 0 8px;
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-summary {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #999;
}

.author-info {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
}

.author-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-tag {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-right: 10px;
}

.article-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.stat-item i {
  font-size: 0.9rem;
  margin-right: 2px;
}

.publish-time {
  margin-left: auto;
}

.article-image {
  width: 100px;
  height: 70px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>