<template>
  <div class="map-picker-page">
    <!-- iOS风格顶部导航 -->
    <div class="ios-nav-bar">
      <div class="left-button" @click="handleBack">
        <van-icon name="arrow-left" size="18" />
      </div>
      <div class="page-title">{{ isReadOnly ? '查看位置' : '选择位置' }}</div>
      <div v-if="!isReadOnly" class="right-button" @click="handleConfirmLocation" :class="{ disabled: !selectedLocation.address }">
        确定
      </div>
      <div v-else class="right-button-placeholder"></div>
    </div>
    
    <!-- 地图容器 -->
    <div class="map-container">
      <div class="map-wrapper">
        <baidu-map
          ref="mapRef"
          :center="initialCenter"
          :zoom="15"
          :show-search="!isReadOnly"
          :show-confirm-button="!isReadOnly"
          :auto-locate="!hasInitialLocation && !isReadOnly"
          :api-key="'W4T3NdSnqPJRPBaVoUhBLS6em9dbpeEr'"
          :disable-default-ui="isReadOnly"
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

// 初始中心点和缺失的变量
const initialCenter = ref({ lng: 116.404, lat: 39.915 }) // 默认北京
const hasInitialLocation = ref(false)

// 选中的位置信息
const selectedLocation = reactive({
  address: '',
  lat: null,
  lng: null
})

// 是否为只读模式
const isReadOnly = ref(false)

// 处理百度地图位置选择事件
const handleSelectLocation = (location) => {
  console.log('选择位置:', location)
  selectedLocation.address = location.address
  selectedLocation.lng = location.point.lng
  selectedLocation.lat = location.point.lat
}

// 处理百度地图确认位置事件
const handleConfirmLocation = () => {
  if (!selectedLocation || !selectedLocation.address) {
    showToast('请先选择一个位置');
    return;
  }

  // 构建要传递的数据对象
  const locationData = {
    lng: selectedLocation.lng,
    lat: selectedLocation.lat,
    address: selectedLocation.address
  };

  // 正确格式化location数据
  const encodedLocation = encodeURIComponent(JSON.stringify(locationData));
  
  // 获取回调路径并确保使用新的路由格式
  let callbackPath = route.query.callback || '/';
  
  // 如果回调路径是旧格式，转换为新格式
  if (callbackPath === '/publish-product') {
    callbackPath = '/publish/product';
  } else if (callbackPath === '/publish-lost-found') {
    callbackPath = '/publish/lost-found';
  } else if (callbackPath === '/publish-article') {
    callbackPath = '/publish/article';
  }
  
  // 确保生成的URL使用单个问号
  const queryChar = callbackPath.includes('?') ? '&' : '?';
  
  const finalUrl = `${callbackPath}${queryChar}location=${encodedLocation}`;
  console.log('跳转URL:', finalUrl);
  
  // 跳转到回调页面，并传递位置数据
  window.location.href = finalUrl;
}

// 定位成功处理
const handleLocateSuccess = (location) => {
  console.log('定位成功:', location)
  selectedLocation.address = location.address
  selectedLocation.lng = location.point.lng
  selectedLocation.lat = location.point.lat
  // 更新初始中心点
  initialCenter.value = {
    lng: location.point.lng,
    lat: location.point.lat
  }
  hasInitialLocation.value = true
}

// 定位失败处理
const handleLocateError = (error) => {
  console.error('定位失败:', error)
  showToast('获取您的位置失败，请手动选择')
}

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

onMounted(() => {
  // 添加消息监听
  window.addEventListener('message', handleMessage)
  
  // 检查是否为只读模式
  isReadOnly.value = route.query.readonly === 'true'
  
  // 检查是否有初始位置
  const initialLocation = route.query.location
  if (initialLocation) {
    try {
      const location = JSON.parse(decodeURIComponent(initialLocation))
      selectedLocation.address = location.address || ''
      selectedLocation.lat = location.lat
      selectedLocation.lng = location.lng
      
      // 更新初始中心点和状态
      initialCenter.value = {
        lng: location.lng,
        lat: location.lat
      }
      hasInitialLocation.value = true
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