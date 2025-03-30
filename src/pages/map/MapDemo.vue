<template>
  <div class="map-demo-page">
    <!-- iOS风格导航栏 -->
    <van-nav-bar
      title="地图功能演示"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="page-content">
      <van-cell-group inset title="基础地图组件">
        <van-cell title="地图选择器组件" is-link @click="showMapSelector = true" />
        <van-cell title="地图选择页面" is-link @click="navigateToMapPicker" />
        <van-cell title="位置字段组件" is-link @click="showLocationField = true" />
      </van-cell-group>
      
      <van-cell-group inset title="地图示例">
        <van-cell title="商品发布地图" is-link to="/publish-product" />
        <van-cell title="失物招领地图" is-link to="/publish-lost-found" />
      </van-cell-group>
      
      <!-- 当前选择的位置信息 -->
      <div v-if="selectedLocation" class="location-card">
        <div class="card-title">已选择位置</div>
        <div class="location-info">
          <div class="address">
            <van-icon name="location-o" color="#1989fa" />
            <span>{{ selectedLocation.address }}</span>
          </div>
          <div class="coordinates">
            经度: {{ selectedLocation.point.lng.toFixed(6) }}<br>
            纬度: {{ selectedLocation.point.lat.toFixed(6) }}
          </div>
        </div>
        <div class="action-buttons">
          <van-button type="danger" size="small" plain @click="clearLocation">清除</van-button>
          <van-button type="primary" size="small" @click="useLocation">使用此位置</van-button>
        </div>
      </div>
    </div>
    
    <!-- 地图选择器弹出层 -->
    <van-popup
      v-model:show="showMapSelector"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="popup-header">
        <div class="popup-title">地图选择器</div>
        <van-icon name="cross" @click="showMapSelector = false" />
      </div>
      
      <div class="popup-content">
        <location-selector
          :initial-location="selectedLocation"
          @confirm="handleLocationConfirm"
        />
      </div>
    </van-popup>
    
    <!-- 位置字段弹出层 -->
    <van-popup
      v-model:show="showLocationField"
      position="bottom"
      round
      closeable
      :style="{ height: '60%' }"
    >
      <div class="popup-header">
        <div class="popup-title">位置字段组件</div>
      </div>
      
      <div class="field-demo-content">
        <location-field
          v-model="selectedLocation"
          label="选择位置"
          placeholder="点击选择位置"
          required
          show-coordinates
          @select="handleLocationSelect"
        />
        
        <div class="field-description">
          <p>位置字段组件是一个表单控件，用于在表单中选择地理位置。点击将跳转至地图选择页面。</p>
          <p>支持的属性:</p>
          <ul>
            <li><code>v-model</code>: 位置对象</li>
            <li><code>label</code>: 字段标签</li>
            <li><code>placeholder</code>: 占位文本</li>
            <li><code>required</code>: 是否必填</li>
            <li><code>disabled</code>: 是否禁用</li>
            <li><code>error</code>: 错误信息</li>
            <li><code>showCoordinates</code>: 是否显示坐标</li>
            <li><code>callbackPath</code>: 回调路径</li>
          </ul>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import LocationSelector from '@/components/map/LocationSelector/index.vue'
import LocationField from '@/components/form/LocationField.vue'

const router = useRouter()
const showMapSelector = ref(false)
const showLocationField = ref(false)
const selectedLocation = ref(null)

// 处理地图选择器确认
const handleLocationConfirm = (location) => {
  selectedLocation.value = location
  showMapSelector.value = false
  showToast('位置已选择')
}

// 处理位置字段选择
const handleLocationSelect = (location) => {
  showToast('位置已更新')
}

// 导航到地图选择页面
const navigateToMapPicker = () => {
  const query = {}
  
  if (selectedLocation.value) {
    query.location = JSON.stringify({
      lng: selectedLocation.value.point.lng,
      lat: selectedLocation.value.point.lat,
      address: selectedLocation.value.address
    })
  }
  
  router.push({
    path: '/map-picker',
    query: {
      ...query,
      callback: '/map/demo'
    }
  })
}

// 清除位置
const clearLocation = () => {
  selectedLocation.value = null
  showToast('位置已清除')
}

// 使用位置
const useLocation = () => {
  if (!selectedLocation.value) {
    showToast('请先选择位置')
    return
  }
  
  showToast('位置已使用')
  // 实际应用中，这里可能需要将位置信息保存到表单或发送到服务器
}
</script>

<style scoped>
.map-demo-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.page-content {
  padding: 16px;
}

.location-card {
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #323233;
}

.location-info {
  margin-bottom: 16px;
}

.address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.coordinates {
  font-size: 14px;
  color: #969799;
  margin-left: 24px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
}

.popup-content {
  height: calc(100% - 53px);
}

.field-demo-content {
  padding: 16px;
}

.field-description {
  margin-top: 24px;
  padding: 16px;
  background-color: #f7f8fa;
  border-radius: 8px;
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
}

.field-description code {
  background-color: #eef0f4;
  padding: 2px 4px;
  border-radius: 2px;
  color: #1989fa;
}

.field-description ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.field-description li {
  margin-bottom: 4px;
}
</style>