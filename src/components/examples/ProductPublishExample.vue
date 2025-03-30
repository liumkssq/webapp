<template>
  <div class="product-publish-example">
    <van-nav-bar
      title="发布商品"
      left-arrow
      @click-left="$router.back()"
      right-text="发布"
      @click-right="handlePublish"
    />
    
    <div class="form-container">
      <!-- 商品标题 -->
      <van-field
        v-model="productForm.title"
        label="商品标题"
        placeholder="请输入商品标题"
        required
      />
      
      <!-- 商品价格 -->
      <van-field
        v-model="productForm.price"
        label="价格"
        placeholder="请输入价格"
        type="number"
        required
      >
        <template #button>
          <span class="price-unit">元</span>
        </template>
      </van-field>
      
      <!-- 商品分类 -->
      <van-field
        v-model="productForm.category"
        label="分类"
        placeholder="请选择分类"
        readonly
        is-link
        required
        @click="showCategoryPicker = true"
      />
      
      <!-- 商品描述 -->
      <van-field
        v-model="productForm.description"
        label="描述"
        type="textarea"
        placeholder="请描述一下您的商品"
        autosize
        required
      />
      
      <!-- 交易方式 -->
      <van-field
        label="交易方式"
        readonly
        required
      >
        <template #input>
          <van-checkbox-group v-model="productForm.deliveryMethods" direction="horizontal">
            <van-checkbox name="delivery">邮寄</van-checkbox>
            <van-checkbox name="pickup">自取</van-checkbox>
            <van-checkbox name="meetup">当面交易</van-checkbox>
          </van-checkbox-group>
        </template>
      </van-field>
      
      <!-- 位置信息 -->
      <div v-if="productForm.deliveryMethods.includes('pickup') || productForm.deliveryMethods.includes('meetup')">
        <location-selector 
          v-model="productForm.location" 
          required
        />
        
        <!-- 如果已选择位置，显示小地图 -->
        <div v-if="productForm.location" class="location-preview">
          <inline-map
            height="150px"
            :initial-location="productForm.location"
            :show-controls="false"
          />
        </div>
      </div>
      
      <!-- 商品图片 -->
      <div class="images-section">
        <div class="section-title">商品图片 <span class="required">*</span></div>
        <van-uploader
          v-model="productForm.images"
          multiple
          :max-count="5"
          :after-read="afterRead"
        />
      </div>
    </div>
    
    <!-- 分类选择弹窗 -->
    <van-popup
      v-model:show="showCategoryPicker"
      position="bottom"
      round
    >
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
        show-toolbar
        title="选择分类"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast } from 'vant'
import InlineMap from '@/components/map/InlineMap/index.vue'
import LocationSelector from '@/components/ui/LocationSelector.vue'

// 分类数据
const categoryColumns = [
  '手机数码',
  '电脑办公',
  '家用电器',
  '服装鞋包',
  '美妆个护',
  '母婴玩具',
  '运动户外',
  '图书音像',
  '其他'
]

// 商品表单
const productForm = reactive({
  title: '',
  price: '',
  category: '',
  description: '',
  deliveryMethods: ['delivery'],
  location: null,
  images: []
})

// 弹窗状态
const showCategoryPicker = ref(false)

// 处理分类选择
const onCategoryConfirm = (value) => {
  productForm.category = value
  showCategoryPicker.value = false
}

// 处理图片上传后的操作
const afterRead = (file) => {
  // 在实际项目中，这里应该上传图片到服务器
  console.log('文件上传', file)
  
  // 模拟上传
  file.status = 'uploading'
  file.message = '上传中...'
  
  setTimeout(() => {
    file.status = 'done'
    file.message = ''
  }, 1000)
}

// 处理发布
const handlePublish = () => {
  // 验证表单
  if (!productForm.title) {
    return showToast('请输入商品标题')
  }
  
  if (!productForm.price) {
    return showToast('请输入商品价格')
  }
  
  if (!productForm.category) {
    return showToast('请选择商品分类')
  }
  
  if (!productForm.description) {
    return showToast('请输入商品描述')
  }
  
  if (productForm.images.length === 0) {
    return showToast('请上传至少一张商品图片')
  }
  
  if ((productForm.deliveryMethods.includes('pickup') || productForm.deliveryMethods.includes('meetup')) && !productForm.location) {
    return showToast('请选择交易地点')
  }
  
  // 组装提交的数据
  const submitData = {
    ...productForm,
    // 将图片数组转为URLs数组
    images: productForm.images.map(item => item.content || item.url)
  }
  
  console.log('提交数据', submitData)
  showToast('发布成功')
}
</script>

<style scoped>
.product-publish-example {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.form-container {
  background-color: #fff;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.price-unit {
  color: #969799;
  font-size: 14px;
}

.images-section {
  padding: 16px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 14px;
  color: #646566;
}

.required {
  color: #ee0a24;
}

.location-preview {
  margin: 8px 16px 16px;
  border-radius: 8px;
  overflow: hidden;
}
</style>