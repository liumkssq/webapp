<template>
  <div class="location-field">
    <div v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </div>
    
    <div 
      class="location-selector" 
      :class="{ 'is-selected': location, 'is-disabled': disabled }"
      @click="openMapSelector"
    >
      <div v-if="location" class="selected-location">
        <van-icon name="location-o" />
        <div class="location-info">
          <div class="location-name">{{ location.address }}</div>
        </div>
      </div>
      <div v-else class="placeholder">
        <van-icon name="location-o" />
        <span>{{ placeholder || '点击选择位置' }}</span>
      </div>
      <van-icon name="arrow" />
    </div>
    
    <div v-if="error" class="field-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  label: {
    type: String,
    default: '位置'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  callbackPath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'click'])

const router = useRouter()
const route = useRoute()

// 内部状态
const location = ref(props.modelValue)

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  location.value = newValue
})

// 组件挂载时检查是否有回调数据
onMounted(() => {
  // 检查URL中是否有位置参数（从地图选择页面返回）
  const locationData = route.query.location
  if (locationData) {
    try {
      const parsedLocation = JSON.parse(locationData)
      
      // 更新位置信息
      location.value = {
        point: {
          lng: parsedLocation.lng,
          lat: parsedLocation.lat
        },
        address: parsedLocation.address
      }
      
      // 更新modelValue
      emit('update:modelValue', location.value)
      
      // 清除URL参数
      router.replace({
        path: route.path,
        query: { ...route.query, location: undefined }
      })
    } catch (e) {
      console.error('解析位置数据失败', e)
    }
  }
})

// 计算当前路径
const currentPath = computed(() => {
  return props.callbackPath || router.currentRoute.value.path
})

// 打开地图选择器
const openMapSelector = () => {
  if (props.disabled) {
    return
  }
  
  emit('click')
  
  // 构建查询参数
  const query = {
    callback: currentPath.value
  }
  
  // 如果已有位置数据，添加到查询参数
  if (location.value) {
    query.location = JSON.stringify({
      lng: location.value.point.lng,
      lat: location.value.point.lat,
      address: location.value.address
    })
  }
  
  // 跳转到地图选择页面
  router.push({
    path: '/map-picker',
    query
  })
}

// 清除选择
const clearLocation = () => {
  location.value = null
}

// 暴露方法
defineExpose({
  open: openMapSelector,
  clear: clearLocation
})
</script>

<style scoped>
.location-field {
  margin-bottom: 16px;
}

.field-label {
  font-size: 14px;
  color: #323233;
  margin-bottom: 8px;
}

.required-mark {
  color: #ee0a24;
}

.location-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ebedf0;
  cursor: pointer;
}

.location-selector.is-selected {
  border-color: #dcdee0;
}

.location-selector.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-location {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.location-name {
  font-size: 14px;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c8c9cc;
  font-size: 14px;
}

.field-error {
  font-size: 12px;
  color: #ee0a24;
  margin-top: 4px;
}
</style>