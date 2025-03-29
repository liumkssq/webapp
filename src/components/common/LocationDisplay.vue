<template>
  <div class="location-display">
    <div v-if="!location && !address" class="empty-location" @click="onSelect">
      <i class="material-icons">location_on</i>
      <span>{{ placeholder }}</span>
      <i v-if="showArrow" class="material-icons arrow">chevron_right</i>
    </div>
    
    <div v-else class="location-info" @click="onSelect">
      <div class="location-content">
        <i class="material-icons location-icon">location_on</i>
        <div class="address-detail">
          <div class="address-name">{{ locationName || formatAddress(address) }}</div>
          <div v-if="showFullAddress && address" class="address-full">{{ address }}</div>
        </div>
      </div>
      <i v-if="showArrow" class="material-icons arrow">chevron_right</i>
    </div>
    
    <div v-if="showMap && location" class="map-preview" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
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
  showFullAddress: {
    type: Boolean,
    default: true
  },
  showMap: {
    type: Boolean,
    default: false
  },
  showArrow: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '选择位置'
  },
  selectable: {
    type: Boolean,
    default: true
  },
  mapHeight: {
    type: String,
    default: '150px'
  }
})

const emit = defineEmits(['select'])
const router = useRouter()
const mapContainer = ref(null)

// 使用地图组合式函数
const { mapInstance, initMap, setMapCenter, updateMarker } = useMap({
  autoLocate: false,
  defaultCenter: props.location || { lng: 116.404, lat: 39.915 }
})

// 格式化地址
const formatAddress = (address) => {
  if (!address) return props.placeholder
  
  // 尝试从地址中提取最有意义的部分
  const parts = address.split(/[,，]/)
  if (parts.length > 2) {
    return parts[parts.length - 2] || parts[parts.length - 1]
  }
  return address
}

// 初始化地图
const initMapPreview = async () => {
  if (props.showMap && props.location && mapContainer.value) {
    try {
      await initMap(mapContainer.value)
      setMapCenter(props.location)
      updateMarker(props.location)
      
      // 设置地图高度
      if (mapContainer.value) {
        mapContainer.value.style.height = props.mapHeight
      }
    } catch (error) {
      console.error('初始化地图预览失败:', error)
    }
  }
}

// 点击选择位置
const onSelect = () => {
  if (!props.selectable) return
  
  emit('select')
  
  if (props.selectable) {
    router.push({
      name: 'LocationPicker',
      params: {
        from: router.currentRoute.value.name
      },
      query: props.location ? {
        lng: props.location.lng,
        lat: props.location.lat,
        address: props.address
      } : {}
    })
  }
}

// 监听位置变化
watch(
  () => props.location,
  (newLocation) => {
    if (newLocation && mapInstance.value && props.showMap) {
      setMapCenter(newLocation)
      updateMarker(newLocation)
    }
  }
)

// 组件挂载后初始化地图
onMounted(() => {
  if (props.showMap && props.location) {
    initMapPreview()
  }
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 如果需要，这里可以添加地图清理代码
})
</script>

<style scoped>
.location-display {
  width: 100%;
}

.empty-location {
  display: flex;
  align-items: center;
  padding: 14px 0;
  color: #999;
  cursor: pointer;
}

.location-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  cursor: pointer;
}

.location-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.location-icon {
  color: #007aff;
  margin-right: 10px;
  font-size: 20px;
  margin-top: 2px;
}

.address-detail {
  flex: 1;
}

.address-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 2px;
  color: #333;
}

.address-full {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.arrow {
  color: #ccc;
  font-size: 20px;
}

.map-preview {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 10px;
  border: 1px solid #e0e0e0;
}

.material-icons {
  font-family: 'Material Icons';
  font-size: 24px;
}
</style> 