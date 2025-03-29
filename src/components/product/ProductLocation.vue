<template>
  <div class="product-location">
    <div class="section-title">
      <span>位置信息</span>
      <span v-if="editable && showViewOnMap && location" class="view-link" @click="viewOnMap">
        在地图上查看
        <i class="material-icons">map</i>
      </span>
    </div>
    
    <LocationDisplay
      :location="location"
      :address="address"
      :location-name="locationName"
      :show-full-address="true"
      :show-map="showMap"
      :show-arrow="editable"
      :selectable="editable"
      :placeholder="placeholder"
      :map-height="mapHeight"
      @select="onSelectLocation"
    />
    
    <div v-if="distance && !editable" class="distance-info">
      <i class="material-icons">directions</i>
      <span>距离您约 {{ formatDistance(distance) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import LocationDisplay from '@/components/common/LocationDisplay.vue'
import useMap from '@/composables/useMap'

const props = defineProps({
  location: {
    type: Object,
    default: null // { lng, lat }
  },
  address: {
    type: String,
    default: ''
  },
  locationName: {
    type: String,
    default: ''
  },
  showMap: {
    type: Boolean,
    default: true
  },
  showViewOnMap: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '添加位置信息'
  },
  mapHeight: {
    type: String,
    default: '150px'
  }
})

const emit = defineEmits(['update:location', 'update:address', 'update:locationName'])
const route = useRoute()
const distance = ref(null)

// 使用地图组合式函数
const { getCurrentLocation, calculateDistance } = useMap({
  autoLocate: true
})

// 格式化距离
const formatDistance = (meters) => {
  if (!meters) return '未知距离'
  
  if (meters < 1000) {
    return `${Math.round(meters)}米`
  }
  return `${(meters / 1000).toFixed(1)}公里`
}

// 查看地图
const viewOnMap = () => {
  if (props.location) {
    const mapUrl = `https://api.map.baidu.com/marker?location=${props.location.lat},${props.location.lng}&title=${props.locationName || '位置'}&content=${props.address}&output=html`
    window.open(mapUrl, '_blank')
  }
}

// 选择位置
const onSelectLocation = () => {
  // 此函数不需要做任何事情，因为LocationDisplay组件会处理导航
  // 但我们需要定义它以便触发select事件
}

// 监听路由变化，处理位置选择回调
watch(
  () => route.query,
  (query) => {
    if (query.selected_location === 'true' && query.selected_lng && query.selected_lat) {
      const newLocation = {
        lng: Number(query.selected_lng),
        lat: Number(query.selected_lat)
      }
      
      const newAddress = query.selected_address || ''
      const newName = query.selected_name || ''
      
      emit('update:location', newLocation)
      emit('update:address', newAddress)
      emit('update:locationName', newName)
      
      // 清除URL参数
      const { selected_location, selected_lng, selected_lat, selected_address, selected_name, ...restQuery } = query
    }
  },
  { immediate: true }
)

// 计算距离
const calculateProductDistance = async () => {
  if (props.location) {
    try {
      const userLocation = await getCurrentLocation()
      
      if (userLocation) {
        const distanceValue = await calculateDistance(
          userLocation,
          props.location
        )
        
        distance.value = distanceValue
      }
    } catch (error) {
      console.error('计算距离失败:', error)
    }
  }
}

// 组件挂载后计算距离
onMounted(() => {
  if (!props.editable && props.location) {
    calculateProductDistance()
  }
})

// 监听位置变化
watch(
  () => props.location,
  (newLocation) => {
    if (newLocation && !props.editable) {
      calculateProductDistance()
    }
  }
)
</script>

<style scoped>
.product-location {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.view-link {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #007aff;
  cursor: pointer;
}

.view-link i {
  font-size: 16px;
  margin-left: 2px;
}

.distance-info {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.distance-info i {
  font-size: 16px;
  margin-right: 4px;
  color: #007aff;
}

.material-icons {
  font-family: 'Material Icons';
}
</style> 