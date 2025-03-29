<template>
  <van-tabbar route fixed placeholder>
    <van-tabbar-item to="/home" icon="home-o">
      首页
    </van-tabbar-item>
    
    <van-tabbar-item to="/category" icon="apps-o">
      分类
    </van-tabbar-item>
    
    <van-tabbar-item to="/publish" icon="add-o">
      发布
    </van-tabbar-item>
    
    <van-tabbar-item to="/map/nearby" icon="location-o">
      附近
    </van-tabbar-item>
    
    <van-tabbar-item to="/profile" icon="user-o">
      我的
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
// TabBar组件不需要额外逻辑
</script>

<style scoped>
:deep(.van-tabbar-item--active) {
  color: #007aff;
}

:deep(.van-tabbar-item__icon) {
  font-size: 22px;
}

:deep(.van-tabbar-item__text) {
  font-size: 12px;
}
</style> 