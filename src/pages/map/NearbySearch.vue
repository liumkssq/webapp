<template>
  <div class="nearby-search">
    <van-nav-bar
      title="附近商品"
      left-arrow
      @click-left="goBack"
      fixed
    />
    
    <div class="search-header">
      <div class="search-location" @click="goToLocationPicker">
        <i class="material-icons">place</i>
        <span class="location-text">{{ currentAddressName || '正在获取位置...' }}</span>
        <i class="material-icons chevron">keyboard_arrow_down</i>
      </div>
      
      <div class="distance-selector">
        <van-dropdown-menu active-color="#007aff">
          <van-dropdown-item v-model="searchRadius" :options="radiusOptions" />
        </van-dropdown-menu>
      </div>
    </div>
    
    <!-- 地图区域 -->
    <div id="map-container" class="map-container"></div>
    
    <!-- 结果列表 -->
    <div class="search-results">
      <div class="filter-bar">
        <div 
          v-for="(filter, index) in filters" 
          :key="index"
          class="filter-item"
          :class="{ active: filter.active }"
          @click="toggleFilter(index)"
        >
          {{ filter.text }}
          <i v-if="filter.active" class="material-icons">check</i>
        </div>
      </div>
      
      <div v-if="isLoading" class="loading-container">
        <van-loading type="spinner" color="#007aff" />
        <p>搜索中...</p>
      </div>
      
      <div v-else-if="nearbyProducts.length === 0" class="empty-result">
        <i class="material-icons">search_off</i>
        <p>暂无附近商品</p>
        <p class="empty-tip">您可以尝试扩大搜索范围或更换位置</p>
      </div>
      
      <div v-else class="product-list">
        <ProductCard 
          v-for="product in nearbyProducts" 
          :key="product.id"
          :product="product"
          :show-distance="true"
          @click="goToDetail(product.id)"
        />
      </div>
      
      <van-empty v-if="!isLoading && nearbyProducts.length === 0" description="暂无附近商品" />
      
      <van-back-top :right="16" :bottom="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import ProductCard from '@/components/product/ProductCard.vue'
import useMap from '@/composables/useMap'
import { searchNearbyProducts } from '@/api/product'

const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const nearbyProducts = ref([])
const searchRadius = ref(2000) // 默认搜索半径2000米

// 使用地图组合式函数
const { 
  mapInstance, 
  isLoaded, 
  currentLocation, 
  currentAddress, 
  initMap, 
  getCurrentLocation,
  setMapCenter,
  updateMarker,
  addMapControls
} = useMap({
  autoLocate: true,
  defaultCenter: { lng: 116.404, lat: 39.915 },
  defaultZoom: 15
})

// 格式化显示地址
const currentAddressName = computed(() => {
  if (!currentAddress.value) return '正在获取位置...'
  
  // 尝试从地址中提取最有意义的部分
  const parts = currentAddress.value.split(/[,，]/)
  if (parts.length > 2) {
    return parts[parts.length - 2] || parts[parts.length - 1]
  }
  return currentAddress.value
})

// 搜索半径选项
const radiusOptions = [
  { text: '500米内', value: 500 },
  { text: '1公里内', value: 1000 },
  { text: '2公里内', value: 2000 },
  { text: '5公里内', value: 5000 },
  { text: '10公里内', value: 10000 }
]

// 筛选选项
const filters = ref([
  { text: '全部', active: true, type: 'all' },
  { text: '价格优先', active: false, type: 'price' },
  { text: '距离优先', active: false, type: 'distance' },
  { text: '最新发布', active: false, type: 'time' }
])

// 切换筛选条件
const toggleFilter = (index) => {
  filters.value.forEach((filter, i) => {
    filter.active = i === index
  })
  
  // 重新搜索
  searchNearby()
}

// 获取激活的筛选条件
const getActiveFilter = () => {
  const activeFilter = filters.value.find(filter => filter.active)
  return activeFilter ? activeFilter.type : 'all'
}

// 搜索附近商品
const searchNearby = async () => {
  if (!currentLocation.value) {
    showToast('正在获取位置，请稍候...')
    return
  }
  
  isLoading.value = true
  
  try {
    const params = {
      longitude: currentLocation.value.lng,
      latitude: currentLocation.value.lat,
      radius: searchRadius.value,
      sortBy: getActiveFilter()
    }
    
    const res = await searchNearbyProducts(params)
    
    if (res && res.data) {
      nearbyProducts.value = res.data.map(item => ({
        ...item,
        distance: item.distance || null
      }))
      
      // 在地图上标记商品
      if (mapInstance.value) {
        showProductsOnMap(nearbyProducts.value)
      }
    }
  } catch (error) {
    console.error('搜索附近商品失败:', error)
    showToast('搜索失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 在地图上展示商品
const showProductsOnMap = (products) => {
  if (!mapInstance.value || !products.length) return
  
  // 清除之前的标记
  mapInstance.value.clearOverlays()
  
  // 当前位置标记
  if (currentLocation.value) {
    const point = new BMap.Point(currentLocation.value.lng, currentLocation.value.lat)
    const marker = new BMap.Marker(point, {
      icon: new BMap.Icon('/images/my-location.png', new BMap.Size(30, 30), {
        imageSize: new BMap.Size(30, 30)
      })
    })
    mapInstance.value.addOverlay(marker)
    
    // 添加圆形范围
    const circle = new BMap.Circle(point, searchRadius.value, {
      strokeColor: 'rgba(0, 122, 255, 0.6)',
      strokeWeight: 1,
      strokeOpacity: 0.5,
      fillColor: 'rgba(0, 122, 255, 0.1)',
      fillOpacity: 0.3
    })
    mapInstance.value.addOverlay(circle)
  }
  
  // 添加商品标记
  products.forEach((product, index) => {
    if (product.location && product.location.longitude && product.location.latitude) {
      const point = new BMap.Point(product.location.longitude, product.location.latitude)
      const marker = new BMap.Marker(point)
      
      // 信息窗口
      const infoWindow = new BMap.InfoWindow(`
        <div style="width: 220px; padding: 5px;">
          <div style="font-weight: bold; margin-bottom: 5px;">${product.title}</div>
          <div style="color: #ff6b6b; margin-bottom: 5px;">¥${product.price}</div>
          <div style="font-size: 12px; color: #666;">${product.location.address || '未知地址'}</div>
        </div>
      `, {
        width: 250,
        height: 100,
        enableMessage: false
      })
      
      // 点击标记显示信息窗口
      marker.addEventListener('click', () => {
        mapInstance.value.openInfoWindow(infoWindow, point)
      })
      
      mapInstance.value.addOverlay(marker)
    }
  })
}

// 前往商品详情
const goToDetail = (id) => {
  router.push({
    name: 'ProductDetail',
    params: {
      id
    }
  })
}

// 前往位置选择
const goToLocationPicker = () => {
  router.push({
    name: 'LocationPicker',
    params: {
      from: 'NearbySearch'
    },
    query: currentLocation.value ? {
      lng: currentLocation.value.lng,
      lat: currentLocation.value.lat,
      address: currentAddress.value
    } : {}
  })
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 初始化地图
const initSearchMap = async () => {
  try {
    await initMap('map-container')
    addMapControls()
  } catch (error) {
    console.error('初始化地图失败:', error)
    showToast('地图初始化失败')
  }
}

// 监听位置变化
watch(
  currentLocation,
  (newLocation) => {
    if (newLocation && mapInstance.value) {
      setMapCenter(newLocation)
      updateMarker(newLocation)
      searchNearby()
    }
  }
)

// 监听搜索半径变化
watch(
  searchRadius,
  () => {
    searchNearby()
  }
)

// 监听路由参数
watch(
  () => route.query,
  (query) => {
    if (query.selected_location === 'true' && query.selected_lng && query.selected_lat) {
      const location = {
        lng: Number(query.selected_lng),
        lat: Number(query.selected_lat)
      }
      
      // 更新位置并重新搜索
      setMapCenter(location)
      updateMarker(location)
      searchNearby()
    }
  }
)

// 组件挂载
onMounted(async () => {
  await initSearchMap()
  
  if (currentLocation.value) {
    searchNearby()
  }
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 清理工作（如有必要）
})
</script>

<style scoped>
.nearby-search {
  padding-top: 46px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.search-location {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #333;
  cursor: pointer;
}

.search-location i {
  color: #007aff;
  margin-right: 4px;
  font-size: 20px;
}

.search-location .chevron {
  color: #999;
  margin-left: 4px;
  font-size: 18px;
}

.location-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.distance-selector {
  display: flex;
  justify-content: flex-end;
}

.map-container {
  width: 100%;
  height: 200px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 70px 0;
  position: relative;
}

.filter-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  background-color: #fff;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  padding: 6px 10px;
  border-radius: 16px;
  cursor: pointer;
}

.filter-item.active {
  color: #007aff;
  background-color: rgba(0, 122, 255, 0.1);
}

.filter-item i {
  font-size: 16px;
  margin-left: 4px;
}

.product-list {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.loading-container p {
  margin-top: 10px;
  font-size: 14px;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
}

.empty-result i {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-result p {
  margin: 5px 0;
  font-size: 15px;
}

.empty-tip {
  font-size: 13px !important;
  color: #999;
}

.material-icons {
  font-family: 'Material Icons';
}
</style> 