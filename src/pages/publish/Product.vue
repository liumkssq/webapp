<template>
  <div class="publish-product-page">
    <!-- iOS风格顶部状态栏 -->
    <div class="status-bar">
      <span class="time">9:41</span>
      <div class="status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
    
    <!-- 导航栏 -->
    <div class="navigation-bar">
      <div class="back-btn" @click="goBack">
        <i class="icon-back"></i>
      </div>
      <div class="nav-title">发布商品</div>
      <div class="publish-btn" @click="handlePublishProduct" :class="{ disabled: !isFormValid }">
        发布
      </div>
    </div>
    
    <!-- AI助手按钮 -->
    <div class="ai-assistant-btn" @click="showContentGenerator = true">
      <i class="icon-ai"></i>
      <span>AI文案助手</span>
    </div>
    
    <!-- 商品信息表单 -->
    <div class="product-form">
      <!-- 商品图片上传 -->
      <div class="images-section">
        <div class="section-title">商品图片 <span class="required">*</span></div>
        <div class="images-grid">
          <div
            v-for="(image, index) in productForm.images"
            :key="index"
            class="image-item"
          >
            <img :src="image.url" :alt="`图片${index+1}`" class="preview-image">
            <div class="delete-image" @click="removeImage(index)">
              <i class="icon-close"></i>
            </div>
          </div>
          
          <div class="add-image-btn" v-if="productForm.images.length < 5" @click="triggerFileSelect">
            <i class="icon-camera"></i>
            <span>{{ productForm.images.length }}/5</span>
          </div>
        </div>
        <div class="images-tip">请上传清晰的商品照片，最多5张</div>
        
        <!-- 隐藏的文件输入框 -->
        <input 
          type="file" 
          ref="fileInput" 
          accept="image/*" 
          multiple 
          style="display: none"
          @change="handleFileSelect" 
        />
        
        <!-- AI图片分析入口 -->
        <div class="ai-image-analyzer-btn" v-if="productForm.images.length > 0" @click="showImageAnalyzer = true">
          <i class="icon-analyze"></i>
          <span>AI图片分析</span>
        </div>
      </div>
      
      <!-- 商品标题 -->
      <div class="form-section">
        <div class="section-title">商品标题 <span class="required">*</span></div>
        <div class="input-container">
          <input 
            type="text" 
            v-model="productForm.title" 
            placeholder="请输入商品标题，如：全新iPhone 14 Pro Max 256G 深空黑" 
            class="text-input"
            maxlength="30"
          >
          <div class="input-counter">{{ productForm.title.length }}/30</div>
        </div>
      </div>
      
      <!-- 商品分类 -->
      <div class="form-section">
        <div class="section-title">商品分类 <span class="required">*</span></div>
        <div class="category-select" @click="showCategoryPicker = true">
          <div class="selected-category">
            {{ productForm.category || '请选择分类' }}
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 商品价格 -->
      <div class="form-section">
        <div class="section-title">价格设置 <span class="required">*</span></div>
        <div class="price-inputs">
          <div class="price-input-container">
            <div class="price-label">售价</div>
            <div class="price-input-wrapper">
              <span class="price-symbol">¥</span>
              <input 
                type="number" 
                v-model="productForm.price" 
                placeholder="0.00" 
                class="price-input"
                min="0"
                step="0.01"
              >
            </div>
          </div>
        </div>
        
        <div class="price-inputs" style="margin-top: 12px;">
          <div class="price-input-container">
            <div class="price-label">原价 <span class="optional">(选填)</span></div>
            <div class="price-input-wrapper">
              <span class="price-symbol">¥</span>
              <input 
                type="number" 
                v-model="productForm.originalPrice" 
                placeholder="0.00" 
                class="price-input"
                min="0"
                step="0.01"
              >
            </div>
          </div>
        </div>
      </div>
      
      <!-- 商品成色 -->
      <div class="form-section">
        <div class="section-title">商品成色 <span class="required">*</span></div>
        <div class="condition-options">
          <div 
            v-for="option in conditionOptions" 
            :key="option.value" 
            class="condition-option"
            :class="{ active: productForm.condition === option.value }"
            @click="productForm.condition = option.value"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
      
      <!-- 商品描述 -->
      <div class="form-section">
        <div class="section-title">商品描述 <span class="required">*</span></div>
        <div class="textarea-container">
          <textarea 
            v-model="productForm.description" 
            placeholder="请详细描述一下商品的使用年限、新旧程度、入手渠道、转手原因等信息，让买家更放心" 
            class="text-textarea"
            rows="4"
          ></textarea>
          <div class="textarea-counter">{{ productForm.description.length }}/500</div>
        </div>
      </div>
      
      <!-- 交易方式 -->
      <div class="form-section">
        <div class="section-title">交易方式 <span class="required">*</span></div>
        <div class="delivery-options">
          <div 
            v-for="option in deliveryOptions" 
            :key="option.value" 
            class="delivery-option"
            :class="{ active: productForm.deliveryMethod === option.value }"
            @click="selectDeliveryMethod(option.value)"
          >
            <div class="option-check">
              <div class="check-inner" v-if="productForm.deliveryMethod === option.value"></div>
            </div>
            <div class="option-label">{{ option.label }}</div>
          </div>
        </div>
      </div>
      
      <!-- 交易地点 -->
      <div class="form-section" v-if="productForm.deliveryMethod === 'meetup'">
        <div class="section-title">交易地点 <span class="required">*</span></div>
        <div class="location-picker" @click="navigateToLocationPicker">
          <div v-if="productForm.location" class="selected-location">
            <i class="icon-location"></i>
            <span>{{ productForm.location }}</span>
          </div>
          <div v-else class="placeholder-location">
            <i class="icon-location"></i>
            <span>点击选择交易地点</span>
          </div>
          <i class="icon-arrow-right"></i>
        </div>
      </div>
      
      <!-- 联系方式 -->
      <div class="form-section">
        <div class="section-title">联系方式 <span class="required">*</span></div>
        <div class="contact-container">
          <div class="contact-item">
            <div class="contact-label">手机号</div>
            <input 
              type="tel" 
              v-model="productForm.contactInfo.phone" 
              placeholder="请输入手机号" 
              class="contact-input"
            >
          </div>
          
          <div class="contact-item">
            <div class="contact-label">微信号 <span class="optional">(选填)</span></div>
            <input 
              type="text" 
              v-model="productForm.contactInfo.wechat" 
              placeholder="请输入微信号" 
              class="contact-input"
            >
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分类选择器弹窗 -->
    <div class="category-picker" v-if="showCategoryPicker">
      <div class="picker-mask" @click="showCategoryPicker = false"></div>
      <div class="picker-content">
        <div class="picker-header">
          <div class="picker-title">选择分类</div>
          <div class="picker-close" @click="showCategoryPicker = false">
            <i class="icon-close"></i>
          </div>
        </div>
        
        <div class="picker-body">
          <div 
            v-for="category in categoryOptions" 
            :key="category" 
            class="picker-item"
            @click="selectCategory(category)"
          >
            {{ category }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="toast" v-if="toast.show">{{ toast.message }}</div>
    
    <!-- AI图片分析弹出层 -->
    <van-popup
      v-model:show="showImageAnalyzer"
      position="bottom"
      round
      :style="{ height: '75%' }"
    >
      <image-analyzer
        :images="productForm.images"
        @select-title="handleSelectTitle"
        @select-tag="handleSelectTag"
        @apply-all="handleApplyAllSuggestions"
      />
    </van-popup>
    
    <!-- AI内容生成弹出层 -->
    <van-popup
      v-model:show="showContentGenerator"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <content-generator
        :product-info="productForm"
        :initial-prompt="generateInitialPrompt()"
        @close="showContentGenerator = false"
        @use-content="handleUseGeneratedContent"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { showToast, showSuccessToast, showLoadingToast, closeToast } from 'vant'
import ImageAnalyzer from '@/components/ai/ImageAnalyzer.vue'
import ContentGenerator from '@/components/ai/ContentGenerator.vue'
import { publishProduct as apiPublishProduct } from '@/api/product'
import { uploadMultipleImages } from '@/api/upload'

const router = useRouter()
const userStore = useUserStore()
const fileInput = ref(null)

// 商品表单
const productForm = reactive({
  title: '',
  category: '',
  price: '',
  originalPrice: '',
  condition: 'new',
  description: '',
  images: [],
  deliveryMethod: 'meetup',
  location: '',
  locationCoords: null,
  contactInfo: {
    phone: '',
    wechat: ''
  }
})

// 商品成色选项
const conditionOptions = [
  { label: '全新', value: 'new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '轻微使用痕迹', value: 'slight_used' },
  { label: '使用正常', value: 'used' },
  { label: '明显使用痕迹', value: 'heavily_used' }
]

// 交易方式选项
const deliveryOptions = [
  { label: '当面交易', value: 'meetup' },
  { label: '邮寄', value: 'shipping' }
]

// 分类选项
const categoryOptions = [
  '电子产品', '图书教材', '日用百货', '服装鞋帽', 
  '箱包配饰', '美妆护肤', '运动户外', '乐器', 
  '自行车', '家居家电', '票券卡券', '其他'
]

// 分类选择器
const showCategoryPicker = ref(false)

// 提示信息
const toast = reactive({
  show: false,
  message: ''
})

// 表单是否有效
const isFormValid = computed(() => {
  return (
    productForm.title.trim() !== '' &&
    productForm.category !== '' &&
    productForm.price > 0 &&
    productForm.description.trim() !== '' &&
    productForm.images.length > 0 &&
    productForm.contactInfo.phone.trim() !== '' &&
    (productForm.deliveryMethod === 'meetup' ? productForm.location.trim() !== '' : true)
  )
})

// 选择交易方式
const selectDeliveryMethod = (method) => {
  productForm.deliveryMethod = method
}

// 触发文件选择
const triggerFileSelect = () => {
  if (productForm.images.length >= 5) {
    showToast('最多上传5张图片')
    return
  }
  
  // 随机选择拍照或选择文件
  if (Math.random() > 0.3) { // 70%概率打开文件选择器
    fileInput.value.click()
  } else { // 30%概率直接生成随机图片
    addRandomImage()
  }
}

// 添加随机图片
const addRandomImage = () => {
  if (productForm.images.length >= 5) {
    showToast('最多上传5张图片')
    return
  }
  
  // 生成随机图片
  const mockImage = {
    id: Date.now(),
    url: `https://picsum.photos/300/300?random=${Math.floor(Math.random() * 1000)}`
  }
  
  productForm.images.push(mockImage)
}

// 选择分类
const selectCategory = (category) => {
  productForm.category = category
  showCategoryPicker.value = false
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  // 检查是否超过限制
  const remainingSlots = 5 - productForm.images.length
  const filesToUpload = Array.from(files).slice(0, remainingSlots)
  
  if (files.length > remainingSlots) {
    showToast(`最多上传${remainingSlots}张图片`)
  }
  
  // 处理每个文件
  filesToUpload.forEach(file => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showToast('只能上传图片文件')
      return
    }
    
    // 检查文件大小 (限制为5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过5MB')
      return
    }
    
    // 创建本地预览URL
    const imageUrl = URL.createObjectURL(file)
    
    // 添加到图片列表
    productForm.images.push({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      url: imageUrl,
      file: file, // 保存文件对象，用于后续上传
      localFile: true // 标记为本地文件
    })
  })
  
  // 重置文件输入，以便选择相同文件时也会触发change事件
  event.target.value = ''
}

// 发布商品前上传本地图片到服务器
const uploadImages = async () => {
  // 检查是否存在本地图片
  const localImages = productForm.images.filter(img => img.localFile)
  if (localImages.length === 0) return productForm.images.map(img => img.url)
  
  showToast('正在上传图片...')
  
  try {
    // 收集所有要上传的文件
    const files = localImages.map(img => img.file)
    
    // 调用上传API
    const response = await uploadMultipleImages(files)
    
    // 检查响应
    if (!response || !response.data || !Array.isArray(response.data)) {
      console.error('上传图片响应格式错误:', response)
      throw new Error('上传图片失败，服务器返回格式异常')
    }
    
    // 获取上传后的URL数组
    const uploadedUrls = response.data
    
    if (uploadedUrls.length !== localImages.length) {
      console.warn('上传图片数量与返回URL数量不匹配', {
        uploaded: localImages.length,
        returned: uploadedUrls.length
      })
    }
    
    // 更新图片URLs
    let urlIndex = 0
    productForm.images = productForm.images.map(img => {
      if (img.localFile) {
        // 释放本地URL
        URL.revokeObjectURL(img.url)
        
        // 使用服务器返回的URL替换本地URL
        return {
          id: img.id,
          url: urlIndex < uploadedUrls.length ? uploadedUrls[urlIndex++] : img.url,
          localFile: false
        }
      }
      return img
    })
    
    // 返回所有图片的URL数组
    return productForm.images.map(img => img.url)
  } catch (error) {
    console.error('上传图片失败', error)
    
    // 如果是API错误响应
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || '上传图片失败，服务器错误')
    }
    
    throw new Error('上传图片失败，请检查网络连接后重试')
  }
}

// 发布商品
const handlePublishProduct = async () => {
  if (!isFormValid.value) {
    if (productForm.images.length === 0) {
      showToast('请上传商品图片')
    } else if (productForm.title.trim() === '') {
      showToast('请输入商品标题')
    } else if (productForm.category === '') {
      showToast('请选择商品分类')
    } else if (productForm.price <= 0) {
      showToast('请设置合理的售价')
    } else if (productForm.description.trim() === '') {
      showToast('请填写商品描述')
    } else if (productForm.deliveryMethod === 'meetup' && productForm.location.trim() === '') {
      showToast('请填写交易地点')
    } else if (productForm.contactInfo.phone.trim() === '') {
      showToast('请填写联系电话')
    }
    return
  }
  
  // 验证用户是否登录
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    const loadingToast = showLoadingToast({
      message: '发布中...',
      forbidClick: true,
      duration: 0
    })
    
    // 先上传图片
    let imageUrls = []
    try {
      imageUrls = await uploadImages()
    } catch (error) {
      closeToast()
      showToast({
        message: error.message,
        type: 'fail'
      })
      return
    }
    
    // 构建请求数据
    const productData = {
      title: productForm.title,
      category: productForm.category,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      condition: productForm.condition,
      description: productForm.description,
      imageUrls: imageUrls,
      deliveryMethods: [productForm.deliveryMethod],
      location: productForm.deliveryMethod === 'meetup' ? {
        address: productForm.location,
        coordinates: productForm.locationCoords
      } : undefined,
      contactInfo: {
        phone: productForm.contactInfo.phone,
        wechat: productForm.contactInfo.wechat || undefined
      }
    }
    
    console.log('发送商品数据:', productData)
    
    // 调用API发布商品
    const response = await apiPublishProduct(productData)
    console.log('发布商品响应:', response)
    
    closeToast() // 关闭加载提示
    
    if (response && (response.code === 200 || response.success)) {
      showSuccessToast('发布成功')
      
      // 跳转到首页或商品列表页
      setTimeout(() => {
        router.push('/product/list')
      }, 1000)
    } else {
      throw new Error(response?.message || '发布失败')
    }
  } catch (error) {
    closeToast() // 确保关闭加载提示
    console.error('发布商品失败', error)
    showToast({
      message: `发布失败: ${error.message || '请重试'}`,
      type: 'fail'
    })
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到地图选择页面
const navigateToLocationPicker = () => {
  // 将当前地址传递给地图选择页面（如果有）
  const query = productForm.locationCoords ? 
    { location: JSON.stringify(productForm.locationCoords) } : 
    {};
  
  // 导航到地图选择页面，并设置回调
  router.push({
    path: '/map/picker',
    query: {
      ...query,
      callback: '/publish/product'
    }
  });
}

// 在onMounted中添加
onMounted(() => {
  // 填充用户信息
  if (userStore.user && userStore.user.phone) {
    productForm.contactInfo.phone = userStore.user.phone
  }
  
  // 检查是否有地图选择的回调数据
  let locationDataFromUrl = null;
  const fullPath = window.location.href;
  console.log('URL完整路径:', fullPath);
  
  // 1. 先尝试常规方式获取
  locationDataFromUrl = router.currentRoute.value.query.location;
  console.log('Router查询参数:', router.currentRoute.value.query);
  
  // 2. 如果没有获取到，检查URL中是否有双问号或其他格式问题
  if (!locationDataFromUrl) {
    console.log('尝试从URL直接提取位置数据');
    
    // 使用正则表达式提取location参数，支持各种URL格式
    const locationMatch = fullPath.match(/[?&]location=([^&]+)/);
    if (locationMatch && locationMatch[1]) {
      locationDataFromUrl = decodeURIComponent(locationMatch[1]);
      console.log('从URL中提取的位置数据:', locationDataFromUrl);
    }
  }
  
  if (locationDataFromUrl) {
    try {
      console.log('接收到位置数据:', locationDataFromUrl);
      // 如果已经是对象，则不需要解析
      let location = typeof locationDataFromUrl === 'string' ? 
                   JSON.parse(decodeURIComponent(locationDataFromUrl)) : 
                   locationDataFromUrl;
      console.log('解析后的位置数据:', location);
      
      // 确保有address属性
      if (location.address) {
        productForm.location = location.address;
        productForm.locationCoords = {
          lng: location.lng,
          lat: location.lat
        };
        
        showToast('已自动填入交易地点');
        console.log('已设置位置信息:', productForm.location, productForm.locationCoords);
      } else {
        console.error('位置数据缺少address属性:', location);
        showToast('位置数据不完整，请重新选择');
      }
      
      // 清除URL中的location参数
      router.replace({
        path: router.currentRoute.value.path
      });
    } catch (e) {
      console.error('解析位置信息失败', e);
      showToast('位置信息解析失败');
    }
  } else {
    console.log('未检测到位置数据');
  }
});

// AI助手相关状态
const showImageAnalyzer = ref(false)
const showContentGenerator = ref(false)

// 处理AI图片分析结果
const handleSelectTitle = (title) => {
  productForm.title = title
}

const handleSelectTag = (tag) => {
  if (!productForm.tags) {
    productForm.tags = []
  }
  if (!productForm.tags.includes(tag)) {
    productForm.tags.push(tag)
  }
}

const handleApplyAllSuggestions = (suggestions) => {
  if (suggestions.title) {
    productForm.title = suggestions.title
  }
  
  if (suggestions.description) {
    productForm.description = suggestions.description
  }
  
  if (suggestions.price && !productForm.price) {
    productForm.price = suggestions.price
  }
  
  if (suggestions.tags && suggestions.tags.length > 0) {
    productForm.tags = [...suggestions.tags]
  }
}

// 处理AI内容生成结果
const handleUseGeneratedContent = (data) => {
  const { content, type } = data
  
  if (type === 'description') {
    productForm.description = content
  } else if (type === 'title') {
    productForm.title = content
  } else if (type === 'tags') {
    const tags = content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    productForm.tags = tags
  }
  
  showContentGenerator.value = false
}

// 生成初始提示词
const generateInitialPrompt = () => {
  const category = productForm.category || ''
  const condition = productForm.condition || ''
  
  return `帮我生成一个${condition}的${category}商品描述`
}

// 移除图片
const removeImage = (index) => {
  // 如果是本地文件，需要释放URL对象
  const image = productForm.images[index]
  if (image.localFile && image.url) {
    URL.revokeObjectURL(image.url)
  }
  
  productForm.images.splice(index, 1)
}
</script>

<style scoped>
.publish-product-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* iOS风格顶部状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background-color: #ffffff;
  height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
}

.status-icons {
  display: flex;
  gap: 8px;
}

/* 导航栏 */
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #ffffff;
  height: 44px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.back-btn {
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}

.icon-back::before {
  content: "←";
  font-weight: 400;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.publish-btn {
  padding: 6px 14px;
  border-radius: 18px;
  background-color: #007aff;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
}

.publish-btn.disabled {
  opacity: 0.5;
  background-color: #8e8e93;
}

.publish-btn:active {
  opacity: 0.8;
}

/* AI助手按钮 */
.ai-assistant-btn {
  position: fixed;
  right: 16px;
  bottom: 80px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 20px;
  color: #007aff;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 0.2s;
}

.ai-assistant-btn:active {
  transform: scale(0.96);
}

.icon-ai::before {
  content: "AI";
  font-style: normal;
  font-weight: 600;
  margin-right: 4px;
}

/* 商品信息表单 */
.product-form {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

/* 表单区域通用样式 */
.form-section {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.required {
  color: #ff3b30;
  margin-left: 4px;
}

.optional {
  color: #8e8e93;
  font-size: 14px;
  font-weight: 400;
  margin-left: 4px;
}

/* 图片上传区域 */
.images-section {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.image-item {
  position: relative;
  width: calc(33.333% - 6px);
  aspect-ratio: 1/1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 16px;
}

.add-image-btn {
  width: calc(33.333% - 6px);
  aspect-ratio: 1/1;
  border-radius: 8px;
  background-color: #f2f2f7;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #8e8e93;
  font-size: 16px;
  border: 1px dashed #d1d1d6;
}

.icon-camera::before {
  content: "📷";
  font-size: 24px;
  line-height: 1;
  margin-bottom: 4px;
}

.icon-close::before {
  content: "×";
  font-weight: 400;
}

.images-tip {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 8px;
}

.ai-image-analyzer-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  padding: 6px 12px;
  background-color: #f2f2f7;
  border-radius: 16px;
  color: #007aff;
  font-size: 14px;
}

.icon-analyze::before {
  content: "🔍";
  margin-right: 4px;
}

/* 输入框样式 */
.input-container {
  position: relative;
}

.text-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #007aff;
}

.input-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: #8e8e93;
}

/* 分类选择器 */
.category-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.selected-category {
  color: #000000;
  font-size: 16px;
}

.icon-arrow-right::before {
  content: ">";
  font-size: 16px;
  color: #8e8e93;
  display: inline-block;
  font-weight: 500;
  line-height: 1;
}

/* 价格输入区域 */
.price-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-input-container {
  width: 100%;
}

.price-label {
  font-size: 14px;
  color: #000000;
  margin-bottom: 8px;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  background-color: #f9f9f9;
  padding: 0 12px;
}

.price-symbol {
  font-size: 16px;
  color: #000000;
  margin-right: 4px;
}

.price-input {
  flex: 1;
  padding: 12px 0;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

/* 商品成色选项 */
.condition-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.condition-option {
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #f2f2f7;
  color: #000000;
  font-size: 14px;
  transition: all 0.2s;
}

.condition-option.active {
  background-color: #e1f0ff;
  color: #007aff;
}

/* 文本区域 */
.textarea-container {
  position: relative;
}

.text-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 16px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.text-textarea:focus {
  border-color: #007aff;
}

.textarea-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: #8e8e93;
}

/* 交易方式 */
.delivery-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.delivery-option.active {
  background-color: #e1f0ff;
}

.option-check {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border: 2px solid #d1d1d6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.option-check .check-inner {
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #007aff;
}

.delivery-option.active .option-check {
  border-color: #007aff;
}

.option-label {
  font-size: 16px;
  color: #000000;
}

/* 位置选择器 */
.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.selected-location, .placeholder-location {
  display: flex;
  align-items: center;
  gap: 8px;
}

.placeholder-location {
  color: #8e8e93;
}

.icon-location::before {
  content: "📍";
  font-size: 16px;
}

/* 联系方式 */
.contact-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-label {
  font-size: 14px;
  color: #000000;
}

.contact-input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e5ea;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.contact-input:focus {
  border-color: #007aff;
}

/* 分类选择器弹窗 */
.category-picker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.picker-content {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out forwards;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5ea;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.picker-close {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
}

.picker-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 0;
}

.picker-item {
  padding: 14px 16px;
  font-size: 16px;
  color: #000000;
  border-bottom: 1px solid #f2f2f7;
}

.picker-item:active {
  background-color: #f2f2f7;
}

/* 提示信息 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 16px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-size: 14px;
  z-index: 999;
  max-width: 80%;
  text-align: center;
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .publish-product-page {
    background-color: #000000;
  }
  
  .status-bar, .navigation-bar {
    background-color: #1c1c1e;
    color: #ffffff;
  }
  
  .nav-title {
    color: #ffffff;
  }
  
  .form-section, .images-section {
    background-color: #1c1c1e;
  }
  
  .section-title {
    color: #ffffff;
  }
  
  .text-input, .text-textarea, .contact-input {
    background-color: #2c2c2e;
    border-color: #3a3a3c;
    color: #ffffff;
  }
  
  .category-select, .location-picker, .price-input-wrapper {
    background-color: #2c2c2e;
    border-color: #3a3a3c;
  }
  
  .selected-category, .option-label, .price-symbol, .price-label, .contact-label {
    color: #ffffff;
  }
  
  .condition-option {
    background-color: #2c2c2e;
    color: #ffffff;
  }
  
  .condition-option.active {
    background-color: #0a395c;
    color: #48a3ff;
  }
  
  .add-image-btn {
    background-color: #2c2c2e;
    border-color: #3a3a3c;
  }
  
  .ai-image-analyzer-btn {
    background-color: #2c2c2e;
  }
  
  .picker-content {
    background-color: #1c1c1e;
  }
  
  .picker-title {
    color: #ffffff;
  }
  
  .picker-item {
    color: #ffffff;
    border-color: #2c2c2e;
  }
  
  .picker-item:active {
    background-color: #2c2c2e;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.form-section, .images-section {
  animation: fadeIn 0.3s ease-in-out;
}
</style>