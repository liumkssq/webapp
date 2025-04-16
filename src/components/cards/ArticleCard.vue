<template>
  <div class="article-card" @click="goToDetail">
    <div class="article-content">
      <div class="article-info">
        <h3 class="article-title">{{ article.title || '无标题文章' }}</h3>
        <p class="article-summary">{{ article.summary || article.contentSnippet || '暂无摘要' }}</p>
        <div class="article-meta">
          <span class="author">
            <van-icon name="user-o" /> {{ getAuthor(article) }}
          </span>
          <span class="time">
            <van-icon name="clock-o" /> {{ formatTime(article.createdAt || article.createTime) }}
          </span>
          <span class="views">
            <van-icon name="eye-o" /> {{ article.viewCount || 0 }}
          </span>
          <span class="likes">
            <van-icon name="like-o" /> {{ article.likeCount || 0 }}
          </span>
        </div>
      </div>
      <div v-if="getArticleImage(article)" class="article-thumbnail">
        <img :src="getArticleImage(article)" :alt="article.title" @error="handleImageError" />
      </div>
    </div>
    <div v-if="showActions" class="article-actions">
      <van-button size="small" type="primary" plain @click.stop="editArticleInfo">编辑</van-button>
      <van-button size="small" type="danger" plain @click.stop="deleteArticleInfo">删除</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon as VanIcon } from 'vant';

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete']);

const router = useRouter();

// 获取文章图片
const getArticleImage = (article) => {
  const placeholder = ''; // No placeholder for articles to avoid taking up space if no image
  if (!article) return placeholder;

  if (article.coverImage) return article.coverImage;
  if (article.thumbnail) return article.thumbnail;
  if (article.imageUrl) return article.imageUrl;
  if (Array.isArray(article.images) && article.images.length > 0) return article.images[0];
  
  // Extract first image from content if needed (simple version)
  if (typeof article.content === 'string') {
    const imgMatch = article.content.match(/<img.*?src=['"](.*?)['"].*?>/);
    if (imgMatch && imgMatch[1]) return imgMatch[1];
  }

  return placeholder;
};

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.style.display = 'none'; // Hide image if error
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '时间未知';
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) return '时间无效';

    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return '时间解析错误';
  }
};

// 获取作者信息
const getAuthor = (article) => {
  if (!article) return '匿名作者';
  if (article.author) {
    return article.author.nickname || article.author.name || '匿名作者';
  }
   if (article.user) { // Fallback if author field is missing
    return article.user.nickname || article.user.name || '匿名作者';
  }
  if (article.authorName) {
      return article.authorName;
  }
  return '匿名作者';
};

// 点击跳转到详情
const goToDetail = () => {
  if (props.article && props.article.id) {
    router.push(`/article/detail/${props.article.id}`);
  }
};

// 编辑
const editArticleInfo = () => {
  emit('edit', props.article.id);
};

// 删除
const deleteArticleInfo = () => {
  emit('delete', props.article);
};

</script>

<style scoped>
.article-card {
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 12px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.article-card:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.article-content {
  display: flex;
  padding: 12px;
  gap: 12px;
}

.article-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevent flex item from overflowing */
}

.article-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 6px;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-summary {
  font-size: 14px;
  color: #646566;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limit summary to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on small screens */
  gap: 8px; /* Spacing between meta items */
  font-size: 12px;
  color: #969799;
  margin-top: auto; /* Push meta to the bottom */
}

.article-meta span {
  display: inline-flex; /* Use inline-flex for alignment */
  align-items: center;
}

.article-meta .van-icon {
  margin-right: 3px;
  font-size: 13px; /* Slightly larger icons */
}

.article-thumbnail {
  width: 80px; /* Fixed width for thumbnail */
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f7f8fa; /* Placeholder background */
}

.article-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f2f3f5;
  padding: 8px 12px;
}
</style>
