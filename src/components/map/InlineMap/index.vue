<template>
  <div class="inline-map-container" :style="{ height: height }">
    <div class="map-wrapper">
      <div id="inlineMap" ref="mapContainer" class="map-container"></div>
      
      <!-- 位置信息显示 -->
      <div v-if="showLocationInfo && currentLocation.address" class="location-info">
        <div class="location-address">
          <van-icon name="location-o" size="16" color="#1989fa" />
          <span>{{ currentLocation.address }}</span>
        </div>
      </div>
      
      <!-- 加载中提示 -->
      <div v-if="loading" class="loading-indicator">
        <van-loading type="spinner" color="#1989fa" size="24px" />
        <span>加载中...</span>
      </div>
    </div>
    
    <!-- 地图底部控制按钮 -->
    <div v-if="showControls" class="map-controls">
      <van-button 
        v-if="showLocateButton" 
        class="control-button locate-button" 
        icon="aim" 
        size="small" 
        round 
        @click="getCurrentLocation"
      />
      
      <van-button 
        v-if="selectable" 
        class="control-button select-button" 
        type="primary" 
        size="small" 
        round 
        @click="handleConfirmLocation"
        :disabled="!currentLocation.address"
      >
        确认位置
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineProps, defineEmits } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  // 地图高度
  height: {
    type: String,
    default: '200px'
  },
  // 初始位置
  initialLocation: {
    type: Object,
    default: null
  },
  // 是否可选择位置
  selectable: {
    type: Boolean,
    default: false
  },
  // 是否显示控制按钮
  showControls: {
    type: Boolean,
    default: true
  },
  // 是否显示定位按钮
  showLocateButton: {
    type: Boolean,
    default: true
  },
  // 是否显示位置信息
  showLocationInfo: {
    type: Boolean,
    default: true
  },
  // 是否自动定位
  autoLocate: {
    type: Boolean,
    default: false
  },
  // 初始化缩放级别
  zoom: {
    type: Number,
    default: 15
  }
})

const emit = defineEmits(['select-location', 'confirm-location', 'map-ready', 'locate-success', 'locate-error'])

// 状态变量
const mapContainer = ref(null)
const map = ref(null)
const loading = ref(true)
const currentMarker = ref(null)
const currentLocation = ref({
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
  map.value = new BMap.Map(mapContainer.value)
  
  // 设置初始中心点和缩放级别
  let initialPoint
  
  if (props.initialLocation && props.initialLocation.lng && props.initialLocation.lat) {
    initialPoint = new BMap.Point(props.initialLocation.lng, props.initialLocation.lat)
    
    // 如果有初始位置，设置当前位置和标记
    currentLocation.value.point = {
      lng: props.initialLocation.lng,
      lat: props.initialLocation.lat
    }
    
    if (props.initialLocation.address) {
      currentLocation.value.address = props.initialLocation.address
    } else {
      // 获取地址信息
      getAddressByPoint(initialPoint)
    }
  } else {
    // 默认位置(北京)
    initialPoint = new BMap.Point(116.404, 39.915)
  }
  
  map.value.centerAndZoom(initialPoint, props.zoom)
  
  // 启用地图功能
  map.value.enableScrollWheelZoom(true)
  map.value.enableDragging()
  
  // 添加控件
  addMapControls()
  
  // 如果有初始位置，添加标记
  if (props.initialLocation && props.initialLocation.lng && props.initialLocation.lat) {
    updateMarker(initialPoint)
  }
  
  // 添加地图点击事件监听
  if (props.selectable) {
    map.value.addEventListener('click', handleMapClick)
  }
  
  // 如果设置了自动定位
  if (props.autoLocate && (!props.initialLocation || !props.initialLocation.lng)) {
    getCurrentLocation()
  }
  
  loading.value = false
  
  // 触发地图准备好的事件
  emit('map-ready', map.value)
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
  if (!props.selectable) return
  
  const point = e.point
  currentLocation.value.point = { lng: point.lng, lat: point.lat }
  
  // 更新标记
  updateMarker(point)
  
  // 获取地址
  getAddressByPoint(point)
  
  // 发送选择位置事件
  emit('select-location', {
    point: { lng: point.lng, lat: point.lat },
    address: currentLocation.value.address
  })
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
      currentLocation.value.address = result.address
    } else {
      currentLocation.value.address = '未知地址'
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
      currentLocation.value.point = { 
        lng: point.lng, 
        lat: point.lat 
      }
      
      // 移动到定位点
      map.value.panTo(point)
      
      // 更新标记
      updateMarker(point)
      
      // 获取地址
      getAddressByPoint(point)
      
      // 发送定位成功事件
      emit('locate-success', {
        point: currentLocation.value.point,
        address: currentLocation.value.address
      })
      
      showToast('定位成功')
    } else {
      // 定位失败
      console.error('定位失败：' + geolocation.getStatus())
      
      // 发送定位错误事件
      emit('locate-error', geolocation.getStatus())
      
      showToast('定位失败，请手动选择位置')
    }
  }, { enableHighAccuracy: true })
}

// 确认选择位置
const handleConfirmLocation = () => {
  if (!currentLocation.value.point || !currentLocation.value.address) {
    showToast('请先选择位置')
    return
  }
  
  emit('confirm-location', {
    point: currentLocation.value.point,
    address: currentLocation.value.address
  })
}

// 设置中心点
const setCenter = (point) => {
  if (!map.value || !point || !point.lng || !point.lat) return
  
  const bPoint = new BMap.Point(point.lng, point.lat)
  map.value.panTo(bPoint)
  
  // 更新标记
  updateMarker(bPoint)
  
  // 更新当前位置
  currentLocation.value.point = { lng: point.lng, lat: point.lat }
  
  // 获取地址
  getAddressByPoint(bPoint)
}

// 监听初始位置变化
watch(() => props.initialLocation, (newLocation) => {
  if (map.value && newLocation && newLocation.lng && newLocation.lat) {
    setCenter({
      lng: newLocation.lng,
      lat: newLocation.lat
    })
  }
}, { deep: true })

// 组件挂载
onMounted(() => {
  // 检查百度地图API是否已经加载
  if (typeof BMap === 'undefined') {
    // 如果没有加载，动态加载脚本
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=W4T3NdSnqPJRPBaVoUhBLS6em9dbpeEr&callback=initBaiduMapComponent`
    document.head.appendChild(script)
    
    // 定义回调函数
    window.initBaiduMapComponent = () => {
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
  if (window.initBaiduMapComponent) {
    window.initBaiduMapComponent = null
  }
  
  // 清理地图实例
  if (map.value) {
    map.value.clearOverlays()
    map.value = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  setCenter,
  getCurrentLocation,
  getLocation: () => currentLocation.value
})
</script>

<style scoped>
.inline-map-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.location-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.location-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.map-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2;
}

.control-button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.locate-button {
  background-color: #fff;
}

.select-button {
  padding: 0 12px;
}
</style>