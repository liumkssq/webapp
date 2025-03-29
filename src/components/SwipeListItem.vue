<template>
  <div 
    ref="swipeItem"
    class="swipe-list-item"
    :class="{ 'swiping': swiping }" 
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- 左侧操作按钮 -->
    <div 
      v-if="showLeftButtons" 
      class="swipe-action left-action"
      :style="{ width: `${actionsWidth}px` }"
    >
      <div 
        v-if="actions.includes('favorite')" 
        class="action-button favorite-button"
        @click.stop="onFavorite"
      >
        <i :class="favorited ? 'icon-star-filled' : 'icon-star'"></i>
        <span>{{ favorited ? '取消收藏' : '收藏' }}</span>
      </div>
      
      <div 
        v-if="actions.includes('mark')" 
        class="action-button mark-button"
        @click.stop="onFavorite"
      >
        <i :class="favorited ? 'icon-check-circle' : 'icon-circle'"></i>
        <span>{{ favorited ? '标记未读' : '标记已读' }}</span>
      </div>
    </div>
    
    <!-- 内容 -->
    <div 
      ref="content"
      class="swipe-content"
      :style="contentStyle"
      @click="onItemClick"
    >
      <slot></slot>
    </div>
    
    <!-- 右侧操作按钮 -->
    <div 
      v-if="showRightButtons" 
      class="swipe-action right-action"
      :style="{ width: `${actionsWidth}px` }"
    >
      <div 
        v-if="actions.includes('delete')" 
        class="action-button delete-button"
        @click.stop="onDelete"
      >
        <i class="icon-trash"></i>
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  // 操作按钮列表 ['delete', 'favorite', 'mark']
  actions: {
    type: Array,
    default: () => ['delete']
  },
  // 是否已收藏/已标记
  favorited: {
    type: Boolean,
    default: false
  },
  // 项目ID
  itemId: {
    type: [String, Number],
    required: true
  },
  // 项目类型
  itemType: {
    type: String,
    default: 'item'
  },
  // 启用左侧滑动
  enableLeftSwipe: {
    type: Boolean,
    default: true
  },
  // 启用右侧滑动
  enableRightSwipe: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['delete', 'favorite', 'click']);

// 操作按钮宽度
const actionsWidth = 80;
// 滑动阈值
const swipeThreshold = 80;
// 关闭速度阈值 (px/ms)
const closeVelocityThreshold = 0.3;

// DOM引用
const swipeItem = ref(null);
const content = ref(null);

// 状态
const startX = ref(0);
const currentX = ref(0);
const offsetX = ref(0);
const startTime = ref(0);
const swiping = ref(false);

// 左右按钮显示状态
const showLeftButtons = computed(() => {
  return props.enableLeftSwipe && (props.actions.includes('favorite') || props.actions.includes('mark'));
});

const showRightButtons = computed(() => {
  return props.enableRightSwipe && props.actions.includes('delete');
});

// 内容样式计算
const contentStyle = computed(() => {
  if (!swiping.value && offsetX.value === 0) {
    return {
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease'
    };
  }
  
  return {
    transform: `translateX(${offsetX.value}px)`,
    transition: swiping.value ? 'none' : 'transform 0.3s ease'
  };
});

// 处理触摸开始
const onTouchStart = (e) => {
  startX.value = e.touches[0].clientX;
  startTime.value = Date.now();
  swiping.value = true;
};

// 处理触摸移动
const onTouchMove = (e) => {
  if (!swiping.value) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - startX.value;
  
  // 限制滑动方向
  if (deltaX > 0 && !showLeftButtons.value) return;
  if (deltaX < 0 && !showRightButtons.value) return;
  
  // 限制最大滑动距离
  let newOffsetX = deltaX;
  if (deltaX > 0) {
    newOffsetX = Math.min(deltaX, actionsWidth);
  } else if (deltaX < 0) {
    newOffsetX = Math.max(deltaX, -actionsWidth);
  }
  
  offsetX.value = newOffsetX;
  
  // 阻止页面滚动
  if (Math.abs(deltaX) > 10) {
    e.preventDefault();
  }
};

// 处理触摸结束
const onTouchEnd = (e) => {
  if (!swiping.value) return;
  
  const endTime = Date.now();
  const duration = endTime - startTime.value;
  const velocity = Math.abs(offsetX.value) / duration;
  
  // 根据滑动速度和距离判断是展开还是关闭
  if (velocity > closeVelocityThreshold || Math.abs(offsetX.value) > swipeThreshold) {
    // 展开操作区
    if (offsetX.value > 0) {
      offsetX.value = actionsWidth;
    } else if (offsetX.value < 0) {
      offsetX.value = -actionsWidth;
    }
  } else {
    // 关闭操作区
    offsetX.value = 0;
  }
  
  swiping.value = false;
};

// 处理删除
const onDelete = () => {
  emit('delete', {
    itemId: props.itemId,
    itemType: props.itemType
  });
  resetSwipe();
};

// 处理收藏/标记
const onFavorite = () => {
  emit('favorite', {
    itemId: props.itemId,
    itemType: props.itemType,
    value: !props.favorited
  });
  resetSwipe();
};

// 处理点击
const onItemClick = () => {
  // 如果处于打开状态，点击关闭
  if (offsetX.value !== 0) {
    resetSwipe();
    return;
  }
  
  emit('click', {
    itemId: props.itemId,
    itemType: props.itemType
  });
};

// 重置滑动状态
const resetSwipe = () => {
  offsetX.value = 0;
  swiping.value = false;
};

// 点击外部时关闭
const handleClickOutside = (e) => {
  if (offsetX.value !== 0 && swipeItem.value && !swipeItem.value.contains(e.target)) {
    resetSwipe();
  }
};

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.swipe-list-item {
  position: relative;
  overflow: hidden;
  width: 100%;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
  touch-action: pan-y;
  user-select: none;
}

.swipe-content {
  position: relative;
  z-index: 1;
  width: 100%;
  will-change: transform;
  background-color: var(--surface);
}

.swipe-action {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
}

.left-action {
  left: 0;
  top: 0;
}

.right-action {
  right: 0;
  top: 0;
}

.action-button {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-sm);
}

.action-button i {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
}

.favorite-button {
  background-color: var(--amber);
}

.mark-button {
  background-color: var(--teal);
}

.delete-button {
  background-color: var(--red);
}
</style> 