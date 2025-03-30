<template>
  <div class="map-example-container">
    <van-nav-bar
      title="地图组件示例"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="content-wrapper">
      <h3 class="section-title">基础地图展示</h3>
      <p class="section-desc">显示特定位置的地图，不可交互</p>
      <div class="map-container">
        <inline-map 
          height="200px" 
          :initial-location="staticLocation"
          :show-controls="false"
        />
      </div>
      
      <h3 class="section-title">自动定位地图</h3>
      <p class="section-desc">自动获取当前位置并展示</p>
      <div class="map-container">
        <inline-map 
          height="250px" 
          :auto-locate="true"
          @locate-success="handleLocateSuccess"
        />
      </div>
      
      <div v-if="currentLocation">
        <div class="location-info">
          <p><strong>当前位置:</strong> {{ currentLocation.address }}</p>
          <p><strong>坐标:</strong> {{ currentLocation.point.lng }}, {{ currentLocation.point.lat }}</p>
        </div>
      </div>
      
      <h3 class="section-title">位置选择地图</h3>
      <p class="section-desc">点击地图选择位置，点击"确认位置"按钮提交</p>
      <div class="map-container">
        <inline-map 
          ref="selectMapRef"
          height="300px" 
          :selectable="true"
          @select-location="handleSelectLocation"
          @confirm-location="handleConfirmLocation"
        />
      </div>
      
      <div v-if="selectedLocation" class="selected-info">
        <h4>已选位置:</h4>
        <p>{{ selectedLocation.address }}</p>
        <div class="buttons">
          <van-button type="primary" @click="useSelectedLocation">使用此位置</van-button>
        </div>
      </div>
      
      <h3 class="section-title">商品位置展示</h3>
      <p class="section-desc">展示商品所在的位置信息</p>
      <div class="product-card">
        <div class="product-info">
          <div class="product-title">iPhone 14 Pro Max 256G 深空黑</div>
          <div class="product-price">¥ 6999.00</div>
          <div class="product-location" @click="showFullMap = true">
            <van-icon name="location-o" />
            <span>{{ staticLocation.address }}</span>
            <van-icon name="arrow" />
          </div>
        </div>
        <div class="product-map">
          <inline-map 
            height="100px" 
            :initial-location="staticLocation"
            :show-controls="false"
            :show-location-info="false"
          />
        </div>
      </div>
    </div>
    
    <!-- 全屏地图弹窗 -->
    <van-popup
      v-model:show="showFullMap"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <div class="fullscreen-map-container">
        <van-nav-bar
          title="位置详情"
          left-arrow
          @click-left="showFullMap = false"
        />
        <div class="fullscreen-map">
          <inline-map 
            height="calc(100% - 46px)" 
            :initial-location="staticLocation"
          />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InlineMap from '@/components/map/InlineMap/index.vue'
import { showToast } from 'vant'

// 静态位置信息
const staticLocation = {
  lng: 116.404,
  lat: 39.915,
  address: '北京市东城区王府井大街1号'
}

// 地图实例引用
const selectMapRef = ref(null)

// 状态变量
const currentLocation = ref(null)
const selectedLocation = ref(null)
const showFullMap = ref(false)

// 处理定位成功
const handleLocateSuccess = (location) => {
  currentLocation.value = location
  showToast('定位成功')
}

// 处理选择位置
const handleSelectLocation = (location) => {
  // 用户在地图上选择了一个位置，但还没有确认
  console.log('选择位置', location)
}

// 处理确认位置
const handleConfirmLocation = (location) => {
  selectedLocation.value = location
  showToast('已确认位置')
}

// 使用选中的位置
const useSelectedLocation = () => {
  if (!selectedLocation.value) {
    showToast('请先选择位置')
    return
  }
  
  showToast(`已选择位置: ${selectedLocation.value.address}`)
  // 实际项目中，这里可能需要保存位置信息到表单或发送到服务器
}
</script>

<style scoped>
.map-example-container {
  height: 100vh;
  overflow-y: auto;
  background-color: #f7f8fa;
}

.content-wrapper {
  padding: 16px;
  padding-bottom: 60px;
}

.section-title {
  margin: 16px 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.section-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: #969799;
}

.map-container {
  margin-bottom: 24px;
}

.location-info, .selected-info {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.location-info p, .selected-info p {
  margin: 4px 0;
}

.selected-info h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #323233;
}

.buttons {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.product-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 24px;
}

.product-info {
  padding: 16px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  color: #f44336;
  font-weight: 600;
  margin-bottom: 12px;
}

.product-location {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #323233;
  cursor: pointer;
  padding-top: 8px;
  border-top: 1px solid #f7f8fa;
}

.product-location .van-icon {
  margin-right: 4px;
}

.product-location .van-icon:last-child {
  margin-left: auto;
  margin-right: 0;
  color: #c8c9cc;
}

.fullscreen-map-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fullscreen-map {
  flex: 1;
}
</style>