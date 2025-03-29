<template>
  <div class="location-picker-page">
    <!-- 头部导航 -->
    <HeaderNavigation 
      title="选择位置" 
      showBack 
      @back="router.back()"
      rightIcon="check"
      @rightClick="confirmSelection"
    />
    
    <!-- 地图容器 -->
    <div class="map-wrapper">
      <BaiduMap
        ref="mapRef"
        :show-search="true"
        :show-confirm-button="false"
        :auto-locate="true"
        @select-location="handleSelectLocation"
        @locate-success="handleLocateSuccess"
        @locate-error="handleLocateError"
      />
    </div>
    
    <!-- 底部操作区 -->
    <div class="bottom-actions">
      <button class="locate-btn" @click="handleLocate">
        <i class="material-icons">my_location</i>
        <span>定位</span>
      </button>
      
      <div class="selected-address">
        <div v-if="selectedLocation.address" class="address-info">
          <div class="address-text">{{ selectedLocation.address }}</div>
        </div>
        <div v-else class="empty-address">
          <i class="material-icons">info</i>
          <span>请在地图上选择位置</span>
        </div>
      </div>
      
      <button 
        class="confirm-btn" 
        :disabled="!selectedLocation.address"
        @click="confirmSelection"
      >
        确认
      </button>
    </div>
    
    <!-- 消息提示 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HeaderNavigation from '@/components/common/HeaderNavigation.vue'
import BaiduMap from '@/components/map/BaiduMap.vue'
import Toast from '@/components/common/Toast.vue'

const router = useRouter()
const route = useRoute()
const toast = ref(null)
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
  toast.value.show('定位成功', 'success')
}

// 处理定位错误
const handleLocateError = (error) => {
  toast.value.show('定位失败，请手动选择位置', 'error')
}

// 手动定位
const handleLocate = () => {
  if (mapRef.value) {
    mapRef.value.locate()
  }
}

// 确认选择
const confirmSelection = () => {
  if (!selectedLocation.address) {
    toast.value.show('请先选择位置', 'warning')
    return
  }
  
  // 返回选中的位置信息
  const callbackPath = route.query.callback || '/'
  
  // 构建返回路径和参数
  router.push({
    path: callbackPath,
    query: {
      location: JSON.stringify({
        lng: selectedLocation.point.lng,
        lat: selectedLocation.point.lat,
        address: selectedLocation.address
      })
    }
  })
}

onMounted(() => {
  // 如果有初始位置，设置到地图上
  const initialLocation = route.query.location
  if (initialLocation) {
    try {
      const location = JSON.parse(initialLocation)
      if (location && location.lng && location.lat) {
        // 延迟设置，确保地图已经初始化
        setTimeout(() => {
          if (mapRef.value) {
            mapRef.value.setCenter({
              lng: location.lng,
              lat: location.lat
            })
          }
        }, 500)
      }
    } catch (e) {
      console.error('解析初始位置失败', e)
    }
  }
})
</script>

<style scoped>
.location-picker-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.map-wrapper {
  flex: 1;
  position: relative;
}

.bottom-actions {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.locate-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  cursor: pointer;
}

.locate-btn i {
  font-size: 16px;
  color: #333;
}

.locate-btn span {
  font-size: 10px;
  margin-top: 2px;
}

.selected-address {
  flex: 1;
  margin: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.address-info {
  font-size: 0.9rem;
}

.empty-address {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 0.9rem;
}

.empty-address i {
  font-size: 1rem;
  margin-right: 5px;
}

.confirm-btn {
  padding: 8px 15px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}
</style>