<template>
  <div class="map-selector">
    <slot name="header"></slot>
    
    <div class="map-content">
      <slot name="content">
        <!-- 默认内容区域 -->
        <div class="map-placeholder" @click="openSelector">
          <template v-if="modelValue">
            <div class="selected-location">
              <van-icon name="location-o" color="#1989fa" />
              <span>{{ modelValue.address }}</span>
            </div>
          </template>
          <template v-else>
            <div class="placeholder-text">
              <van-icon name="location-o" color="#999" />
              <span>{{ placeholder }}</span>
            </div>
          </template>
          <van-icon name="arrow" />
        </div>
      </slot>
    </div>
    
    <!-- 地图选择弹出层 -->
    <van-popup
      v-model:show="showSelector"
      position="bottom"
      round
      :style="{ height: '90%' }"
    >
      <div class="popup-header">
        <div class="popup-title">选择位置</div>
        <van-icon name="cross" @click="showSelector = false" />
      </div>
      
      <div class="popup-content">
        <location-selector 
          ref="locationSelectorRef"
          :initial-location="modelValue"
          @confirm="handleConfirm"
        />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVModel } from '@vueuse/core'
import LocationSelector from './LocationSelector/index.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => null
  },
  placeholder: {
    type: String,
    default: '点击选择位置'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const locationValue = useVModel(props, 'modelValue', emit)
const showSelector = ref(false)
const locationSelectorRef = ref(null)

// 打开地图选择器
const openSelector = () => {
  if (props.disabled) return
  showSelector.value = true
}

// 处理位置确认
const handleConfirm = (location) => {
  locationValue.value = location
  showSelector.value = false
  emit('select', location)
}

// 暴露方法
defineExpose({
  open: openSelector,
  clear: () => {
    locationValue.value = null
  }
})
</script>

<style scoped>
.map-selector {
  width: 100%;
}

.map-content {
  width: 100%;
}

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;
}

.selected-location,
.placeholder-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placeholder-text {
  color: #999;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
}

.popup-content {
  height: calc(100% - 53px);
}
</style>