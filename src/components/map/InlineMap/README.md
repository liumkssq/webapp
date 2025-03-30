# 内联地图组件 (InlineMap)

这是一个可在任何组件内部使用的地图组件，基于百度地图API实现。

## 特性

- 轻量级内联地图组件
- 支持定位、地址解析
- 支持位置选择和确认
- 兼容移动设备，适配iOS界面风格
- 可自定义高度、控制按钮和交互方式

## 使用方法

```vue
<template>
  <div class="container">
    <h2>位置信息</h2>
    
    <!-- 基本用法 -->
    <InlineMap 
      height="250px"
      :auto-locate="true"
      @locate-success="handleLocateSuccess"
    />
    
    <!-- 位置选择 -->
    <InlineMap 
      height="300px"
      :selectable="true"
      :initial-location="initialLocation"
      @confirm-location="handleConfirmLocation"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InlineMap from '@/components/map/InlineMap/index.vue'

// 保存当前位置
const currentLocation = ref(null)

// 初始位置
const initialLocation = ref({
  lng: 116.404,
  lat: 39.915,
  address: '北京市'
})

// 处理定位成功
const handleLocateSuccess = (location) => {
  console.log('定位成功', location)
  currentLocation.value = location
}

// 处理确认位置
const handleConfirmLocation = (location) => {
  console.log('确认位置', location)
  currentLocation.value = location
}
</script>
```

## Props

| 属性名 | 类型 | 默认值 | 说明 |
|------|------|-------|-----|
| height | String | '200px' | 地图高度 |
| initialLocation | Object | null | 初始位置，包含 lng, lat, address 属性 |
| selectable | Boolean | false | 是否可以选择位置 |
| showControls | Boolean | true | 是否显示控制按钮 |
| showLocateButton | Boolean | true | 是否显示定位按钮 |
| showLocationInfo | Boolean | true | 是否显示位置信息 |
| autoLocate | Boolean | false | 是否自动定位 |
| zoom | Number | 15 | 初始化缩放级别 |

## 事件

| 事件名 | 参数 | 说明 |
|-------|-----|-----|
| select-location | location | 选择位置时触发 |
| confirm-location | location | 确认位置时触发 |
| map-ready | map | 地图初始化完成时触发 |
| locate-success | location | 定位成功时触发 |
| locate-error | error | 定位失败时触发 |

## 暴露的方法

- `setCenter(point)`: 设置地图中心点
- `getCurrentLocation()`: 获取当前位置
- `getLocation()`: 获取当前位置信息