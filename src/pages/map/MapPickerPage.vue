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
      <baidu-map
        ref="mapRef"
        :show-search="true"
        :show-confirm-button="false"
        :auto-locate="true"
        @select-location="handleSelectLocation"
        @locate-success="handleLocateSuccess"
        @locate-error="handleLocateError"
      />
    </div>
    
    <!-- Toast提示 -->
    <van-toast id="van-toast" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import BaiduMap from '@/components/map/BaiduMap.vue'

const router = useRouter()
const route = useRoute()
const mapRef = ref(null)

// 选中的位置信息
const selectedLocation = reactive({
  point: null,
  address: ''
})

// 处理位置选择
const handleSelectLocation = (location) => {
  selectedLocation.point = location.point
  selectedLocation.address = location.address
}

// 处理定位成功
const handleLocateSuccess = (location) => {
  selectedLocation.point = location.point
  selectedLocation.address = location.address
}

// 处理定位错误
const handleLocateError = (error) => {
  showToast('定位失败，请手动选择位置')
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
    lng: selectedLocation.point.lng,
    lat: selectedLocation.point.lat,
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
  // 检查是否有初始位置
  const initialLocation = route.query.location
  if (initialLocation) {
    try {
      const location = JSON.parse(initialLocation)
      // 设置初始位置
      selectedLocation.point = {
        lng: location.lng,
        lat: location.lat
      }
      
      if (location.address) {
        selectedLocation.address = location.address
      }
      
      // 延迟设置地图中心点，确保地图已初始化
      setTimeout(() => {
        if (mapRef.value) {
          mapRef.value.setCenter(selectedLocation.point)
        }
      }, 500)
    } catch (e) {
      console.error('解析初始位置失败', e)
    }
  }
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
</style>