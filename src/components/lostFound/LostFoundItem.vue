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
  if (!item) return `https://picsum.photos/id/1/300/300`;
  
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
              : `https://picsum.photos/id/${(item.id % 30) + 1}/300/300`;
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
            : `https://picsum.photos/id/${(item.id % 30) + 1}/300/300`;
        } catch (e) {
          console.error('解析失物招领图片字符串失败:', e);
          return item.images;
        }
      }
      return item.images;
    }
  }
  
  // 默认返回占位图，使用item.id确保每个item有不同的图片
  return `https://picsum.photos/id/${(item.id % 30) + 1}/300/300`;
};

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('失物招领图片加载失败，使用占位图替换');
  
  // 检查是否已经是占位图，避免循环加载
  if (event.target.getAttribute('data-is-placeholder') === 'true') {
    console.log('已经是占位图，不再替换');
    return;
  }
  
  // 使用当前时间作为随机种子，避免缓存问题
  const randomId = Math.floor(Math.random() * 100) + 1;
  const timestamp = new Date().getTime();
  event.target.src = `https://picsum.photos/id/${randomId}/300/300?t=${timestamp}`;
  
  // 标记这个图片已经使用了占位图
  event.target.setAttribute('data-is-placeholder', 'true');
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
  <div class="lost-found-item ios-card" :class="item.type" @click.stop="handleClick">
    <div class="item-image">
      <img 
        :src="getImageUrl(item)" 
        :alt="item.title" 
        @error="handleImageError" 
        loading="lazy"
        class="ios-image"
      />
    </div>
    <div class="item-info">
      <div class="item-badge ios-badge">{{ item.type === 'lost' ? '寻物启事' : '招领启事' }}</div>
      <div class="item-title ios-title">{{ item.title }}</div>
      <div v-if="showDescription" class="item-description ios-description">{{ item.description }}</div>
      <div class="item-detail ios-detail">
        <div class="location">
          <svg-icon name="location" class="ios-icon" />
          {{ item.location || '未知位置' }}
        </div>
        <div class="time">
          <svg-icon name="time" class="ios-icon" />
          {{ item.time || '未知时间' }}
        </div>
      </div>
      <div class="item-meta ios-meta">
        <div class="publisher">{{ item.publisher?.nickname || '未知用户' }}</div>
        <div class="status ios-status" :class="item.status">{{ 
          item.status === 'open' ? '进行中' : 
          item.status === 'pending' ? '确认中' : '已完成' 
        }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ios-card {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--background-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
  transition: all 0.3s ease;
  border: 0.5px solid var(--separator-color);
}

.ios-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.ios-card.lost {
  border-left: 4px solid var(--warning-color);
}

.ios-card.found {
  border-left: 4px solid var(--success-color);
}

.item-image {
  flex: 0 0 120px;
  height: 120px;
  overflow: hidden;
}

.ios-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.ios-image:hover {
  transform: scale(1.05);
}

.item-info {
  flex: 1;
  padding: 12px;
  position: relative;
}

.ios-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  font-size: 12px;
  color: white;
  border-radius: 12px;
  background-color: var(--info-color);
  font-weight: 500;
}

.lost .ios-badge {
  background-color: var(--warning-color);
}

.found .ios-badge {
  background-color: var(--success-color);
}

.ios-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
  padding-right: 70px;
  line-height: 1.3;
}

.ios-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.ios-detail {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.location, .time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ios-icon {
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
}

.ios-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.publisher {
  color: var(--text-tertiary);
}

.ios-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.ios-status.open {
  background-color: rgba(255, 149, 0, 0.1);
  color: var(--warning-color);
}

.ios-status.pending {
  background-color: rgba(0, 122, 255, 0.1);
  color: var(--primary-color);
}

.ios-status.closed {
  background-color: rgba(52, 199, 89, 0.1);
  color: var(--success-color);
}

@media (max-width: 767px) {
  .item-image {
    flex: 0 0 100px;
    height: 100px;
  }
  
  .ios-title {
    font-size: 15px;
  }
  
  .ios-description {
    font-size: 13px;
  }
}

@media (prefers-color-scheme: dark) {
  .ios-card {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .ios-status.open {
    background-color: rgba(255, 149, 0, 0.2);
  }
  
  .ios-status.pending {
    background-color: rgba(0, 122, 255, 0.2);
  }
  
  .ios-status.closed {
    background-color: rgba(52, 199, 89, 0.2);
  }
}
</style>