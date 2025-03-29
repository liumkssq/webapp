import { ref, computed, onMounted } from 'vue'
import * as mapApi from '@/api/map'

/**
 * 提供地图相关功能的可复用逻辑
 * @param {Object} options - 选项对象
 * @param {boolean} options.autoLocate - 是否自动定位
 * @param {Object} options.defaultCenter - 默认中心点 { lng, lat }
 * @param {number} options.defaultZoom - 默认缩放级别
 * @returns {Object} 地图状态和方法
 */
export default function useMap(options = {}) {
  const {
    autoLocate = false,
    defaultCenter = { lng: 116.404, lat: 39.915 }, // 默认北京
    defaultZoom = 15
  } = options

  // 地图状态
  const mapInstance = ref(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const currentLocation = ref(null)
  const currentAddress = ref('')
  const searchResults = ref([])
  const searchKeyword = ref('')
  
  // 当前标记
  const currentMarker = ref(null)
  
  /**
   * 判断百度地图API是否已加载完成
   */
  const isBMapReady = computed(() => {
    return typeof BMap !== 'undefined'
  })
  
  /**
   * 初始化地图
   * @param {string} containerId - 地图容器ID
   * @returns {Promise} 初始化完成的Promise
   */
  const initMap = async (containerId) => {
    if (!containerId) {
      throw new Error('必须提供地图容器ID')
    }
    
    if (!isBMapReady.value) {
      console.warn('百度地图API尚未加载完成，请确保在HTML中引入了百度地图API')
      return null
    }
    
    isLoading.value = true
    
    try {
      // 创建地图实例
      mapInstance.value = new BMap.Map(containerId)
      
      // 设置中心点和缩放级别
      const point = new BMap.Point(defaultCenter.lng, defaultCenter.lat)
      mapInstance.value.centerAndZoom(point, defaultZoom)
      
      // 启用滚轮缩放和拖拽
      mapInstance.value.enableScrollWheelZoom(true)
      mapInstance.value.enableDragging()
      
      // 添加控件
      addMapControls()
      
      // 自动定位
      if (autoLocate) {
        await getCurrentLocation()
      }
      
      isLoaded.value = true
      return mapInstance.value
    } catch (error) {
      console.error('初始化地图失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 添加地图控件
   */
  const addMapControls = () => {
    if (!mapInstance.value) return
    
    // 添加缩放控件
    const navigationControl = new BMap.NavigationControl({
      anchor: BMAP_ANCHOR_TOP_RIGHT,
      type: BMAP_NAVIGATION_CONTROL_SMALL
    })
    mapInstance.value.addControl(navigationControl)
    
    // 添加比例尺控件
    const scaleControl = new BMap.ScaleControl({
      anchor: BMAP_ANCHOR_BOTTOM_LEFT
    })
    mapInstance.value.addControl(scaleControl)
  }
  
  /**
   * 获取当前位置
   * @returns {Promise} 位置信息的Promise
   */
  const getCurrentLocation = () => {
    if (!mapInstance.value) {
      console.warn('地图尚未初始化')
      return Promise.reject(new Error('地图尚未初始化'))
    }
    
    isLoading.value = true
    
    return new Promise((resolve, reject) => {
      // 创建定位控件
      const geolocation = new BMap.Geolocation()
      
      // 开始定位
      geolocation.getCurrentPosition(
        result => {
          isLoading.value = false
          
          if (geolocation.getStatus() === BMAP_STATUS_SUCCESS) {
            // 定位成功
            const point = result.point
            currentLocation.value = { lng: point.lng, lat: point.lat }
            
            // 设置中心点并添加标记
            mapInstance.value.centerAndZoom(point, defaultZoom)
            updateMarker(point)
            
            // 获取地址
            getAddressByPoint(point)
            
            resolve({ 
              point: currentLocation.value,
              address: currentAddress.value
            })
          } else {
            // 定位失败
            reject(new Error(`定位失败: ${geolocation.getStatus()}`))
          }
        },
        { enableHighAccuracy: true }
      )
    })
  }
  
  /**
   * 搜索位置
   * @param {string} keyword - 搜索关键词
   * @param {string} region - 区域
   * @returns {Promise} 搜索结果的Promise
   */
  const searchLocation = async (keyword, region = '') => {
    if (!keyword) return
    
    isLoading.value = true
    searchKeyword.value = keyword
    
    try {
      // 调用API进行搜索
      const res = await mapApi.searchPlaces(keyword, region)
      searchResults.value = res.data.results || []
      return searchResults.value
    } catch (error) {
      console.error('搜索位置失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 根据位置ID搜索位置详情
   * @param {Object} location - 位置信息
   * @returns {Promise} 位置详情的Promise
   */
  const selectLocation = async (location) => {
    if (!mapInstance.value) return
    
    const { lng, lat } = location.location
    const point = new BMap.Point(lng, lat)
    
    // 更新地图位置
    mapInstance.value.centerAndZoom(point, defaultZoom)
    
    // 更新标记
    updateMarker(point)
    
    // 更新当前位置和地址
    currentLocation.value = { lng, lat }
    currentAddress.value = location.address || ''
    
    return {
      point: currentLocation.value,
      address: currentAddress.value
    }
  }
  
  /**
   * 设置地图中心点
   * @param {Object} point - 坐标点 { lng, lat }
   * @param {number} zoom - 缩放级别
   */
  const setMapCenter = (point, zoom = defaultZoom) => {
    if (!mapInstance.value) return
    
    const bPoint = new BMap.Point(point.lng, point.lat)
    mapInstance.value.centerAndZoom(bPoint, zoom)
  }
  
  /**
   * 更新地图上的标记
   * @param {Object} point - BMap.Point对象
   */
  const updateMarker = (point) => {
    if (!mapInstance.value) return
    
    // 清除之前的标记
    if (currentMarker.value) {
      mapInstance.value.removeOverlay(currentMarker.value)
    }
    
    // 创建新标记
    currentMarker.value = new BMap.Marker(point)
    mapInstance.value.addOverlay(currentMarker.value)
    
    // 添加动画效果
    currentMarker.value.setAnimation(BMAP_ANIMATION_DROP)
  }
  
  /**
   * 根据坐标点获取地址信息
   * @param {Object} point - BMap.Point对象
   * @returns {Promise} 地址信息的Promise
   */
  const getAddressByPoint = (point) => {
    if (!mapInstance.value) return Promise.reject(new Error('地图尚未初始化'))
    
    isLoading.value = true
    
    return new Promise((resolve, reject) => {
      // 创建地址解析器实例
      const geoCoder = new BMap.Geocoder()
      
      // 将坐标转换为地址
      geoCoder.getLocation(point, (result) => {
        isLoading.value = false
        
        if (result) {
          currentAddress.value = result.address
          resolve(result)
        } else {
          currentAddress.value = '未知地址'
          reject(new Error('获取地址失败'))
        }
      })
    })
  }
  
  /**
   * 根据地址获取坐标点
   * @param {string} address - 地址
   * @param {string} city - 城市
   * @returns {Promise} 坐标信息的Promise
   */
  const getPointByAddress = async (address, city = '') => {
    isLoading.value = true
    
    try {
      const res = await mapApi.geocode(address, city)
      return res.data
    } catch (error) {
      console.error('地址解析失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 获取周边兴趣点
   * @param {Object} point - 坐标点 { lng, lat }
   * @param {number} radius - 半径
   * @param {string} keyword - 关键词
   * @returns {Promise} 周边兴趣点的Promise
   */
  const getNearbyPlaces = async (point, radius = 1000, keyword = '') => {
    isLoading.value = true
    
    try {
      const res = await mapApi.searchNearby(point.lng, point.lat, keyword, radius)
      return res.data
    } catch (error) {
      console.error('获取周边兴趣点失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 计算两点之间的距离
   * @param {Object} pointA - 起点 { lng, lat }
   * @param {Object} pointB - 终点 { lng, lat }
   * @returns {number} 距离(米)
   */
  const calculateDistance = (pointA, pointB) => {
    if (!isBMapReady.value) return 0
    
    const pointA_bmap = new BMap.Point(pointA.lng, pointA.lat)
    const pointB_bmap = new BMap.Point(pointB.lng, pointB.lat)
    
    return mapInstance.value.getDistance(pointA_bmap, pointB_bmap)
  }
  
  /**
   * 销毁地图，释放资源
   */
  const destroyMap = () => {
    if (mapInstance.value) {
      // 清除所有覆盖物
      mapInstance.value.clearOverlays()
      
      // 释放其他资源
      // ...
      
      // 重置状态
      mapInstance.value = null
      isLoaded.value = false
      currentLocation.value = null
      currentAddress.value = ''
      currentMarker.value = null
    }
  }
  
  onMounted(() => {
    // 可以在这里检查百度地图API是否已加载
    if (typeof BMap === 'undefined') {
      console.warn('百度地图API尚未加载，地图功能可能无法正常使用')
    }
  })
  
  return {
    // 状态
    mapInstance,
    isLoaded,
    isLoading,
    isBMapReady,
    currentLocation,
    currentAddress,
    searchResults,
    searchKeyword,
    
    // 方法
    initMap,
    getCurrentLocation,
    searchLocation,
    selectLocation,
    setMapCenter,
    updateMarker,
    getAddressByPoint,
    getPointByAddress,
    getNearbyPlaces,
    calculateDistance,
    destroyMap
  }
} 