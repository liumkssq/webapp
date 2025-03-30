<template>
  <div class="map-demo-page">
    <!-- iOS风格顶部导航 -->
    <div class="ios-nav-bar">
      <div class="left-button" @click="router.back()">
        <van-icon name="arrow-left" size="18" />
      </div>
      <div class="page-title">地图组件演示</div>
      <div class="right-button"></div>
    </div>
    
    <div class="demo-content">
      <div class="demo-section">
        <div class="section-title">1. 位置选择字段</div>
        <div class="section-desc">表单中使用的位置选择字段，点击跳转到地图选择页</div>
        <div class="component-demo">
          <location-field v-model="selectedLocation" />
        </div>
        <div class="demo-result" v-if="selectedLocation">
          <div class="result-title">选择结果：</div>
          <div class="result-content">
            <div>地址：{{ selectedLocation.address }}</div>
            <div>坐标：{{ selectedLocation.point?.lng }}, {{ selectedLocation.point?.lat }}</div>
          </div>
          <van-button size="small" @click="clearLocation">清除位置</van-button>
        </div>
      </div>
      
      <div class="demo-section">
        <div class="section-title">2. 模拟发布页面</div>
        <div class="section-desc">展示如何在表单中集成位置选择</div>
        <div class="form-demo">
          <div class="form-item">
            <div class="item-label">标题</div>
            <input type="text" placeholder="请输入标题" class="item-input" v-model="formData.title">
          </div>
          
          <div class="form-item">
            <div class="item-label">位置 <span class="required">*</span></div>
            <location-field v-model="formData.location" required />
          </div>
          
          <div class="form-item">
            <div class="item-label">描述</div>
            <textarea placeholder="请输入描述" class="item-textarea" v-model="formData.description"></textarea>
          </div>
          
          <van-button type="primary" block @click="handleSubmit" :disabled="!formData.location">
            提交表单
          </van-button>
        </div>
      </div>
      
      <div class="usage-guide">
        <div class="section-title">使用指南</div>
        <div class="guide-content">
          <pre>
&lt;script&gt;
import LocationField from '@/components/form/LocationField.vue'

// 在组件中使用
const location = ref(null)

// 使用v-model绑定
&lt;location-field v-model="location" /&gt;
&lt;/script&gt;
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import LocationField from '@/components/form/LocationField.vue'

const router = useRouter()

// 单独的位置选择示例
const selectedLocation = ref(null)

// 表单数据示例
const formData = reactive({
  title: '',
  description: '',
  location: null
})

// 清除位置
const clearLocation = () => {
  selectedLocation.value = null
}

// 提交表单
const handleSubmit = () => {
  if (!formData.location) {
    showToast('请选择位置')
    return
  }
  
  showToast('表单提交成功！')
  console.log('表单数据：', formData)
}
</script>

<style scoped>
.map-demo-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.ios-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 44px;
  box-sizing: content-box;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.left-button, .right-button {
  font-size: 16px;
  min-width: 60px;
}

.left-button {
  display: flex;
  align-items: center;
}

.demo-content {
  padding: 16px;
}

.demo-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.component-demo {
  margin-bottom: 16px;
}

.demo-result {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
}

.result-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.result-content {
  font-size: 14px;
  margin-bottom: 12px;
}

.form-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.item-label {
  font-size: 14px;
  margin-bottom: 8px;
}

.required {
  color: #ee0a24;
}

.item-input, .item-textarea {
  padding: 10px 12px;
  border: 1px solid #ebedf0;
  border-radius: 6px;
  font-size: 14px;
}

.item-textarea {
  height: 80px;
  resize: none;
}

.usage-guide {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.guide-content {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

pre {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
}
</style>