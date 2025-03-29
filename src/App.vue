<template>
  <div class="app">
    <AppMessage />
    <router-view />
  </div>
</template>

<script setup>
import AppMessage from '@/components/AppMessage.vue'
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>