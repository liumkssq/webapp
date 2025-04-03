<template>
  <component :is="itemComponent" 
    :item="item" 
    @click="navigateToDetail" 
    class="search-result-item"
  />
</template>

<script setup>
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'

// 组件
const ProductItem = defineComponent({
  props: ['item'],
  template: `
    <div class="product-item">
      <div class="product-content">
        <div class="product-header">
          <div class="product-title">{{ item.title }}</div>
          <div class="product-price">¥{{ item.price || 0 }}</div>
        </div>
        <div class="product-desc">{{ truncateText(item.description || item.content, 50) }}</div>
        <div class="product-images" v-if="item.images && item.images.length > 0">
          <img 
            v-for="(image, index) in item.images.slice(0, 3)" 
            :key="index" 
            :src="image" 
            :alt="item.title"
            class="product-image"
          >
        </div>
        <div class="product-meta">
          <span class="seller-info">
            <i class="icon-user"></i> {{ item.seller?.name || '未知用户' }}
          </span>
          <span class="product-time">
            <i class="icon-time"></i> {{ formatTime(item.createTime) }}
          </span>
        </div>
      </div>
    </div>
  `,
  setup() {
    return {
      truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      },
      formatTime(time) {
        if (!time) return '';
        const date = new Date(time);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    }
  }
})

const ArticleItem = defineComponent({
  props: ['item'],
  template: `
    <div class="article-item">
      <div class="article-content">
        <div class="article-title">{{ item.title }}</div>
        <div class="article-text">{{ truncateText(item.content, 80) }}</div>
        <div class="article-images" v-if="item.images && item.images.length > 0">
          <img 
            v-for="(image, index) in item.images.slice(0, 3)" 
            :key="index" 
            :src="image" 
            alt="文章图片"
          >
        </div>
        <div class="article-meta">
          <span class="author-info">{{ item.author?.nickname || '未知作者' }}</span>
          <span class="article-stats">
            <i class="icon-like"></i> {{ item.likes || 0 }}
            <i class="icon-comment"></i> {{ item.comments || 0 }}
          </span>
          <span class="article-time">{{ formatTime(item.publishTime) }}</span>
        </div>
      </div>
    </div>
  `,
  setup() {
    return {
      truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      },
      formatTime(time) {
        if (!time) return '';
        const date = new Date(time);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    }
  }
})

const LostFoundItem = defineComponent({
  props: ['item'],
  template: `
    <div class="lost-found-item">
      <div class="lost-found-badge" :class="item.type">
        {{ item.type === 'lost' ? '丢失' : '招领' }}
      </div>
      <div class="lost-found-content">
        <div class="lost-found-title">{{ item.title }}</div>
        <div class="lost-found-desc">{{ truncateText(item.description, 60) }}</div>
        <div class="lost-found-images" v-if="item.images && item.images.length > 0">
          <img 
            v-for="(image, index) in item.images.slice(0, 2)" 
            :key="index" 
            :src="image" 
            alt="物品图片"
          >
        </div>
        <div class="lost-found-info">
          <div class="lost-found-meta">
            <span class="location">{{ item.location || '未知地点' }}</span>
            <span class="category">{{ item.category || '其他' }}</span>
            <span class="time">{{ formatTime(item.lostFoundTime) }}</span>
          </div>
          <div class="lost-found-status" :class="item.status">
            {{ item.status === 'open' ? '未解决' : '已解决' }}
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    return {
      truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      },
      formatTime(time) {
        if (!time) return '';
        const date = new Date(time);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    }
  }
})

const UserItem = defineComponent({
  props: ['item'],
  template: `
    <div class="user-item">
      <div class="user-avatar">
        <img :src="item.avatar || '/images/default-avatar.png'" alt="用户头像">
      </div>
      <div class="user-info">
        <div class="user-name">{{ item.nickname || item.username }}</div>
        <div class="user-bio">{{ item.bio || '该用户暂无简介' }}</div>
      </div>
      <div class="user-action">
        <button class="follow-btn" v-if="!item.isFollowing">关注</button>
        <button class="following-btn" v-else>已关注</button>
      </div>
    </div>
  `
})

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'product',
    validator: (value) => ['product', 'article', 'lostFound', 'user'].includes(value)
  }
})

const router = useRouter()

const itemComponent = computed(() => {
  switch(props.type) {
    case 'product': return ProductItem
    case 'article': return ArticleItem
    case 'lostFound': return LostFoundItem
    case 'user': return UserItem
    default: return ProductItem
  }
})

const navigateToDetail = () => {
  let path = ''
  
  switch(props.type) {
    case 'product':
      path = `/product/detail/${props.item.id}`
      break
    case 'article':
      path = `/article/detail/${props.item.id}`
      break
    case 'lostFound':
      path = `/lost-found/detail/${props.item.id}`
      break
    case 'user':
      path = `/user/profile/${props.item.id}`
      break
  }
  
  if (path) {
    router.push(path)
  }
}
</script>

<style scoped>
.search-result-item {
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.search-result-item:active {
  transform: scale(0.98);
}

/* 商品项样式 */
.product-item {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 12px;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.product-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
  flex: 1;
  margin-right: 12px;
}

.product-price {
  font-size: 17px;
  font-weight: 600;
  color: #ff3b30;
  white-space: nowrap;
}

.product-desc {
  font-size: 15px;
  color: #666666;
  margin-bottom: 10px;
  line-height: 1.4;
}

.product-images {
  display: flex;
  gap: 8px;
  margin: 8px 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.product-images::-webkit-scrollbar {
  display: none;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #8e8e93;
  margin-top: 8px;
}

.seller-info, .product-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-user::before {
  content: "\1F464";
}

.icon-time::before {
  content: "\1F552";
}

/* 适配暗模式 */
@media (prefers-color-scheme: dark) {
  .product-item {
    background-color: #1c1c1e;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .product-title {
    color: #ffffff;
  }
  
  .product-desc {
    color: #a1a1a1;
  }
  
  .product-meta {
    color: #8e8e93;
  }
}

/* 文章项样式 */
.article-item {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 12px;
}

/* 失物招领项样式 */
.lost-found-item {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
}

.lost-found-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.lost-found-badge.lost {
  background-color: #ff3b30;
  color: white;
}

.lost-found-badge.found {
  background-color: #34c759;
  color: white;
}

/* 用户项样式 */
.user-item {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 4px;
}

.user-bio {
  font-size: 14px;
  color: #666666;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.user-action {
  margin-left: 12px;
}

.follow-btn, .following-btn {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.follow-btn {
  background-color: #007aff;
  color: white;
}

.following-btn {
  background-color: #e5e5ea;
  color: #000000;
}

@media (prefers-color-scheme: dark) {
  .article-item, .lost-found-item, .user-item {
    background-color: #1c1c1e;
  }
  
  .user-name {
    color: #ffffff;
  }
  
  .user-bio {
    color: #a1a1a1;
  }
  
  .following-btn {
    background-color: #2c2c2e;
    color: #ffffff;
  }
}
</style>