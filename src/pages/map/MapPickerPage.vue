<template>
  <div class="map-picker-page">
    <!-- iOS风格顶部导航 -->
    <div class="ios-nav-bar">
      <div class="left-button" @click="handleBack">
        <van-icon name="arrow-left" size="18" />
      </div>
      <div class="page-title">选择位置</div>
      <div class="right-button" @click="handleConfirm" :class="{ disabled: !selectedLocation.address }">
        确定
      </div>
    </div>
    
    <!-- 地图容器 -->
    <div class="map-container">
      <div class="map-wrapper">
        <baidu-map
          ref="mapRef"
          :center="initialCenter"
          :zoom="15"
          :show-search="true"
          :show-confirm-button="true"
          :auto-locate="!hasInitialLocation"
          :api-key="'W4T3NdSnqPJRPBaVoUhBLS6em9dbpeEr'"
          @select-location="handleSelectLocation"
          @confirm-location="handleConfirmLocation"
          @locate-success="handleLocateSuccess"
          @locate-error="handleLocateError"
        ></baidu-map>
      </div>
    </div>
    
    <!-- 底部已选位置信息 -->
    <div class="bottom-info" v-if="selectedLocation.address">
      <div class="location-info">
        <van-icon name="location-o" />
        <div class="address-text">{{ selectedLocation.address }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const mapRef = ref(null)

// 选中的位置信息
const selectedLocation = reactive({
  address: '',
  lat: null,
  lng: null
})

// 监听位置选择消息
const handleMessage = (event) => {
  // 腾讯地图选择器发送的消息
  if (event.data && event.data.module === 'locationPicker') {
    const loc = event.data.latlng
    selectedLocation.address = event.data.poiaddress
    selectedLocation.lat = loc.lat
    selectedLocation.lng = loc.lng
  }
}

// 地图加载完成
const handleMapLoad = () => {
  console.log('Map loaded')
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 确认选择
const handleConfirm = () => {
  if (!selectedLocation.address) {
    showToast('请先选择位置')
    return
  }
  
  // 获取回调页面路径
  const callbackPath = route.query.callback || '/'
  
  // 构建返回参数
  const locationData = JSON.stringify({
    lng: selectedLocation.lng,
    lat: selectedLocation.lat,
    address: selectedLocation.address
  })
  
  // 返回选中的位置信息
  router.push({
    path: callbackPath,
    query: {
      location: locationData
    }
  })
}

onMounted(() => {
  // 添加消息监听
  window.addEventListener('message', handleMessage)
  
  // 检查是否有初始位置
  const initialLocation = route.query.location
  if (initialLocation) {
    try {
      const location = JSON.parse(initialLocation)
      selectedLocation.address = location.address || ''
      selectedLocation.lat = location.lat
      selectedLocation.lng = location.lng
    } catch (e) {
      console.error('解析初始位置失败', e)
    }
  }
})

onUnmounted(() => {
  // 移除消息监听
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
.map-picker-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

.ios-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 44px;
  box-sizing: content-box;
  position: relative;
  z-index: 100;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.left-button, .right-button {
  font-size: 16px;
  min-width: 60px;
}

.left-button {
  display: flex;
  align-items: center;
}

.right-button {
  color: #1989fa;
  text-align: right;
}

.right-button.disabled {
  color: #c8c9cc;
}

.map-container {
  flex: 1;
  position: relative;
}

.map-wrapper {
  width: 100%;
  height: 100%;
}

.bottom-info {
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.location-info {
  display: flex;
  align-items: center;
}

.address-text {
  margin-left: 8px;
  font-size: 14px;
}
</style>