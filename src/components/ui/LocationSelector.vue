<template>
  <div class="location-selector">
    <!-- 位置选择按钮 -->
    <div class="location-field" @click="showLocationPicker = true">
      <div class="field-label">
        <van-icon name="location-o" class="field-icon" />
        <span>位置信息</span>
        <span v-if="required" class="required">*</span>
      </div>
      
      <div class="field-content">
        <span v-if="modelValue && modelValue.address" class="selected-location">
          {{ modelValue.address }}
        </span>
        <span v-else class="placeholder">点击选择位置</span>
        <van-icon name="arrow" class="right-icon" />
      </div>
    </div>
    
    <!-- 位置选择弹窗 -->
    <van-popup
      v-model:show="showLocationPicker"
      position="bottom"
      round
      :style="{ height: popupHeight }"
    >
      <div class="location-picker-container">
        <van-nav-bar
          title="选择位置"
          left-arrow
          @click-left="showLocationPicker = false"
          :right-text="modelValue && modelValue.address ? '确定' : ''"
          @click-right="confirmLocation"
        />
        
        <div class="map-container">
          <inline-map
            ref="mapRef"
            height="calc(100% - 46px)"
            :auto-locate="!modelValue"
            :initial-location="modelValue"
            :selectable="true"
            @select-location="handleSelectLocation"
            @confirm-location="handleConfirmLocation"
            @locate-success="handleLocateSuccess"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { showToast } from 'vant'
import InlineMap from '@/components/map/InlineMap/index.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  popupHeight: {
    type: String,
    default: '80%'
  }
})

const emit = defineEmits(['update:modelValue'])

// 状态变量
const showLocationPicker = ref(false)
const selectedLocation = ref(null)
const mapRef = ref(null)

// 处理位置选择
const handleSelectLocation = (location) => {
  selectedLocation.value = location
}

// 处理确认位置
const handleConfirmLocation = (location) => {
  selectedLocation.value = location
  updateModelValue(location)
  showLocationPicker.value = false
  showToast('位置已选择')
}

// 处理定位成功
const handleLocateSuccess = (location) => {
  if (!props.modelValue) {
    selectedLocation.value = location
  }
}

// 确认选择的位置
const confirmLocation = () => {
  if (selectedLocation.value || props.modelValue) {
    updateModelValue(selectedLocation.value || props.modelValue)
    showLocationPicker.value = false
  } else {
    showToast('请先选择位置')
  }
}

// 更新v-model值
const updateModelValue = (location) => {
  if (!location) return
  
  emit('update:modelValue', {
    lng: location.point.lng,
    lat: location.point.lat,
    address: location.address
  })
}
</script>

<style scoped>
.location-selector {
  width: 100%;
}

.location-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
}

.field-label {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #323233;
}

.field-icon {
  margin-right: 6px;
  color: #1989fa;
}

.required {
  color: #ee0a24;
  margin-left: 4px;
}

.field-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
  color: #323233;
  margin-left: 12px;
}

.selected-location {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder {
  color: #c8c9cc;
}

.right-icon {
  margin-left: 4px;
  color: #c8c9cc;
}

.location-picker-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.map-container {
  flex: 1;
}
</style>