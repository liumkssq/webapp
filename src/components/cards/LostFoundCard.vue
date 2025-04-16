<template>
  <div class="lost-found-card">
    <div class="card-content" @click="goToDetail">
      <div class="item-image">
        <img :src="getItemImage(item)" :alt="item.itemName" @error="handleImageError" />
        <span :class="['item-type-badge', item.type === 'lost' ? 'type-lost' : 'type-found']">
          {{ item.type === 'lost' ? '丢失' : '捡到' }}
        </span>
         <span v-if="statusText" :class="['status-badge', statusClass]">{{ statusText }}</span>
      </div>
      <div class="item-info">
        <h3 class="item-name">{{ item.itemName || '未命名物品' }}</h3>
        <p class="item-location">
          <van-icon name="location-o" /> {{ item.location || '地点未知' }}
        </p>
        <p class="item-time">
           <van-icon name="clock-o" /> {{ formatTime(item.time || item.createTime || item.createdAt) }}
        </p>
        <p class="item-description">{{ item.description || '暂无描述' }}</p>
         <div class="item-meta">
          <span class="publisher">{{ getPublisher(item) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showActions" class="item-actions">
       <template v-if="item.status === STATUS_ACTIVE">
        <van-button size="small" type="success" plain @click.stop="toggleItemStatus">标记为已解决</van-button>
      </template>
      <template v-else-if="item.status === STATUS_RESOLVED">
        <van-button size="small" type="warning" plain @click.stop="toggleItemStatus">重新激活</van-button>
      </template>
      <van-button size="small" type="primary" plain @click.stop="editItemInfo">编辑</van-button>
      <van-button size="small" type="danger" plain @click.stop="deleteItemInfo">删除</van-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Icon as VanIcon } from 'vant';

const props = defineProps({
  item: {
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

// 状态常量
const STATUS_ACTIVE = 1;    // 活跃
const STATUS_RESOLVED = 2;  // 已解决

// 获取状态文本
const statusText = computed(() => {
  if (!props.item) return '';
  switch (props.item.status) {
    case STATUS_ACTIVE: return '寻找中';
    case STATUS_RESOLVED: return '已解决';
    default: return '';
  }
});

// 获取状态样式类
const statusClass = computed(() => {
  if (!props.item) return '';
  switch (props.item.status) {
    case STATUS_ACTIVE: return 'status-active';
    case STATUS_RESOLVED: return 'status-resolved';
    default: return '';
  }
});

// 处理物品图片
const getItemImage = (item) => {
  const placeholder = 'https://via.placeholder.com/150/F7F8FA/969799?text=No+Image';
  if (!item) return placeholder;

  if (item.imageUrl) return item.imageUrl;
  if (item.images) {
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0];
    }
    if (typeof item.images === 'string') {
       try {
        if (item.images.startsWith('[')) {
          const parsedImages = JSON.parse(item.images);
          return Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : placeholder;
        }
        return item.images || placeholder;
      } catch (e) {
        return placeholder;
      }
    }
  }
  if (item.image) return item.image;
  return placeholder;
};

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.src = getItemImage(null); // 使用占位图
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

// 获取发布者信息
const getPublisher = (item) => {
  if (!item) return '匿名用户';
  if (item.publisher) {
    return item.publisher.nickname || item.publisher.name || '匿名用户';
  }
  if (item.publisherName) {
    return item.publisherName;
  }
   if (item.user) {
    return item.user.nickname || item.user.name || '匿名用户';
  }
  return '匿名用户';
};

// 点击跳转到详情
const goToDetail = () => {
  if (props.item && props.item.id) {
    // 根据失物招领的路由调整
    router.push(`/lostfound/detail/${props.item.id}`);
  }
};

// 编辑
const editItemInfo = () => {
  emit('edit', props.item.id);
};

// 删除
const deleteItemInfo = () => {
  emit('delete', props.item);
};

// 切换状态
const toggleItemStatus = () => {
  emit('toggle-status', props.item);
};
</script>

<style scoped>
.lost-found-card {
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.lost-found-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  padding: 12px;
  cursor: pointer;
}

.item-image {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f7f8fa; /* Placeholder background */
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-type-badge {
  position: absolute;
  top: 0;
  left: 0;
  padding: 2px 6px;
  font-size: 12px;
  color: white;
  border-bottom-right-radius: 8px;
}

.type-lost {
  background-color: #ee0a24; /* Red for lost */
}

.type-found {
  background-color: #07c160; /* Green for found */
}

.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 6px;
  font-size: 12px;
  color: white;
  border-top-left-radius: 8px;
}

.status-active {
   background-color: #ff976a; /* Orange for active/seeking */
}

.status-resolved {
  background-color: #969799; /* Grey for resolved */
}

.item-info {
  flex: 1;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent text overflow */
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 6px;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-location,
.item-time {
  font-size: 13px;
  color: #646566;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-location .van-icon,
.item-time .van-icon {
  margin-right: 4px;
  font-size: 14px;
}

.item-description {
  font-size: 14px;
  color: #969799;
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 1; /* Show only one line */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  margin-top: auto; /* Push to bottom */
  font-size: 12px;
  color: #969799;
  text-align: right;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f2f3f5;
  padding: 10px 12px;
}
</style>
