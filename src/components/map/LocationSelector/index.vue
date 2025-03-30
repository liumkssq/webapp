<template>
  <div class="location-selector">
    <!-- 地图容器 -->
    <div class="map-container">
      <div id="selectorMap" class="map"></div>
      
      <!-- 位置信息显示区域 -->
      <div v-if="selectedLocation.address" class="location-info">
        <div class="location-address">
          <van-icon name="location-o" size="16" color="#1989fa" />
          <span>{{ selectedLocation.address }}</span>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <div class="search-box">
        <div class="search-input-container">
          <van-icon name="search" color="#999" />
          <input 
            type="text" 
            v-model="searchKeyword" 
            placeholder="搜索地点" 
            @keyup.enter="searchLocation"
            class="search-input"
          />
          <van-icon 
            v-if="searchKeyword" 
            name="clear" 
            color="#999" 
            class="clear-btn" 
            @click="clearSearch"
          />
        </div>
        <van-button 
          type="primary" 
          size="small" 
          class="search-btn" 
          @click="searchLocation"
        >
          搜索
        </van-button>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-buttons">
        <van-button 
          class="locate-btn" 
          icon="aim" 
          round 
          size="small" 
          @click="getCurrentLocation"
        />
      </div>
      
      <!-- 加载中提示 -->
      <div v-if="loading" class="loading-indicator">
        <van-loading type="spinner" color="#1989fa" size="24px" />
        <span>加载中...</span>
      </div>
    </div>
    
    <!-- 底部操作区域 -->
    <div class="bottom-actions">
      <van-button 
        type="primary" 
        block 
        :disabled="!selectedLocation.address" 
        @click="confirmLocation"
      >
        确认位置
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  // 初始位置
  initialLocation: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['confirm'])

// 状态变量
const map = ref(null)
const loading = ref(false)
const searchKeyword = ref('')
const currentMarker = ref(null)
const selectedLocation = reactive({
  point: null,
  address: ''
})

// 初始化地图
const initMap = () => {
  // 确保BMap已加载
  if (typeof BMap === 'undefined') {
    setTimeout(initMap, 100)
    return
  }
  
  loading.value = true
  
  // 创建地图实例
  map.value = new BMap.Map('selectorMap')
  
  // 设置初始中心点和缩放级别
  let initialPoint
  
  if (props.initialLocation && props.initialLocation.lng && props.initialLocation.lat) {
    initialPoint = new BMap.Point(props.initialLocation.lng, props.initialLocation.lat)
    
    // 如果有初始位置，设置当前位置和标记
    selectedLocation.point = {
      lng: props.initialLocation.lng,
      lat: props.initialLocation.lat
    }
    
    if (props.initialLocation.address) {
      selectedLocation.address = props.initialLocation.address
    } else {
      // 获取地址信息
      getAddressByPoint(initialPoint)
    }
  } else {
    // 默认位置(北京)
    initialPoint = new BMap.Point(116.404, 39.915)
  }
  
  map.value.centerAndZoom(initialPoint, 15)
  
  // 启用地图功能
  map.value.enableScrollWheelZoom(true)
  map.value.enableDragging()
  
  // 添加控件
  addMapControls()
  
  // 如果有初始位置，添加标记
  if (props.initialLocation && props.initialLocation.lng && props.initialLocation.lat) {
    updateMarker(initialPoint)
  } else {
    // 如果没有初始位置，尝试自动定位
    getCurrentLocation()
  }
  
  // 添加地图点击事件监听
  map.value.addEventListener('click', handleMapClick)
  
  loading.value = false
}

// 添加地图控件
const addMapControls = () => {
  // 添加缩放控件
  const navigationControl = new BMap.NavigationControl({
    anchor: BMAP_ANCHOR_TOP_RIGHT,
    type: BMAP_NAVIGATION_CONTROL_SMALL
  })
  map.value.addControl(navigationControl)
  
  // 添加比例尺控件
  const scaleControl = new BMap.ScaleControl({
    anchor: BMAP_ANCHOR_BOTTOM_LEFT
  })
  map.value.addControl(scaleControl)
}

// 处理地图点击
const handleMapClick = (e) => {
  const point = e.point
  selectedLocation.point = { lng: point.lng, lat: point.lat }
  
  // 更新标记
  updateMarker(point)
  
  // 获取地址
  getAddressByPoint(point)
}

// 更新地图标记
const updateMarker = (point) => {
  // 清除之前的标记
  if (currentMarker.value && map.value) {
    map.value.removeOverlay(currentMarker.value)
  }
  
  // 创建新标记
  currentMarker.value = new BMap.Marker(point)
  map.value.addOverlay(currentMarker.value)
  
  // 添加动画效果
  currentMarker.value.setAnimation(BMAP_ANIMATION_DROP)
}

// 根据坐标获取地址
const getAddressByPoint = (point) => {
  loading.value = true
  
  // 创建地址解析器实例
  const geoCoder = new BMap.Geocoder()
  
  // 将坐标转换为地址
  geoCoder.getLocation(point, (result) => {
    loading.value = false
    
    if (result) {
      selectedLocation.address = result.address
    } else {
      selectedLocation.address = '未知地址'
    }
  })
}

// 获取当前位置
const getCurrentLocation = () => {
  loading.value = true
  
  // 创建定位控件
  const geolocation = new BMap.Geolocation()
  
  // 开始定位
  geolocation.getCurrentPosition((result) => {
    loading.value = false
    
    if (geolocation.getStatus() === BMAP_STATUS_SUCCESS) {
      // 定位成功
      const point = result.point
      selectedLocation.point = { 
        lng: point.lng, 
        lat: point.lat 
      }
      
      // 移动到定位点
      map.value.panTo(point)
      
      // 更新标记
      updateMarker(point)
      
      // 获取地址
      getAddressByPoint(point)
      
      showToast('定位成功')
    } else {
      // 定位失败
      console.error('定位失败：' + geolocation.getStatus())
      showToast('定位失败，请手动选择位置')
    }
  }, { enableHighAccuracy: true })
}

// 搜索位置
const searchLocation = () => {
  if (!searchKeyword.value) return
  
  loading.value = true
  
  // 创建本地搜索实例
  const localSearch = new BMap.LocalSearch(map.value, {
    renderOptions: { map: map.value },
    onSearchComplete: (results) => {
      loading.value = false
      
      if (localSearch.getStatus() === BMAP_STATUS_SUCCESS) {
        // 搜索成功，获取第一个结果
        if (results.getCurrentNumPois() > 0) {
          const poi = results.getPoi(0)
          const point = poi.point
          selectedLocation.point = { lng: point.lng, lat: point.lat }
          
          // 移动到搜索点
          map.value.panTo(point)
          
          // 清除所有标记并添加新标记
          map.value.clearOverlays()
          updateMarker(point)
          
          // 获取地址
          selectedLocation.address = poi.address || poi.title
        } else {
          showToast('没有找到相关位置')
        }
      } else {
        // 搜索失败
        console.error('搜索失败：' + localSearch.getStatus())
        showToast('搜索失败，请重试')
      }
    }
  })
  
  // 开始搜索
  localSearch.search(searchKeyword.value)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 确认位置
const confirmLocation = () => {
  if (!selectedLocation.point || !selectedLocation.address) {
    showToast('请先选择位置')
    return
  }
  
  emit('confirm', {
    point: selectedLocation.point,
    address: selectedLocation.address
  })
}

// 组件挂载
onMounted(() => {
  // 检查百度地图API是否已经加载
  if (typeof BMap === 'undefined') {
    // 如果没有加载，动态加载脚本
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=W4T3NdSnqPJRPBaVoUhBLS6em9dbpeEr&callback=initBaiduMapSelector`
    document.head.appendChild(script)
    
    // 定义回调函数
    window.initBaiduMapSelector = () => {
      initMap()
    }
  } else {
    // 如果已经加载，直接初始化地图
    initMap()
  }
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 移除全局回调
  if (window.initBaiduMapSelector) {
    window.initBaiduMapSelector = null
  }
  
  // 清理地图实例
  if (map.value) {
    map.value.clearOverlays()
    map.value = null
  }
})

// 暴露方法
defineExpose({
  getCurrentLocation,
  setInitialLocation: (location) => {
    if (location && location.lng && location.lat && map.value) {
      const point = new BMap.Point(location.lng, location.lat)
      map.value.panTo(point)
      updateMarker(point)
      
      selectedLocation.point = { lng: location.lng, lat: location.lat }
      
      if (location.address) {
        selectedLocation.address = location.address
      } else {
        getAddressByPoint(point)
      }
    }
  }
})
</script>

<style scoped>
.location-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f8f8;
}

.map-container {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 300px;
}

.map {
  width: 100%;
  height: 100%;
}

.search-box {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 60px;
  display: flex;
  z-index: 2;
}

.search-input-container {
  flex: 1;
  background-color: white;
  border-radius: 4px 0 0 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.search-input {
  flex: 1;
  border: none;
  padding: 8px;
  outline: none;
  font-size: 14px;
}

.clear-btn {
  cursor: pointer;
}

.search-btn {
  border-radius: 0 4px 4px 0;
}

.location-info {
  position: absolute;
  bottom: 60px;
  left: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.location-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.control-buttons {
  position: absolute;
  right: 10px;
  bottom: 60px;
  z-index: 2;
}

.locate-btn {
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.bottom-actions {
  padding: 10px 16px;
  background-color: white;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>