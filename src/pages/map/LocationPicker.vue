<template>
  <div class="page-container">
    <LocationPicker 
      :initial-location="initialLocation"
      @select="onLocationSelected"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LocationPicker from '@/components/common/LocationPicker.vue'
import { showNotify } from 'vant'

const router = useRouter()
const route = useRoute()

// 解析路由参数获取初始位置
const initialLocation = computed(() => {
  const { lng, lat, address } = route.query
  
  if (lng && lat) {
    return {
      location: {
        lng: Number(lng),
        lat: Number(lat)
      },
      address: address || ''
    }
  }
  
  return null
})

// 位置选择回调
const onLocationSelected = (location) => {
  // 存储上一次选择的位置到本地存储
  try {
    localStorage.setItem('lastSelectedLocation', JSON.stringify(location))
  } catch (error) {
    console.error('保存位置信息失败:', error)
  }
  
  // 如果路由中有回调页面，则返回到指定页面
  const fromRoute = route.params.from
  
  if (fromRoute) {
    router.replace({
      name: fromRoute,
      query: {
        ...route.query,
        selected_location: 'true',
        selected_lng: location.location.lng,
        selected_lat: location.location.lat,
        selected_address: location.address,
        selected_name: location.name || ''
      }
    })
  } else {
    // 默认回退
    router.back()
    
    // 通知位置选择成功
    showNotify({
      type: 'success',
      message: '位置已选择',
      duration: 2000
    })
  }
}

// 取消选择
const onCancel = () => {
  router.back()
}

// 组件挂载
onMounted(() => {
  // 监听页面返回
  const handlePopState = () => {
    router.back()
  }
  
  window.addEventListener('popstate', handlePopState)
  
  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
})
</script>

<style scoped>
.page-container {
  height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  background-color: #fff;
}
</style> 