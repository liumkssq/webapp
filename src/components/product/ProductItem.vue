<script setup>
// Remove the unnecessary import of defineProps
// import { defineProps } from 'vue'
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showDescription: {
    type: Boolean,
    default: true
  }
});

// 处理产品图片，支持多种图片格式
const getProductImage = (product) => {
  // 如果没有product或没有图片，返回占位符
  if (!product) return 'https://via.placeholder.com/300';
  
  // 处理imageUrl字段
  if (product.imageUrl) return product.imageUrl;
  
  // 处理images数组
  if (product.images) {
    // 如果images是数组
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      
      // 处理JSON字符串格式
      if (typeof firstImage === 'string') {
        if (firstImage.startsWith('[')) {
          try {
            const parsedImages = JSON.parse(firstImage);
            return Array.isArray(parsedImages) && parsedImages.length > 0 
              ? parsedImages[0] 
              : 'https://via.placeholder.com/300';
          } catch (e) {
            console.error('解析商品图片JSON失败:', e);
            // 尝试移除JSON字符串的引号和括号
            return firstImage.replace(/^\[\"|\"\]$/g, '') || 'https://via.placeholder.com/300';
          }
        }
        
        // 检查是否为CDN图片URL
        if (firstImage.includes('cdn.pixabay.com') || 
            firstImage.includes('http://') || 
            firstImage.includes('https://')) {
          return firstImage;
        }
      }
      
      return firstImage;
    }
    
    // 如果images是字符串（可能是JSON）
    if (typeof product.images === 'string') {
      try {
        if (product.images.startsWith('[')) {
          const parsedImages = JSON.parse(product.images);
          return Array.isArray(parsedImages) && parsedImages.length > 0 
            ? parsedImages[0] 
            : 'https://via.placeholder.com/300';
        }
        return product.images;
      } catch (e) {
        console.error('解析商品图片字符串失败:', e);
        return 'https://via.placeholder.com/300';
      }
    }
  }
  
  // 尝试使用其他可能的图片字段
  if (product.image) return product.image;
  if (product.thumbnail) return product.thumbnail;
  
  // 默认占位图
  return 'https://via.placeholder.com/300';
};

// 图片加载错误处理
const handleImageError = (event) => {
  console.warn('商品图片加载失败，使用占位图替换');
  event.target.src = 'https://via.placeholder.com/300';
};

// 格式化价格
const formatPrice = (price) => {
  if (price === undefined || price === null) return '0.00';
  
  // 确保价格是数字
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  
  // 格式化为两位小数
  return numPrice.toFixed(2);
};

// 获取卖家信息
const getSeller = (product) => {
  if (!product) return '未知用户';
  
  // 优先使用seller对象
  if (product.seller) {
    return product.seller.nickname || product.seller.name || '未知用户';
  }
  
  // 其次使用sellerName字段
  if (product.sellerName) {
    return product.sellerName;
  }
  
  return '未知用户';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  
  try {
    const date = new Date(time);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    
    // 时间差小于24小时，显示"x小时前"
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    
    // 时间差小于30天，显示"x天前"
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 其他情况显示日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    console.error('时间格式化错误:', e);
    return '';
  }
};

// 商品点击处理
const handleClick = () => {
  if (props.product && props.product.id) {
    const productId = props.product.id;
    console.log('商品点击，导航到详情页:', productId);
    router.push(`/product/detail/${productId}`);
  }
};
</script>

<template>
  <div class="product-item" @click="handleClick">
    <div class="product-image">
      <img :src="getProductImage(product)" :alt="product.title" @error="handleImageError" />
    </div>
    <div class="product-info">
      <div class="product-title">{{ product.title || '未命名商品' }}</div>
      <div v-if="showDescription" class="product-description">{{ product.description || '暂无描述' }}</div>
      <div class="product-price">¥{{ formatPrice(product.price) }}</div>
      <div class="product-meta">
        <div class="seller">{{ getSeller(product) }}</div>
        <div class="time">{{ formatTime(product.createdAt || product.createTime) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.product-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.product-item:hover .product-image img {
  transform: scale(1.05);
}

.product-info {
  padding: 12px;
}

.product-title {
  font-weight: 500;
  font-size: var(--font-size-headline);
  margin-bottom: 8px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  font-size: var(--font-size-subhead);
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: var(--font-size-headline);
  font-weight: 600;
  color: var(--error-color);
  margin-bottom: 8px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption-1);
  color: var(--text-tertiary);
}

@media (max-width: 767px) {
  .product-image {
    height: 160px;
  }
}
</style>