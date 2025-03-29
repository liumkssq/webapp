<template>
  <div class="publish-form">
    <van-nav-bar
      title="发布商品"
      left-arrow
      @click-left="goBack"
      fixed
    />
    
    <div class="form-container">
      <van-form @submit="onSubmit">
        <!-- 标题输入 -->
        <van-field
          v-model="productData.title"
          name="title"
          label="标题"
          placeholder="请输入商品标题"
          :rules="[{ required: true, message: '请填写商品标题' }]"
        />
        
        <!-- 商品描述 -->
        <van-field
          v-model="productData.description"
          name="description"
          label="描述"
          type="textarea"
          rows="3"
          autosize
          placeholder="请详细描述您的商品，如新旧程度、购买渠道、转手原因等"
          :rules="[{ required: true, message: '请填写商品描述' }]"
        />
        
        <!-- 价格输入 -->
        <van-field
          v-model="productData.price"
          name="price"
          label="价格"
          placeholder="请输入商品价格"
          :rules="[{ required: true, message: '请填写商品价格' }]"
        >
          <template #button>
            <span class="price-unit">¥</span>
          </template>
        </van-field>
        
        <!-- 原价输入 -->
        <van-field
          v-model="productData.originalPrice"
          name="originalPrice"
          label="原价"
          placeholder="选填"
        >
          <template #button>
            <span class="price-unit">¥</span>
          </template>
        </van-field>
        
        <!-- 分类选择 -->
        <van-field
          readonly
          name="category"
          label="分类"
          :model-value="categoryText"
          placeholder="请选择商品分类"
          @click="showCategoryPicker = true"
          :rules="[{ required: true, message: '请选择商品分类' }]"
          right-icon="arrow"
        />
        
        <!-- 商品图片上传 -->
        <div class="form-item">
          <div class="form-item-label">商品图片</div>
          <van-uploader
            v-model="productData.images"
            multiple
            :max-count="9"
            :after-read="afterReadImage"
            :before-delete="beforeDeleteImage"
          />
          <div class="form-item-tip">最多上传9张图片，第一张将作为商品主图</div>
        </div>
        
        <!-- 位置信息 -->
        <div class="form-item location-wrapper">
          <ProductLocation
            :location="productData.location"
            :address="productData.address"
            :location-name="productData.locationName"
            :editable="true"
            :show-map="true"
            placeholder="添加交易地点"
            @update:location="handleLocationUpdate"
            @update:address="handleAddressUpdate"
            @update:location-name="handleLocationNameUpdate"
          />
        </div>
        
        <!-- 联系方式 -->
        <van-field
          v-model="productData.contactInfo"
          name="contactInfo"
          label="联系方式"
          placeholder="微信/手机号，方便买家联系您"
          :rules="[{ required: true, message: '请填写联系方式' }]"
        />
        
        <!-- 提交按钮 -->
        <div class="submit-btn-wrapper">
          <van-button round block type="primary" native-type="submit" :loading="isSubmitting">
            发布商品
          </van-button>
        </div>
      </van-form>
    </div>
    
    <!-- 分类选择弹出层 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import ProductLocation from '@/components/product/ProductLocation.vue'
import { uploadProductImage, publishProduct } from '@/api/product'
import { getCategoryList } from '@/api/category'

const router = useRouter()
const isSubmitting = ref(false)
const showCategoryPicker = ref(false)
const categoryList = ref([])
const selectedCategory = ref(null)

// 商品数据
const productData = reactive({
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  categoryId: '',
  images: [],
  location: null,
  address: '',
  locationName: '',
  contactInfo: ''
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    if (res && res.data) {
      categoryList.value = res.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showToast('获取分类列表失败')
  }
}

// 分类选择器数据
const categoryColumns = computed(() => {
  return categoryList.value.map(item => ({
    text: item.name,
    value: item.id
  }))
})

// 选中的分类文本
const categoryText = computed(() => {
  if (selectedCategory.value) {
    return selectedCategory.value.text
  }
  return ''
})

// 确认分类选择
const onCategoryConfirm = (value) => {
  selectedCategory.value = value
  productData.categoryId = value.value
  showCategoryPicker.value = false
}

// 上传图片后的处理
const afterReadImage = async (file) => {
  if (Array.isArray(file)) {
    // 处理多张图片
    file.forEach(async (item) => {
      await handleUploadImage(item)
    })
  } else {
    // 处理单张图片
    await handleUploadImage(file)
  }
}

// 上传单张图片
const handleUploadImage = async (file) => {
  try {
    // 添加上传状态
    file.status = 'uploading'
    file.message = '上传中...'
    
    const formData = new FormData()
    formData.append('file', file.file)
    
    const res = await uploadProductImage(formData)
    
    if (res && res.data && res.data.url) {
      file.status = 'done'
      file.message = '上传成功'
      file.url = res.data.url
      file.serverId = res.data.id || res.data.fileId
    } else {
      file.status = 'failed'
      file.message = '上传失败'
      showToast('图片上传失败')
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    file.status = 'failed'
    file.message = '上传失败'
    showToast('图片上传失败')
  }
}

// 删除图片前确认
const beforeDeleteImage = (file) => {
  return new Promise((resolve) => {
    showDialog({
      title: '确认删除',
      message: '确定要删除这张图片吗？',
      showCancelButton: true,
    })
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        resolve(false)
      })
  })
}

// 地图位置相关方法
const handleLocationUpdate = (newLocation) => {
  productData.location = newLocation
}

const handleAddressUpdate = (newAddress) => {
  productData.address = newAddress
}

const handleLocationNameUpdate = (newName) => {
  productData.locationName = newName
}

// 提交表单
const onSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    // 准备提交数据
    const formData = {
      title: productData.title,
      description: productData.description,
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : undefined,
      categoryId: productData.categoryId,
      imageIds: productData.images
        .filter(img => img.status === 'done' && img.serverId)
        .map(img => img.serverId),
      location: productData.location 
        ? {
            longitude: productData.location.lng,
            latitude: productData.location.lat,
            address: productData.address,
            name: productData.locationName || undefined
          }
        : undefined,
      contactInfo: productData.contactInfo
    }
    
    // 发布商品
    const res = await publishProduct(formData)
    
    isSubmitting.value = false
    
    if (res && res.data) {
      showToast({
        type: 'success',
        message: '发布成功',
        onClose: () => {
          router.replace({
            name: 'ProductDetail',
            params: { id: res.data.id }
          })
        }
      })
    } else {
      showToast('发布失败，请重试')
    }
  } catch (error) {
    console.error('发布商品失败:', error)
    isSubmitting.value = false
    showToast('发布失败，请重试')
  }
}

// 验证表单
const validateForm = () => {
  if (!productData.title.trim()) {
    showToast('请填写商品标题')
    return false
  }
  
  if (!productData.description.trim()) {
    showToast('请填写商品描述')
    return false
  }
  
  if (!productData.price || isNaN(parseFloat(productData.price))) {
    showToast('请填写有效的商品价格')
    return false
  }
  
  if (productData.originalPrice && isNaN(parseFloat(productData.originalPrice))) {
    showToast('请填写有效的商品原价')
    return false
  }
  
  if (!productData.categoryId) {
    showToast('请选择商品分类')
    return false
  }
  
  const validImages = productData.images.filter(img => img.status === 'done')
  if (validImages.length === 0) {
    showToast('请至少上传一张商品图片')
    return false
  }
  
  if (!productData.contactInfo.trim()) {
    showToast('请填写联系方式')
    return false
  }
  
  return true
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载时获取分类列表
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.publish-form {
  padding-top: 46px;
  padding-bottom: 80px;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.form-container {
  padding: 16px;
}

.form-item {
  background-color: #fff;
  padding: 10px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
}

.form-item-label {
  font-size: 15px;
  margin-bottom: 12px;
  color: #323233;
}

.form-item-tip {
  font-size: 12px;
  color: #969799;
  margin-top: 8px;
}

.location-wrapper {
  margin-top: 12px;
}

.price-unit {
  color: #969799;
  font-size: 14px;
}

.submit-btn-wrapper {
  margin-top: 24px;
  padding: 0 16px;
}

:deep(.van-field) {
  padding: 12px 16px;
}

:deep(.van-uploader) {
  padding-top: 8px;
}

:deep(.van-uploader__preview) {
  margin-right: 10px;
  margin-bottom: 10px;
}

:deep(.van-uploader__upload) {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style> 