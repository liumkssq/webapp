<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  showDescription: {
    type: Boolean,
    default: true
  }
});

// 处理图片显示
const getImageUrl = (item) => {
  if (!item) return 'https://via.placeholder.com/300';
  
  // 直接使用imageUrl字段
  if (item.imageUrl) return item.imageUrl;
  
  // 使用images数组第一张图
  if (item.images) {
    if (Array.isArray(item.images) && item.images.length > 0) {
      const firstImage = item.images[0];
      if (typeof firstImage === 'string') {
        // 处理可能的JSON字符串
        if (firstImage.startsWith('[')) {
          try {
            const parsedImages = JSON.parse(firstImage);
            return Array.isArray(parsedImages) && parsedImages.length > 0 
              ? parsedImages[0] 
              : 'https://via.placeholder.com/300';
          } catch (e) {
            console.error('解析失物招领图片JSON失败:', e);
            return firstImage;
          }
        }
        return firstImage;
      }
      return firstImage;
    }
    
    // 处理字符串格式的images
    if (typeof item.images === 'string') {
      if (item.images.startsWith('[')) {
        try {
          const parsedImages = JSON.parse(item.images);
          return Array.isArray(parsedImages) && parsedImages.length > 0 
            ? parsedImages[0] 
            : 'https://via.placeholder.com/300';
        } catch (e) {
          console.error('解析失物招领图片字符串失败:', e);
          return item.images;
        }
      }
      return item.images;
    }
  }
  
  // 默认返回占位图
  return 'https://via.placeholder.com/300';
};

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('失物招领图片加载失败，使用占位图替换');
  event.target.src = 'https://via.placeholder.com/300';
};

// 处理点击事件
const handleClick = () => {
  if (props.item && props.item.id) {
    console.log('导航到失物招领详情页:', props.item.id);
    router.push(`/lost-found/detail/${props.item.id}`);
  }
};
</script>

<template>
  <div class="lost-found-item" :class="item.type" @click.stop="handleClick">
    <div class="item-image" v-if="item.imageUrl || item.images">
      <img :src="getImageUrl(item)" :alt="item.title" @error="handleImageError" />
    </div>
    <div class="item-info">
      <div class="item-badge">{{ item.type === 'lost' ? '寻物启事' : '招领启事' }}</div>
      <div class="item-title">{{ item.title }}</div>
      <div v-if="showDescription" class="item-description">{{ item.description }}</div>
      <div class="item-detail">
        <div class="location">
          <svg-icon name="location" size="14" />
          {{ item.location || '未知位置' }}
        </div>
        <div class="time">
          <svg-icon name="time" size="14" />
          {{ item.time || '未知时间' }}
        </div>
      </div>
      <div class="item-meta">
        <div class="publisher">{{ item.publisher?.nickname || '未知用户' }}</div>
        <div class="status" :class="item.status">{{ 
          item.status === 'open' ? '进行中' : 
          item.status === 'pending' ? '确认中' : '已完成' 
        }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lost-found-item {
  display: flex;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border-left: 4px solid var(--info-color);
}

.lost-found-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.lost-found-item.lost {
  border-left-color: var(--warning-color);
}

.lost-found-item.found {
  border-left-color: var(--success-color);
}

.item-image {
  flex: 0 0 120px;
  height: 120px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  padding: 12px;
  position: relative;
}

.item-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  font-size: var(--font-size-caption-2);
  color: white;
  border-radius: 10px;
  background-color: var(--info-color);
}

.lost .item-badge {
  background-color: var(--warning-color);
}

.found .item-badge {
  background-color: var(--success-color);
}

.item-title {
  font-weight: 500;
  font-size: var(--font-size-headline);
  margin-bottom: 8px;
  color: var(--text-primary);
  padding-right: 70px;
}

.item-description {
  font-size: var(--font-size-subhead);
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-detail {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: var(--font-size-footnote);
  color: var(--text-tertiary);
}

.location, .time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption-1);
}

.publisher {
  color: var(--text-tertiary);
}

.status {
  padding: 2px 8px;
  border-radius: 10px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.status.open {
  background-color: var(--warning-color);
  color: white;
}

.status.pending {
  background-color: var(--info-color);
  color: white;
}

.status.closed {
  background-color: var(--success-color);
  color: white;
}

@media (max-width: 767px) {
  .item-image {
    flex: 0 0 100px;
    height: 100px;
  }
}
</style>