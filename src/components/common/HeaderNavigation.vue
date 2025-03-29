<template>
  <div class="header-navigation" :class="{ 'with-border': showBorder }">
    <!-- 左侧按钮：返回或自定义 -->
    <div class="left-action">
      <template v-if="showBack">
        <div class="back-button" @click="handleBack">
          <i class="material-icons">arrow_back</i>
        </div>
      </template>
      <template v-else-if="leftIcon">
        <div class="icon-button" @click="$emit('leftClick')">
          <i class="material-icons">{{ leftIcon }}</i>
        </div>
      </template>
      <slot name="left"></slot>
    </div>
    
    <!-- 标题 -->
    <div class="title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    
    <!-- 右侧按钮 -->
    <div class="right-action">
      <template v-if="rightIcon">
        <div class="icon-button" @click="$emit('rightClick')">
          <i class="material-icons">{{ rightIcon }}</i>
        </div>
      </template>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 是否显示返回按钮
  showBack: {
    type: Boolean,
    default: false
  },
  // 左侧图标
  leftIcon: {
    type: String,
    default: ''
  },
  // 右侧图标
  rightIcon: {
    type: String,
    default: ''
  },
  // 底部是否显示边框
  showBorder: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['back', 'leftClick', 'rightClick'])

// 返回按钮处理
const handleBack = () => {
  emit('back')
}

// 修改导航链接，使其与路由配置匹配
const navigation = {
  home: '/',
  message: '/message',
  publish: '/publish',  // 修改为/publish，使用Selector组件选择发布类型
  product: '/product/list',
  lostFound: '/lost-found/list',
  article: '/article/list',
  user: '/user/profile'
}
</script>

<style scoped>
.header-navigation {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  background-color: #fff;
}

.header-navigation.with-border {
  border-bottom: 1px solid #f0f0f0;
}

.left-action, .right-action {
  display: flex;
  align-items: center;
  min-width: 40px;
}

.back-button, .icon-button {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}
</style>