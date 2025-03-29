<template>
  <div 
    class="swipe-action"
    ref="container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div 
      class="swipe-content"
      :style="contentStyle"
      :class="{ swiping: isSwiping, animated: isAnimated }"
    >
      <slot></slot>
    </div>
    
    <div 
      v-if="showRightButtons"
      class="swipe-buttons right-buttons"
      :style="{ width: `${rightWidth}px` }"
    >
      <slot name="right">
        <div 
          class="swipe-button delete-button" 
          @click="handleRightAction('delete')"
        >
          <i class="icon-delete"></i>
          <span>删除</span>
        </div>
      </slot>
    </div>
    
    <div 
      v-if="showLeftButtons"
      class="swipe-buttons left-buttons"
      :style="{ width: `${leftWidth}px` }"
    >
      <slot name="left">
        <div 
          class="swipe-button favorite-button" 
          @click="handleLeftAction('favorite')"
        >
          <i class="icon-favorite"></i>
          <span>收藏</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  // 是否启用右侧按钮
  rightEnabled: {
    type: Boolean,
    default: true
  },
  // 是否启用左侧按钮
  leftEnabled: {
    type: Boolean,
    default: false
  },
  // 右侧按钮宽度
  rightWidth: {
    type: Number,
    default: 80
  },
  // 左侧按钮宽度
  leftWidth: {
    type: Number,
    default: 80
  },
  // 滑动阈值，超过此值自动完成滑动
  threshold: {
    type: Number,
    default: 0.3
  },
  // 是否点击其他区域自动关闭
  autoClose: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['left-action', 'right-action', 'open', 'close']);

// 状态变量
const offset = ref(0);
const isSwiping = ref(false);
const isAnimated = ref(true);
const container = ref(null);

// 计算属性
const contentStyle = computed(() => {
  return {
    transform: `translateX(${offset.value}px)`
  };
});

const showRightButtons = computed(() => props.rightEnabled);
const showLeftButtons = computed(() => props.leftEnabled);

// 触摸状态
let touchStartX = 0;
let initialOffset = 0;
let direction = '';
let openedItems = [];

// 处理触摸开始
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
  initialOffset = offset.value;
  isAnimated.value = false;
  isSwiping.value = true;
};

// 处理触摸移动
const handleTouchMove = (e) => {
  if (!isSwiping.value) return;
  
  const moveX = e.touches[0].clientX - touchStartX;
  let newOffset = initialOffset + moveX;
  
  // 设置滑动方向
  if (!direction) {
    direction = moveX > 0 ? 'right' : 'left';
  }
  
  // 限制滑动范围
  if ((direction === 'left' && !props.rightEnabled) || (direction === 'right' && !props.leftEnabled)) {
    newOffset = 0;
  } else if (direction === 'left') {
    // 向左滑动，显示右侧按钮
    newOffset = Math.max(-props.rightWidth, Math.min(0, newOffset));
  } else {
    // 向右滑动，显示左侧按钮
    newOffset = Math.min(props.leftWidth, Math.max(0, newOffset));
  }
  
  offset.value = newOffset;
};

// 处理触摸结束
const handleTouchEnd = () => {
  isAnimated.value = true;
  isSwiping.value = false;
  direction = '';
  
  // 判断是否超过阈值
  if (offset.value < 0 && Math.abs(offset.value) > props.rightWidth * props.threshold) {
    // 展开右侧按钮
    offset.value = -props.rightWidth;
    emit('open', 'right');
    if (props.autoClose) addToOpenedItems();
  } else if (offset.value > 0 && Math.abs(offset.value) > props.leftWidth * props.threshold) {
    // 展开左侧按钮
    offset.value = props.leftWidth;
    emit('open', 'left');
    if (props.autoClose) addToOpenedItems();
  } else {
    // 恢复原位
    offset.value = 0;
    emit('close');
  }
};

// 处理右侧按钮点击
const handleRightAction = (action) => {
  emit('right-action', action);
  close();
};

// 处理左侧按钮点击
const handleLeftAction = (action) => {
  emit('left-action', action);
  close();
};

// 关闭滑动菜单
const close = () => {
  offset.value = 0;
  emit('close');
};

// 添加到已打开列表
const addToOpenedItems = () => {
  if (openedItems.includes(container.value)) return;
  openedItems.push(container.value);
};

// 从已打开列表移除
const removeFromOpenedItems = () => {
  const index = openedItems.indexOf(container.value);
  if (index !== -1) {
    openedItems.splice(index, 1);
  }
};

// 点击其他区域关闭
const handleDocumentClick = (e) => {
  if (!props.autoClose || !container.value) return;
  
  // 点击其他区域关闭此项
  if (!container.value.contains(e.target) && offset.value !== 0) {
    close();
  }
};

// 关闭其他已打开项
const closeOthers = () => {
  openedItems.forEach(item => {
    if (item !== container.value) {
      const vm = item.__vue__;
      if (vm && vm.close) {
        vm.close();
      }
    }
  });
};

// 暴露方法
defineExpose({
  close,
  isOpen: () => offset.value !== 0
});

onMounted(() => {
  if (props.autoClose) {
    document.addEventListener('click', handleDocumentClick);
  }
});

onBeforeUnmount(() => {
  if (props.autoClose) {
    document.removeEventListener('click', handleDocumentClick);
    removeFromOpenedItems();
  }
});
</script>

<style scoped>
.swipe-action {
  position: relative;
  overflow: hidden;
  width: 100%;
  background-color: var(--background-primary);
}

.swipe-content {
  position: relative;
  width: 100%;
  z-index: 2;
  background-color: inherit;
}

.swipe-content.animated {
  transition: transform 0.3s ease;
}

.swipe-buttons {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 1;
}

.right-buttons {
  right: 0;
}

.left-buttons {
  left: 0;
}

.swipe-button {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-sm);
}

.delete-button {
  background-color: var(--error-color);
}

.favorite-button {
  background-color: var(--warning-color);
}

.swipe-button i {
  font-size: var(--font-size-lg);
  margin-bottom: 4px;
}
</style> 