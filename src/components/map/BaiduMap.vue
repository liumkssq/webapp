<template>
  <div class="baidu-map-container">
    <div id="baiduMap" class="map-container"></div>
    
    <!-- 地址显示区域 -->
    <div v-if="address" class="address-display">
      <div class="current-address">
        <i class="material-icons">location_on</i>
        <span>{{ address }}</span>
      </div>
      <div v-if="showConfirmButton" class="action-buttons">
        <button class="confirm-btn" @click="confirmLocation">确认位置</button>
      </div>
    </div>
    
    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-box">
      <div class="search-input-container">
        <i class="material-icons">search</i>
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索地点" 
          @keyup.enter="searchLocation"
        />
        <i 
          v-if="searchKeyword" 
          class="material-icons clear-btn" 
          @click="clearSearch"
        >close</i>
      </div>
      <button class="search-btn" @click="searchLocation">搜索</button>
    </div>
    
    <!-- 加载中提示 -->
    <div v-if="loading" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  // 初始中心点
  center: {
    type: Object,
    default: () => ({ lng: 116.404, lat: 39.915 }) // 默认北京
  },
  // 初始缩放级别
  zoom: {
    type: Number,
    default: 15
  },
  // 是否显示搜索框
  showSearch: {
    type: Boolean,
    default: true
  },
  // 是否显示确认按钮
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  // 是否在组件挂载时定位
  autoLocate: {
    type: Boolean,
    default: false
  },
  // 百度地图API密钥
  apiKey: {
    type: String,
    default: 'W4T3NdSnqPJRPBaVoUhBLS6em9dbpeEr'
  }
})

const emit = defineEmits(['select-location', 'confirm-location', 'locate-success', 'locate-error'])

// 地图状态
const map = ref(null)
const loading = ref(true)
const address = ref('')
const searchKeyword = ref('')
const currentMarker = ref(null)
const currentPoint = ref(null)

// 初始化百度地图
const initMap = () => {
  // 确保BMap已经加载
  if (typeof BMap === 'undefined') {
    // 如果未加载，等待一会再试
    setTimeout(initMap, 100)
    return
  }
  
  // 创建地图实例
  map.value = new BMap.Map('baiduMap')
  
  // 设置中心点和缩放级别
  const point = new BMap.Point(props.center.lng, props.center.lat)
  map.value.centerAndZoom(point, props.zoom)
  
  // 启用滚轮缩放和拖拽
  map.value.enableScrollWheelZoom(true)
  map.value.enableDragging()
  
  // 添加控件
  addControls()
  
  // 添加点击事件监听
  map.value.addEventListener('click', handleMapClick)
  
  // 如果配置了自动定位，则定位
  if (props.autoLocate) {
    getCurrentLocation()
  }
  
  loading.value = false
}

// 添加地图控件
const addControls = () => {
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
  currentPoint.value = { lng: point.lng, lat: point.lat }
  
  // 更新标记
  updateMarker(point)
  
  // 获取地址
  getAddressByPoint(point)
  
  // 发送选择位置事件
  emit('select-location', {
    point: { lng: point.lng, lat: point.lat },
    address: address.value
  })
}

// 更新标记
const updateMarker = (point) => {
  // 清除之前的标记
  if (currentMarker.value) {
    map.value.removeOverlay(currentMarker.value)
  }
  
  // 创建新标记
  currentMarker.value = new BMap.Marker(point)
  map.value.addOverlay(currentMarker.value)
  
  // 添加动画效果
  currentMarker.value.setAnimation(BMAP_ANIMATION_DROP)
}

// 根据点获取地址
const getAddressByPoint = (point) => {
  loading.value = true
  
  // 创建地址解析器实例
  const geoCoder = new BMap.Geocoder()
  
  // 将坐标转换为地址
  geoCoder.getLocation(point, (result) => {
    loading.value = false
    
    if (result) {
      address.value = result.address
    } else {
      address.value = '未知地址'
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
      currentPoint.value = { lng: point.lng, lat: point.lat }
      
      // 移动到定位点
      map.value.panTo(point)
      
      // 更新标记
      updateMarker(point)
      
      // 获取地址
      getAddressByPoint(point)
      
      // 发送定位成功事件
      emit('locate-success', {
        point: { lng: point.lng, lat: point.lat },
        address: address.value
      })
    } else {
      // 定位失败
      console.error('定位失败：' + geolocation.getStatus())
      
      // 发送定位错误事件
      emit('locate-error', geolocation.getStatus())
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
          currentPoint.value = { lng: point.lng, lat: point.lat }
          
          // 移动到搜索点
          map.value.panTo(point)
          
          // 更新标记（不需要手动添加，LocalSearch已经添加了）
          // 但我们仍需要更新currentMarker引用以便后续操作
          map.value.clearOverlays() // 清除搜索结果添加的所有标记
          updateMarker(point)
          
          // 获取地址
          address.value = poi.address || poi.title
          
          // 发送选择位置事件
          emit('select-location', {
            point: { lng: point.lng, lat: point.lat },
            address: address.value
          })
        }
      } else {
        // 搜索失败
        console.error('搜索失败：' + localSearch.getStatus())
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
  if (currentPoint.value) {
    emit('confirm-location', {
      point: currentPoint.value,
      address: address.value
    })
  }
}

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    const point = new BMap.Point(newCenter.lng, newCenter.lat)
    map.value.panTo(point)
  }
}, { deep: true })

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  if (map.value && newZoom) {
    map.value.setZoom(newZoom)
  }
})

// 组件挂载时加载地图
onMounted(() => {
  // 检查百度地图API是否已经加载
  if (typeof BMap === 'undefined') {
    // 如果没有加载，动态加载脚本
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${props.apiKey}&callback=initBaiduMap`
    document.head.appendChild(script)
    
    // 定义回调函数
    window.initBaiduMap = () => {
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
  if (window.initBaiduMap) {
    window.initBaiduMap = null
  }
  
  // 清理地图实例
  if (map.value) {
    map.value.clearOverlays()
    map.value = null
  }
})

// 暴露方法
defineExpose({
  // 定位到当前位置
  locate: getCurrentLocation,
  // 搜索位置
  search: (keyword) => {
    searchKeyword.value = keyword
    searchLocation()
  },
  // 清除标记
  clearMarker: () => {
    if (map.value && currentMarker.value) {
      map.value.removeOverlay(currentMarker.value)
      currentMarker.value = null
    }
  },
  // 设置中心点
  setCenter: (point) => {
    if (map.value && point) {
      const bPoint = new BMap.Point(point.lng, point.lat)
      map.value.panTo(bPoint)
    }
  },
  // 获取当前选择的位置
  getCurrentLocation: () => {
    return {
      point: currentPoint.value,
      address: address.value
    }
  }
})
</script>

<style scoped>
.baidu-map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.address-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.current-address {
  display: flex;
  align-items: center;
}

.current-address i {
  margin-right: 8px;
  color: #1e88e5;
}

.action-buttons {
  margin-top: 10px;
  text-align: right;
}

.confirm-btn {
  padding: 6px 12px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-box {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 60px;
  display: flex;
}

.search-input-container {
  flex: 1;
  position: relative;
  background-color: white;
  border-radius: 4px 0 0 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.search-input-container i {
  color: #999;
}

.search-input-container input {
  flex: 1;
  border: none;
  padding: 10px;
  outline: none;
}

.clear-btn {
  cursor: pointer;
}

.search-btn {
  padding: 0 12px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 15px 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  margin-bottom: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>