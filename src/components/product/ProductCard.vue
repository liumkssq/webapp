<template>
  <div class="product-card">
    <div class="product-content" @click="goToDetail">
      <div class="product-image">
        <img :src="getProductImage(product)" :alt="product.title" @error="handleImageError" />
        <span v-if="statusText" :class="['status-badge', statusClass]">{{ statusText }}</span>
      </div>
      <div class="product-info">
        <h3 class="product-title">{{ product.title || product.name || '未命名商品' }}</h3>
        <p class="product-description">{{ product.description || '暂无描述' }}</p>
        <div class="product-price">¥{{ formatPrice(product.price) }}</div>
        <div class="product-meta">
          <span class="seller">{{ getSeller(product) }}</span>
          <span class="time">{{ formatTime(product.createdAt || product.createTime) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="showActions" class="product-actions">
      <template v-if="product.status === STATUS_ACTIVE">
        <van-button size="small" type="default" @click.stop="toggleProductStatus">下架</van-button>
      </template>
      <template v-else-if="product.status === STATUS_INACTIVE">
        <van-button size="small" type="primary" @click.stop="toggleProductStatus">上架</van-button>
      </template>
      <van-button size="small" type="primary" plain @click.stop="editProductInfo">编辑</van-button>
      <van-button size="small" type="danger" plain @click.stop="deleteProductInfo">删除</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete', 'toggle-status']);

const router = useRouter();

// 产品状态常量
const STATUS_ACTIVE = 1;    // 上架中
const STATUS_INACTIVE = 2;  // 已下架
const STATUS_SOLD = 3;      // 已售出

// 获取状态文本
const statusText = computed(() => {
  if (!props.product) return '';
  
  switch (props.product.status) {
    case STATUS_ACTIVE: return '上架中';
    case STATUS_INACTIVE: return '已下架';
    case STATUS_SOLD: return '已售出';
    default: return '';
  }
});

// 获取状态样式类
const statusClass = computed(() => {
  if (!props.product) return '';
  
  switch (props.product.status) {
    case STATUS_ACTIVE: return 'status-active';
    case STATUS_INACTIVE: return 'status-inactive';
    case STATUS_SOLD: return 'status-sold';
    default: return '';
  }
});

// 处理产品图片
const getProductImage = (product) => {
  if (!product) return 'https://via.placeholder.com/300';
  
  // 处理imageUrl字段
  if (product.imageUrl) return product.imageUrl;
  
  // 处理images数组
  if (product.images) {
    // 如果images是数组
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
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
  
  if (product.seller) {
    return product.seller.nickname || product.seller.name || '未知用户';
  }
  
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
    
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) {
    console.error('时间格式化错误:', e);
    return '';
  }
};

// 点击跳转到商品详情
const goToDetail = () => {
  if (props.product && props.product.id) {
    router.push(`/product/detail/${props.product.id}`);
  }
};

// 编辑商品
const editProductInfo = () => {
  emit('edit', props.product.id);
};

// 删除商品
const deleteProductInfo = () => {
  emit('delete', props.product);
};

// 切换商品状态
const toggleProductStatus = () => {
  emit('toggle-status', props.product);
};
</script>

<style scoped>
.product-card {
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.product-content {
  display: flex;
  padding: 12px;
  cursor: pointer;
}

.product-image {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 2px 6px;
  font-size: 12px;
  color: white;
  border-bottom-left-radius: 8px;
}

.status-active {
  background-color: #07c160;
}

.status-inactive {
  background-color: #969799;
}

.status-sold {
  background-color: #ee0a24;
}

.product-info {
  flex: 1;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 6px;
  color: #323233;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  font-size: 14px;
  color: #646566;
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
  margin: 0 0 6px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: auto;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f2f3f5;
  padding: 10px 12px;
}
</style> 