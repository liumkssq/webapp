<template>
  <div class="app">
    <AppMessage />
    <router-view />
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup>
import AppMessage from '@/components/AppMessage.vue'
import TabBar from './components/TabBar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 判断当前路由是否需要显示底部导航栏
const showTabBar = computed(() => {
  const excludeRoutes = ['Login', 'Register', 'ProductDetail', 'ChatSession', 'LocationPicker', 'UserProfile'];
  return !excludeRoutes.includes(route.name);
});
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>