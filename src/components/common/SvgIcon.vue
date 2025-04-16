<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 图标名称
  name: {
    type: String,
    required: true
  },
  // 图标颜色
  color: {
    type: String,
    default: 'currentColor'
  },
  // 图标大小
  size: {
    type: [Number, String],
    default: 16
  },
  // 是否旋转
  spin: {
    type: Boolean,
    default: false
  }
})

// 计算样式
const style = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: size,
    height: size,
    fill: props.color,
    animation: props.spin ? 'spin 1.5s linear infinite' : ''
  }
})

// 图标路径
const iconPath = computed(() => {
  return `#icon-${props.name}`
})
</script>

<template>
  <span class="svg-icon">
    <svg aria-hidden="true" v-bind="$attrs" :style="style">
      <use :xlink:href="iconPath" />
    </svg>
  </span>
</template>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>