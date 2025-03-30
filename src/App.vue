<template>
  <van-config-provider>
    <div class="app">
      <AppMessage />
      <router-view v-slot="{ Component, route }">
        <transition :name="route.meta.transitionName || 'van-fade'" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </van-config-provider>
</template>

<script setup>
import { ConfigProvider as VanConfigProvider } from 'vant'
import AppMessage from '@/components/AppMessage.vue'
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>