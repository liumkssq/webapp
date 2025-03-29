<template>
  <div class="location-picker">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="left" @click="goBack">
        <i class="material-icons">arrow_back</i>
        <span>返回</span>
      </div>
      <div class="title">选择位置</div>
      <div class="right" @click="confirmLocation" :class="{ disabled: !currentAddress }">
        <span>确定</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input">
        <i class="material-icons">search</i>
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索地点"
          @input="onKeywordChange"
          @focus="showSearchPanel = true"
          @keyup.enter="searchLocation"
        />
        <i v-if="searchKeyword" class="material-icons clear" @click="clearSearch">close</i>
      </div>
    </div>

    <!-- 地图容器 -->
    <div id="map-container" class="map-container"></div>

    <!-- 当前位置信息 -->
    <div v-if="currentAddress" class="location-info">
      <div class="info-content">
        <i class="material-icons location-icon">location_on</i>
        <div class="address-detail">
          <div class="address-name">{{ getAddressName() }}</div>
          <div class="address-full">{{ currentAddress }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索面板 -->
    <div v-if="showSearchPanel" class="search-panel">
      <!-- 搜索结果 -->
      <div v-if="searchResults.length" class="search-results">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-item"
          @click="selectSearchResult(result)"
        >
          <i class="material-icons">place</i>
          <div class="result-content">
            <div class="result-title">{{ result.title }}</div>
            <div class="result-address">{{ result.address }}</div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-else-if="searchHistory.length && !searchKeyword" class="search-history">
        <div class="history-header">
          <div class="title">搜索历史</div>
          <div class="clear" @click="clearHistory">清除</div>
        </div>
        <div class="history-list">
          <div
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="useHistoryItem(item)"
          >
            <i class="material-icons">history</i>
            <span>{{ item.title }}</span>
          </div>
        </div>
      </div>

      <!-- 附近的点 -->
      <div v-else-if="!searchKeyword && !isLoading" class="nearby-places">
        <div class="nearby-header">
          <div class="title">附近的地点</div>
        </div>
        <div class="nearby-list">
          <div
            v-for="(place, index) in nearbyPlaces"
            :key="index"
            class="nearby-item"
            @click="selectNearbyPlace(place)"
          >
            <i class="material-icons">place</i>
            <div class="place-content">
              <div class="place-title">{{ place.title }}</div>
              <div class="place-address">{{ place.address }}</div>
              <div class="place-distance">{{ formatDistance(place.distance) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="searchKeyword && !isLoading && !searchResults.length" class="no-results">
        <i class="material-icons">search_off</i>
        <p>未找到相关位置信息</p>
      </div>

      <!-- 加载中提示 -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>搜索中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import useMap from '@/composables/useMap'
import { showToast } from 'vant'

const props = defineProps({
  initialLocation: {
    type: Object,
    default: () => null // { lng, lat, address }
  }
})

const emit = defineEmits(['select', 'cancel'])
const router = useRouter()

// 使用地图组合式函数
const { 
  mapInstance, 
  isLoaded, 
  isLoading, 
  currentLocation, 
  currentAddress,
  searchResults: mapSearchResults,
  initMap, 
  getCurrentLocation, 
  searchLocation: doMapSearch,
  selectLocation,
  getNearbyPlaces
} = useMap({
  autoLocate: !props.initialLocation,
  defaultCenter: props.initialLocation?.location || { lng: 116.404, lat: 39.915 }
})

// 本地状态
const searchKeyword = ref('')
const searchResults = ref([])
const showSearchPanel = ref(false)
const searchHistory = ref([])
const nearbyPlaces = ref([])

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('locationSearchHistory')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('读取搜索历史失败:', error)
  }
}

// 保存搜索历史
const saveSearchHistory = (item) => {
  try {
    // 移除重复项
    searchHistory.value = searchHistory.value.filter(h => h.title !== item.title)
    // 添加到开头
    searchHistory.value.unshift(item)
    // 保持最多10条记录
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
    // 保存到本地
    localStorage.setItem('locationSearchHistory', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 清除搜索历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('locationSearchHistory')
}

// 使用历史记录项
const useHistoryItem = (item) => {
  searchKeyword.value = item.title
  if (item.location) {
    selectSearchResult(item)
  } else {
    searchLocation()
  }
}

// 处理关键词变化
const onKeywordChange = () => {
  if (!searchKeyword.value) {
    searchResults.value = []
    return
  }
  // 实现简单的防抖
  if (window.searchTimeout) {
    clearTimeout(window.searchTimeout)
  }
  window.searchTimeout = setTimeout(() => {
    searchLocation()
  }, 500)
}

// 搜索位置
const searchLocation = async () => {
  if (!searchKeyword.value) return
  
  try {
    const results = await doMapSearch(searchKeyword.value)
    searchResults.value = results || []
  } catch (error) {
    console.error('搜索位置失败:', error)
    showToast('搜索失败，请重试')
  }
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 选择搜索结果
const selectSearchResult = async (result) => {
  try {
    await selectLocation(result)
    showSearchPanel.value = false
    saveSearchHistory(result)
  } catch (error) {
    console.error('选择位置失败:', error)
    showToast('选择位置失败，请重试')
  }
}

// 选择附近地点
const selectNearbyPlace = (place) => {
  selectSearchResult({
    title: place.title,
    address: place.address,
    location: place.location
  })
}

// 加载附近地点
const loadNearbyPlaces = async () => {
  if (!currentLocation.value) return
  
  try {
    const data = await getNearbyPlaces(currentLocation.value, 1000)
    if (data && data.results) {
      nearbyPlaces.value = data.results.map(item => {
        return {
          title: item.name,
          address: item.address,
          location: item.location,
          distance: item.distance
        }
      })
    }
  } catch (error) {
    console.error('获取附近地点失败:', error)
  }
}

// 格式化距离
const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}米`
  }
  return `${(meters / 1000).toFixed(1)}公里`
}

// 获取地址名称
const getAddressName = () => {
  if (!currentAddress.value) return ''
  
  // 尝试提取地址中的建筑物或路名
  const parts = currentAddress.value.split(/[,，]/)
  return parts[parts.length - 2] || parts[parts.length - 1] || currentAddress.value
}

// 确认位置
const confirmLocation = () => {
  if (!currentLocation.value || !currentAddress.value) {
    showToast('请先选择一个位置')
    return
  }
  
  emit('select', {
    location: currentLocation.value,
    address: currentAddress.value,
    name: getAddressName()
  })
  
  router.back()
}

// 返回上一页
const goBack = () => {
  emit('cancel')
  router.back()
}

// 初始化
onMounted(async () => {
  try {
    await initMap('map-container')
    
    // 如果提供了初始位置，则显示它
    if (props.initialLocation) {
      selectLocation({
        location: props.initialLocation.location,
        address: props.initialLocation.address
      })
    }
    
    // 加载搜索历史
    loadSearchHistory()
    
    // 加载附近地点
    loadNearbyPlaces()
  } catch (error) {
    console.error('初始化地图失败:', error)
    showToast('地图初始化失败，请刷新页面重试')
  }
})

// 监听当前位置变化，更新附近地点
watch(currentLocation, () => {
  loadNearbyPlaces()
})

// 组件销毁前清理
onBeforeUnmount(() => {
  if (window.searchTimeout) {
    clearTimeout(window.searchTimeout)
  }
})
</script>

<style scoped>
.location-picker {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
  position: relative;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  height: 50px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.action-bar .left, .action-bar .right {
  display: flex;
  align-items: center;
  color: #007aff;
  cursor: pointer;
}

.action-bar .left {
  font-weight: normal;
}

.action-bar .right {
  font-weight: 500;
}

.action-bar .right.disabled {
  color: #ccc;
  cursor: not-allowed;
}

.action-bar .title {
  font-size: 17px;
  font-weight: 500;
}

.search-bar {
  padding: 10px 15px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 0 10px;
  height: 36px;
}

.search-input input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 10px;
  font-size: 15px;
  outline: none;
}

.search-input i {
  color: #666;
  font-size: 20px;
}

.search-input i.clear {
  cursor: pointer;
}

.map-container {
  flex: 1;
  width: 100%;
  min-height: 300px;
  position: relative;
  z-index: 0;
}

.location-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 16px 16px 0 0;
  z-index: 1;
}

.info-content {
  display: flex;
  align-items: flex-start;
}

.location-icon {
  color: #007aff;
  margin-right: 10px;
  margin-top: 2px;
  font-size: 20px;
}

.address-detail {
  flex: 1;
}

.address-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.address-full {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.search-panel {
  position: absolute;
  top: 96px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 3;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-results, .search-history, .nearby-places {
  padding: 10px 0;
}

.history-header, .nearby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.history-header .title, .nearby-header .title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.history-header .clear {
  color: #007aff;
  font-size: 14px;
  cursor: pointer;
}

.result-item, .history-item, .nearby-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.result-item:active, .history-item:active, .nearby-item:active {
  background-color: #f9f9f9;
}

.result-item i, .history-item i, .nearby-item i {
  color: #666;
  margin-right: 12px;
  font-size: 20px;
}

.result-content, .place-content {
  flex: 1;
}

.result-title, .place-title {
  font-size: 15px;
  margin-bottom: 4px;
  color: #333;
}

.result-address, .place-address {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.place-distance {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.history-item {
  padding: 10px 15px;
}

.history-item span {
  color: #333;
}

.no-results, .loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  color: #999;
}

.no-results i, .loading i {
  font-size: 40px;
  margin-bottom: 10px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 适配iOS风格 */
.material-icons {
  font-family: 'Material Icons';
  font-size: 24px;
}
</style> 